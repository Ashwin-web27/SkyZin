const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const { authenticate, adminOnly } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      // Video files
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed for video field'));
      }
    } else if (file.fieldname === 'thumbnail') {
      // Image files for thumbnails
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for thumbnail field'));
      }
    } else {
      cb(new Error('Unexpected field'));
    }
  },
});

// @route   GET /api/admin/courses
// @desc    Get all courses with analytics (Admin only)
// @access  Private/Admin
router.get('/courses', authenticate, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, search } = req.query;
    
    // Build filter query
    let filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructorName: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(filter)
      .populate('instructor', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get analytics for each course
    const coursesWithAnalytics = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = course.enrolledStudents.length;
        const completionRate = enrollmentCount > 0 
          ? course.enrolledStudents.filter(es => es.progress === 100).length / enrollmentCount * 100
          : 0;

        // Get revenue data
        const revenue = await Payment.aggregate([
          { $match: { courseId: course._id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        return {
          ...course.toObject(),
          analytics: {
            enrollmentCount,
            completionRate: Math.round(completionRate),
            revenue: revenue[0]?.total || 0,
            averageRating: course.rating.average,
            reviewCount: course.rating.count
          }
        };
      })
    );

    const total = await Course.countDocuments(filter);

    res.json({
      success: true,
      data: coursesWithAnalytics,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching admin courses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses'
    });
  }
});

// @route   POST /api/admin/courses
// @desc    Create new course (Admin only)
// @access  Private/Admin
router.post('/courses',
  authenticate,
  adminOnly,
  upload.single('thumbnail'),
  [
    body('title').notEmpty().trim().withMessage('Course title is required'),
    body('description').notEmpty().trim().withMessage('Course description is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('category').notEmpty().withMessage('Category is required'),
    body('level').isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid level'),
  ],
  async (req, res) => {
    try {
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
        tags,
        status = 'Draft'
      } = req.body;

      let thumbnailUrl = null;

      // Upload thumbnail to Cloudinary if provided
      if (req.file) {
        try {
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                resource_type: 'image',
                folder: 'course-thumbnails',
                transformation: [
                  { width: 800, height: 450, crop: 'fill', quality: 'auto' }
                ]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(req.file.buffer);
          });
          thumbnailUrl = result.secure_url;
        } catch (uploadError) {
          console.error('Thumbnail upload error:', uploadError);
          return res.status(400).json({
            success: false,
            message: 'Failed to upload thumbnail'
          });
        }
      }

      const course = new Course({
        title,
        description,
        instructor: req.user._id,
        instructorName: `${req.user.firstName} ${req.user.lastName}`,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        category,
        level,
        thumbnail: thumbnailUrl,
        tags: tags ? JSON.parse(tags) : [],
        lessons: [],
        status,
        isActive: status === 'Published',
        duration: 0 // Will be calculated when lessons are added
      });

      await course.save();

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

// @route   PUT /api/admin/courses/:id
// @desc    Update course (Admin only)
// @access  Private/Admin
router.put('/courses/:id',
  authenticate,
  adminOnly,
  upload.single('thumbnail'),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      const updateData = { ...req.body };

      // Handle price conversion
      if (updateData.price) updateData.price = parseFloat(updateData.price);
      if (updateData.originalPrice) updateData.originalPrice = parseFloat(updateData.originalPrice);

      // Handle tags parsing
      if (updateData.tags && typeof updateData.tags === 'string') {
        updateData.tags = JSON.parse(updateData.tags);
      }

      // Handle thumbnail upload
      if (req.file) {
        try {
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                resource_type: 'image',
                folder: 'course-thumbnails',
                transformation: [
                  { width: 800, height: 450, crop: 'fill', quality: 'auto' }
                ]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(req.file.buffer);
          });
          updateData.thumbnail = result.secure_url;
        } catch (uploadError) {
          console.error('Thumbnail upload error:', uploadError);
          return res.status(400).json({
            success: false,
            message: 'Failed to upload thumbnail'
          });
        }
      }

      // Update isActive based on status
      if (updateData.status) {
        updateData.isActive = updateData.status === 'Published';
      }

      const updatedCourse = await Course.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

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

// @route   POST /api/admin/courses/:id/lessons
// @desc    Add lesson to course with video upload
// @access  Private/Admin
router.post('/courses/:id/lessons',
  authenticate,
  adminOnly,
  upload.single('video'),
  [
    body('title').notEmpty().trim().withMessage('Lesson title is required'),
    body('content').notEmpty().trim().withMessage('Lesson content is required'),
    body('duration').isNumeric().withMessage('Duration must be a number'),
  ],
  async (req, res) => {
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

      const { title, content, duration } = req.body;
      let videoUrl = null;

      // Upload video to Cloudinary if provided
      if (req.file) {
        try {
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                resource_type: 'video',
                folder: 'course-videos',
                quality: 'auto',
                format: 'mp4'
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(req.file.buffer);
          });
          videoUrl = result.secure_url;
        } catch (uploadError) {
          console.error('Video upload error:', uploadError);
          return res.status(400).json({
            success: false,
            message: 'Failed to upload video'
          });
        }
      }

      const newLesson = {
        title,
        content,
        videoUrl,
        duration: parseInt(duration),
        order: course.lessons.length + 1
      };

      course.lessons.push(newLesson);
      
      // Update total course duration
      course.duration = course.lessons.reduce((total, lesson) => total + lesson.duration, 0);
      
      await course.save();

      res.status(201).json({
        success: true,
        message: 'Lesson added successfully',
        data: newLesson
      });

    } catch (error) {
      console.error('Error adding lesson:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while adding lesson'
      });
    }
  }
);

