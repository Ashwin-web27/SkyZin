const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const adminCoursesRoutes = require('./routes/adminCourses');
const adminCourseManagementRoutes = require('./routes/adminCourseManagement');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminInstructorRoutes = require('./routes/adminInstructorRoutes');
const userRoutes = require('./routes/user');
const coursesRoutes = require('./routes/courses');
const enrollmentRoutes = require('./routes/enrollment');
const cartRoutes = require('./routes/cart');
const testAuthRoutes = require('./routes/test-auth');

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'development' 
      ? ['http://localhost:3000', 'http://localhost:4000', 'http://127.0.0.1:3000', 'http://127.0.0.1:4000']
      : process.env.SOCKET_CORS_ORIGINS ? process.env.SOCKET_CORS_ORIGINS.split(',') : false,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowEIO3: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize Socket Manager
const SocketManager = require('./utils/socketManager');
const socketManager = new SocketManager(io);

// Make io and socketManager accessible throughout the app
app.set('io', io);
app.set('socketManager', socketManager);

// Connect to MongoDB
connectDB();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 5, // More lenient in development
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);

// CORS configuration - Allow all origins during development
const corsOptions = {
  origin: process.env.NODE_ENV === 'development' ? true : function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_ADMIN_URL || 'http://localhost:4000',
      process.env.FRONTEND_USER_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:4000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:4000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminCoursesRoutes);
app.use('/api/admin/course-management', adminCourseManagementRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/instructors', adminInstructorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/test', testAuthRoutes);

// Real-time status endpoint
app.get('/api/realtime/status', (req, res) => {
  res.status(200).json({
    success: true,
    socketIo: {
      enabled: true,
      activeConnections: socketManager.getActiveConnectionsCount(),
      activeUsers: socketManager.getActiveUsersCount(),
      connectionsByRole: socketManager.getConnectionsByRole()
    },
    features: {
      notifications: process.env.REALTIME_NOTIFICATIONS === 'true',
      chat: process.env.REALTIME_CHAT === 'true',
      progressTracking: process.env.REALTIME_PROGRESS_TRACKING === 'true'
    },
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'E-Learning Platform API',
    version: '1.0.0',
    realTime: 'Socket.io enabled',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      admin: '/api/admin',
      users: '/api/users'
    }
  });
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
  console.error(err.stack);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

const PORT = process.env.PORT || 5000;

const server = httpServer.listen(PORT, () => {
  console.log(`
🚀 Server running in ${process.env.NODE_ENV || 'development'} mode
📡 Port: ${PORT}
🌐 Admin URL: ${process.env.FRONTEND_ADMIN_URL || 'http://localhost:4000'}
👥 User URL: ${process.env.FRONTEND_USER_URL || 'http://localhost:3000'}
📚 API Documentation: http://localhost:${PORT}/
🔄 Real-time: Socket.io enabled
  `);
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

module.exports = app;