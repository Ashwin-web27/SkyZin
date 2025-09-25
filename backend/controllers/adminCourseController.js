const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Cart = require('../models/Cart');
const { validationResult } = require('express-validator');

// Get all courses for admin with advanced filtering and analytics
const getAllCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter query
    const filter = {};
    
    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }
    
    // Category filter
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }
    
    // Level filter  
    if (req.query.level && req.query.level !== 'all') {
      filter.level = req.query.level;
    }
    
    // Active filter
    if (req.query.active !== undefined) {
      filter.isActive = req.query.active === 'true';
    }
    
    // Search filter
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }
    
    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }
    
    // Sort options
    let sortBy = { createdAt: -1 }; // default sort
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      sortBy = { [sortField]: sortOrder };
    }
    
    const courses = await Course.find(filter)
      .populate('instructor', 'name email avatar')
      .populate('lastModifiedBy', 'name email')
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .lean();
      
    const totalCourses = await Course.countDocuments(filter);
    
    // Add enrollment counts and revenue data
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await Enrollment.countDocuments({ 
          course: course._id,
          status: { $in: ['enrolled', 'in_progress', 'completed'] }
        });
        
        const completedCount = await Enrollment.countDocuments({
          course: course._id,
          status: 'completed'
        });
        
        const revenue = enrollmentCount * (course.currentPrice || course.price);
        
        return {
          ...course,
          stats: {
            enrollmentCount,
            completedCount,
            completionRate: enrollmentCount > 0 ? Math.round((completedCount / enrollmentCount) * 100) : 0,
            revenue: revenue
          }
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        courses: coursesWithStats,
        pagination: {
          page,
          limit,
          total: totalCourses,
          pages: Math.ceil(totalCourses / limit)
        },
        filters: {
          status: req.query.status || 'all',
          category: req.query.category || 'all',
          level: req.query.level || 'all',
          active: req.query.active,
          search: req.query.search
        }
      }
    });
    
  } catch (error) {
    console.error('Get all courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses'
    });
  }
};

// Get single course for admin with full details
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email avatar')
      .populate('lastModifiedBy', 'name email')
      .populate('reviews.user', 'name avatar');
      
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Get enrollment analytics
    const enrollments = await Enrollment.find({ course: course._id })
      .populate('user', 'name email')
      .sort({ enrollmentDate: -1 });
    
    const enrollmentStats = {
      total: enrollments.length,
      active: enrollments.filter(e => ['enrolled', 'in_progress'].includes(e.status)).length,
      completed: enrollments.filter(e => e.status === 'completed').length,
      dropped: enrollments.filter(e => e.status === 'dropped').length
    };
    
    // Calculate revenue
    const revenue = enrollments.length * (course.currentPrice || course.price);
    
    // Get recent enrollments
    const recentEnrollments = enrollments.slice(0, 10);
    
    res.json({
      success: true,
      data: {
        course,
        analytics: {
          enrollments: enrollmentStats,
          revenue,
          averageRating: course.rating.average,
          totalReviews: course.reviews.length,
          recentEnrollments
        }
      }
    });
    
  } catch (error) {
    console.error('Get course by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course details'
    });
  }
};

// Create new course
const createCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const courseData = {
      ...req.body,
      instructor: req.body.instructor || req.user._id,
      instructorName: req.body.instructorName || req.user.name,
      lastModifiedBy: req.user._id
    };
    
    const course = new Course(courseData);
    await course.save();
    
    await course.populate('instructor', 'name email avatar');
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('courseCreated', {
        course: course,
        createdBy: req.user.name,
        timestamp: new Date()
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
    
  } catch (error) {
    console.error('Create course error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Course with this title already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create course'
    });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const updateData = {
      ...req.body,
      lastModifiedBy: req.user._id
    };
    
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('instructor', 'name email avatar');
    
    // Emit real-time update to all users
    const io = req.app.get('io');
    if (io) {
      io.emit('courseUpdated', {
        courseId: course._id,
        course: updatedCourse,
        updatedBy: req.user.name,
        changes: Object.keys(req.body),
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Course updated successfully',
      data: updatedCourse
    });
    
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course'
    });
  }
};

