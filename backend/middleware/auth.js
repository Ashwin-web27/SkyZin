const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const User = require('../models/User');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }
    
    // Temporary test token support for development
    if (process.env.NODE_ENV === 'development' && token === 'temp-admin-token-for-testing') {
      // Find admin user for testing
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        req.user = adminUser;
        req.userId = adminUser._id;
        req.userRole = adminUser.role;
        return next();
      }
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Find user
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

    // Attach user to request object
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Admin only middleware
const adminOnly = authorize('admin');

// Admin or instructor middleware
const adminOrInstructor = authorize('admin', 'instructor');

// User only middleware (can access their own resources)
const userOnly = authorize('user', 'admin');

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);
    
    if (token) {
      const decoded = verifyToken(token);
      
      if (decoded.type === 'access') {
        const user = await User.findById(decoded.userId);
        if (user && user.status !== 'Blocked') {
          req.user = user;
          req.userId = user._id;
          req.userRole = user.role;
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  adminOnly,
  adminOrInstructor,
  userOnly,
  optionalAuth
};