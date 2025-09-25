const express = require("express")
const router = express.Router()
const User = require("../models/User")
const { authenticate, authorize } = require("../middleware/auth")

// Get all users (admin only)
router.get("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query
    const query = {}

    if (role) query.role = role

    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
    }

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(Number.parseInt(limit))
      .sort({ createdAt: -1 })

    const total = await User.countDocuments(query)

    res.json({
      users,
      pagination: {
        current: Number.parseInt(page),
        pages: Math.ceil(total / Number.parseInt(limit)),
        total,
      },
    })
  } catch (error) {
    console.error("[v0] Get users error:", error)
    res.status(500).json({ message: "Failed to fetch users" })
  }
})

// Get user by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    // Users can only view their own profile unless they're admin
    if (req.user.role !== "admin" && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: "Access denied" })
    }

    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("enrolledCourses.course", "title category level")
      .populate("teachingCourses", "title category level")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
  } catch (error) {
    console.error("[v0] Get user error:", error)
    res.status(500).json({ message: "Failed to fetch user" })
  }
})

// Update user (admin only)
router.put("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const allowedUpdates = ["name", "email", "role", "isActive", "phone", "dateOfBirth"]
    const updates = {}

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key]
      }
    })

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select(
      "-password",
    )

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
  } catch (error) {
    console.error("[v0] Update user error:", error)
    res.status(400).json({ message: error.message })
  }
})

// Delete user (admin only)
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("[v0] Delete user error:", error)
    res.status(500).json({ message: "Failed to delete user" })
  }
})

module.exports = router
