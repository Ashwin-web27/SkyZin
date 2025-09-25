const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const { createTokenResponse } = require('../utils/jwt');

const router = express.Router();

// Test endpoint to create initial admin user
router.post('/create-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(200).json({
        success: true,
        message: 'Admin user already exists',
        data: {
          email: existingAdmin.email,
          name: existingAdmin.name
        }
      });
    }

    // Create default admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@elearning.com',
      password: 'Admin123!',
      role: 'admin',
      status: 'Active'
    });

    await adminUser.save();

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        credentials: {
          email: 'admin@elearning.com',
          password: 'Admin123!'
        }
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user',
      error: error.message
    });
  }
});

// Test endpoint to create sample user
router.post('/create-test-user', async (req, res) => {
  try {
    const testUser = new User({
      name: 'Test User',
      email: 'user@test.com',
      password: 'Test123!',
      role: 'user',
      status: 'Active'
    });

    await testUser.save();

    res.status(201).json({
      success: true,
      message: 'Test user created successfully',
      data: {
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        credentials: {
          email: 'user@test.com',
          password: 'Test123!'
        }
      }
    });

  } catch (error) {
    console.error('Create test user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test user',
      error: error.message
    });
  }
});

// Test endpoint to create sample courses
router.post('/create-sample-courses', async (req, res) => {
  try {
    // Find or create an instructor
    let instructor = await User.findOne({ role: 'admin' });
    if (!instructor) {
      instructor = await User.findOne({ role: 'instructor' });
      if (!instructor) {
        instructor = await User.findOne({});
      }
    }

    if (!instructor) {
      return res.status(400).json({
        success: false,
        message: 'No instructor found. Please create a user first.'
      });
    }

    const sampleCourses = [
      {
        title: 'Introduction to JavaScript',
        description: 'Learn the fundamentals of JavaScript programming language. This comprehensive course covers variables, functions, objects, and DOM manipulation.',
        instructor: instructor._id,
        instructorName: instructor.name,
        price: 2499,
        originalPrice: 3999,
        currency: 'INR',
        category: 'Programming',
        level: 'Beginner',
        duration: 480, // 8 hours
        status: 'Published',
        lessons: [
          {
            title: 'Getting Started with JavaScript',
            content: 'Introduction to JavaScript syntax and basic concepts',
            duration: 60,
            order: 1
          },
          {
            title: 'Variables and Data Types',
            content: 'Understanding different data types in JavaScript',
            duration: 45,
            order: 2
          },
          {
            title: 'Functions and Scope',
            content: 'Creating and using functions in JavaScript',
            duration: 75,
            order: 3
          }
        ],
        tags: ['javascript', 'programming', 'web development']
      },
      {
        title: 'React.js for Beginners',
        description: 'Master React.js framework and build modern web applications. Learn components, state management, and hooks.',
        instructor: instructor._id,
        instructorName: instructor.name,
        price: 3299,
        originalPrice: 4999,
        currency: 'INR',
        category: 'Programming',
        level: 'Intermediate',
        duration: 600, // 10 hours
        status: 'Published',
        lessons: [
          {
            title: 'Introduction to React',
            content: 'What is React and why use it',
            duration: 45,
            order: 1
          },
          {
            title: 'Components and JSX',
            content: 'Creating React components using JSX',
            duration: 90,
            order: 2
          }
        ],
        tags: ['react', 'javascript', 'frontend']
      },
      {
        title: 'UI/UX Design Fundamentals',
        description: 'Learn the principles of user interface and user experience design. Create beautiful and functional designs.',
        instructor: instructor._id,
        instructorName: instructor.name,
        price: 1999,
        originalPrice: 2999,
        currency: 'INR',
        category: 'Design',
        level: 'Beginner',
        duration: 420, // 7 hours
        status: 'Published',
        lessons: [
          {
            title: 'Design Principles',
            content: 'Understanding fundamental design principles',
            duration: 60,
            order: 1
          },
          {
            title: 'Color Theory',
            content: 'How to use colors effectively in design',
            duration: 45,
            order: 2
          }
        ],
        tags: ['design', 'ui', 'ux']
      }
    ];

    // Check if courses already exist
    const existingCourses = await Course.find({});
    if (existingCourses.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Sample courses already exist',
        data: {
          totalCourses: existingCourses.length,
          courses: existingCourses.map(c => ({ title: c.title, price: c.price, category: c.category }))
        }
      });
    }

    const createdCourses = await Course.insertMany(sampleCourses);

    res.status(201).json({
      success: true,
      message: 'Sample courses created successfully',
      data: {
        totalCourses: createdCourses.length,
        courses: createdCourses.map(c => ({
          id: c._id,
          title: c.title,
          price: c.price,
          category: c.category,
          level: c.level
        }))
      }
    });

  } catch (error) {
    console.error('Create sample courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sample courses',
      error: error.message
    });
  }
});

// Test endpoint to verify authentication flow
router.post('/test-auth', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        debug: {
          searchedEmail: email.toLowerCase(),
          totalUsers: await User.countDocuments()
        }
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
        debug: {
          user: user.email,
          passwordProvided: !!password
        }
      });
    }

    // Generate token
    const tokenResponse = createTokenResponse(user);

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      data: tokenResponse,
      debug: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status
        }
      }
    });

  } catch (error) {
    console.error('Test auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication test failed',
      error: error.message
    });
  }
});

// Simple registration for testing (without complex validation)
router.post('/simple-register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role: 'user',
      status: 'Active'
    });

    await user.save();

    // Generate tokens and response
    const tokenResponse = createTokenResponse(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: tokenResponse
    });

  } catch (error) {
    console.error('Simple register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Test users endpoint without auth
router.get('/users', async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find({}).select('-password').limit(10);
    
    res.status(200).json({
      success: true,
      message: 'Test users endpoint',
      data: {
        users,
        total: users.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get test users',
      error: error.message
    });
  }
});

// Get platform status
router.get('/status', async (req, res) => {
  try {
    const [userCount, adminCount, courseCount] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'admin' }),
      Course.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      message: 'Platform status',
      data: {
        database: 'Connected',
        users: {
          total: userCount,
          admins: adminCount,
          regularUsers: userCount
        },
        courses: {
          total: courseCount
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get platform status',
      error: error.message
    });
  }
});

module.exports = router;