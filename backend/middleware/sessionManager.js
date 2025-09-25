const User = require('../models/User');
const { 
  extractDeviceInfo, 
  generateDeviceFingerprint, 
  validateDeviceFingerprint,
  getDeviceDescription 
} = require('../utils/deviceFingerprint');
const jwt = require('jsonwebtoken');

/**
 * Middleware to check for existing active sessions and enforce single device limit
 */
const checkActiveSession = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next();
    }

    // Extract device information from request
    const deviceInfo = extractDeviceInfo(req);
    const currentDeviceFingerprint = generateDeviceFingerprint(deviceInfo);
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return next();
    }

    // Check if user has an active session on a different device
    if (user.hasActiveSession(currentDeviceFingerprint)) {
      const activeDevice = user.activeDevice;
      const deviceDescription = getDeviceDescription(activeDevice.deviceInfo);
      
      return res.status(409).json({
        success: false,
        message: 'User is already logged in on another device',
        error: 'ACTIVE_SESSION_EXISTS',
        details: {
          activeDevice: {
            description: deviceDescription,
            loginTime: activeDevice.loginAt,
            lastActivity: activeDevice.lastActivity,
            location: activeDevice.location?.city || 'Unknown Location'
          },
          options: {
            forceLogin: 'To login on this device, you can force logout from the other device',
            contactSupport: 'Contact support if this seems suspicious'
          }
        }
      });
    }

    // Attach device info to request for use in login controller
    req.deviceInfo = deviceInfo;
    req.deviceFingerprint = currentDeviceFingerprint;
    
    next();
  } catch (error) {
    console.error('Session check error:', error);
    next(); // Continue with login process even if session check fails
  }
};

/**
 * Force logout from current device (for force login scenarios)
 */
const forceLogout = async (req, res, next) => {
  try {
    const { email, forceLogout } = req.body;
    
    if (!email || !forceLogout) {
      return next();
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (user && user.isOnline) {
      // Clear the active session
      user.clearActiveSession();
      await user.save();
      
      console.log(`Force logout executed for user: ${email}`);
    }
    
    next();
  } catch (error) {
    console.error('Force logout error:', error);
    next();
  }
};

/**
 * Middleware to validate current session and update activity
 */
const validateSession = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
        error: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }

      if (user.status === 'Blocked') {
        return res.status(403).json({
          success: false,
          message: 'Account is blocked',
          error: 'ACCOUNT_BLOCKED'
        });
      }

      // Extract current device info
      const deviceInfo = extractDeviceInfo(req);
      const currentFingerprint = generateDeviceFingerprint(deviceInfo);

      // Check if user is still logged in and on the same device
      if (!user.isOnline || !user.activeDevice) {
        return res.status(401).json({
          success: false,
          message: 'Session expired - not logged in',
          error: 'SESSION_EXPIRED'
        });
      }

      // Validate device fingerprint
      if (user.activeDevice.deviceFingerprint !== currentFingerprint) {
        // Device mismatch - possible security issue
        user.clearActiveSession();
        await user.save();
        
        return res.status(401).json({
          success: false,
          message: 'Session invalid - device mismatch',
          error: 'DEVICE_MISMATCH'
        });
      }

      // Check session timeout (30 minutes of inactivity)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (user.activeDevice.lastActivity < thirtyMinutesAgo) {
        user.clearActiveSession();
        await user.save();
        
        return res.status(401).json({
          success: false,
          message: 'Session expired due to inactivity',
          error: 'SESSION_TIMEOUT'
        });
      }

      // Update last activity and check for expired courses
      user.updateActivity();
      const hasExpiredCourses = user.updateExpiredCourses();
      if (hasExpiredCourses) {
        await user.save();
      }

      req.user = user;
      req.deviceInfo = deviceInfo;
      
      // Save updated activity (don't wait for it)
      user.save().catch(err => console.error('Error updating user activity:', err));
      
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Session validation failed',
      error: 'VALIDATION_ERROR'
    });
  }
};

/**
 * Middleware to check course access permissions
 */
const checkCourseAccess = (req, res, next) => {
  try {
    const { courseId } = req.params;
    const user = req.user;
    
    if (!user || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required information',
        error: 'MISSING_INFO'
      });
    }

    // Check if user is enrolled in the course
    const enrollment = user.enrolledCourses.find(ec => ec.course.toString() === courseId);
    
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course',
        error: 'NOT_ENROLLED'
      });
    }

    // Check if course has expired
    if (user.isCourseExpired(courseId)) {
      return res.status(403).json({
        success: false,
        message: 'Course access has expired',
        error: 'COURSE_EXPIRED',
        details: {
          enrolledAt: enrollment.enrolledAt,
          expiresAt: enrollment.expiresAt,
          message: 'This course expired 6 months after enrollment. Please contact support to renew access.'
        }
      });
    }

    req.enrollment = enrollment;
    next();
  } catch (error) {
    console.error('Course access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check course access',
      error: 'ACCESS_CHECK_ERROR'
    });
  }
};

/**
 * Middleware to clean up inactive sessions (run periodically)
 */
const cleanupInactiveSessions = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Find users with inactive sessions
    const inactiveUsers = await User.find({
      isOnline: true,
      'activeDevice.lastActivity': { $lt: oneHourAgo }
    });

    // Clear their sessions
    const bulkOps = inactiveUsers.map(user => ({
      updateOne: {
        filter: { _id: user._id },
        update: {
          $unset: { activeDevice: 1, sessionToken: 1 },
          $set: { isOnline: false }
        }
      }
    }));

    if (bulkOps.length > 0) {
      await User.bulkWrite(bulkOps);
      console.log(`Cleaned up ${bulkOps.length} inactive sessions`);
    }
  } catch (error) {
    console.error('Session cleanup error:', error);
  }
};

/**
 * Get active sessions info for admin
 */
const getActiveSessions = async (req, res) => {
  try {
    const activeSessions = await User.find(
      { isOnline: true },
      {
        name: 1,
        email: 1,
        activeDevice: 1,
        lastLoginAt: 1,
        role: 1
      }
    ).sort({ 'activeDevice.lastActivity': -1 });

    const sessionInfo = activeSessions.map(user => ({
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      device: getDeviceDescription(user.activeDevice.deviceInfo),
      loginTime: user.activeDevice.loginAt,
      lastActivity: user.activeDevice.lastActivity,
      ipAddress: user.activeDevice.ipAddress,
      location: user.activeDevice.location
    }));

    res.status(200).json({
      success: true,
      data: {
        totalActiveSessions: sessionInfo.length,
        sessions: sessionInfo
      }
    });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active sessions'
    });
  }
};

module.exports = {
  checkActiveSession,
  forceLogout,
  validateSession,
  checkCourseAccess,
  cleanupInactiveSessions,
  getActiveSessions
};