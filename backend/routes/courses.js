const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const courseService = require('../services/courseService');
const { authenticate, adminOnly } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   GET /api/courses
// @desc    Get all active courses (unified for admin and user)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      level, 
      status, 
      featured, 
      trending, 
      search,
      page = 1, 
      limit = 20,
      sort 
    } = req.query;

    const filters = { category, level, status, featured, trending, search };
    const pagination = { page: parseInt(page), limit: parseInt(limit), sort };
    const userRole = req.user?.role || 'user';

    const result = await courseService.getAllCourses(filters, pagination, userRole);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses'
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course by ID (unified with enrollment status)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role || 'user';
    
    const result = await courseService.getCourseById(req.params.id, userId, userRole);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course'
    });
  }
});

// @route   POST /api/courses
// @desc    Create a new course (Admin only)
// @access  Private/Admin
router.post('/',
  authenticate,
  [
    body('title').notEmpty().trim().withMessage('Course title is required'),
    body('description').notEmpty().trim().withMessage('Course description is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('category').notEmpty().withMessage('Category is required'),
    body('level').isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid level'),
    body('duration').isNumeric().withMessage('Duration must be a number')
  ],
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        title,
        description,
        price,
        originalPrice,
        category,
        level,
        duration,
        thumbnail,
        tags,
        lessons
      } = req.body;

      const course = new Course({
        title,
        description,
        instructor: req.user._id,
        instructorName: `${req.user.firstName} ${req.user.lastName}`,
        price,
        originalPrice,
        category,
        level,
        duration,
        thumbnail,
        tags: tags || [],
        lessons: lessons || [],
        status: 'Published',
        isActive: true
      });

      await course.save();

      // Emit real-time event for new course
      const socketManager = req.app.get('socketManager');
      if (socketManager) {
        socketManager.broadcastCourseCreated(course);
      }

      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course
      });
    } catch (error) {
      console.error('Error creating course:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating course'
      });
    }
  }
);

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private/Admin
router.put('/:id',
  authenticate,
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      const updatedCourse = await Course.findByIdAndUpdate(
        req.params.id,
        { ...req.body },
        { new: true, runValidators: true }
      );

      // Emit real-time event for course update
      const socketManager = req.app.get('socketManager');
      if (socketManager) {
        socketManager.broadcastCourseUpdated(updatedCourse);
      }

      res.json({
        success: true,
        message: 'Course updated successfully',
        data: updatedCourse
      });
    } catch (error) {
      console.error('Error updating course:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating course'
      });
    }
  }
);

// @route   DELETE /api/courses/:id
// @desc    Delete a course (soft delete by setting isActive to false)
// @access  Private/Admin
router.delete('/:id',
  authenticate,
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      // Soft delete - set isActive to false
      course.isActive = false;
      await course.save();

      // Emit real-time event for course deletion
      const socketManager = req.app.get('socketManager');
      if (socketManager) {
        socketManager.broadcastCourseDeleted(req.params.id, course.title);
      }

      res.json({
        success: true,
        message: 'Course deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting course'
      });
    }
  }
);

// @route   GET /api/courses/featured
// @desc    Get featured courses
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const result = await courseService.getFeaturedCourses(parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Error fetching featured courses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured courses'
    });
  }
});

// @route   GET /api/courses/trending
// @desc    Get trending courses
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const result = await courseService.getTrendingCourses(parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Error fetching trending courses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trending courses'
    });
  }
});

// @route   GET /api/courses/stats
// @desc    Get course statistics
// @access  Public (with role-based data)
router.get('/stats', async (req, res) => {
  try {
    const result = await courseService.getCourseStats();
    res.json(result);
  } catch (error) {
    console.error('Error fetching course stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course statistics'
    });
  }
});

// @route   GET /api/courses/search
// @desc    Search courses with advanced filters
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q: searchQuery, ...filters } = req.query;
    const userId = req.user?._id;
    
    const result = await courseService.searchCourses(searchQuery, filters, userId);
    res.json(result);
  } catch (error) {
    console.error('Error searching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching courses'
    });
  }
});

module.exports = router;
