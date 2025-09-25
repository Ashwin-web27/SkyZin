const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');
const {
  getAllInstructors,
  getInstructorById,
  createInstructor,
  updateInstructor,
  toggleInstructorStatus,
  deleteInstructor,
  assignInstructorToCourse,
  getInstructorAnalytics
} = require('../controllers/adminInstructorController');

// Validation middleware for creating instructor
const createInstructorValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters long')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('bio')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bio cannot exceed 1000 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
];

// Validation middleware for updating instructor
const updateInstructorValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters long')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('bio')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bio cannot exceed 1000 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  body('status')
    .optional()
    .isIn(['Active', 'Blocked', 'Pending'])
    .withMessage('Status must be Active, Blocked, or Pending')
];

// Validation for course assignment
const assignCourseValidation = [
  body('courseId')
    .isMongoId()
    .withMessage('Please provide a valid course ID')
];

// Development bypass for testing - Always bypass auth during development
router.use(async (req, res, next) => {
  // Always find admin user for development testing
  const User = require('../models/User');
  const adminUser = await User.findOne({ role: 'admin' });
  if (adminUser) {
    req.user = adminUser;
    req.userId = adminUser._id;
    req.userRole = adminUser.role;
  }
  next();
});

// GET /admin/instructors - Get all instructors with filtering and pagination
router.get('/', getAllInstructors);

// GET /admin/instructors/analytics - Get instructor analytics (MUST be before /:id)
router.get('/analytics', getInstructorAnalytics);

// GET /admin/instructors/:id - Get single instructor details
router.get('/:id', getInstructorById);

// POST /admin/instructors - Create new instructor
router.post('/', createInstructorValidation, createInstructor);

// PUT /admin/instructors/:id - Update instructor
router.put('/:id', updateInstructorValidation, updateInstructor);

// PATCH /admin/instructors/:id/status - Toggle instructor status
router.patch('/:id/status', toggleInstructorStatus);

// POST /admin/instructors/:id/assign-course - Assign instructor to course
router.post('/:id/assign-course', assignCourseValidation, assignInstructorToCourse);

// DELETE /admin/instructors/:id - Delete instructor
router.delete('/:id', deleteInstructor);

module.exports = router;