// Delete course (soft delete - archive)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if course has active enrollments
    const activeEnrollments = await Enrollment.countDocuments({
      course: course._id,
      status: { $in: ['enrolled', 'in_progress'] }
    });
    
    if (activeEnrollments > 0 && req.query.force !== 'true') {
      return res.status(400).json({
        success: false,
        message: `Course has ${activeEnrollments} active enrollments. Use ?force=true to archive anyway.`,
        activeEnrollments
      });
    }
    
    // Archive instead of hard delete
    course.status = 'Archived';
    course.isActive = false;
    course.archivedAt = new Date();
    course.lastModifiedBy = req.user._id;
    await course.save();
    
    // Remove from all carts
    await Cart.updateMany(
      { 'items.course': course._id },
      { $pull: { items: { course: course._id } } }
    );
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('courseArchived', {
        courseId: course._id,
        courseTitle: course.title,
        archivedBy: req.user.name,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Course archived successfully'
    });
    
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive course'
    });
  }
};

// Manage course lessons
const updateLessons = async (req, res) => {
  try {
    const { lessons } = req.body;
    
    if (!Array.isArray(lessons)) {
      return res.status(400).json({
        success: false,
        message: 'Lessons must be an array'
      });
    }
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Validate lesson order
    const orders = lessons.map(l => l.order);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      return res.status(400).json({
        success: false,
        message: 'Lesson orders must be unique'
      });
    }
    
    course.lessons = lessons.map(lesson => ({
      ...lesson,
      updatedAt: new Date()
    }));
    
    course.lastModifiedBy = req.user._id;
    await course.save();
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('courseLessonsUpdated', {
        courseId: course._id,
        courseTitle: course.title,
        lessonCount: course.lessons.length,
        updatedBy: req.user.name,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Lessons updated successfully',
      data: {
        courseId: course._id,
        lessons: course.lessons,
        totalDuration: course.duration
      }
    });
    
  } catch (error) {
    console.error('Update lessons error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lessons'
    });
  }
};

// Bulk operations
const bulkUpdateCourses = async (req, res) => {
  try {
    const { courseIds, updates, action } = req.body;
    
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Course IDs array is required'
      });
    }
    
    let result;
    const updateData = { 
      ...updates, 
      lastModifiedBy: req.user._id 
    };
    
    switch (action) {
      case 'publish':
        updateData.status = 'Published';
        updateData.publishedAt = new Date();
        break;
      case 'draft':
        updateData.status = 'Draft';
        break;
      case 'archive':
        updateData.status = 'Archived';
        updateData.isActive = false;
        updateData.archivedAt = new Date();
        break;
      case 'activate':
        updateData.isActive = true;
        break;
      case 'deactivate':
        updateData.isActive = false;
        break;
    }
    
    result = await Course.updateMany(
      { _id: { $in: courseIds } },
      updateData
    );
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('coursesBulkUpdated', {
        action,
        courseIds,
        updatedCount: result.modifiedCount,
        updatedBy: req.user.name,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: `Bulk ${action} completed`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });
    
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk operation'
    });
  }
};

// Get course analytics
const getCourseAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'month' } = req.query; // day, week, month, year
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 30); // Last 30 days
        break;
      case 'week':
        startDate.setDate(now.getDate() - (7 * 12)); // Last 12 weeks
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 12); // Last 12 months
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 5); // Last 5 years
        break;
    }
    
    // Get enrollment trends
    const enrollmentTrends = await Enrollment.aggregate([
      {
        $match: {
          course: course._id,
          enrollmentDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: period === 'day' ? '%Y-%m-%d' : 
                     period === 'week' ? '%Y-%U' :
                     period === 'month' ? '%Y-%m' : '%Y',
              date: '$enrollmentDate'
            }
          },
          count: { $sum: 1 },
          revenue: { $sum: course.price }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Get completion analytics
    const completionStats = await Enrollment.aggregate([
      {
        $match: { course: course._id }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgProgress: { $avg: '$progress.percentage' }
        }
      }
    ]);
    
    // Calculate total metrics
    const totalEnrollments = await Enrollment.countDocuments({ course: course._id });
    const totalRevenue = totalEnrollments * course.price;
    const avgRating = course.rating.average;
    const totalReviews = course.reviews.length;
    
    res.json({
      success: true,
      data: {
        course: {
          id: course._id,
          title: course.title,
          status: course.status
        },
        period,
        trends: enrollmentTrends,
        completion: completionStats,
        totals: {
          enrollments: totalEnrollments,
          revenue: totalRevenue,
          avgRating,
          totalReviews
        }
      }
    });
    
  } catch (error) {
    console.error('Get course analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  updateLessons,
  bulkUpdateCourses,
  getCourseAnalytics
};