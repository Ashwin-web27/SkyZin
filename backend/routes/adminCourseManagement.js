const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { authenticate, adminOnly } = require('../middleware/auth');
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  updateLessons,
  bulkUpdateCourses,
  getCourseAnalytics
} = require('../controllers/adminCourseController');

// Validation middleware
const validateCourseCreation = [
  body('title')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .trim(),
  body('description')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .trim(),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .isIn([
      'Programming', 'Design', 'Business', 'Marketing', 'Photography', 
      'Music', 'Automation', 'Cloud Computing', 'Artificial Intelligence',
      'Cybersecurity', 'Web Development', 'Data Science', 'Other'
    ])
    .withMessage('Invalid category'),
  body('level')
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Level must be Beginner, Intermediate, or Advanced'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 minute'),
  body('instructorName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Instructor name must be between 2 and 100 characters')
    .trim(),
  body('originalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Original price must be a positive number'),
  body('promotionalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Promotional price must be a positive number'),
  body('promotionalPriceEndDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid promotional price end date'),
  body('maxEnrollments')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max enrollments must be at least 1'),
  body('enrollmentStartDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid enrollment start date'),
  body('enrollmentEndDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid enrollment end date'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters')
    .trim(),
  body('whatYoullLearn')
    .optional()
    .isArray()
    .withMessage('What you will learn must be an array'),
  body('prerequisites')
    .optional()
    .isArray()
    .withMessage('Prerequisites must be an array'),
  body('language')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Language must be between 2 and 50 characters')
    .trim(),
  body('seoTitle')
    .optional()
    .isLength({ max: 60 })
    .withMessage('SEO title cannot exceed 60 characters')
    .trim(),
  body('seoDescription')
    .optional()
    .isLength({ max: 160 })
    .withMessage('SEO description cannot exceed 160 characters')
    .trim()
];

const validateCourseUpdate = [
  body('title')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .trim(),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('status')
    .optional()
    .isIn(['Published', 'Draft', 'Archived'])
    .withMessage('Status must be Published, Draft, or Archived'),
  body('category')
    .optional()
    .isIn([
      'Programming', 'Design', 'Business', 'Marketing', 'Photography', 
      'Music', 'Automation', 'Cloud Computing', 'Artificial Intelligence',
      'Cybersecurity', 'Web Development', 'Data Science', 'Other'
    ])
    .withMessage('Invalid category'),
  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Level must be Beginner, Intermediate, or Advanced'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('featured must be a boolean'),
  body('trending')
    .optional()
    .isBoolean()
    .withMessage('trending must be a boolean'),
  body('promotionalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Promotional price must be a positive number'),
  body('promotionalPriceEndDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid promotional price end date'),
  body('maxEnrollments')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max enrollments must be at least 1'),
  body('adminNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Admin notes cannot exceed 1000 characters')
    .trim()
];

const validateLessons = [
  body('lessons')
    .isArray({ min: 1 })
    .withMessage('At least one lesson is required'),
  body('lessons.*.title')
    .isLength({ min: 3, max: 200 })
    .withMessage('Lesson title must be between 3 and 200 characters')
    .trim(),
  body('lessons.*.content')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Lesson content must be between 10 and 5000 characters')
    .trim(),
  body('lessons.*.duration')
    .isInt({ min: 1 })
    .withMessage('Lesson duration must be at least 1 minute'),
  body('lessons.*.order')
    .isInt({ min: 1 })
    .withMessage('Lesson order must be at least 1'),
  body('lessons.*.videoUrl')
    .optional()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Invalid video URL format'),
  body('lessons.*.videoDuration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Video duration must be a positive integer'),
  body('lessons.*.isPreview')
    .optional()
    .isBoolean()
    .withMessage('isPreview must be a boolean')
];

const validateBulkUpdate = [
  body('courseIds')
    .isArray({ min: 1 })
    .withMessage('At least one course ID is required'),
  body('courseIds.*')
    .isMongoId()
    .withMessage('Invalid course ID format'),
  body('action')
    .isIn(['publish', 'draft', 'archive', 'activate', 'deactivate'])
    .withMessage('Invalid action')
];

// Routes

// @route   GET /api/admin/courses
// @desc    Get all courses with advanced filtering and pagination
// @access  Private (Admin only)
router.get('/', 
  authenticate, 
  adminOnly, 
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['title', 'createdAt', 'updatedAt', 'price', 'enrollmentCount']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('status').optional().isIn(['all', 'Published', 'Draft', 'Archived']).withMessage('Invalid status filter'),
    query('category').optional().isString().withMessage('Category must be a string'),
    query('level').optional().isIn(['all', 'Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid level filter'),
    query('active').optional().isIn(['true', 'false']).withMessage('Active filter must be true or false'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date')
  ],
  getAllCourses
);

// @route   GET /api/admin/courses/:id
// @desc    Get course by ID with full analytics
// @access  Private (Admin only)
router.get('/:id', 
  authenticate, 
  adminOnly,
  [param('id').isMongoId().withMessage('Invalid course ID')],
  getCourseById
);

// @route   POST /api/admin/courses
// @desc    Create new course
// @access  Private (Admin only)
router.post('/', 
  authenticate, 
  adminOnly, 
  validateCourseCreation, 
  createCourse
);

// @route   PUT /api/admin/courses/:id
// @desc    Update course
// @access  Private (Admin only)
router.put('/:id', 
  authenticate, 
  adminOnly,
  [param('id').isMongoId().withMessage('Invalid course ID')],
  validateCourseUpdate, 
  updateCourse
);

// @route   DELETE /api/admin/courses/:id
// @desc    Archive course
// @access  Private (Admin only)
router.delete('/:id', 
  authenticate, 
  adminOnly,
  [param('id').isMongoId().withMessage('Invalid course ID')],
  deleteCourse
);

// @route   PUT /api/admin/courses/:id/lessons
// @desc    Update course lessons with videos
// @access  Private (Admin only)
router.put('/:id/lessons', 
  authenticate, 
  adminOnly,
  [param('id').isMongoId().withMessage('Invalid course ID')],
  validateLessons, 
  updateLessons
);

// @route   POST /api/admin/courses/bulk
// @desc    Bulk update courses
// @access  Private (Admin only)
router.post('/bulk', 
  authenticate, 
  adminOnly, 
  validateBulkUpdate, 
  bulkUpdateCourses
);

// @route   GET /api/admin/courses/:id/analytics
// @desc    Get course analytics
// @access  Private (Admin only)
router.get('/:id/analytics', 
  authenticate, 
  adminOnly,
  [
    param('id').isMongoId().withMessage('Invalid course ID'),
    query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid period')
  ],
  getCourseAnalytics
);

module.exports = router;