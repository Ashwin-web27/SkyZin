const User = require('../models/User');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');
const Analytics = require('../models/Analytics');
const { validationResult } = require('express-validator');

// Dashboard stats with real-time analytics
const getDashboardStats = async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    const socketManager = req.app.get('socketManager');
    
    const [
      totalUsers,
      totalCourses,
      totalInstructors,
      totalPayments,
      recentUsers,
      recentCourses,
      monthlyRevenue,
      analyticsData,
      notifications
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Course.countDocuments(),
      User.countDocuments({ role: 'instructor' }),
      Payment.countDocuments({ status: 'Paid' }),
      User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5),
      Course.find().sort({ createdAt: -1 }).limit(5),
      Payment.aggregate([
        { $match: { status: 'Paid', createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Analytics.getDashboardStats(timeRange),
      Notification.find({ type: 'system_announcement' })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('sender', 'name')
    ]);

    const revenue = monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0;
    
    // Get real-time connection stats
    const realTimeStats = {
      activeConnections: socketManager.getActiveConnectionsCount(),
      activeUsers: socketManager.getActiveUsersCount(),
      connectionsByRole: socketManager.getConnectionsByRole()
    };

    // Calculate growth rates
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    
    const [
      lastMonthUsers,
      lastMonthCourses,
      lastMonthRevenue
    ] = await Promise.all([
      User.countDocuments({ role: 'user', createdAt: { $gte: lastMonthStart } }),
      Course.countDocuments({ createdAt: { $gte: lastMonthStart } }),
      Payment.aggregate([
        { 
          $match: { 
            status: 'Paid', 
            createdAt: { 
              $gte: lastMonthStart,
              $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    
    const lastMonthRev = lastMonthRevenue.length > 0 ? lastMonthRevenue[0].total : 0;
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalCourses,
          totalInstructors,
          totalPayments,
          monthlyRevenue: revenue,
          growth: {
            usersGrowth: lastMonthUsers > 0 ? ((totalUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1) : 0,
            coursesGrowth: lastMonthCourses > 0 ? ((totalCourses - lastMonthCourses) / lastMonthCourses * 100).toFixed(1) : 0,
            revenueGrowth: lastMonthRev > 0 ? ((revenue - lastMonthRev) / lastMonthRev * 100).toFixed(1) : 0
          }
        },
        realTimeStats,
        analytics: analyticsData,
        recentUsers: recentUsers.map(user => user.getPublicProfile()),
        recentCourses,
        recentNotifications: notifications
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
};

// User management
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (role && role !== 'all') {
      query.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('enrolledCourses.course', 'title'),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          enrolled: user.enrolledCourses?.length || 0,
          createdAt: user.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('-password')
      .populate('enrolledCourses.course', 'title price');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Blocked', 'Pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Active, Blocked, or Pending'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Send real-time notification to user about status change
    const socketManager = req.app.get('socketManager');
    
    if (socketManager) {
      const notificationData = {
        type: 'system_announcement',
        title: 'Account Status Updated',
        message: `Your account status has been changed to ${status}`,
        priority: status === 'Blocked' ? 'high' : 'medium'
      };
      
      await socketManager.sendNotificationToUser(id, notificationData);
    }

    // Track analytics
    Analytics.trackEvent('user_status_updated', {
      userId: id,
      eventData: { oldStatus: req.body.oldStatus, newStatus: status },
      metadata: {
        adminId: req.user?.id
      }
    });

    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting admin users
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    // Delete related data
    await Promise.all([
      Enrollment.deleteMany({ user: id }),
      Payment.deleteMany({ user: id }),
      User.findByIdAndDelete(id)
    ]);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

// Course management
const getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, instructor } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { instructorName: { $regex: search, $options: 'i' } }
      ];
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (instructor) {
      query.instructor = instructor;
    }

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('instructor', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Course.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        courses: courses.map(course => ({
          id: course._id,
          title: course.title,
          instructor: course.instructorName,
          price: course.price,
          status: course.status,
          enrolledCount: course.enrolledStudents?.length || 0,
          createdAt: course.createdAt,
          thumbnail: course.thumbnail
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses'
    });
  }
};

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

    const { title, description, price, category, level, duration, instructorId } = req.body;

    // Find instructor
    const instructor = await User.findById(instructorId);
    if (!instructor || !['admin', 'instructor'].includes(instructor.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid instructor'
      });
    }

    const course = new Course({
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category,
      level: level || 'Beginner',
      duration: parseInt(duration),
      instructor: instructorId,
      instructorName: instructor.name
    });

    const newCourse = await course.save();

    // Send real-time notifications and events
    const socketManager = req.app.get('socketManager');
    
    if (socketManager) {
      // Emit to all users about new course
      socketManager.emitToUsers('course-created', {
        course: {
          id: newCourse._id,
          title: newCourse.title,
          price: newCourse.price,
          category: newCourse.category,
          level: newCourse.level,
          instructor: instructor.name,
          thumbnail: newCourse.thumbnail
        }
      });

      // Send notification to instructor
      await socketManager.sendNotificationToUser(instructorId, {
        type: 'course_published',
        title: 'Course Created Successfully',
        message: `Your course "${newCourse.title}" has been created and is now available.`,
        data: { courseId: newCourse._id }
      });
    }

    // Track analytics
    Analytics.trackEvent('course_created', {
      userId: instructorId,
      courseId: newCourse._id,
      eventData: {
        title: newCourse.title,
        category: newCourse.category,
        price: newCourse.price
      },
      metadata: {
        adminId: req.user?.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: newCourse
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course'
    });
  }
};

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

    const { id } = req.params;
    const updates = req.body;

    const course = await Course.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('instructor', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Emit real-time event for course update
    const io = req.app.get('io');
    io.to('user-room').emit('course-updated', {
      course: {
        id: course._id,
        title: course.title,
        price: course.price,
        category: course.category,
        level: course.level,
        status: course.status
      }
    });

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course'
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if course has enrollments
    const enrollmentCount = await Enrollment.countDocuments({ course: id });
    if (enrollmentCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete course with active enrollments'
      });
    }

    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Emit real-time event for course deletion
    const io = req.app.get('io');
    io.to('user-room').emit('course-deleted', {
      courseId: course._id,
      courseTitle: course.title
    });

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course'
    });
  }
};

