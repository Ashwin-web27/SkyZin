const mongoose = require("mongoose")

const scheduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Schedule title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    type: {
      type: String,
      enum: ["class", "meeting", "consultation", "exam", "assignment", "event"],
      required: [true, "Schedule type is required"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: function () {
        return ["class", "exam", "assignment"].includes(this.type)
      },
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Instructor is required"],
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["invited", "accepted", "declined", "attended", "absent"],
          default: "invited",
        },
        joinedAt: Date,
        leftAt: Date,
      },
    ],
    dateTime: {
      start: {
        type: Date,
        required: [true, "Start date and time is required"],
      },
      end: {
        type: Date,
        required: [true, "End date and time is required"],
      },
      timezone: {
        type: String,
        default: "UTC",
      },
    },
    recurrence: {
      type: {
        type: String,
        enum: ["none", "daily", "weekly", "monthly"],
        default: "none",
      },
      interval: {
        type: Number,
        default: 1,
      },
      endDate: Date,
      daysOfWeek: [
        {
          type: String,
          enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        },
      ],
    },
    location: {
      type: {
        type: String,
        enum: ["online", "physical", "hybrid"],
        default: "online",
      },
      details: {
        room: String,
        address: String,
        meetingLink: String,
        meetingId: String,
        password: String,
      },
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled", "postponed"],
      default: "scheduled",
    },
    notifications: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      reminders: [
        {
          type: { type: String, enum: ["email", "push", "sms"] },
          minutesBefore: Number,
          sent: { type: Boolean, default: false },
          sentAt: Date,
        },
      ],
    },
    attendance: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["present", "absent", "late"],
          default: "absent",
        },
        joinTime: Date,
        leaveTime: Date,
        duration: Number, // in minutes
      },
    ],
    materials: [
      {
        title: String,
        type: { type: String, enum: ["slides", "document", "video", "link"] },
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    recording: {
      available: { type: Boolean, default: false },
      url: String,
      duration: Number, // in minutes
      uploadedAt: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for efficient queries
scheduleSchema.index({ "dateTime.start": 1, "dateTime.end": 1 })
scheduleSchema.index({ instructor: 1, "dateTime.start": 1 })
scheduleSchema.index({ course: 1, "dateTime.start": 1 })
scheduleSchema.index({ "participants.user": 1 })
scheduleSchema.index({ status: 1, "dateTime.start": 1 })

// Virtual for duration in minutes
scheduleSchema.virtual("durationMinutes").get(function () {
  return Math.round((this.dateTime.end - this.dateTime.start) / (1000 * 60))
})

// Pre-save middleware to validate dates
scheduleSchema.pre("save", function (next) {
  if (this.dateTime.start >= this.dateTime.end) {
    next(new Error("End time must be after start time"))
  }
  next()
})

module.exports = mongoose.model("Schedule", scheduleSchema)
