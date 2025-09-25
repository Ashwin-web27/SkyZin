const mongoose = require("mongoose")

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Course description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Instructor is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["programming", "design", "business", "marketing", "data-science", "other"],
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    duration: {
      weeks: { type: Number, required: true },
      hoursPerWeek: { type: Number, required: true },
    },
    schedule: {
      days: [
        {
          type: String,
          enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        },
      ],
      startTime: { type: String, required: true }, // Format: "HH:MM"
      endTime: { type: String, required: true }, // Format: "HH:MM"
      timezone: { type: String, default: "UTC" },
    },
    capacity: {
      min: { type: Number, default: 1 },
      max: { type: Number, required: true },
    },
    enrolledStudents: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["active", "completed", "dropped"],
          default: "active",
        },
      },
    ],
    price: {
      amount: { type: Number, required: true },
      currency: { type: String, default: "USD" },
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    status: {
      type: String,
      enum: ["draft", "published", "ongoing", "completed", "cancelled"],
      default: "draft",
    },
    materials: [
      {
        title: String,
        type: { type: String, enum: ["video", "document", "link", "assignment"] },
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    tags: [String],
    thumbnail: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
courseSchema.index({ category: 1, level: 1 })
courseSchema.index({ instructor: 1 })
courseSchema.index({ startDate: 1, endDate: 1 })
courseSchema.index({ "enrolledStudents.student": 1 })

// Virtual for current enrollment count
courseSchema.virtual("currentEnrollment").get(function () {
  return this.enrolledStudents.filter((enrollment) => enrollment.status === "active").length
})

// Virtual for available spots
courseSchema.virtual("availableSpots").get(function () {
  return this.capacity.max - this.currentEnrollment
})

module.exports = mongoose.model("Course", courseSchema)
