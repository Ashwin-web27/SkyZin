const express = require("express")
const router = express.Router()
const Schedule = require("../models/Schedule")
const Course = require("../models/Course")
const { authenticate, authorize } = require("../middleware/auth")
const { io } = require("../index")

// Get all schedules for authenticated user
router.get("/", authenticate, async (req, res) => {
  try {
    const { startDate, endDate, type, status } = req.query
    const query = {}

    // Build query based on user role
    if (req.user.role === "student") {
      query["participants.user"] = req.user._id
    } else if (req.user.role === "teacher") {
      query.instructor = req.user._id
    }

    // Add filters
    if (startDate && endDate) {
      query["dateTime.start"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    if (type) query.type = type
    if (status) query.status = status

    const schedules = await Schedule.find(query)
      .populate("course", "title category")
      .populate("instructor", "name email")
      .populate("participants.user", "name email")
      .sort({ "dateTime.start": 1 })

    res.json(schedules)
  } catch (error) {
    console.error("[v0] Get schedules error:", error)
    res.status(500).json({ message: "Failed to fetch schedules" })
  }
})

// Create new schedule
router.post("/", authenticate, authorize("teacher", "admin"), async (req, res) => {
  try {
    const scheduleData = {
      ...req.body,
      instructor: req.user._id,
      createdBy: req.user._id,
    }

    const schedule = new Schedule(scheduleData)
    await schedule.save()

    await schedule.populate([
      { path: "course", select: "title category" },
      { path: "instructor", select: "name email" },
      { path: "participants.user", select: "name email" },
    ])

    // Emit real-time update to relevant users
    if (schedule.course) {
      io.to(`course_${schedule.course._id}`).emit("schedule_created", schedule)
    }

    // Notify participants
    schedule.participants.forEach((participant) => {
      io.to(`user_${participant.user._id}`).emit("schedule_invitation", {
        schedule,
        message: `You've been invited to ${schedule.title}`,
      })
    })

    res.status(201).json(schedule)
  } catch (error) {
    console.error("[v0] Create schedule error:", error)
    res.status(400).json({ message: error.message })
  }
})

// Update schedule
router.put("/:id", authenticate, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" })
    }

    // Check permissions
    const canEdit =
      req.user.role === "admin" ||
      schedule.instructor.toString() === req.user._id.toString() ||
      schedule.createdBy.toString() === req.user._id.toString()

    if (!canEdit) {
      return res.status(403).json({ message: "Not authorized to edit this schedule" })
    }

    Object.assign(schedule, req.body)
    await schedule.save()

    await schedule.populate([
      { path: "course", select: "title category" },
      { path: "instructor", select: "name email" },
      { path: "participants.user", select: "name email" },
    ])

    // Emit real-time update
    if (schedule.course) {
      io.to(`course_${schedule.course._id}`).emit("schedule_updated", schedule)
    }

    res.json(schedule)
  } catch (error) {
    console.error("[v0] Update schedule error:", error)
    res.status(400).json({ message: error.message })
  }
})

// Join/Accept schedule invitation
router.post("/:id/join", authenticate, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" })
    }

    const participantIndex = schedule.participants.findIndex((p) => p.user.toString() === req.user._id.toString())

    if (participantIndex === -1) {
      return res.status(400).json({ message: "You are not invited to this schedule" })
    }

    schedule.participants[participantIndex].status = "accepted"
    await schedule.save()

    // Emit real-time update
    io.to(`user_${schedule.instructor}`).emit("schedule_accepted", {
      schedule: schedule._id,
      user: req.user.name,
      message: `${req.user.name} accepted the invitation to ${schedule.title}`,
    })

    res.json({ message: "Successfully joined the schedule" })
  } catch (error) {
    console.error("[v0] Join schedule error:", error)
    res.status(500).json({ message: "Failed to join schedule" })
  }
})

// Mark attendance
router.post("/:id/attendance", authenticate, async (req, res) => {
  try {
    const { status, joinTime, leaveTime } = req.body
    const schedule = await Schedule.findById(req.params.id)

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" })
    }

    // Check if user is participant or instructor
    const isParticipant = schedule.participants.some((p) => p.user.toString() === req.user._id.toString())
    const isInstructor = schedule.instructor.toString() === req.user._id.toString()

    if (!isParticipant && !isInstructor) {
      return res.status(403).json({ message: "Not authorized to mark attendance" })
    }

    const attendanceIndex = schedule.attendance.findIndex((a) => a.user.toString() === req.user._id.toString())

    const attendanceData = {
      user: req.user._id,
      status,
      joinTime: joinTime ? new Date(joinTime) : new Date(),
      leaveTime: leaveTime ? new Date(leaveTime) : null,
    }

    if (attendanceData.joinTime && attendanceData.leaveTime) {
      attendanceData.duration = Math.round((attendanceData.leaveTime - attendanceData.joinTime) / (1000 * 60))
    }

    if (attendanceIndex === -1) {
      schedule.attendance.push(attendanceData)
    } else {
      schedule.attendance[attendanceIndex] = attendanceData
    }

    await schedule.save()

    // Emit real-time update
    if (schedule.course) {
      io.to(`course_${schedule.course._id}`).emit("attendance_updated", {
        scheduleId: schedule._id,
        attendance: attendanceData,
      })
    }

    res.json({ message: "Attendance marked successfully" })
  } catch (error) {
    console.error("[v0] Mark attendance error:", error)
    res.status(500).json({ message: "Failed to mark attendance" })
  }
})

// Delete schedule
router.delete("/:id", authenticate, authorize("teacher", "admin"), async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" })
    }

    // Check permissions
    const canDelete =
      req.user.role === "admin" ||
      schedule.instructor.toString() === req.user._id.toString() ||
      schedule.createdBy.toString() === req.user._id.toString()

    if (!canDelete) {
      return res.status(403).json({ message: "Not authorized to delete this schedule" })
    }

    await Schedule.findByIdAndDelete(req.params.id)

    // Emit real-time update
    if (schedule.course) {
      io.to(`course_${schedule.course._id}`).emit("schedule_deleted", {
        scheduleId: schedule._id,
      })
    }

    res.json({ message: "Schedule deleted successfully" })
  } catch (error) {
    console.error("[v0] Delete schedule error:", error)
    res.status(500).json({ message: "Failed to delete schedule" })
  }
})

module.exports = router
