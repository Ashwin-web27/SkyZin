const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Analytics = require('../models/Analytics');

class SocketManager {
  constructor(io) {
    this.io = io;
    this.activeConnections = new Map();
    this.userSockets = new Map(); // userId -> Set of socket IDs
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Socket connected: ${socket.id}`);
      
      // Handle authentication
      socket.on('authenticate', async (data) => {
        try {
          const { token } = data;
          
          if (!token) {
            socket.emit('auth-error', { message: 'No token provided' });
            return;
          }

          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.id).select('name email role avatar status');
          
          if (!user) {
            socket.emit('auth-error', { message: 'User not found' });
            return;
          }

          if (user.status === 'Blocked') {
            socket.emit('auth-error', { message: 'Account blocked' });
            return;
          }

          // Store user info in socket
          socket.userId = user._id.toString();
          socket.userRole = user.role;
          socket.userData = user;

          // Track connection
          this.activeConnections.set(socket.id, {
            userId: user._id.toString(),
            role: user.role,
            connectedAt: new Date(),
            lastActivity: new Date()
          });

          // Add to user sockets map
          if (!this.userSockets.has(socket.userId)) {
            this.userSockets.set(socket.userId, new Set());
          }
          this.userSockets.get(socket.userId).add(socket.id);

          // Join appropriate rooms
          socket.join(`user-${user._id}`);
          
          if (user.role === 'admin') {
            socket.join('admin-room');
            socket.join('instructors-room');
          } else if (user.role === 'instructor') {
            socket.join('instructors-room');
          } else {
            socket.join('users-room');
          }

          socket.emit('authenticated', {
            user: user.getPublicProfile(),
            rooms: socket.rooms
          });

          // Track login analytics
          Analytics.trackEvent('user_login', {
            userId: user._id,
            metadata: {
              userAgent: socket.handshake.headers['user-agent'],
              ip: socket.handshake.address
            }
          });

          console.log(`👤 User authenticated: ${user.name} (${user.role})`);

        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('auth-error', { message: 'Invalid token' });
        }
      });

      // Handle joining specific rooms
      socket.on('join-room', (data) => {
        const { room } = data;
        
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Validate room access
        if (this.canJoinRoom(socket, room)) {
          socket.join(room);
          socket.emit('room-joined', { room });
          console.log(`🚪 User ${socket.userId} joined room: ${room}`);
        } else {
          socket.emit('error', { message: 'Access denied to room' });
        }
      });

      // Handle leaving rooms
      socket.on('leave-room', (data) => {
        const { room } = data;
        socket.leave(room);
        socket.emit('room-left', { room });
      });

      // Handle real-time notifications
      socket.on('mark-notification-read', async (data) => {
        try {
          const { notificationId } = data;
          
          if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const notification = await Notification.findOne({
            _id: notificationId,
            recipient: socket.userId
          });

          if (notification) {
            await notification.markAsRead();
            socket.emit('notification-read', { notificationId });
          }
        } catch (error) {
          console.error('Mark notification error:', error);
          socket.emit('error', { message: 'Failed to mark notification as read' });
        }
      });

      // Handle real-time course progress updates
      socket.on('update-progress', async (data) => {
        try {
          const { courseId, lessonId, progress } = data;
          
          if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          // Update progress in database (implement in course controller)
          // Emit progress update to user's other devices
          this.emitToUser(socket.userId, 'progress-updated', {
            courseId,
            lessonId,
            progress,
            timestamp: new Date()
          });

          // Track analytics
          Analytics.trackEvent('lesson_completion', {
            userId: socket.userId,
            courseId,
            eventData: { lessonId, progress }
          });

        } catch (error) {
          console.error('Progress update error:', error);
          socket.emit('error', { message: 'Failed to update progress' });
        }
      });

      // Handle chat messages (if implementing chat)
      socket.on('send-message', async (data) => {
        try {
          const { message, channelId, courseId } = data;
          
          if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          // Process and save message (implement message model if needed)
          const messageData = {
            id: Date.now().toString(),
            message,
            sender: socket.userData,
            timestamp: new Date(),
            channelId,
            courseId
          };

          // Emit to appropriate room
          const room = courseId ? `course-${courseId}` : `channel-${channelId}`;
          socket.to(room).emit('new-message', messageData);
          socket.emit('message-sent', messageData);

        } catch (error) {
          console.error('Message send error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing-start', (data) => {
        const { channelId, courseId } = data;
        const room = courseId ? `course-${courseId}` : `channel-${channelId}`;
        
        socket.to(room).emit('user-typing', {
          userId: socket.userId,
          userName: socket.userData?.name
        });
      });

      socket.on('typing-stop', (data) => {
        const { channelId, courseId } = data;
        const room = courseId ? `course-${courseId}` : `channel-${channelId}`;
        
        socket.to(room).emit('user-stopped-typing', {
          userId: socket.userId
        });
      });

      // Handle heartbeat for connection monitoring
      socket.on('heartbeat', () => {
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          connection.lastActivity = new Date();
        }
        socket.emit('heartbeat-ack');
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
        
        // Remove from tracking
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          const userSockets = this.userSockets.get(connection.userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
              this.userSockets.delete(connection.userId);
            }
          }
        }
        
        this.activeConnections.delete(socket.id);
      });
    });
  }

  // Check if socket can join specific room
  canJoinRoom(socket, room) {
    if (!socket.userId || !socket.userRole) return false;

    // Admin can join any room
    if (socket.userRole === 'admin') return true;

    // Users can join their own rooms and course rooms they're enrolled in
    if (room.startsWith(`user-${socket.userId}`)) return true;
    if (room.startsWith('course-')) return true; // Add enrollment check here
    if (room === 'users-room' && socket.userRole === 'user') return true;
    if (room === 'instructors-room' && socket.userRole === 'instructor') return true;

    return false;
  }

  // Emit to all sockets of a specific user
  emitToUser(userId, event, data) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(event, data);
        }
      });
    }
  }

  // Emit to all admin users
  emitToAdmins(event, data) {
    this.io.to('admin-room').emit(event, data);
  }

  // Emit to all instructors
  emitToInstructors(event, data) {
    this.io.to('instructors-room').emit(event, data);
  }

  // Emit to all users
  emitToUsers(event, data) {
    this.io.to('users-room').emit(event, data);
  }

  // Emit to course participants
  emitToCourse(courseId, event, data) {
    this.io.to(`course-${courseId}`).emit(event, data);
  }

  // Get active connections count
  getActiveConnectionsCount() {
    return this.activeConnections.size;
  }

  // Get active users count
  getActiveUsersCount() {
    return this.userSockets.size;
  }

  // Get connections by role
  getConnectionsByRole() {
    const connections = Array.from(this.activeConnections.values());
    const byRole = {};
    
    connections.forEach(conn => {
      byRole[conn.role] = (byRole[conn.role] || 0) + 1;
    });
    
    return byRole;
  }

  // Send notification to user
  async sendNotificationToUser(userId, notification) {
    try {
      // Save to database
      const savedNotification = await Notification.create({
        recipient: userId,
        ...notification
      });

      // Emit real-time notification
      this.emitToUser(userId, 'new-notification', savedNotification);
      
      return savedNotification;
    } catch (error) {
      console.error('Send notification error:', error);
      return null;
    }
  }

  // Send progress update to user
  sendProgressUpdate(userId, progressData) {
    try {
      this.emitToUser(userId, 'progress-update', progressData);
      return true;
    } catch (error) {
      console.error('Send progress update error:', error);
      return false;
    }
  }

  // Broadcast system announcement
  async broadcastSystemAnnouncement(title, message, targetRole = null) {
    try {
      // If targetRole is specified, only send to that role
      const event = 'system-announcement';
      const data = {
        title,
        message,
        timestamp: new Date(),
        type: 'system_announcement'
      };

      if (targetRole === 'admin') {
        this.emitToAdmins(event, data);
      } else if (targetRole === 'instructor') {
        this.emitToInstructors(event, data);
      } else if (targetRole === 'user') {
        this.emitToUsers(event, data);
      } else {
        // Broadcast to all
        this.io.emit(event, data);
      }

      return true;
    } catch (error) {
      console.error('Broadcast announcement error:', error);
      return false;
    }
  }

  // Course synchronization methods
  broadcastCourseCreated(course) {
    try {
      const data = {
        course,
        message: `New course available: ${course.title}`,
        timestamp: new Date(),
        type: 'course_created'
      };
      
      // Notify all users about new course
      this.emitToUsers('courseCreated', data);
      
      // Also notify admins
      this.emitToAdmins('courseCreated', data);
      
      console.log(`📚 Broadcast: New course created - ${course.title}`);
      return true;
    } catch (error) {
      console.error('Broadcast course created error:', error);
      return false;
    }
  }

  broadcastCourseUpdated(course) {
    try {
      const data = {
        course,
        message: `Course updated: ${course.title}`,
        timestamp: new Date(),
        type: 'course_updated'
      };
      
      // Notify all users about course update
      this.emitToUsers('courseUpdated', data);
      
      // Also notify admins
      this.emitToAdmins('courseUpdated', data);
      
      console.log(`📝 Broadcast: Course updated - ${course.title}`);
      return true;
    } catch (error) {
      console.error('Broadcast course updated error:', error);
      return false;
    }
  }

  broadcastCourseDeleted(courseId, courseName) {
    try {
      const data = {
        courseId,
        courseName,
        message: `Course removed: ${courseName}`,
        timestamp: new Date(),
        type: 'course_deleted'
      };
      
      // Notify all users about course deletion
      this.emitToUsers('courseDeleted', data);
      
      // Also notify admins
      this.emitToAdmins('courseDeleted', data);
      
      console.log(`🗑️ Broadcast: Course deleted - ${courseName}`);
      return true;
    } catch (error) {
      console.error('Broadcast course deleted error:', error);
      return false;
    }
  }

  // Enrollment synchronization
  broadcastEnrollmentUpdate(userId, courseId, enrollmentData) {
    try {
      const data = {
        courseId,
        enrollmentData,
        timestamp: new Date(),
        type: 'enrollment_updated'
      };
      
      // Notify the specific user about their enrollment update
      this.emitToUser(userId, 'enrollmentUpdated', data);
      
      // Notify admins about the enrollment
      this.emitToAdmins('enrollmentUpdated', { userId, ...data });
      
      return true;
    } catch (error) {
      console.error('Broadcast enrollment update error:', error);
      return false;
    }
  }

  // Cart synchronization
  broadcastCartUpdate(userId, cartData) {
    try {
      const data = {
        cart: cartData,
        timestamp: new Date(),
        type: 'cart_updated'
      };
      
      // Notify the specific user about their cart update
      this.emitToUser(userId, 'cartUpdated', data);
      
      return true;
    } catch (error) {
      console.error('Broadcast cart update error:', error);
      return false;
    }
  }
}

module.exports = SocketManager;