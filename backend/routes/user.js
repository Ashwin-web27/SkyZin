const express = require('express');
const {
  getProfile,
  updateProfile,
  changePassword,
  getPublicStats,
  getCourses,
  getCourseById,
  enrollInCourse,
  getMyEnrollments,
  updateCourseProgress,
  createPaymentIntent,
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUserAnalytics
} = require('../controllers/userController');
const { authenticate, userOnly, optionalAuth } = require('../middleware/auth');
const { 
  validateProfileUpdate, 
  validatePasswordChange, 
  validateEnrollment,
  validatePayment
} = require('../middleware/validation');

const router = express.Router();

// Public statistics route (no auth required)
// @route   GET /api/users/stats
// @desc    Get public platform statistics
// @access  Public
router.get('/stats', getPublicStats);

// Profile management routes
// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, validateProfileUpdate, updateProfile);

// @route   PUT /api/users/password
// @desc    Change user password
// @access  Private
router.put('/password', authenticate, validatePasswordChange, changePassword);

// Course browsing routes (public)
// @route   GET /api/users/courses
// @desc    Get all published courses with filtering and pagination
// @access  Public
router.get('/courses', optionalAuth, getCourses);

// @route   GET /api/users/courses/:id
// @desc    Get course by ID with enrollment status
// @access  Public (but shows enrollment status if authenticated)
router.get('/courses/:id', optionalAuth, getCourseById);

// Enrollment routes
// @route   POST /api/users/enroll
// @desc    Enroll in a course
// @access  Private
router.post('/enroll', authenticate, validateEnrollment, enrollInCourse);

// @route   GET /api/users/enrollments
// @desc    Get user's enrollments with progress
// @access  Private
router.get('/enrollments', authenticate, getMyEnrollments);

// @route   POST /api/users/courses/:courseId/progress
// @desc    Update course progress (mark lesson complete)
// @access  Private
router.post('/courses/:courseId/progress', authenticate, updateCourseProgress);

// Payment routes
// @route   POST /api/users/payments/intent
// @desc    Create payment intent for course enrollment
// @access  Private
router.post('/payments/intent', authenticate, validatePayment, createPaymentIntent);

// Cart routes
// @route   GET /api/users/cart
// @desc    Get user's cart
// @access  Private
router.get('/cart', authenticate, getCart);

// @route   POST /api/users/cart
// @desc    Add course to cart
// @access  Private
router.post('/cart', authenticate, addToCart);

// @route   DELETE /api/users/cart/:courseId
// @desc    Remove course from cart
// @access  Private
router.delete('/cart/:courseId', authenticate, removeFromCart);

// @route   DELETE /api/users/cart
// @desc    Clear entire cart
// @access  Private
router.delete('/cart', authenticate, clearCart);

// Notification routes
// @route   GET /api/users/notifications
// @desc    Get user notifications with pagination
// @access  Private
router.get('/notifications', authenticate, getNotifications);

// @route   PUT /api/users/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:id/read', authenticate, markNotificationAsRead);

// @route   PUT /api/users/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/notifications/read-all', authenticate, markAllNotificationsAsRead);

// Analytics routes
// @route   GET /api/users/analytics
// @desc    Get user learning analytics and insights
// @access  Private
router.get('/analytics', authenticate, getUserAnalytics);

// Dashboard stats routes
// @route   GET /api/users/dashboard/stats
// @desc    Get user dashboard statistics (profile summary)
// @access  Private
router.get('/dashboard/stats', authenticate, require('../controllers/userController').getDashboardStats);

module.exports = router;
