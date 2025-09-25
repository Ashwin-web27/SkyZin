const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
require("dotenv").config({ path: ".env.local" })

const connectDB = require("./config/database")
const authRoutes = require("./routes/auth")
const scheduleRoutes = require("./routes/schedule")
const courseRoutes = require("./routes/courses")
const userRoutes = require("./routes/users")
const { authenticateSocket } = require("./middleware/auth")

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? ["https://yourdomain.com"] : ["http://localhost:3000"],
    methods: ["GET", "POST"],
  },
})

// Connect to MongoDB
connectDB()

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? ["https://yourdomain.com"] : ["http://localhost:3000"],
    credentials: true,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use("/api/", limiter)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/schedule", scheduleRoutes)
app.use("/api/courses", courseRoutes)
app.use("/api/users", userRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

// Socket.IO connection handling
io.use(authenticateSocket)

io.on("connection", (socket) => {
  console.log(`[v0] User connected: ${socket.userId}`)

  // Join user to their personal room
  socket.join(`user_${socket.userId}`)

  // Handle schedule updates
  socket.on("schedule_update", (data) => {
    // Broadcast to relevant users (teachers, students in the class)
    socket.broadcast.to(`course_${data.courseId}`).emit("schedule_updated", data)
  })

  // Handle course enrollment
  socket.on("join_course", (courseId) => {
    socket.join(`course_${courseId}`)
    console.log(`[v0] User ${socket.userId} joined course ${courseId}`)
  })

  // Handle leaving course
  socket.on("leave_course", (courseId) => {
    socket.leave(`course_${courseId}`)
    console.log(`[v0] User ${socket.userId} left course ${courseId}`)
  })

  socket.on("disconnect", () => {
    console.log(`[v0] User disconnected: ${socket.userId}`)
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("[v0] Error:", err.stack)
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`[v0] Server running on port ${PORT}`)
  console.log(`[v0] Environment: ${process.env.NODE_ENV}`)
})

module.exports = { app, io }
