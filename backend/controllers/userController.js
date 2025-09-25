const User = require('../models/User');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Cart = require('../models/Cart');
const Notification = require('../models/Notification');
const Analytics = require('../models/Analytics');
const { validationResult } = require('express-validator');

// Profile management
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('enrolledCourses.course', 'title price thumbnail');

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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email } = req.body;
    const updates = {};
    
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase();

    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

// Public statistics for homepage
const getPublicStats = async (req, res) => {
  try {
    const [totalUsers, totalCourses, totalInstructors, totalEnrollments] = await Promise.all([
      User.countDocuments({ status: 'Active' }),
      Course.countDocuments({ status: 'Published', isActive: true }),
      User.countDocuments({ role: 'instructor', status: 'Active' }),
      Enrollment.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalCourses,
        totalInstructors,
        totalPayments: totalEnrollments, // Using enrollments as payments for now
        monthlyRevenue: 0 // Can be calculated based on payment records
      }
    });

  } catch (error) {
    console.error('Get public stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};

// Cart management with real-time updates
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId })
      .populate('items.course', 'title price thumbnail instructorName category level duration');
    
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
      await cart.save();
    }

    res.status(200).json({
      success: true,
      data: cart
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart'
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const { courseId } = req.body;
    
    // Check if course exists and is published
    const course = await Course.findOne({ _id: courseId, status: 'Published', isActive: true });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not available'
      });
    }

    // Check if user is already enrolled in this course
    const user = await User.findById(req.userId);
    const isEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.course.toString() === courseId
    );
    
    if (isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    // Check if course is already in cart
    const existingItem = cart.items.find(
      item => item.course.toString() === courseId
    );
    
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Course already in cart'
      });
    }

    // Add course to cart
    cart.items.push({ course: courseId });
    await cart.save();

    // Populate the cart for response
    await cart.populate('items.course', 'title price thumbnail instructorName category level duration');

    // Track analytics
    Analytics.trackEvent('cart_addition', {
      userId: req.userId,
      courseId,
      eventData: {
        courseName: course.title,
        coursePrice: course.price
      }
    });

    // Real-time cart update
    const socketManager = req.app.get('socketManager');
    if (socketManager) {
      socketManager.emitToUser(req.userId, 'cart-updated', {
        action: 'added',
        course: {
          id: course._id,
          title: course.title,
          price: course.price
        },
        cartItemCount: cart.items.length
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course added to cart',
      data: cart
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add course to cart'
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const courseToRemove = cart.items.find(
      item => item.course.toString() === courseId
    );
    
    if (!courseToRemove) {
      return res.status(404).json({
        success: false,
        message: 'Course not found in cart'
      });
    }

    // Remove course from cart
    cart.items = cart.items.filter(
      item => item.course.toString() !== courseId
    );
    await cart.save();

    // Populate the cart for response
    await cart.populate('items.course', 'title price thumbnail instructorName category level duration');

    // Track analytics
    Analytics.trackEvent('cart_removal', {
      userId: req.userId,
      courseId
    });

    // Real-time cart update
    const socketManager = req.app.get('socketManager');
    if (socketManager) {
      socketManager.emitToUser(req.userId, 'cart-updated', {
        action: 'removed',
        courseId,
        cartItemCount: cart.items.length
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course removed from cart',
      data: cart
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove course from cart'
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    await cart.save();

    // Real-time cart update
    const socketManager = req.app.get('socketManager');
    if (socketManager) {
      socketManager.emitToUser(req.userId, 'cart-updated', {
        action: 'cleared',
        cartItemCount: 0
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    });
  }
};

// Course browsing with analytics tracking
const getCourses = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      search, 
      category, 
      level, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minPrice,
      maxPrice
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query - only show published courses
    const query = { status: 'Published', isActive: true };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructorName: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
      
      // Track search analytics
      if (req.userId) {
        Analytics.trackEvent('search_query', {
          userId: req.userId,
          eventData: { searchTerm: search, category, level }
        });
      }
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (level && level !== 'all') {
      query.level = level;
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('instructor', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Course.countDocuments(query)
    ]);

    const coursesWithDetails = courses.map(course => ({
      id: course._id,
      title: course.title,
      description: course.description,
      instructor: course.instructorName,
      price: course.price,
      originalPrice: course.originalPrice,
      thumbnail: course.thumbnail,
      category: course.category,
      level: course.level,
      duration: course.duration,
      rating: course.rating,
      enrolledCount: course.enrolledStudents?.length || 0,
      lessonsCount: course.lessons?.length || 0,
      tags: course.tags,
      createdAt: course.createdAt
    }));

    res.status(200).json({
      success: true,
      data: {
        courses: coursesWithDetails,
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

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findOne({ 
      _id: id, 
      status: 'Published', 
      isActive: true 
    }).populate('instructor', 'name email avatar')
     .populate('reviews.user', 'name avatar');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is enrolled (if authenticated)
    let isEnrolled = false;
    if (req.userId) {
      const enrollment = await Enrollment.findOne({ 
        user: req.userId, 
        course: id 
      });
      isEnrolled = !!enrollment;
    }

    const courseData = {
      id: course._id,
      title: course.title,
      description: course.description,
      instructor: {
        id: course.instructor._id,
        name: course.instructor.name,
        email: course.instructor.email,
        avatar: course.instructor.avatar
      },
      price: course.price,
      originalPrice: course.originalPrice,
      thumbnail: course.thumbnail,
      category: course.category,
      level: course.level,
      duration: course.duration,
      rating: course.rating,
      enrolledCount: course.enrolledStudents?.length || 0,
      lessonsCount: course.lessons?.length || 0,
      lessons: course.lessons,
      tags: course.tags,
      reviews: course.reviews,
      isEnrolled,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    };

    res.status(200).json({
      success: true,
      data: courseData
    });

  } catch (error) {
    console.error('Get course by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course'
    });
  }
};

// Enrollment management
const enrollInCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { courseId } = req.body;
    const userId = req.userId;

    // Check if course exists and is published
    const course = await Course.findOne({ 
      _id: courseId, 
      status: 'Published', 
      isActive: true 
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not available'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ 
      user: userId, 
      course: courseId 
    });

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      user: userId,
      course: courseId,
      enrollmentDate: new Date()
    });

    await enrollment.save();

    // Add to user's enrolled courses
    await User.findByIdAndUpdate(userId, {
      $push: {
        enrolledCourses: {
          course: courseId,
          enrolledAt: new Date()
        }
      }
    });

    // Get the course to determine expiry
    const enrolledCourse = await Course.findById(courseId);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (enrolledCourse.defaultExpiryDuration || 365));

    // Add to course's enrolled students with expiry
    await Course.findByIdAndUpdate(courseId, {
      $push: {
        enrolledStudents: {
          student: userId,
          enrolledAt: new Date(),
          expiresAt: expiryDate
        }
      }
    });

    // Emit real-time events
    const io = req.app.get('io');
    
    // Notify the user about their enrollment
    io.to(`user-${userId}`).emit('enrollment-success', {
      courseId,
      courseTitle: enrolledCourse.title,
      expiresAt: expiryDate
    });

    // Notify admins about new enrollment
    io.to('admin-room').emit('new-enrollment', {
      userId,
      courseId,
      courseTitle: enrolledCourse.title,
      expiresAt: expiryDate
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment
    });

  } catch (error) {
    console.error('Enroll in course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course'
    });
  }
};

