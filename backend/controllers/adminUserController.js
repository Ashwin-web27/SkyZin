const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Cart = require('../models/Cart');
const { validationResult } = require('express-validator');

// Get all users for admin with advanced filtering and analytics
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter query
    const filter = {};
    
    // Role filter
    if (req.query.role && req.query.role !== 'all') {
      filter.role = req.query.role;
    }
    
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
    
    const users = await User.find(filter)
      .select('-password') // Exclude password field
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .lean();
      
    const totalUsers = await User.countDocuments(filter);
    
    // Add enrollment counts and activity data
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Get enrollment count
        const enrollmentCount = await Enrollment.countDocuments({ 
          user: user._id,
          status: { $in: ['enrolled', 'in_progress', 'completed'] }
        });
        
        // Get completed courses count
        const completedCount = await Enrollment.countDocuments({
          user: user._id,
          status: 'completed'
        });
        
        // Get cart items count
        const cart = await Cart.findOne({ user: user._id });
        const cartItemsCount = cart ? cart.items.length : 0;
        
        // Calculate total spent (assuming each enrollment cost the course price)
        const enrollments = await Enrollment.find({ user: user._id })
          .populate('course', 'price')
          .select('course');
        
        const totalSpent = enrollments.reduce((sum, enrollment) => {
          return sum + (enrollment.course?.price || 0);
        }, 0);
        
        return {
          ...user,
          stats: {
            enrollmentCount,
            completedCount,
            completionRate: enrollmentCount > 0 ? Math.round((completedCount / enrollmentCount) * 100) : 0,
            cartItemsCount,
            totalSpent,
            lastLoginAt: user.lastLoginAt || null
          }
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page,
          limit,
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit)
        },
        filters: {
          role: req.query.role || 'all',
          status: req.query.status || 'all',
          search: req.query.search
        }
      }
    });
    
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// Get single user for admin with full details
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .lean();
      
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user's enrollments with course details
    const enrollments = await Enrollment.find({ user: user._id })
      .populate('course', 'title price thumbnail category level')
      .sort({ enrollmentDate: -1 });
    
    // Get user's cart
    const cart = await Cart.findOne({ user: user._id })
      .populate('items.course', 'title price thumbnail');
    
    // Calculate user statistics
    const stats = {
      totalEnrollments: enrollments.length,
      completedCourses: enrollments.filter(e => e.status === 'completed').length,
      inProgressCourses: enrollments.filter(e => e.status === 'in_progress').length,
      totalSpent: enrollments.reduce((sum, e) => sum + (e.course?.price || 0), 0),
      cartValue: cart ? cart.items.reduce((sum, item) => sum + (item.course?.price || 0), 0) : 0,
      averageProgress: enrollments.length > 0 
        ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress?.percentage || 0), 0) / enrollments.length)
        : 0
    };
    
    res.json({
      success: true,
      data: {
        user,
        enrollments,
        cart: cart || { items: [] },
        stats
      }
    });
    
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details'
    });
  }
};

// Update user (admin can change role, status, etc.)
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent self-demotion from admin
    if (user._id.toString() === req.user._id.toString() && req.body.role && req.body.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own admin role'
      });
    }
    
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    // Remove sensitive fields that shouldn't be updated via this route
    delete updateData.password;
    delete updateData._id;
    delete updateData.createdAt;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('userUpdated', {
        userId: user._id,
        user: updatedUser,
        updatedBy: req.user.name,
        changes: Object.keys(req.body),
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

// Toggle user status (Active/Blocked)
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent self-blocking
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block/unblock yourself'
      });
    }
    
    const newStatus = user.status === 'Active' ? 'Blocked' : 'Active';
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status: newStatus,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('userStatusChanged', {
        userId: user._id,
        user: updatedUser,
        previousStatus: user.status,
        newStatus: newStatus,
        changedBy: req.user.name,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: `User ${newStatus.toLowerCase()} successfully`,
      data: updatedUser
    });
    
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

// Delete user (soft delete by setting status to 'Deleted')
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete yourself'
      });
    }
    
    // Check if user has active enrollments
    const activeEnrollments = await Enrollment.countDocuments({
      user: user._id,
      status: { $in: ['enrolled', 'in_progress'] }
    });
    
    if (activeEnrollments > 0 && req.query.force !== 'true') {
      return res.status(400).json({
        success: false,
        message: `User has ${activeEnrollments} active enrollments. Use ?force=true to delete anyway.`,
        activeEnrollments
      });
    }
    
    // Soft delete - set status to 'Deleted'
    user.status = 'Deleted';
    user.email = `deleted_${Date.now()}_${user.email}`; // Prevent email conflicts
    user.updatedAt = new Date();
    await user.save();
    
    // Clean up user's cart
    await Cart.deleteOne({ user: user._id });
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('userDeleted', {
        userId: user._id,
        userName: user.name,
        deletedBy: req.user.name,
        timestamp: new Date()
      });
    }
    
    res.json({
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

// Get user analytics and dashboard stats
const getUserAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year
    
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
    
    // Get user registration trends
    const registrationTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'Deleted' }
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
          count: { $sum: 1 },
          roles: {
            $push: '$role'
          }
        }
      },
      {
        $addFields: {
          userCount: { $size: { $filter: { input: '$roles', cond: { $eq: ['$$this', 'user'] } } } },
          adminCount: { $size: { $filter: { input: '$roles', cond: { $eq: ['$$this', 'admin'] } } } },
          instructorCount: { $size: { $filter: { input: '$roles', cond: { $eq: ['$$this', 'instructor'] } } } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Get user status distribution
    const statusDistribution = await User.aggregate([
      {
        $match: { status: { $ne: 'Deleted' } }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get role distribution
    const roleDistribution = await User.aggregate([
      {
        $match: { status: { $ne: 'Deleted' } }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Calculate total metrics
    const totalUsers = await User.countDocuments({ status: { $ne: 'Deleted' } });
    const activeUsers = await User.countDocuments({ status: 'Active' });
    const blockedUsers = await User.countDocuments({ status: 'Blocked' });
    const newUsers = await User.countDocuments({ 
      createdAt: { $gte: startDate },
      status: { $ne: 'Deleted' }
    });
    
    res.json({
      success: true,
      data: {
        period,
        trends: registrationTrends,
        statusDistribution,
        roleDistribution,
        totals: {
          totalUsers,
          activeUsers,
          blockedUsers,
          newUsers
        }
      }
    });
    
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getUserAnalytics
};