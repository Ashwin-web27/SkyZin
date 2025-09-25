const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'instructor'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['Active', 'Blocked', 'Pending'],
    default: 'Active'
  },
  avatar: {
    type: String,
    default: null
  },
  enrolledCourses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: function() {
        // Set expiry to 6 months from enrollment
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        return sixMonthsFromNow;
      }
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    isExpired: {
      type: Boolean,
      default: false
    }
  }],
  // Security and Session Management
  activeDevice: {
    deviceFingerprint: String,
    deviceInfo: {
      userAgent: String,
      platform: String,
      browser: String,
      screenResolution: String,
      timezone: String,
      language: String
    },
    loginAt: Date,
    lastActivity: Date,
    ipAddress: String,
    location: {
      country: String,
      city: String
    }
  },
  sessionToken: String,
  isOnline: {
    type: Boolean,
    default: false
  },
  lastLoginAt: Date,
  loginAttempts: {
    count: {
      type: Number,
      default: 0
    },
    lastAttempt: Date,
    lockedUntil: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get user without sensitive data
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpire;
  delete userObject.emailVerificationToken;
  delete userObject.sessionToken;
  delete userObject.activeDevice;
  delete userObject.loginAttempts;
  return userObject;
};

// Check if user has an active session on another device
userSchema.methods.hasActiveSession = function(currentDeviceFingerprint) {
  return this.isOnline && 
         this.activeDevice && 
         this.activeDevice.deviceFingerprint !== currentDeviceFingerprint &&
         this.activeDevice.lastActivity > new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
};

// Set active device session
userSchema.methods.setActiveDevice = function(deviceInfo, ipAddress, location = {}) {
  this.activeDevice = {
    deviceFingerprint: deviceInfo.fingerprint,
    deviceInfo: {
      userAgent: deviceInfo.userAgent,
      platform: deviceInfo.platform,
      browser: deviceInfo.browser,
      screenResolution: deviceInfo.screenResolution,
      timezone: deviceInfo.timezone,
      language: deviceInfo.language
    },
    loginAt: new Date(),
    lastActivity: new Date(),
    ipAddress: ipAddress,
    location: location
  };
  this.isOnline = true;
  this.lastLoginAt = new Date();
  this.sessionToken = require('crypto').randomBytes(32).toString('hex');
};

// Clear active session
userSchema.methods.clearActiveSession = function() {
  this.isOnline = false;
  this.activeDevice = undefined;
  this.sessionToken = undefined;
};

// Update last activity
userSchema.methods.updateActivity = function() {
  if (this.activeDevice) {
    this.activeDevice.lastActivity = new Date();
  }
};

// Check if course is expired
userSchema.methods.isCourseExpired = function(courseId) {
  const enrollment = this.enrolledCourses.find(ec => ec.course.toString() === courseId.toString());
  if (!enrollment) return true;
  
  return enrollment.expiresAt < new Date() || enrollment.isExpired;
};

// Get active (non-expired) courses
userSchema.methods.getActiveCourses = function() {
  const now = new Date();
  return this.enrolledCourses.filter(enrollment => 
    !enrollment.isExpired && enrollment.expiresAt > now
  );
};

// Extend course expiry (admin function)
userSchema.methods.extendCourseExpiry = function(courseId, monthsToAdd = 6) {
  const enrollment = this.enrolledCourses.find(ec => ec.course.toString() === courseId.toString());
  if (enrollment) {
    const newExpiry = new Date(enrollment.expiresAt);
    newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd);
    enrollment.expiresAt = newExpiry;
    enrollment.isExpired = false;
  }
};

// Check and update expired courses
userSchema.methods.updateExpiredCourses = function() {
  const now = new Date();
  let hasChanges = false;
  
  this.enrolledCourses.forEach(enrollment => {
    if (!enrollment.isExpired && enrollment.expiresAt < now) {
      enrollment.isExpired = true;
      hasChanges = true;
    }
  });
  
  return hasChanges;
};

// Virtual for enrolled courses count
userSchema.virtual('enrolledCount').get(function() {
  return this.enrolledCourses ? this.enrolledCourses.length : 0;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);