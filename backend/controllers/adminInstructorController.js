const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// Get all instructors with analytics and course information
const getAllInstructors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter query
    const filter = { role: 'instructor' };
    
    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }
    
    // Search filter (name or email)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
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
    
    const instructors = await User.find(filter)
      .select('-password')
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .lean();
      
    const totalInstructors = await User.countDocuments(filter);
    
    // Add course statistics for each instructor
    const instructorsWithStats = await Promise.all(
      instructors.map(async (instructor) => {
        // Get instructor's courses
        const courses = await Course.find({ 
          instructor: instructor._id,
          status: { $ne: 'Archived' }
        });
        
        const publishedCourses = courses.filter(course => course.status === 'Published');
        const draftCourses = courses.filter(course => course.status === 'Draft');
        
        // Calculate total enrollments across all courses
        const totalEnrollments = courses.reduce((sum, course) => {
          return sum + (course.analytics?.totalEnrollments || 0);
        }, 0);
        
        // Calculate total revenue
        const totalRevenue = courses.reduce((sum, course) => {
          return sum + (course.analytics?.totalRevenue || 0);
        }, 0);
        
        // Calculate average rating across all courses
        const coursesWithRatings = courses.filter(course => course.rating && course.rating.count > 0);
        const averageRating = coursesWithRatings.length > 0 
          ? coursesWithRatings.reduce((sum, course) => sum + course.rating.average, 0) / coursesWithRatings.length
          : 0;
        
        // Calculate total reviews count
        const totalReviews = courses.reduce((sum, course) => {
          return sum + (course.rating?.count || 0);
        }, 0);
        
        return {
          ...instructor,
          stats: {
            totalCourses: courses.length,
            publishedCourses: publishedCourses.length,
            draftCourses: draftCourses.length,
            totalEnrollments,
            totalRevenue,
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews,
            joinedDate: instructor.createdAt
          }
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        instructors: instructorsWithStats,
        pagination: {
          page,
          limit,
          total: totalInstructors,
          pages: Math.ceil(totalInstructors / limit)
        },
        filters: {
          status: req.query.status || 'all',
          search: req.query.search
        }
      }
    });
    
  } catch (error) {
    console.error('Get all instructors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch instructors'
    });
  }
};

// Get single instructor with detailed information
const getInstructorById = async (req, res) => {
  try {
    const instructor = await User.findById(req.params.id)
      .select('-password')
      .lean();
      
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }
    
    // Get instructor's courses with detailed information
    const courses = await Course.find({ instructor: instructor._id })
      .populate('enrolledStudents.student', 'name email')
      .sort({ createdAt: -1 });
    
    // Get recent enrollments across all instructor's courses
    const recentEnrollments = await Enrollment.find({
      course: { $in: courses.map(c => c._id) }
    })
      .populate('user', 'name email avatar')
      .populate('course', 'title price')
      .sort({ enrollmentDate: -1 })
      .limit(10);
    
    // Calculate comprehensive statistics
    const stats = {
      totalCourses: courses.length,
      publishedCourses: courses.filter(c => c.status === 'Published').length,
      draftCourses: courses.filter(c => c.status === 'Draft').length,
      archivedCourses: courses.filter(c => c.status === 'Archived').length,
      totalEnrollments: courses.reduce((sum, course) => sum + (course.analytics?.totalEnrollments || 0), 0),
      totalRevenue: courses.reduce((sum, course) => sum + (course.analytics?.totalRevenue || 0), 0),
      totalStudents: new Set(courses.flatMap(c => c.enrolledStudents.map(s => s.student._id.toString()))).size,
      averageRating: courses.length > 0 
        ? courses.reduce((sum, c) => sum + (c.rating?.average || 0), 0) / courses.length
        : 0,
      totalReviews: courses.reduce((sum, course) => sum + (course.rating?.count || 0), 0),
      totalLessons: courses.reduce((sum, course) => sum + course.lessons.length, 0),
      totalDuration: courses.reduce((sum, course) => sum + (course.duration || 0), 0), // in minutes
      monthlyRevenue: courses.reduce((sum, course) => {
        // Calculate revenue from this month (simplified)
        return sum + (course.analytics?.totalRevenue || 0) * 0.1; // rough estimate
      }, 0)
    };
    
    res.json({
      success: true,
      data: {
        instructor,
        courses,
        recentEnrollments,
        stats
      }
    });
    
  } catch (error) {
    console.error('Get instructor by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch instructor details'
    });
  }
};

// Create a new instructor
const createInstructor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { name, email, password, phone, avatar, bio } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    // Create instructor user
    const instructor = new User({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      avatar,
      bio,
      role: 'instructor',
      status: 'Active'
    });
    
    await instructor.save();
    
    // Remove password from response
    const instructorResponse = instructor.toObject();
    delete instructorResponse.password;
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('instructorCreated', {
        instructor: instructorResponse,
        createdBy: req.user.name,
        timestamp: new Date()
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Instructor created successfully',
      data: instructorResponse
    });
    
  } catch (error) {
    console.error('Create instructor error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create instructor'
    });
  }
};

