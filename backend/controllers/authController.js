const User = require('../models/User');
const { createTokenResponse, verifyToken, generateAccessToken } = require('../utils/jwt');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/email');
const { 
  extractDeviceInfo, 
  generateDeviceFingerprint,
  getClientIP,
  getDeviceDescription 
} = require('../utils/deviceFingerprint');

// Register new user
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role = 'user' } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role: role === 'admin' ? 'admin' : 'user'
    });

    await user.save();

    // Set device info for new user
    const deviceInfo = extractDeviceInfo(req);
    const deviceFingerprint = generateDeviceFingerprint(deviceInfo);
    const ipAddress = getClientIP(req);

    user.setActiveDevice({
      fingerprint: deviceFingerprint,
      userAgent: deviceInfo.userAgent,
      platform: deviceInfo.platform,
      browser: deviceInfo.browser,
      screenResolution: deviceInfo.screenResolution,
      timezone: deviceInfo.timezone,
      language: deviceInfo.language
    }, ipAddress);

    await user.save();

    const tokenResponse = createTokenResponse(user);
    tokenResponse.sessionInfo = {
      deviceDescription: getDeviceDescription(deviceInfo),
      loginTime: user.activeDevice.loginAt,
      sessionToken: user.sessionToken
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: tokenResponse
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user with device tracking
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.status === 'Blocked') {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked. Please contact administrator.'
      });
    }

    // Check if account is locked
    if (user.loginAttempts.lockedUntil && user.loginAttempts.lockedUntil > new Date()) {
      const lockTimeRemaining = Math.ceil((user.loginAttempts.lockedUntil - new Date()) / 1000 / 60);
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked. Try again in ${lockTimeRemaining} minutes.`,
        error: 'ACCOUNT_LOCKED',
        lockTimeRemaining: lockTimeRemaining
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      user.loginAttempts.count = (user.loginAttempts.count || 0) + 1;
      user.loginAttempts.lastAttempt = new Date();
      
      if (user.loginAttempts.count >= 5) {
        user.loginAttempts.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      
      await user.save();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        remainingAttempts: Math.max(0, 5 - user.loginAttempts.count)
      });
    }

    // Get device information
    const deviceInfo = req.deviceInfo || extractDeviceInfo(req);
    const deviceFingerprint = req.deviceFingerprint || generateDeviceFingerprint(deviceInfo);
    const ipAddress = getClientIP(req);

    // Set active device session
    user.setActiveDevice({
      fingerprint: deviceFingerprint,
      userAgent: deviceInfo.userAgent,
      platform: deviceInfo.platform,
      browser: deviceInfo.browser,
      screenResolution: deviceInfo.screenResolution,
      timezone: deviceInfo.timezone,
      language: deviceInfo.language
    }, ipAddress, {
      country: req.body.location?.country || 'Unknown',
      city: req.body.location?.city || 'Unknown'
    });

    // Reset login attempts
    user.loginAttempts.count = 0;
    user.loginAttempts.lastAttempt = undefined;
    user.loginAttempts.lockedUntil = undefined;

    await user.save();

    const tokenResponse = createTokenResponse(user);
    tokenResponse.sessionInfo = {
      deviceDescription: getDeviceDescription(deviceInfo),
      loginTime: user.activeDevice.loginAt,
      sessionToken: user.sessionToken
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: tokenResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin login with additional checks
const adminLogin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      role: 'admin'
    }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or insufficient privileges'
      });
    }

    if (user.status === 'Blocked') {
      return res.status(403).json({
        success: false,
        message: 'Admin account is blocked'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or insufficient privileges'
      });
    }

    // Set device info for admin
    const deviceInfo = extractDeviceInfo(req);
    const deviceFingerprint = generateDeviceFingerprint(deviceInfo);
    const ipAddress = getClientIP(req);

    user.setActiveDevice({
      fingerprint: deviceFingerprint,
      userAgent: deviceInfo.userAgent,
      platform: deviceInfo.platform,
      browser: deviceInfo.browser,
      screenResolution: deviceInfo.screenResolution,
      timezone: deviceInfo.timezone,
      language: deviceInfo.language
    }, ipAddress);

    await user.save();

    const tokenResponse = createTokenResponse(user);
    tokenResponse.sessionInfo = {
      deviceDescription: getDeviceDescription(deviceInfo),
      loginTime: user.activeDevice.loginAt,
      sessionToken: user.sessionToken
    };

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: tokenResponse
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout with session cleanup
const logout = async (req, res) => {
  try {
    const user = req.user;
    
    if (user) {
      user.clearActiveSession();
      await user.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

// Refresh token with session validation
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const decoded = verifyToken(refreshToken);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status === 'Blocked') {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked'
      });
    }

    // Check if user has active session
    if (!user.isOnline) {
      return res.status(401).json({
        success: false,
        message: 'No active session found'
      });
    }

    // Update activity
    user.updateActivity();
    await user.save();

    const newAccessToken = generateAccessToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        tokenType: 'Bearer',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    const profile = user.getPublicProfile();
    
    // Add active courses info
    profile.activeCourses = user.getActiveCourses().map(enrollment => ({
      courseId: enrollment.course,
      enrolledAt: enrollment.enrolledAt,
      expiresAt: enrollment.expiresAt,
      progress: enrollment.progress,
      daysRemaining: Math.ceil((enrollment.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
    }));

    res.status(200).json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

// Forgot Password (unchanged)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset email has been sent'
      });
    }

    if (user.status === 'Blocked') {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked. Please contact administrator.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl
      });

      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
};

// Reset Password (unchanged)
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    if (user.status === 'Blocked') {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked. Please contact administrator.'
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
};

// Verify Reset Token (unchanged)
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    if (user.status === 'Blocked') {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked. Please contact administrator.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        email: user.email
      }
    });

  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  refreshToken,
  getProfile,
  logout,
  forgotPassword,
  resetPassword,
  verifyResetToken
};