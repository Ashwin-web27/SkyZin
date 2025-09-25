const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    enum: [
      'user_registration',
      'user_login',
      'course_view',
      'course_enrollment',
      'course_completion',
      'payment_attempt',
      'payment_success',
      'cart_addition',
      'cart_removal',
      'video_watch',
      'lesson_completion',
      'quiz_attempt',
      'search_query',
      'page_visit',
      'download',
      'export',
      'share'
    ],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  value: {
    type: Number,
    default: 1
  },
  metadata: {
    userAgent: String,
    ip: String,
    country: String,
    device: String,
    browser: String,
    os: String,
    referrer: String,
    sessionId: String
  }
}, {
  timestamps: true
});

// Indexes for efficient aggregation queries
analyticsSchema.index({ type: 1, date: -1 });
analyticsSchema.index({ user: 1, date: -1 });
analyticsSchema.index({ course: 1, date: -1 });
analyticsSchema.index({ date: -1 });

// Compound indexes for common queries
analyticsSchema.index({ type: 1, user: 1, date: -1 });
analyticsSchema.index({ type: 1, course: 1, date: -1 });

// TTL index to automatically delete old analytics data (optional)
// Uncomment to keep only 1 year of data
// analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

// Static method to track event
analyticsSchema.statics.trackEvent = async function(type, data = {}) {
  try {
    const analytics = new this({
      type,
      user: data.userId || null,
      course: data.courseId || null,
      data: data.eventData || {},
      value: data.value || 1,
      metadata: data.metadata || {}
    });
    
    await analytics.save();
    return analytics;
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return null;
  }
};

// Static method to get dashboard stats
analyticsSchema.statics.getDashboardStats = async function(timeRange = '7d') {
  const now = new Date();
  let startDate;
  
  switch (timeRange) {
    case '1d':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
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
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: '$value' },
        totalValue: { $sum: '$value' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  return stats;
};

module.exports = mongoose.model('Analytics', analyticsSchema);