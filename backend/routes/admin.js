const express = require('express');
const {
  getDashboardStats,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getPayments,
  getNotifications,
  createSystemNotification,
  getAnalytics,
  getRealTimeStats
} = require('../controllers/adminController');
const { authenticate, adminOnly } = require('../middleware/auth');
const { validateCourse, validateCourseUpdate } = require('../middleware/validation');

const router = express.Router();

// Apply authentication and admin-only middleware to all routes
router.use(authenticate);
router.use(adminOnly);

// Dashboard routes
// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/dashboard/stats', getDashboardStats);

// User management routes moved to dedicated adminUserRoutes.js
// These routes are now handled by /api/admin/users/* endpoint

// Course management routes
// @route   GET /api/admin/courses
// @desc    Get all courses with pagination and filtering
// @access  Private/Admin
router.get('/courses', getCourses);

// @route   POST /api/admin/courses
// @desc    Create new course
// @access  Private/Admin
router.post('/courses', validateCourse, createCourse);

// @route   PUT /api/admin/courses/:id
// @desc    Update course
// @access  Private/Admin
router.put('/courses/:id', validateCourseUpdate, updateCourse);

// @route   DELETE /api/admin/courses/:id
// @desc    Delete course
// @access  Private/Admin
router.delete('/courses/:id', deleteCourse);

// Instructor management routes moved to dedicated adminInstructorRoutes.js
// These routes are now handled by /api/admin/instructors/* endpoint

// Payment management routes
// @route   GET /api/admin/payments
// @desc    Get all payments with pagination and filtering
// @access  Private/Admin
router.get('/payments', getPayments);

// Notification management routes
// @route   GET /api/admin/notifications
// @desc    Get all notifications with pagination and filtering
// @access  Private/Admin
router.get('/notifications', getNotifications);

// @route   POST /api/admin/notifications
// @desc    Create system-wide notification
// @access  Private/Admin
router.post('/notifications', createSystemNotification);

// Analytics routes
// @route   GET /api/admin/analytics
// @desc    Get platform analytics with filtering and time ranges
// @access  Private/Admin
router.get('/analytics', getAnalytics);

// Real-time features routes
// @route   GET /api/admin/realtime/stats
// @desc    Get real-time connection statistics
// @access  Private/Admin
router.get('/realtime/stats', getRealTimeStats);

// Alternative route for real-time stats (matches frontend API call)
// @route   GET /api/admin/real-time-stats
// @desc    Get real-time connection statistics
// @access  Private/Admin
router.get('/real-time-stats', getRealTimeStats);

module.exports = router;