// Payment management
const getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, user, course } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (user) {
      query.user = user;
    }
    if (course) {
      query.course = course;
    }

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('user', 'name email')
        .populate('course', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments: payments.map(payment => ({
          id: payment._id,
          user: payment.userName,
          course: payment.courseName,
          amount: payment.amount,
          status: payment.status,
          date: payment.createdAt,
          transactionId: payment.transactionId
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
};

// Instructor management
const getInstructors = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    const query = { role: 'instructor' };
    if (status && status !== 'all') {
      query.status = status;
    }

    const [instructors, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    // Get course counts and ratings for each instructor
    const instructorData = await Promise.all(
      instructors.map(async (instructor) => {
        const [courses, avgRating] = await Promise.all([
          Course.countDocuments({ instructor: instructor._id }),
          Course.aggregate([
            { $match: { instructor: instructor._id } },
            { $group: { _id: null, avgRating: { $avg: '$rating.average' } } }
          ])
        ]);

        return {
          id: instructor._id,
          name: instructor.name,
          email: instructor.email,
          totalCourses: courses,
          rating: avgRating.length > 0 ? avgRating[0].avgRating : 0,
          status: instructor.status,
          createdAt: instructor.createdAt
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        instructors: instructorData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get instructors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch instructors'
    });
  }
};

// Notification management
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, isRead } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = {};
    if (type && type !== 'all') {
      query.type = type;
    }
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('recipient', 'name email')
        .populate('sender', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

const createSystemNotification = async (req, res) => {
  try {
    const { title, message, type = 'system_announcement', priority = 'medium', targetRole } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    const socketManager = req.app.get('socketManager');
    
    // If targeting specific role, send to those users only
    if (targetRole && targetRole !== 'all') {
      const targetUsers = await User.find({ role: targetRole }).select('_id');
      
      // Create notifications for target users
      const notifications = await Notification.insertMany(
        targetUsers.map(user => ({
          recipient: user._id,
          sender: req.user?.id,
          type,
          title,
          message,
          priority
        }))
      );

      // Send real-time notifications
      if (socketManager) {
        await socketManager.broadcastSystemAnnouncement(title, message, targetRole);
      }

      res.status(201).json({
        success: true,
        message: `System notification sent to ${targetUsers.length} ${targetRole}s`,
        data: { count: notifications.length }
      });
    } else {
      // Send to all users
      const allUsers = await User.find({}).select('_id');
      
      const notifications = await Notification.insertMany(
        allUsers.map(user => ({
          recipient: user._id,
          sender: req.user?.id,
          type,
          title,
          message,
          priority
        }))
      );

      if (socketManager) {
        await socketManager.broadcastSystemAnnouncement(title, message);
      }

      res.status(201).json({
        success: true,
        message: `System notification sent to all ${allUsers.length} users`,
        data: { count: notifications.length }
      });
    }

  } catch (error) {
    console.error('Create system notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create system notification'
    });
  }
};

// Analytics management
const getAnalytics = async (req, res) => {
  try {
    const { 
      timeRange = '7d', 
      type, 
      groupBy = 'day',
      startDate,
      endDate
    } = req.query;

    let matchQuery = {};
    
    // Date range filtering
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      const now = new Date();
      let startFromDate;
      
      switch (timeRange) {
        case '1d':
          startFromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startFromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startFromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startFromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startFromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      matchQuery.createdAt = { $gte: startFromDate };
    }

    // Type filtering
    if (type && type !== 'all') {
      matchQuery.type = type;
    }

    // Group by time period
    let groupByFormat;
    switch (groupBy) {
      case 'hour':
        groupByFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
        break;
      case 'day':
        groupByFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'month':
        groupByFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default:
        groupByFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    const analyticsData = await Analytics.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            ...groupByFormat,
            type: '$type'
          },
          count: { $sum: '$value' },
          totalValue: { $sum: '$value' }
        }
      },
      {
        $group: {
          _id: {
            period: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
              hour: '$_id.hour'
            }
          },
          events: {
            $push: {
              type: '$_id.type',
              count: '$count',
              value: '$totalValue'
            }
          },
          totalEvents: { $sum: '$count' }
        }
      },
      { $sort: { '_id.period.year': 1, '_id.period.month': 1, '_id.period.day': 1, '_id.period.hour': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        analytics: analyticsData,
        filters: {
          timeRange,
          type: type || 'all',
          groupBy,
          startDate,
          endDate
        }
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

const getRealTimeStats = async (req, res) => {
  try {
    const socketManager = req.app.get('socketManager');
    
    const stats = {
      activeConnections: socketManager.getActiveConnectionsCount(),
      activeUsers: socketManager.getActiveUsersCount(),
      connectionsByRole: socketManager.getConnectionsByRole(),
      serverUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date()
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get real-time stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch real-time stats'
    });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getPayments,
  getInstructors,
  getNotifications,
  createSystemNotification,
  getAnalytics,
  getRealTimeStats
};