const getMyEnrollments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = { user: req.userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const [enrollments, total] = await Promise.all([
      Enrollment.find(query)
        .populate('course', 'title thumbnail price instructor instructorName')
        .sort({ enrollmentDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Enrollment.countDocuments(query)
    ]);

    const enrollmentData = enrollments.map(enrollment => ({
      id: enrollment._id,
      course: {
        id: enrollment.course._id,
        title: enrollment.course.title,
        thumbnail: enrollment.course.thumbnail,
        price: enrollment.course.price,
        instructor: enrollment.course.instructorName
      },
      enrollmentDate: enrollment.enrollmentDate,
      progress: enrollment.progress.percentage,
      status: enrollment.status,
      completionDate: enrollment.completionDate,
      certificate: enrollment.certificate
    }));

    res.status(200).json({
      success: true,
      data: {
        enrollments: enrollmentData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollments'
    });
  }
};

const updateCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lessonId, timeSpent = 0 } = req.body;

    const enrollment = await Enrollment.findOne({ 
      user: req.userId, 
      course: courseId 
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Mark lesson as complete
    await enrollment.markLessonComplete(lessonId, timeSpent);
    
    // Recalculate progress
    await enrollment.calculateProgress();

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        progress: enrollment.progress.percentage,
        status: enrollment.status
      }
    });

  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress'
    });
  }
};

