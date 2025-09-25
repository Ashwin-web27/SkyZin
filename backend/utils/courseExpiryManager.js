const User = require('../models/User');
const cron = require('node-cron');

/**
 * Course Expiry Management System
 * Handles 6-month course expiry logic and notifications
 */

/**
 * Check and update expired courses for all users
 */
async function checkExpiredCourses() {
  try {
    console.log('Starting course expiry check...');
    
    const users = await User.find({
      'enrolledCourses': { $exists: true, $ne: [] }
    });

    let updatedUsers = 0;
    let expiredCoursesCount = 0;

    for (const user of users) {
      const hasExpiredCourses = user.updateExpiredCourses();
      
      if (hasExpiredCourses) {
        await user.save();
        updatedUsers++;
        
        // Count expired courses
        const expiredCourses = user.enrolledCourses.filter(ec => ec.isExpired);
        expiredCoursesCount += expiredCourses.length;
      }
    }

    console.log(`Course expiry check completed. Updated ${updatedUsers} users with ${expiredCoursesCount} expired courses.`);
    
    return {
      updatedUsers,
      expiredCoursesCount,
      totalUsers: users.length
    };
  } catch (error) {
    console.error('Error checking expired courses:', error);
    throw error;
  }
}

/**
 * Get users with courses expiring soon (within specified days)
 */
async function getUsersWithExpiringCourses(daysFromNow = 7) {
  try {
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + daysFromNow);
    
    const users = await User.find({
      'enrolledCourses': {
        $elemMatch: {
          'expiresAt': { 
            $gte: new Date(), 
            $lte: expiryThreshold 
          },
          'isExpired': false
        }
      }
    }).populate('enrolledCourses.course', 'title');

    const expiringCourses = [];

    users.forEach(user => {
      user.enrolledCourses.forEach(enrollment => {
        if (enrollment.expiresAt <= expiryThreshold && 
            enrollment.expiresAt >= new Date() && 
            !enrollment.isExpired) {
          
          const daysUntilExpiry = Math.ceil((enrollment.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
          
          expiringCourses.push({
            userId: user._id,
            userEmail: user.email,
            userName: user.name,
            courseId: enrollment.course._id,
            courseName: enrollment.course.title,
            expiresAt: enrollment.expiresAt,
            daysUntilExpiry: daysUntilExpiry,
            enrolledAt: enrollment.enrolledAt,
            progress: enrollment.progress
          });
        }
      });
    });

    return expiringCourses;
  } catch (error) {
    console.error('Error getting expiring courses:', error);
    throw error;
  }
}

/**
 * Send expiry notifications to users
 */
async function sendExpiryNotifications() {
  try {
    // Get courses expiring in 7 days
    const expiring7Days = await getUsersWithExpiringCourses(7);
    // Get courses expiring in 1 day
    const expiring1Day = await getUsersWithExpiringCourses(1);
    
    console.log(`Found ${expiring7Days.length} courses expiring in 7 days`);
    console.log(`Found ${expiring1Day.length} courses expiring in 1 day`);
    
    // Here you would integrate with your email service
    // For now, we'll just log the notifications
    
    const notifications = [];
    
    // 7-day notifications
    for (const course of expiring7Days) {
      notifications.push({
        type: 'course_expiry_warning',
        urgency: 'medium',
        recipient: course.userEmail,
        subject: `Course Expiring Soon: ${course.courseName}`,
        message: `Your course "${course.courseName}" will expire in ${course.daysUntilExpiry} days. Renew now to continue learning!`,
        data: course
      });
    }
    
    // 1-day notifications (urgent)
    for (const course of expiring1Day) {
      notifications.push({
        type: 'course_expiry_urgent',
        urgency: 'high',
        recipient: course.userEmail,
        subject: `URGENT: Course Expires Tomorrow - ${course.courseName}`,
        message: `Your course "${course.courseName}" expires tomorrow! Contact support to extend access.`,
        data: course
      });
    }
    
    // Log notifications (in production, send actual emails)
    console.log(`Generated ${notifications.length} notifications:`, notifications);
    
    return notifications;
  } catch (error) {
    console.error('Error sending expiry notifications:', error);
    throw error;
  }
}

/**
 * Get course expiry statistics
 */
async function getCourseExpiryStats() {
  try {
    const stats = await User.aggregate([
      { $unwind: '$enrolledCourses' },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          expiredCourses: {
            $sum: {
              $cond: [{ $eq: ['$enrolledCourses.isExpired', true] }, 1, 0]
            }
          },
          activeCourses: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$enrolledCourses.isExpired', false] },
                    { $gt: ['$enrolledCourses.expiresAt', new Date()] }
                  ]
                },
                1, 0
              ]
            }
          },
          expiringIn7Days: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$enrolledCourses.isExpired', false] },
                    { $lte: ['$enrolledCourses.expiresAt', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] },
                    { $gt: ['$enrolledCourses.expiresAt', new Date()] }
                  ]
                },
                1, 0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalEnrollments: 0,
      expiredCourses: 0,
      activeCourses: 0,
      expiringIn7Days: 0
    };

    return {
      ...result,
      expiryRate: result.totalEnrollments > 0 ? (result.expiredCourses / result.totalEnrollments * 100).toFixed(2) : 0
    };
  } catch (error) {
    console.error('Error getting course expiry stats:', error);
    throw error;
  }
}

/**
 * Extend course expiry for a user (admin function)
 */
async function extendCourseExpiry(userId, courseId, monthsToAdd = 6) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.extendCourseExpiry(courseId, monthsToAdd);
    await user.save();

    console.log(`Extended course ${courseId} for user ${userId} by ${monthsToAdd} months`);
    
    return {
      success: true,
      message: `Course expiry extended by ${monthsToAdd} months`,
      newExpiryDate: user.enrolledCourses.find(ec => ec.course.toString() === courseId.toString())?.expiresAt
    };
  } catch (error) {
    console.error('Error extending course expiry:', error);
    throw error;
  }
}

/**
 * Get detailed expiry report for admin
 */
async function getExpiryReport() {
  try {
    const [stats, expiring7Days, expiring1Day] = await Promise.all([
      getCourseExpiryStats(),
      getUsersWithExpiringCourses(7),
      getUsersWithExpiringCourses(1)
    ]);

    return {
      statistics: stats,
      expiringCourses: {
        in7Days: expiring7Days,
        in1Day: expiring1Day
      },
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Error generating expiry report:', error);
    throw error;
  }
}

/**
 * Initialize scheduled tasks for course expiry management
 */
function initializeCourseExpiryScheduler() {
  // Run expiry check daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running scheduled course expiry check...');
    try {
      await checkExpiredCourses();
    } catch (error) {
      console.error('Scheduled course expiry check failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  // Send expiry notifications daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Sending scheduled expiry notifications...');
    try {
      await sendExpiryNotifications();
    } catch (error) {
      console.error('Scheduled expiry notifications failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  console.log('Course expiry scheduler initialized');
}

module.exports = {
  checkExpiredCourses,
  getUsersWithExpiringCourses,
  sendExpiryNotifications,
  getCourseExpiryStats,
  extendCourseExpiry,
  getExpiryReport,
  initializeCourseExpiryScheduler
};