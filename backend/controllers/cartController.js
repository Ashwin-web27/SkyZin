const Cart = require('../models/Cart');
const Course = require('../models/Course');
const { validationResult } = require('express-validator');

// Get user's cart
const getCart = async (req, res) => {
  try {
    const userId = req.userId;
    
    let cart = await Cart.findOne({ user: userId })
      .populate('items.course', 'title price thumbnail category level duration');
    
    if (!cart) {
      // Create empty cart if doesn't exist
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }

    // Emit real-time cart update to user
    const io = req.app.get('io');
    io.to(`user-${userId}`).emit('cart-updated', {
      cart: {
        id: cart._id,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
        items: cart.items
      }
    });

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

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.userId;
    const { courseId } = req.body;

    // Check if course exists and is active
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

    // Check if user is already enrolled in this course
    const isEnrolled = course.enrolledStudents.some(
      enrollment => enrollment.student.toString() === userId
    );

    if (isEnrolled) {
      return res.status(409).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if course is already in cart
    const existingItem = cart.items.find(
      item => item.course.toString() === courseId
    );

    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: 'Course is already in your cart'
      });
    }

    // Add course to cart
    cart.items.push({ course: courseId });
    await cart.save();

    // Populate the cart for response
    cart = await Cart.findById(cart._id)
      .populate('items.course', 'title price thumbnail category level duration');

    // Emit real-time updates
    const io = req.app.get('io');
    
    // Update user's cart
    io.to(`user-${userId}`).emit('cart-updated', {
      cart: {
        id: cart._id,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
        items: cart.items
      }
    });

    // Notify admins about cart activity
    io.to('admin-room').emit('user-cart-updated', {
      userId,
      action: 'added',
      courseId,
      courseName: course.title,
      cartTotal: cart.totalItems
    });

    res.status(200).json({
      success: true,
      message: 'Course added to cart successfully',
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

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Remove item from cart
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item.course.toString() !== courseId);

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Course not found in cart'
      });
    }

    await cart.save();

    // Populate the cart for response
    const populatedCart = await Cart.findById(cart._id)
      .populate('items.course', 'title price thumbnail category level duration');

    // Emit real-time updates
    const io = req.app.get('io');
    
    // Update user's cart
    io.to(`user-${userId}`).emit('cart-updated', {
      cart: {
        id: populatedCart._id,
        totalItems: populatedCart.totalItems,
        totalPrice: populatedCart.totalPrice,
        items: populatedCart.items
      }
    });

    // Notify admins about cart activity
    io.to('admin-room').emit('user-cart-updated', {
      userId,
      action: 'removed',
      courseId,
      cartTotal: populatedCart.totalItems
    });

    res.status(200).json({
      success: true,
      message: 'Course removed from cart successfully',
      data: populatedCart
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove course from cart'
    });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const userId = req.userId;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    await cart.save();

    // Emit real-time updates
    const io = req.app.get('io');
    
    // Update user's cart
    io.to(`user-${userId}`).emit('cart-updated', {
      cart: {
        id: cart._id,
        totalItems: 0,
        totalPrice: 0,
        items: []
      }
    });

    // Notify admins about cart activity
    io.to('admin-room').emit('user-cart-updated', {
      userId,
      action: 'cleared',
      cartTotal: 0
    });

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
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

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  clearCart
};