// Update instructor information
const updateInstructor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const instructor = await User.findById(req.params.id);
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }
    
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    // Remove sensitive fields that shouldn't be updated via this route
    delete updateData.password;
    delete updateData._id;
    delete updateData.role; // Prevent role changes
    delete updateData.createdAt;
    
    // If email is being updated, check for conflicts
    if (updateData.email && updateData.email !== instructor.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email.toLowerCase(),
        _id: { $ne: instructor._id }
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
      
      updateData.email = updateData.email.toLowerCase();
    }
    
    const updatedInstructor = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    // Update instructorName in all courses if name was changed
    if (updateData.name && updateData.name !== instructor.name) {
      await Course.updateMany(
        { instructor: instructor._id },
        { instructorName: updateData.name }
      );
    }
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('instructorUpdated', {
        instructorId: instructor._id,
        instructor: updatedInstructor,
        updatedBy: req.user.name,
        changes: Object.keys(req.body),
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Instructor updated successfully',
      data: updatedInstructor
    });
    
  } catch (error) {
    console.error('Update instructor error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update instructor'
    });
  }
};

// Toggle instructor status (Active/Blocked)
const toggleInstructorStatus = async (req, res) => {
  try {
    const instructor = await User.findById(req.params.id);
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }
    
    const newStatus = instructor.status === 'Active' ? 'Blocked' : 'Active';
    
    const updatedInstructor = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status: newStatus,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    // If blocking instructor, archive their active courses
    if (newStatus === 'Blocked') {
      await Course.updateMany(
        { instructor: instructor._id, status: { $ne: 'Archived' } },
        { 
          status: 'Archived',
          archivedAt: new Date(),
          lastModifiedBy: req.user._id
        }
      );
    }
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('instructorStatusChanged', {
        instructorId: instructor._id,
        instructor: updatedInstructor,
        previousStatus: instructor.status,
        newStatus: newStatus,
        changedBy: req.user.name,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: `Instructor ${newStatus.toLowerCase()} successfully`,
      data: updatedInstructor
    });
    
  } catch (error) {
    console.error('Toggle instructor status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update instructor status'
    });
  }
};

// Delete instructor (soft delete)
const deleteInstructor = async (req, res) => {
  try {
    const instructor = await User.findById(req.params.id);
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }
    
    // Check if instructor has active courses
    const activeCourses = await Course.countDocuments({
      instructor: instructor._id,
      status: { $in: ['Published', 'Draft'] }
    });
    
    if (activeCourses > 0 && req.query.force !== 'true') {
      return res.status(400).json({
        success: false,
        message: `Instructor has ${activeCourses} active courses. Use ?force=true to delete anyway.`,
        activeCourses
      });
    }
    
    // Archive all instructor's courses
    await Course.updateMany(
      { instructor: instructor._id },
      { 
        status: 'Archived',
        archivedAt: new Date(),
        lastModifiedBy: req.user._id
      }
    );
    
    // Soft delete instructor
    instructor.status = 'Blocked';
    instructor.email = `deleted_${Date.now()}_${instructor.email}`;
    instructor.updatedAt = new Date();
    await instructor.save();
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('instructorDeleted', {
        instructorId: instructor._id,
        instructorName: instructor.name,
        deletedBy: req.user.name,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Instructor deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete instructor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete instructor'
    });
  }
};

// Assign instructor to course
const assignInstructorToCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const instructorId = req.params.id;
    
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Update course with new instructor
    course.instructor = instructorId;
    course.instructorName = instructor.name;
    course.lastModifiedBy = req.user._id;
    course.updatedAt = new Date();
    
    await course.save();
    
    res.json({
      success: true,
      message: 'Instructor assigned to course successfully',
      data: { course, instructor }
    });
    
  } catch (error) {
    console.error('Assign instructor to course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign instructor to course'
    });
  }
};

// Get instructor analytics
const getInstructorAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'week':
        startDate.setDate(now.getDate() - (7 * 12));
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 12);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 5);
        break;
    }
    
    // Get instructor registration trends
    const instructorTrends = await User.aggregate([
      {
        $match: {
          role: 'instructor',
          createdAt: { $gte: startDate },
          status: { $ne: 'Blocked' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: period === 'day' ? '%Y-%m-%d' : 
                     period === 'week' ? '%Y-%U' :
                     period === 'month' ? '%Y-%m' : '%Y',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Get status distribution
    const statusDistribution = await User.aggregate([
      {
        $match: { role: 'instructor' }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get course creation trends by instructors
    const courseCreationTrends = await Course.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: period === 'day' ? '%Y-%m-%d' : 
                     period === 'week' ? '%Y-%U' :
                     period === 'month' ? '%Y-%m' : '%Y',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Calculate totals
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const activeInstructors = await User.countDocuments({ role: 'instructor', status: 'Active' });
    const blockedInstructors = await User.countDocuments({ role: 'instructor', status: 'Blocked' });
    const newInstructors = await User.countDocuments({ 
      role: 'instructor',
      createdAt: { $gte: startDate }
    });
    
    res.json({
      success: true,
      data: {
        period,
        instructorTrends,
        statusDistribution,
        courseCreationTrends,
        totals: {
          totalInstructors,
          activeInstructors,
          blockedInstructors,
          newInstructors
        }
      }
    });
    
  } catch (error) {
    console.error('Get instructor analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch instructor analytics'
    });
  }
};

module.exports = {
  getAllInstructors,
  getInstructorById,
  createInstructor,
  updateInstructor,
  toggleInstructorStatus,
  deleteInstructor,
  assignInstructorToCourse,
  getInstructorAnalytics
};