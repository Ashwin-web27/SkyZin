const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Course title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [2000, 'Course description cannot exceed 2000 characters']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required']
  },
  instructorName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Course price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['Published', 'Draft', 'Archived'],
    default: 'Draft'
  },
  thumbnail: {
    type: String,
    default: null
  },
  category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: [
      'Programming', 
      'Design', 
      'Business', 
      'Marketing', 
      'Photography', 
      'Music', 
      'Automation',
      'Cloud Computing',
      'Artificial Intelligence',
      'Cybersecurity',
      'Web Development',
      'Data Science',
      'Other'
    ]
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Course duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  lessons: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Lesson title cannot exceed 200 characters']
    },
    content: {
      type: String,
      required: true,
      maxlength: [5000, 'Lesson content cannot exceed 5000 characters']
    },
    videoUrl: {
      type: String,
      default: null,
      trim: true,
      validate: {
        validator: function(url) {
          if (!url) return true;
          // Validate video URL format (supports YouTube, Vimeo, direct video URLs)
          const videoRegex = /^(https?:\/\/)?((www\.)?(youtube|vimeo|drive\.google|dropbox|aws)\.com|youtu\.be|.*\.(mp4|avi|mov|wmv|flv|webm)).*$/i;
          return videoRegex.test(url);
        },
        message: 'Please provide a valid video URL'
      }
    },
    videoDuration: {
      type: Number, // in seconds
      default: 0,
      min: [0, 'Video duration cannot be negative']
    },
    duration: {
      type: Number, // lesson duration in minutes (estimated)
      required: true,
      min: [1, 'Lesson duration must be at least 1 minute']
    },
    order: {
      type: Number,
      required: true,
      min: [1, 'Lesson order must be at least 1']
    },
    isPreview: {
      type: Boolean,
      default: false // if true, lesson can be viewed without enrollment
    },
    resources: [{
      title: String,
      url: String,
      type: {
        type: String,
        enum: ['pdf', 'document', 'image', 'link', 'code'],
        default: 'link'
      }
    }],
    quiz: {
      questions: [{
        question: String,
        options: [String],
        correctAnswer: Number,
        explanation: String
      }],
      passingScore: {
        type: Number,
        default: 70,
        min: 0,
        max: 100
      }
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  enrolledStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: function() {
        // Default expiry: 6 months from enrollment
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 6);
        return expiry;
      }
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  defaultExpiryDuration: {
    type: Number, // in days
    default: 180, // 6 months default (180 days)
    min: [1, 'Expiry duration must be at least 1 day']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  trending: {
    type: Boolean,
    default: false
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  instructorImage: {
    type: String,
    default: null
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  whatYoullLearn: [{
    type: String
  }],
  prerequisites: [{
    type: String
  }],
  language: {
    type: String,
    default: 'English'
  },
  subtitles: [{
    type: String
  }],
  currency: {
    type: String,
    default: 'INR'
  },
  // Coming Soon Management
  comingSoon: {
    type: Boolean,
    default: false
  },
  expectedLaunchDate: {
    type: Date,
    default: null
  },
  earlyAccessPrice: {
    type: Number,
    default: null
  },
  notifyWhenAvailable: [{
    email: {
      type: String,
      required: true
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Admin Management Fields
  adminNotes: {
    type: String,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  promotionalPrice: {
    type: Number,
    min: [0, 'Promotional price cannot be negative'],
    default: null
  },
  promotionalPriceEndDate: {
    type: Date,
    default: null
  },
  maxEnrollments: {
    type: Number,
    default: null, // null means unlimited
    min: [1, 'Max enrollments must be at least 1']
  },
  enrollmentStartDate: {
    type: Date,
    default: Date.now
  },
  enrollmentEndDate: {
    type: Date,
    default: null // null means no end date
  },
  certificateTemplate: {
    type: String,
    default: 'default'
  },
  allowDownloads: {
    type: Boolean,
    default: false
  },
  courseMaterials: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'document', 'image', 'video', 'audio', 'zip', 'other'],
      default: 'pdf'
    },
    size: Number, // in bytes
    description: String,
    downloadable: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  seoTitle: {
    type: String,
    maxlength: [60, 'SEO title cannot exceed 60 characters']
  },
  seoDescription: {
    type: String,
    maxlength: [160, 'SEO description cannot exceed 160 characters']
  },
  seoKeywords: [{
    type: String,
    trim: true
  }],
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  publishedAt: {
    type: Date,
    default: null
  },
  archivedAt: {
    type: Date,
    default: null
  },
  analytics: {
    totalViews: {
      type: Number,
      default: 0
    },
    totalEnrollments: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    averageCompletionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastAnalyticsUpdate: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Virtual for enrolled students count
courseSchema.virtual('enrolledCount').get(function() {
  return this.enrolledStudents ? this.enrolledStudents.length : 0;
});

// Virtual for lessons count
courseSchema.virtual('lessonsCount').get(function() {
  return this.lessons ? this.lessons.length : 0;
});

// Virtual for total video duration
courseSchema.virtual('totalVideoDuration').get(function() {
  if (!this.lessons) return 0;
  return this.lessons.reduce((total, lesson) => total + (lesson.videoDuration || 0), 0);
});

// Virtual for current price (considers promotional pricing)
courseSchema.virtual('currentPrice').get(function() {
  if (this.promotionalPrice && 
      this.promotionalPriceEndDate && 
      new Date() <= this.promotionalPriceEndDate) {
    return this.promotionalPrice;
  }
  return this.price;
});

// Virtual for enrollment availability
courseSchema.virtual('isEnrollmentOpen').get(function() {
  const now = new Date();
  const startCheck = !this.enrollmentStartDate || now >= this.enrollmentStartDate;
  const endCheck = !this.enrollmentEndDate || now <= this.enrollmentEndDate;
  const maxCheck = !this.maxEnrollments || this.enrolledCount < this.maxEnrollments;
  return startCheck && endCheck && maxCheck && this.status === 'Published' && this.isActive && !this.comingSoon;
});

// Virtual for coming soon status
courseSchema.virtual('isComingSoon').get(function() {
  return this.comingSoon && this.status === 'Published';
});

// Virtual for newly available (launched in last 30 days)
courseSchema.virtual('isNewlyAvailable').get(function() {
  if (this.comingSoon || this.status !== 'Published' || !this.isActive) return false;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.publishedAt && this.publishedAt >= thirtyDaysAgo;
});

// Pre-save middleware for admin management
courseSchema.pre('save', function(next) {
  // Update lesson timestamps
  if (this.isModified('lessons')) {
    this.lessons.forEach(lesson => {
      if (lesson.isNew) {
        lesson.createdAt = new Date();
      }
      lesson.updatedAt = new Date();
    });
  }
  
  // Set publishedAt timestamp when status changes to Published
  if (this.isModified('status') && this.status === 'Published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Set archivedAt timestamp when status changes to Archived
  if (this.isModified('status') && this.status === 'Archived' && !this.archivedAt) {
    this.archivedAt = new Date();
  }
  
  // Update duration based on lessons
  if (this.isModified('lessons') && this.lessons.length > 0) {
    this.duration = this.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
  }
  
  next();
});

// Index for text search
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ status: 1, isActive: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ 'analytics.totalEnrollments': -1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ publishedAt: -1 });

// Ensure virtual fields are serialized
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Course', courseSchema);