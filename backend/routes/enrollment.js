const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Cart = require('../models/Cart');
const Payment = require('../models/Payment');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   POST /api/enrollment/enroll/:courseId
// @desc    Enroll user in a course (free or after payment)
// @access  Private
router.post('/enroll/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Check if course exists and is active
    const course = await Course.findById(courseId);
    if (!course || !course.isActive || course.status !== 'Published') {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not available'
      });
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      status: 'active'
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // For paid courses, check if payment exists
    if (course.price > 0) {
      const payment = await Payment.findOne({
        user: userId,
        courseId: courseId,
        status: 'completed'
      });

      if (!payment) {
        return res.status(400).json({
          success: false,
          message: 'Payment required. Please complete the purchase first.'
        });
      }
    }

    // Create enrollment
    const enrollment = new Enrollment({
      user: userId,
      course: courseId,
      enrolledAt: new Date(),
      expiresAt: new Date(Date.now() + course.defaultExpiryDuration * 24 * 60 * 60 * 1000),
      progress: 0,
      lessonsCompleted: [],
      lastAccessedAt: new Date()
    });

    await enrollment.save();

    // Update course enrolled students
    course.enrolledStudents.push({
      student: userId,
      enrolledAt: new Date(),
      expiresAt: enrollment.expiresAt,
      progress: 0
    });
    await course.save();

    // Send real-time notification
    const io = req.app.get('io');
    const socketManager = req.app.get('socketManager');
    if (io && socketManager) {
      socketManager.sendNotificationToUser(userId, {
        type: 'enrollment_success',
        title: 'Course Enrollment Successful!',
        message: `You have successfully enrolled in "${course.title}"`,
        courseId: courseId,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: {
        enrollment,
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          level: course.level,
          duration: course.duration,
          lessonsCount: course.lessonsCount
        }
      }
    });

  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during enrollment'
    });
  }
});

// @route   GET /api/enrollment/my-courses
// @desc    Get user's enrolled courses with progress
// @access  Private
router.get('/my-courses', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const enrollments = await Enrollment.find({
      user: userId,
      status: 'active'
    })
    .populate({
      path: 'course',
      select: 'title description thumbnail level duration lessons price category tags instructorName rating'
    })
    .sort({ enrolledAt: -1 });

    const enrolledCourses = enrollments.map(enrollment => ({
      enrollmentId: enrollment._id,
      course: enrollment.course,
      progress: enrollment.progress,
      lessonsCompleted: enrollment.lessonsCompleted,
      enrolledAt: enrollment.enrolledAt,
      expiresAt: enrollment.expiresAt,
      lastAccessedAt: enrollment.lastAccessedAt,
      completedAt: enrollment.completedAt,
      certificateUrl: enrollment.certificateUrl
    }));

    res.json({
      success: true,
      count: enrolledCourses.length,
      data: enrolledCourses
    });

  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching enrolled courses'
    });
  }
});

// @route   PUT /api/enrollment/progress/:courseId
// @desc    Update course progress and lesson completion
// @access  Private
router.put('/progress/:courseId', 
  authenticate,
  [
    body('lessonId').notEmpty().withMessage('Lesson ID is required'),
    body('completed').isBoolean().withMessage('Completed must be boolean'),
    body('timeSpent').optional().isNumeric().withMessage('Time spent must be a number')
  ],
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { lessonId, completed, timeSpent } = req.body;
      const userId = req.user._id;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      // Find enrollment
      const enrollment = await Enrollment.findOne({
        user: userId,
        course: courseId,
        status: 'active'
      });

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: 'Enrollment not found'
        });
      }

      // Get course to validate lesson
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      const lesson = course.lessons.find(l => l._id.toString() === lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Update lesson completion
      const existingCompletion = enrollment.lessonsCompleted.find(
        lc => lc.lessonId.toString() === lessonId
      );

      if (existingCompletion) {
        existingCompletion.completed = completed;
        existingCompletion.completedAt = completed ? new Date() : null;
        if (timeSpent) existingCompletion.timeSpent = timeSpent;
      } else {
        enrollment.lessonsCompleted.push({
          lessonId: lessonId,
          completed: completed,
          completedAt: completed ? new Date() : null,
          timeSpent: timeSpent || 0
        });
      }

      // Calculate progress
      const completedLessons = enrollment.lessonsCompleted.filter(lc => lc.completed).length;
      const totalLessons = course.lessons.length;
      enrollment.progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      // Check if course is completed
      if (enrollment.progress === 100 && !enrollment.completedAt) {
        enrollment.completedAt = new Date();
        
        // Send completion notification
        const io = req.app.get('io');
        const socketManager = req.app.get('socketManager');
        if (io && socketManager) {
          socketManager.sendNotificationToUser(userId, {
            type: 'course_completed',
            title: 'Congratulations! Course Completed! 🎉',
            message: `You have successfully completed "${course.title}"`,
            courseId: courseId,
            timestamp: new Date()
          });
        }
      }

      enrollment.lastAccessedAt = new Date();
      await enrollment.save();

      // Update course enrolled students progress
      const studentEnrollment = course.enrolledStudents.find(
        es => es.student.toString() === userId.toString()
      );
      if (studentEnrollment) {
        studentEnrollment.progress = enrollment.progress;
        await course.save();
      }

      // Send real-time progress update
      const io = req.app.get('io');
      const socketManager = req.app.get('socketManager');
      if (io && socketManager) {
        socketManager.sendProgressUpdate(userId, {
          courseId: courseId,
          lessonId: lessonId,
          progress: enrollment.progress,
          completed: completed,
          timestamp: new Date()
        });
      }

      res.json({
        success: true,
        message: 'Progress updated successfully',
        data: {
          progress: enrollment.progress,
          lessonsCompleted: enrollment.lessonsCompleted,
          courseCompleted: !!enrollment.completedAt
        }
      });

    } catch (error) {
      console.error('Error updating progress:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating progress'
      });
    }
  }
);

// @route   GET /api/enrollment/progress/:courseId
// @desc    Get specific course progress
// @access  Private
router.get('/progress/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      status: 'active'
    }).populate('course', 'title lessons');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    res.json({
      success: true,
      data: {
        courseId: courseId,
        courseTitle: enrollment.course.title,
        progress: enrollment.progress,
        lessonsCompleted: enrollment.lessonsCompleted,
        enrolledAt: enrollment.enrolledAt,
        lastAccessedAt: enrollment.lastAccessedAt,
        completedAt: enrollment.completedAt,
        totalLessons: enrollment.course.lessons.length
      }
    });

  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching progress'
    });
  }
});

// @route   POST /api/enrollment/unenroll/:courseId
// @desc    Unenroll from a course
// @access  Private
router.post('/unenroll/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Soft delete - change status to cancelled
    enrollment.status = 'cancelled';
    enrollment.cancelledAt = new Date();
    await enrollment.save();

    // Remove from course enrolled students
    const course = await Course.findById(courseId);
    if (course) {
      course.enrolledStudents = course.enrolledStudents.filter(
        es => es.student.toString() !== userId.toString()
      );
      await course.save();
    }

    res.json({
      success: true,
      message: 'Successfully unenrolled from course'
    });

  } catch (error) {
    console.error('Error unenrolling:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during unenrollment'
    });
  }
});

module.exports = router;