// Payment related (simplified for demo)
const createPaymentIntent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { courseId, amount, paymentMethod, paymentGateway } = req.body;
    const userId = req.userId;

    // Verify course exists and amount is correct
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (parseFloat(amount) !== course.price) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Create payment record
    const payment = new Payment({
      user: userId,
      userName: req.user.name,
      course: courseId,
      courseName: course.title,
      amount: parseFloat(amount),
      paymentMethod,
      paymentGateway,
      transactionId: `tx_${Date.now()}_${userId}`, // Demo transaction ID
      status: 'Pending'
    });

    await payment.save();

    // In a real application, you would integrate with actual payment gateways here
    // For demo purposes, we'll simulate a successful payment
    setTimeout(async () => {
      await payment.markAsPaid();
      // Auto-enroll user after successful payment
      await enrollInCourse({ body: { courseId }, userId }, { 
        status: () => ({ json: () => {} }) 
      });
    }, 1000);

    res.status(201).json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        paymentId: payment._id,
        transactionId: payment.transactionId,
        status: payment.status,
        amount: payment.amount
      }
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent'
    });
  }
};

// Notification management
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = { recipient: req.userId };
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.userId, isRead: false })
    ]);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
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

const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
      _id: id,
      recipient: req.userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

// Enhanced enrollment with real-time updates
const getMyEnrollmentsEnhanced = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const user = await User.findById(req.userId)
      .populate({
        path: 'enrolledCourses.course',
        select: 'title description thumbnail instructorName category level duration lessons rating',
        match: status !== 'all' ? { status } : {}
      })
      .select('enrolledCourses');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Filter out null courses (unmatched due to status filter)
    const validEnrollments = user.enrolledCourses.filter(enrollment => enrollment.course);
    const total = validEnrollments.length;
    const paginatedEnrollments = validEnrollments.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        enrollments: paginatedEnrollments.map(enrollment => ({
          ...enrollment.toObject(),
          course: {
            ...enrollment.course.toObject(),
            completedLessons: Math.floor((enrollment.progress / 100) * enrollment.course.lessons.length),
            totalLessons: enrollment.course.lessons.length
          }
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
    console.error('Get my enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollments'
    });
  }
};

// Course progress update with real-time sync
const updateCourseProgressEnhanced = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lessonId, progress, timeSpent } = req.body;
    
    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: 'Progress must be between 0 and 100'
      });
    }

    const user = await User.findById(req.userId);
    const enrollment = user.enrolledCourses.find(
      e => e.course.toString() === courseId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Update progress
    enrollment.progress = Math.max(enrollment.progress, progress);
    await user.save();

    // Track analytics
    Analytics.trackEvent('lesson_completion', {
      userId: req.userId,
      courseId,
      eventData: {
        lessonId,
        progress,
        timeSpent: timeSpent || 0,
        previousProgress: enrollment.progress
      }
    });

    // Send real-time progress update
    const socketManager = req.app.get('socketManager');
    if (socketManager) {
      socketManager.emitToUser(req.userId, 'progress-updated', {
        courseId,
        lessonId,
        progress: enrollment.progress,
        timestamp: new Date()
      });
    }

    // Check if course is completed
    if (enrollment.progress === 100) {
      // Send completion notification
      if (socketManager) {
        const course = await Course.findById(courseId).select('title');
        await socketManager.sendNotificationToUser(req.userId, {
          type: 'course_completed',
          title: 'Course Completed!',
          message: `Congratulations! You have completed "${course.title}".`,
          data: { courseId, courseName: course.title }
        });
      }

      // Track completion analytics
      Analytics.trackEvent('course_completion', {
        userId: req.userId,
        courseId
      });
    }

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        courseId,
        progress: enrollment.progress,
        completed: enrollment.progress === 100
      }
    });

  } catch (error) {
    console.error('Update course progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course progress'
    });
  }
};

