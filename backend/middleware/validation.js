const { body } = require('express-validator');

// Validation rules for user registration
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
    
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
    
  body('role')
    .optional()
    .isIn(['user', 'admin', 'instructor'])
    .withMessage('Role must be either user, admin, or instructor')
];

// Validation rules for user login
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation rules for admin login
const validateAdminLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation rules for refresh token
const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

// Validation rules for course creation
const validateCourse = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Course title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Course title must be between 5 and 200 characters'),
    
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Course description is required')
    .isLength({ min: 20, max: 2000 })
    .withMessage('Course description must be between 20 and 2000 characters'),
    
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
    
  body('category')
    .isIn(['Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Other'])
    .withMessage('Invalid category'),
    
  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Level must be Beginner, Intermediate, or Advanced'),
    
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer (in minutes)')
];

// Validation rules for course update
const validateCourseUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Course title must be between 5 and 200 characters'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Course description must be between 20 and 2000 characters'),
    
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
    
  body('category')
    .optional()
    .isIn(['Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Other'])
    .withMessage('Invalid category'),
    
  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Level must be Beginner, Intermediate, or Advanced'),
    
  body('status')
    .optional()
    .isIn(['Published', 'Draft', 'Archived'])
    .withMessage('Status must be Published, Draft, or Archived')
];

// Validation rules for user profile update
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
    
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

// Validation rules for password change
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
    
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
];

// Validation rules for enrollment
const validateEnrollment = [
  body('courseId')
    .isMongoId()
    .withMessage('Valid course ID is required')
];

// Validation rules for payment
const validatePayment = [
  body('courseId')
    .isMongoId()
    .withMessage('Valid course ID is required'),
    
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
    
  body('paymentMethod')
    .isIn(['card', 'paypal', 'bank_transfer', 'wallet'])
    .withMessage('Invalid payment method'),
    
  body('paymentGateway')
    .isIn(['stripe', 'paypal', 'razorpay', 'square'])
    .withMessage('Invalid payment gateway')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateAdminLogin,
  validateRefreshToken,
  validateCourse,
  validateCourseUpdate,
  validateProfileUpdate,
  validatePasswordChange,
  validateEnrollment,
  validatePayment
};