// @route   PUT /api/admin/courses/:courseId/lessons/:lessonId
// @desc    Update lesson with optional video upload
// @access  Private/Admin
router.put('/courses/:courseId/lessons/:lessonId',
  authenticate,
  adminOnly,
  upload.single('video'),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      const lesson = course.lessons.id(req.params.lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Update lesson fields
      const { title, content, duration } = req.body;
      if (title) lesson.title = title;
      if (content) lesson.content = content;
      if (duration) lesson.duration = parseInt(duration);

      // Handle video upload
      if (req.file) {
        try {
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                resource_type: 'video',
                folder: 'course-videos',
                quality: 'auto',
                format: 'mp4'
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(req.file.buffer);
          });
          lesson.videoUrl = result.secure_url;
        } catch (uploadError) {
          console.error('Video upload error:', uploadError);
          return res.status(400).json({
            success: false,
            message: 'Failed to upload video'
          });
        }
      }

      // Recalculate course duration
      course.duration = course.lessons.reduce((total, lesson) => total + lesson.duration, 0);
      
      await course.save();

      res.json({
        success: true,
        message: 'Lesson updated successfully',
        data: lesson
      });

    } catch (error) {
      console.error('Error updating lesson:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating lesson'
      });
    }
  }
);

// @route   DELETE /api/admin/courses/:courseId/lessons/:lessonId
// @desc    Delete lesson from course
// @access  Private/Admin
router.delete('/courses/:courseId/lessons/:lessonId',
  authenticate,
  adminOnly,
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      course.lessons.id(req.params.lessonId).remove();
      
      // Recalculate course duration
      course.duration = course.lessons.reduce((total, lesson) => total + lesson.duration, 0);
      
      await course.save();

      res.json({
        success: true,
        message: 'Lesson deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting lesson:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting lesson'
      });
    }
  }
);

// @route   GET /api/admin/dashboard/analytics
// @desc    Get comprehensive dashboard analytics
// @access  Private/Admin
router.get('/dashboard/analytics', authenticate, adminOnly, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    switch (period) {
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

    // Get course statistics
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ status: 'Published' });
    const draftCourses = await Course.countDocuments({ status: 'Draft' });

    // Get enrollment statistics
    const totalEnrollments = await Enrollment.countDocuments({ status: 'active' });
    const newEnrollments = await Enrollment.countDocuments({ 
      status: 'active',
      enrolledAt: { $gte: startDate }
    });

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments({ 
      createdAt: { $gte: startDate }
    });

    // Get revenue statistics
    const revenueData = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get top performing courses
    const topCourses = await Course.aggregate([
      { $match: { status: 'Published' } },
      { $addFields: { enrollmentCount: { $size: '$enrolledStudents' } } },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 5 },
      { $project: { title: 1, enrollmentCount: 1, price: 1, rating: 1 } }
    ]);

    // Get recent enrollments with course and user info
    const recentEnrollments = await Enrollment.find({ 
      status: 'active',
      enrolledAt: { $gte: startDate }
    })
    .populate('user', 'firstName lastName email')
    .populate('course', 'title price')
    .sort({ enrolledAt: -1 })
    .limit(10);

    // Revenue trend data
    const revenueTrend = await Payment.aggregate([
      { 
        $match: { 
          status: 'completed', 
          createdAt: { $gte: startDate } 
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalCourses,
          publishedCourses,
          draftCourses,
          totalEnrollments,
          newEnrollments,
          totalUsers,
          newUsers,
          periodRevenue: revenueData[0]?.total || 0,
          periodSales: revenueData[0]?.count || 0,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        topCourses,
        recentEnrollments,
        revenueTrend
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with enrollment data
// @access  Private/Admin
router.get('/users', authenticate, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    
    let filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get enrollment data for each user
    const usersWithEnrollments = await Promise.all(
      users.map(async (user) => {
        const enrollments = await Enrollment.find({ user: user._id, status: 'active' });
        const totalSpent = await Payment.aggregate([
          { $match: { user: user._id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        return {
          ...user.toObject(),
          enrollments: enrollments.length,
          totalSpent: totalSpent[0]?.total || 0,
          lastEnrollment: enrollments.length > 0 
            ? enrollments.sort((a, b) => b.enrolledAt - a.enrolledAt)[0].enrolledAt 
            : null
        };
      })
    );

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: usersWithEnrollments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

module.exports = router;