// User analytics and insights
const getUserAnalytics = async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [learningActivity, courseProgress, totalSpent] = await Promise.all([
      Analytics.aggregate([
        {
          $match: {
            user: req.userId,
            createdAt: { $gte: startDate },
            type: { $in: ['lesson_completion', 'video_watch', 'course_enrollment'] }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              type: '$type'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),
      
      User.findById(req.userId)
        .populate('enrolledCourses.course', 'title price')
        .select('enrolledCourses'),
        
      User.aggregate([
        { $match: { _id: req.userId } },
        { $unwind: '$enrolledCourses' },
        {
          $lookup: {
            from: 'courses',
            localField: 'enrolledCourses.course',
            foreignField: '_id',
            as: 'courseDetails'
          }
        },
        { $unwind: '$courseDetails' },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$courseDetails.price' },
            coursesEnrolled: { $sum: 1 },
            averageProgress: { $avg: '$enrolledCourses.progress' }
          }
        }
      ])
    ]);

    const stats = totalSpent[0] || { totalSpent: 0, coursesEnrolled: 0, averageProgress: 0 };

    res.status(200).json({
      success: true,
      data: {
        learningActivity,
        courseProgress: courseProgress?.enrolledCourses || [],
        summary: {
          totalCoursesEnrolled: stats.coursesEnrolled,
          totalAmountSpent: stats.totalSpent,
          averageProgress: Math.round(stats.averageProgress || 0),
          timeRange
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

// Dashboard stats for profile page
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.userId;

    // Get user details
    const user = await User.findById(userId).select('name email');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get enrollments with progress using the My Courses logic
    console.log('Fetching enrollments for user:', userId);
    const enrollments = await Enrollment.find({ 
      user: userId, 
      status: { $in: ['enrolled', 'in_progress', 'completed'] }
    })
      .populate({
        path: 'course',
        select: 'title description thumbnail level duration lessons price category tags instructorName rating'
      })
      .sort({ enrollmentDate: -1 });
    
    console.log('Found enrollments:', enrollments.length);
    if (enrollments.length > 0) {
      console.log('First enrollment:', {
        id: enrollments[0]._id,
        coursePopulated: !!enrollments[0].course,
        courseTitle: enrollments[0].course?.title
      });
    }

    // Get cart items
    let cart = await Cart.findOne({ user: userId })
      .populate('items.course', 'title price thumbnail level');
    
    if (!cart) {
      cart = { items: [] };
    }

    // Calculate overall progress
    const totalProgress = enrollments.reduce((sum, enrollment) => sum + (enrollment.progress?.percentage || 0), 0);
    const averageProgress = enrollments.length > 0 ? Math.round(totalProgress / enrollments.length) : 0;

    // Get continue learning (ALL My Courses - show all enrolled courses)
    const continueLearning = enrollments
      .slice(0, 6) // Show more courses
      .map(enrollment => {
        console.log('Processing enrollment:', {
          id: enrollment._id,
          courseId: enrollment.course ? enrollment.course._id : 'NO COURSE',
          courseTitle: enrollment.course ? enrollment.course.title : 'NO TITLE',
          progress: enrollment.progress?.percentage
        });
        
        return {
          enrollmentId: enrollment._id,
          _id: enrollment.course ? enrollment.course._id : null,
          title: enrollment.course ? enrollment.course.title : 'Course Not Found',
          description: enrollment.course ? enrollment.course.description : '',
          thumbnail: enrollment.course ? enrollment.course.thumbnail : null,
          progress: enrollment.progress?.percentage || 0,
          instructorName: enrollment.course ? enrollment.course.instructorName : 'Unknown Instructor',
          level: enrollment.course ? enrollment.course.level : 'Unknown',
          rating: enrollment.course ? enrollment.course.rating : { average: 0, count: 0 },
          lessonsCompleted: enrollment.progress?.completedLessons ? enrollment.progress.completedLessons.length : 0,
          totalLessons: enrollment.course && enrollment.course.lessons ? enrollment.course.lessons.length : 0,
          enrolledAt: enrollment.enrollmentDate,
          lastAccessedAt: enrollment.progress?.lastAccessedAt
        };
      });

    // Get trending/recommended courses (popular courses with high enrollment)
    const recommendedCourses = await Course.aggregate([
      {
        $match: {
          status: 'Published',
          isActive: true,
          _id: { $nin: enrollments.map(e => e.course._id) } // Exclude enrolled courses
        }
      },
      {
        $addFields: {
          enrollmentCount: { $size: { $ifNull: ['$enrolledStudents', []] } },
          avgRating: { $ifNull: ['$rating.average', 0] }
        }
      },
      {
        $sort: {
          enrollmentCount: -1, // Most enrolled first (trending)
          avgRating: -1,       // Then by rating
          createdAt: -1        // Then by newest
        }
      },
      {
        $limit: 6
      },
      {
        $project: {
          title: 1,
          description: 1,
          thumbnail: 1,
          price: 1,
          level: 1,
          rating: 1,
          instructorName: 1,
          category: 1,
          enrollmentCount: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email
        },
        stats: {
          enrolledCoursesCount: enrollments.length,
          averageProgress: averageProgress,
          cartItemsCount: cart.items ? cart.items.length : 0
        },
        continueLearning: continueLearning,
        recommendedCourses: recommendedCourses,
        cartItems: cart.items || []
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getPublicStats,
  getCourses,
  getCourseById,
  enrollInCourse,
  getMyEnrollments: getMyEnrollmentsEnhanced,
  updateCourseProgress: updateCourseProgressEnhanced,
  createPaymentIntent,
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUserAnalytics,
  getDashboardStats
};
