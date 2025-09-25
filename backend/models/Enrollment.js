const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    default: null
  },
  progress: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedLessons: [{
      lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      timeSpent: {
        type: Number, // in minutes
        default: 0
      }
    }],
    totalTimeSpent: {
      type: Number, // in minutes
      default: 0
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['enrolled', 'in_progress', 'completed', 'dropped', 'suspended'],
    default: 'enrolled'
  },
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issuedAt: Date,
    certificateUrl: String,
    certificateId: String
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    review: String,
    ratedAt: Date
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Compound index to ensure unique enrollment per user per course
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

// Index for status and date filtering
enrollmentSchema.index({ status: 1, enrollmentDate: -1 });

// Index for progress tracking
enrollmentSchema.index({ 'progress.percentage': -1 });

// Methods
enrollmentSchema.methods.markLessonComplete = function(lessonId, timeSpent = 0) {
  const existingLesson = this.progress.completedLessons.find(
    lesson => lesson.lessonId.toString() === lessonId.toString()
  );
  
  if (!existingLesson) {
    this.progress.completedLessons.push({
      lessonId,
      completedAt: new Date(),
      timeSpent
    });
  }
  
  this.progress.totalTimeSpent += timeSpent;
  this.progress.lastAccessedAt = new Date();
  
  // Update status based on progress
  if (this.status === 'enrolled') {
    this.status = 'in_progress';
  }
  
  return this.save();
};

enrollmentSchema.methods.calculateProgress = async function() {
  try {
    await this.populate('course');
    if (!this.course || !this.course.lessons || this.course.lessons.length === 0) {
      this.progress.percentage = 0;
      return this.save();
    }
    
    const totalLessons = this.course.lessons.length;
    const completedLessons = this.progress.completedLessons.length;
    
    this.progress.percentage = Math.round((completedLessons / totalLessons) * 100);
    
    // Mark as completed if 100% progress
    if (this.progress.percentage === 100 && this.status !== 'completed') {
      this.status = 'completed';
      this.completionDate = new Date();
    }
    
    return this.save();
  } catch (error) {
    throw error;
  }
};

enrollmentSchema.methods.addRating = function(score, review = null) {
  this.rating.score = score;
  this.rating.review = review;
  this.rating.ratedAt = new Date();
  return this.save();
};

enrollmentSchema.methods.issueCertificate = function(certificateUrl, certificateId) {
  if (this.status === 'completed') {
    this.certificate.issued = true;
    this.certificate.issuedAt = new Date();
    this.certificate.certificateUrl = certificateUrl;
    this.certificate.certificateId = certificateId;
    return this.save();
  }
  throw new Error('Cannot issue certificate for incomplete course');
};

// Virtual for enrollment duration
enrollmentSchema.virtual('enrollmentDuration').get(function() {
  const endDate = this.completionDate || new Date();
  const startDate = this.enrollmentDate;
  return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)); // in days
});

// Ensure virtual fields are serialized
enrollmentSchema.set('toJSON', { virtuals: true });
enrollmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);