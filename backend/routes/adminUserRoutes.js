const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');
const {
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getUserAnalytics
} = require('../controllers/adminUserController');

// Validation middleware
const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters long'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['user', 'admin', 'instructor'])
    .withMessage('Role must be user, admin, or instructor'),
  body('status')
    .optional()
    .isIn(['Active', 'Blocked'])
    .withMessage('Status must be Active or Blocked'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
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

// GET /admin/users - Get all users with filtering and pagination
router.get('/', getAllUsers);

// GET /admin/users/analytics - Get user analytics (MUST be before /:id)
router.get('/analytics', getUserAnalytics);

// GET /admin/users/:id - Get single user details
router.get('/:id', getUserById);

// PUT /admin/users/:id - Update user
router.put('/:id', updateUserValidation, updateUser);

// PATCH /admin/users/:id/status - Toggle user status
router.patch('/:id/status', toggleUserStatus);

// DELETE /admin/users/:id - Delete user
router.delete('/:id', deleteUser);

module.exports = router;