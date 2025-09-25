const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
require('dotenv').config();

async function createTestEnrollments() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

  // Find a test user
  const user = await User.findOne({ email: 'dashtest@example.com' });
    if (!user) {
      console.log('User not found');
      return;
    }
    console.log('Found user:', user.email);

    // Get some courses
    const courses = await Course.find({ status: 'Published', isActive: true }).limit(3);
    console.log('Found courses:', courses.length);

    if (courses.length === 0) {
      console.log('No courses found');
      return;
    }

    // Delete existing enrollments for this user
    await Enrollment.deleteMany({ user: user._id });
    console.log('Cleared existing enrollments');

    // Create sample enrollments
    const enrollments = [];
    for (let i = 0; i < Math.min(3, courses.length); i++) {
      const course = courses[i];
      const enrollment = new Enrollment({
        user: user._id,
        course: course._id,
        enrollmentDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Stagger dates
        progress: {
          percentage: [50, 0, 25][i], // Different progress levels
          completedLessons: [],
          totalTimeSpent: 0,
          lastAccessedAt: new Date()
        },
        status: 'in_progress' // Valid status from enum
      });
      
      await enrollment.save();
      enrollments.push(enrollment);
      console.log(`Created enrollment for: ${course.title} (${enrollment.progress}% progress)`);
    }

    console.log(`✅ Created ${enrollments.length} test enrollments successfully!`);

  } catch (error) {
    console.error('❌ Error creating test enrollments:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestEnrollments();