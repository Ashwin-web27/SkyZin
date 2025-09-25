const express = require('express');
const { 
  register, 
  login, 
  adminLogin, 
  refreshToken, 
  getProfile, 
  logout,
  forgotPassword,
  resetPassword,
  verifyResetToken
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { 
  validateRegister, 
  validateLogin, 
  validateAdminLogin, 
  validateRefreshToken 
} = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', validateRegister, register);

// @route   POST /api/auth/login
// @desc    User login
// @access  Public
router.post('/login', validateLogin, login);

// @route   POST /api/auth/admin/login
// @desc    Admin login
// @access  Public
router.post('/admin/login', validateAdminLogin, adminLogin);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', validateRefreshToken, refreshToken);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, getProfile);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticate, logout);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', resetPassword);

// @route   POST /api/auth/verify-reset-token
// @desc    Verify password reset token
// @access  Public
router.post('/verify-reset-token', verifyResetToken);

module.exports = router;
