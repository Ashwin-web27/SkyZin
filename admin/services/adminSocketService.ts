import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

class AdminSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.token = localStorage.getItem('adminToken');
    this.userId = localStorage.getItem('adminUserId');
  }

  connect(token?: string, userId?: string) {
    if (token) {
      this.token = token;
      localStorage.setItem('adminToken', token);
    }
    if (userId) {
      this.userId = userId;
      localStorage.setItem('adminUserId', userId);
    }

    if (this.socket?.connected) {
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.setupEventListeners();
    
    // Authenticate after connection
    if (this.token) {
      this.authenticate();
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 Admin connected to server');
      this.reconnectAttempts = 0;
      
      if (this.token) {
        this.authenticate();
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Admin disconnected from server:', reason);
      
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Admin connection error:', error);
      this.handleReconnection();
    });

    // Authentication events
    this.socket.on('authenticated', (data) => {
      console.log('✅ Admin authenticated successfully', data);
      this.joinAdminRooms();
    });

    this.socket.on('auth-error', (error) => {
      console.error('❌ Admin authentication error:', error);
      toast.error('Authentication failed. Please log in again.');
      this.disconnect();
    });

    // Real-time admin notifications
    this.socket.on('new-notification', (notification) => {
      console.log('🔔 Admin notification:', notification);
      this.handleAdminNotification(notification);
    });

    // User activity events
    this.socket.on('user-registered', (data) => {
      console.log('👤 New user registered:', data);
      toast.success(`New user registered: ${data.user.name}`);
      this.emit('user-activity', { type: 'registration', data });
    });

    this.socket.on('user-login', (data) => {
      console.log('👤 User logged in:', data);
      this.emit('user-activity', { type: 'login', data });
    });

    this.socket.on('course-enrollment', (data) => {
      console.log('📚 New course enrollment:', data);
      toast.info(`${data.userName} enrolled in ${data.courseName}`);
      this.emit('enrollment-activity', data);
    });

    // Payment events
    this.socket.on('payment-success', (data) => {
      console.log('💳 Payment successful:', data);
      toast.success(`Payment received: $${data.amount} from ${data.userName}`);
      this.emit('payment-activity', { type: 'success', data });
    });

    this.socket.on('payment-failed', (data) => {
      console.log('💳 Payment failed:', data);
      toast.error(`Payment failed: ${data.userName} - ${data.reason}`);
      this.emit('payment-activity', { type: 'failed', data });
    });

    // Course management events
    this.socket.on('course-created', (data) => {
      console.log('📚 Course created:', data);
      this.emit('course-update', { type: 'created', data });
    });

    this.socket.on('course-updated', (data) => {
      console.log('📚 Course updated:', data);
      this.emit('course-update', { type: 'updated', data });
    });

    this.socket.on('course-deleted', (data) => {
      console.log('📚 Course deleted:', data);
      this.emit('course-update', { type: 'deleted', data });
    });

    // System events
    this.socket.on('system-stats-update', (stats) => {
      console.log('📊 System stats updated:', stats);
      this.emit('stats-update', stats);
    });

    this.socket.on('real-time-analytics', (analytics) => {
      console.log('📈 Real-time analytics:', analytics);
      this.emit('analytics-update', analytics);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Admin socket error:', error);
      toast.error(error.message || 'Admin connection error occurred');
    });

    // Heartbeat
    this.socket.on('heartbeat-ack', () => {
      // Server acknowledged heartbeat
    });
  }

  private authenticate() {
    if (!this.socket || !this.token) return;

    this.socket.emit('authenticate', { token: this.token });
  }

  private joinAdminRooms() {
    if (!this.socket || !this.userId) return;

    // Join admin-specific rooms
    this.socket.emit('join-room', { room: 'admin-room' });
    this.socket.emit('join-room', { room: 'instructors-room' });
    this.socket.emit('join-room', { room: `user-${this.userId}` });
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Admin reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.socket?.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Admin max reconnection attempts reached');
      toast.error('Connection lost. Please refresh the page.');
    }
  }

  private handleAdminNotification(notification: any) {
    const message = notification.title;
    
    switch (notification.priority) {
      case 'urgent':
        toast.error(message, { 
          duration: 10000,
          description: notification.message 
        });
        break;
      case 'high':
        toast.warning(message, { 
          duration: 8000,
          description: notification.message 
        });
        break;
      case 'medium':
        toast.info(message, { 
          duration: 5000,
          description: notification.message 
        });
        break;
      default:
        toast.success(message, { 
          duration: 3000,
          description: notification.message 
        });
    }

    this.emit('admin-notification', notification);
  }

  // Admin-specific methods
  broadcastSystemAnnouncement(title: string, message: string, targetRole?: string) {
    this.socket?.emit('broadcast-announcement', { title, message, targetRole });
  }

  requestRealTimeStats() {
    this.socket?.emit('request-stats');
  }

  requestAnalyticsUpdate() {
    this.socket?.emit('request-analytics');
  }

  // User management actions
  updateUserStatus(userId: string, status: string) {
    this.socket?.emit('admin-action', { 
      type: 'user-status-update', 
      userId, 
      status 
    });
  }

  deleteUser(userId: string) {
    this.socket?.emit('admin-action', { 
      type: 'user-delete', 
      userId 
    });
  }

  // Course management actions
  createCourse(courseData: any) {
    this.socket?.emit('admin-action', { 
      type: 'course-create', 
      data: courseData 
    });
  }

  updateCourse(courseId: string, updates: any) {
    this.socket?.emit('admin-action', { 
      type: 'course-update', 
      courseId, 
      updates 
    });
  }

  deleteCourse(courseId: string) {
    this.socket?.emit('admin-action', { 
      type: 'course-delete', 
      courseId 
    });
  }

  // Notification management
  sendNotificationToUser(userId: string, notification: any) {
    this.socket?.emit('send-user-notification', { userId, notification });
  }

  sendNotificationToRole(role: string, notification: any) {
    this.socket?.emit('send-role-notification', { role, notification });
  }

  // Heartbeat
  sendHeartbeat() {
    this.socket?.emit('heartbeat');
  }

  // Event emitter functionality
  private eventListeners: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event: string, data?: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  // Connection management
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
    this.userId = null;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUserId');
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionStats() {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  // Start heartbeat interval
  startHeartbeat() {
    setInterval(() => {
      if (this.isConnected()) {
        this.sendHeartbeat();
      }
    }, 30000); // Every 30 seconds
  }

  // Dashboard specific methods
  subscribeToLiveUpdates() {
    if (!this.socket) return;

    this.socket.on('dashboard-update', (data) => {
      this.emit('dashboard-update', data);
    });

    this.socket.on('live-stats', (stats) => {
      this.emit('live-stats', stats);
    });

    this.socket.on('active-users-update', (users) => {
      this.emit('active-users-update', users);
    });
  }

  unsubscribeFromLiveUpdates() {
    if (!this.socket) return;

    this.socket.off('dashboard-update');
    this.socket.off('live-stats');
    this.socket.off('active-users-update');
  }
}

// Export singleton instance
export const adminSocketService = new AdminSocketService();
export default adminSocketService;