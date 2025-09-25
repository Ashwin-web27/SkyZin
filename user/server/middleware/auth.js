const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Middleware for HTTP requests
const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select("-password")

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid token or user not active." })
    }

    req.user = user
    next()
  } catch (error) {
    console.error("[v0] Auth middleware error:", error)
    res.status(401).json({ message: "Invalid token." })
  }
}

// Middleware for Socket.IO connections
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error("Authentication error: No token provided"))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select("-password")

    if (!user || !user.isActive) {
      return next(new Error("Authentication error: Invalid token or user not active"))
    }

    socket.userId = user._id.toString()
    socket.user = user
    next()
  } catch (error) {
    console.error("[v0] Socket auth error:", error)
    next(new Error("Authentication error: Invalid token"))
  }
}

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Access denied. Please authenticate." })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. Insufficient permissions.",
      })
    }

    next()
  }
}

module.exports = { authenticate, authenticateSocket, authorize }
