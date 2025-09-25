const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Cart = require('../models/Cart');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   POST /api/cart/add/:courseId
// @desc    Add course to user's cart
// @access  Private
router.post('/add/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Check if course exists and is available for purchase
    const course = await Course.findById(courseId);
    if (!course || !course.isActive || course.status !== 'Published') {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not available'
      });
    }

    // Check if user already owns this course
    const isEnrolled = course.enrolledStudents.some(
      student => student.student.toString() === userId.toString()
    );

    if (isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Find or create cart for user
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: []
      });
    }

    // Check if course is already in cart
    const existingItem = cart.items.find(
      item => item.course.toString() === courseId
    );

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Course is already in your cart'
      });
    }

    // Add course to cart
    cart.items.push({
      course: courseId,
      addedAt: new Date()
    });
    await cart.save();

    // Populate course details for response
    await cart.populate({
      path: 'items.course',
      select: 'title description thumbnail level duration price originalPrice category instructorName'
    });

    res.status(201).json({
      success: true,
      message: 'Course added to cart successfully',
      data: {
        cart,
        itemsCount: cart.totalItems,
        totalAmount: cart.totalPrice
      }
    });

  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding to cart'
    });
  }
});

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.course',
        select: 'title description thumbnail level duration price originalPrice category instructorName isActive status'
      });

    if (!cart) {
      cart = {
        items: [],
        totalItems: 0,
        totalPrice: 0
      };
    } else {
      // Filter out inactive courses
      const activeItems = cart.items.filter(
        item => item.course && item.course.isActive && item.course.status === 'Published'
      );

      if (activeItems.length !== cart.items.length) {
        cart.items = activeItems;
        await cart.save();
      }
    }

    res.json({
      success: true,
      data: {
        cart,
        itemsCount: cart.totalItems || 0,
        totalAmount: cart.totalPrice || 0
      }
    });

  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cart'
    });
  }
});

// @route   DELETE /api/cart/remove/:courseId
// @desc    Remove course from cart
// @access  Private
router.delete('/remove/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Remove course from cart
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      item => item.course.toString() !== courseId
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Course not found in cart'
      });
    }

    await cart.save();

    res.json({
      success: true,
      message: 'Course removed from cart successfully',
      data: {
        itemsCount: cart.totalItems,
        totalAmount: cart.totalPrice
      }
    });

  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing from cart'
    });
  }
});

// @route   DELETE /api/cart/clear
// @desc    Clear user's cart
// @access  Private
router.delete('/clear', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        itemsCount: 0,
        totalAmount: 0
      }
    });

  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing cart'
    });
  }
});

// @route   POST /api/cart/checkout
// @desc    Process cart checkout and create payment records
// @access  Private
router.post('/checkout', 
  authenticate,
  [
    body('paymentMethod').isIn(['stripe', 'paypal', 'free']).withMessage('Invalid payment method'),
    body('paymentDetails').optional().isObject().withMessage('Payment details must be an object')
  ],
  async (req, res) => {
    try {
      const { paymentMethod, paymentDetails } = req.body;
      const userId = req.user._id;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      // Get user's cart
      const cart = await Cart.findOne({ user: userId })
        .populate({
          path: 'items.course',
          select: 'title price originalPrice isActive status'
        });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty'
        });
      }

      // Validate all courses are still available
      const unavailableItems = cart.items.filter(
        item => !item.course || !item.course.isActive || item.course.status !== 'Published'
      );

      if (unavailableItems.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Some courses in your cart are no longer available',
          unavailableItems
        });
      }

      // Create payment records for each course
      const paymentPromises = cart.items.map(async (item) => {
        const payment = new Payment({
          user: userId,
          courseId: item.course._id,
          amount: item.course.price,
          originalAmount: item.course.originalPrice || item.course.price,
          paymentMethod: paymentMethod,
          paymentDetails: paymentDetails || {},
          status: paymentMethod === 'free' ? 'completed' : 'pending',
          transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date()
        });

        return await payment.save();
      });

      const payments = await Promise.all(paymentPromises);

      // For demo purposes, mark all payments as completed
      // In real app, you'd integrate with Stripe/PayPal here
      if (paymentMethod !== 'free') {
        await Payment.updateMany(
          { _id: { $in: payments.map(p => p._id) } },
          { status: 'completed', completedAt: new Date() }
        );
      }

      // Automatically enroll user in purchased courses
      const enrollmentPromises = cart.items.map(async (item) => {
        try {
          // Get full course details
          const course = await Course.findById(item.course._id);
          if (!course) {
            throw new Error(`Course ${item.course._id} not found`);
          }

          // Create proper Enrollment record
          const enrollment = new Enrollment({
            user: userId,
            course: item.course._id,
            enrolledAt: new Date(),
            expiresAt: new Date(Date.now() + (course.defaultExpiryDuration || 365) * 24 * 60 * 60 * 1000),
            progress: 0,
            lessonsCompleted: [],
            lastAccessedAt: new Date(),
            paymentId: payments.find(p => p.courseId.toString() === item.course._id.toString())?._id
          });

          await enrollment.save();

          // Add user to course's enrolledStudents
          await Course.findByIdAndUpdate(
            item.course._id,
            {
              $addToSet: {
                enrolledStudents: {
                  student: userId,
                  enrolledAt: new Date(),
                  expiresAt: enrollment.expiresAt,
                  progress: 0
                }
              }
            }
          );

          console.log(`User ${userId} enrolled in course ${item.course._id} with enrollment ID ${enrollment._id}`);
        } catch (enrollError) {
          console.error(`Failed to enroll user ${userId} in course ${item.course._id}:`, enrollError);
        }
      });

      await Promise.all(enrollmentPromises);

      // Clear the cart after successful checkout
      cart.items = [];
      await cart.save();

      // Send real-time notification
      const io = req.app.get('io');
      const socketManager = req.app.get('socketManager');
      if (io && socketManager) {
        socketManager.sendNotificationToUser(userId, {
          type: 'purchase_success',
          title: 'Purchase Successful! 🎉',
          message: `You have successfully purchased ${payments.length} course(s)`,
          timestamp: new Date()
        });
      }

      res.status(201).json({
        success: true,
        message: 'Checkout successful',
        data: {
          payments,
          totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
          coursesCount: payments.length,
          transactionIds: payments.map(p => p.transactionId)
        }
      });

    } catch (error) {
      console.error('Error during checkout:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during checkout'
      });
    }
  }
);

// @route   GET /api/cart/purchase-history
// @desc    Get user's purchase history
// @access  Private
router.get('/purchase-history', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({ user: userId })
      .populate({
        path: 'courseId',
        select: 'title description thumbnail level instructorName'
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments({ user: userId });

    res.json({
      success: true,
      data: payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching purchase history'
    });
  }
});

module.exports = router;