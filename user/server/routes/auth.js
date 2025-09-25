const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const { authenticate } = require("../middleware/auth")

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  })
}

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "student" } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" })
    }

    // Create new user
    const user = new User({ name, email, password, role })
    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("[v0] Register error:", error)
    res.status(400).json({ message: error.message })
  }
})

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated" })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    res.status(500).json({ message: "Login failed" })
  }
})

// Get current user profile
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("enrolledCourses.course", "title category level")
      .populate("teachingCourses", "title category level")

    res.json(user)
  } catch (error) {
    console.error("[v0] Get profile error:", error)
    res.status(500).json({ message: "Failed to fetch profile" })
  }
})

// Update user profile
router.put("/me", authenticate, async (req, res) => {
  try {
    const allowedUpdates = ["name", "phone", "dateOfBirth", "avatar", "preferences"]
    const updates = {}

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key]
      }
    })

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })

    res.json(user)
  } catch (error) {
    console.error("[v0] Update profile error:", error)
    res.status(400).json({ message: error.message })
  }
})

// Change password
router.put("/change-password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Get user with password
    const user = await User.findById(req.user._id).select("+password")

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("[v0] Change password error:", error)
    res.status(400).json({ message: error.message })
  }
})

// Logout (client-side token removal, but we can track it)
router.post("/logout", authenticate, async (req, res) => {
  try {
    // In a more complex setup, you might want to blacklist the token
    // For now, we'll just send a success response
    res.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("[v0] Logout error:", error)
    res.status(500).json({ message: "Logout failed" })
  }
})

module.exports = router
