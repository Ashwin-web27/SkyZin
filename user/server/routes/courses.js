const express = require("express")
const router = express.Router()
const Course = require("../models/Course")
const User = require("../models/User")
const { authenticate, authorize } = require("../middleware/auth")
const { io } = require("../index")

// Get all courses with filtering and pagination
router.get("/", async (req, res) => {
  try {
    const { category, level, instructor, status = "published", page = 1, limit = 10, search } = req.query

    const query = { status }

    // Add filters
    if (category) query.category = category
    if (level) query.level = level
    if (instructor) query.instructor = instructor

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ]
    }

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    const courses = await Course.find(query)
      .populate("instructor", "name email avatar")
      .skip(skip)
      .limit(Number.parseInt(limit))
      .sort({ createdAt: -1 })

    const total = await Course.countDocuments(query)

    res.json({
      courses,
      pagination: {
        current: Number.parseInt(page),
        pages: Math.ceil(total / Number.parseInt(limit)),
        total,
      },
    })
  } catch (error) {
    console.error("[v0] Get courses error:", error)
    res.status(500).json({ message: "Failed to fetch courses" })
  }
})

// Get single course by ID
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name email avatar")
      .populate("enrolledStudents.student", "name email avatar")

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    res.json(course)
  } catch (error) {
    console.error("[v0] Get course error:", error)
    res.status(500).json({ message: "Failed to fetch course" })
  }
})

// Create new course
router.post("/", authenticate, authorize("teacher", "admin"), async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      instructor: req.user._id,
    }

    const course = new Course(courseData)
    await course.save()

    // Add course to instructor's teaching courses
    await User.findByIdAndUpdate(req.user._id, { $push: { teachingCourses: course._id } })

    await course.populate("instructor", "name email avatar")

    res.status(201).json(course)
  } catch (error) {
    console.error("[v0] Create course error:", error)
    res.status(400).json({ message: error.message })
  }
})

// Update course
router.put("/:id", authenticate, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Check permissions
    const canEdit = req.user.role === "admin" || course.instructor.toString() === req.user._id.toString()

    if (!canEdit) {
      return res.status(403).json({ message: "Not authorized to edit this course" })
    }

    Object.assign(course, req.body)
    await course.save()

    await course.populate("instructor", "name email avatar")

    // Emit real-time update to enrolled students
    io.to(`course_${course._id}`).emit("course_updated", course)

    res.json(course)
  } catch (error) {
    console.error("[v0] Update course error:", error)
    res.status(400).json({ message: error.message })
  }
})

// Enroll in course
router.post("/:id/enroll", authenticate, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    if (course.status !== "published") {
      return res.status(400).json({ message: "Course is not available for enrollment" })
    }

    // Check if already enrolled
    const alreadyEnrolled = course.enrolledStudents.some(
      (enrollment) => enrollment.student.toString() === req.user._id.toString(),
    )

    if (alreadyEnrolled) {
      return res.status(400).json({ message: "Already enrolled in this course" })
    }

    // Check capacity
    if (course.currentEnrollment >= course.capacity.max) {
      return res.status(400).json({ message: "Course is full" })
    }

    // Add student to course
    course.enrolledStudents.push({
      student: req.user._id,
      enrolledAt: new Date(),
      status: "active",
    })

    await course.save()

    // Add course to student's enrolled courses
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        enrolledCourses: {
          course: course._id,
          enrolledAt: new Date(),
          progress: 0,
        },
      },
    })

    // Emit real-time update
    io.to(`user_${course.instructor}`).emit("student_enrolled", {
      course: course.title,
      student: req.user.name,
      message: `${req.user.name} enrolled in ${course.title}`,
    })

    res.json({ message: "Successfully enrolled in course" })
  } catch (error) {
    console.error("[v0] Enroll course error:", error)
    res.status(500).json({ message: "Failed to enroll in course" })
  }
})

// Unenroll from course
router.post("/:id/unenroll", authenticate, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Remove student from course
    course.enrolledStudents = course.enrolledStudents.filter(
      (enrollment) => enrollment.student.toString() !== req.user._id.toString(),
    )

    await course.save()

    // Remove course from student's enrolled courses
    await User.findByIdAndUpdate(req.user._id, {
      $pull: {
        enrolledCourses: { course: course._id },
      },
    })

    res.json({ message: "Successfully unenrolled from course" })
  } catch (error) {
    console.error("[v0] Unenroll course error:", error)
    res.status(500).json({ message: "Failed to unenroll from course" })
  }
})

// Delete course
router.delete("/:id", authenticate, authorize("teacher", "admin"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Check permissions
    const canDelete = req.user.role === "admin" || course.instructor.toString() === req.user._id.toString()

    if (!canDelete) {
      return res.status(403).json({ message: "Not authorized to delete this course" })
    }

    await Course.findByIdAndDelete(req.params.id)

    // Remove course from all users
    await User.updateMany(
      {},
      {
        $pull: {
          enrolledCourses: { course: course._id },
          teachingCourses: course._id,
        },
      },
    )

    res.json({ message: "Course deleted successfully" })
  } catch (error) {
    console.error("[v0] Delete course error:", error)
    res.status(500).json({ message: "Failed to delete course" })
  }
})

module.exports = router
