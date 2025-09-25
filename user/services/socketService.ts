import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.token = localStorage.getItem('token');
    this.userId = localStorage.getItem('userId');
  }

  connect(token?: string, userId?: string) {
    if (token) {
      this.token = token;
      localStorage.setItem('token', token);
    }
    if (userId) {
      this.userId = userId;
      localStorage.setItem('userId', userId);
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
      console.log('🔌 Connected to server');
      this.reconnectAttempts = 0;
      
      if (this.token) {
        this.authenticate();
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      
      if (reason === 'io server disconnect') {
        // The disconnection was initiated by the server, reconnect manually
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handleReconnection();
    });

    // Authentication events
    this.socket.on('authenticated', (data) => {
      console.log('✅ Authenticated successfully', data);
      this.joinUserRooms();
    });

    this.socket.on('auth-error', (error) => {
      console.error('❌ Authentication error:', error);
      toast.error('Authentication failed. Please log in again.');
      this.disconnect();
    });

    // Real-time notifications
    this.socket.on('new-notification', (notification) => {
      console.log('🔔 New notification:', notification);
      this.handleNewNotification(notification);
    });

    // Course updates
    this.socket.on('course-created', (data) => {
      console.log('📚 New course available:', data);
      toast.success(`New course available: ${data.course.title}`);
      this.emit('course-list-update', data);
    });

    this.socket.on('course-updated', (data) => {
      console.log('📚 Course updated:', data);
      toast.info(`Course updated: ${data.course.title}`);
      this.emit('course-list-update', data);
    });

    this.socket.on('course-deleted', (data) => {
      console.log('📚 Course removed:', data);
      toast.info(`Course no longer available: ${data.courseTitle}`);
      this.emit('course-list-update', data);
    });

    // Cart updates
    this.socket.on('cart-updated', (data) => {
      console.log('🛒 Cart updated:', data);
      this.handleCartUpdate(data);
      this.emit('cart-update', data);
    });

    // Progress updates
    this.socket.on('progress-updated', (data) => {
      console.log('📈 Progress updated:', data);
      this.emit('progress-update', data);
    });

    // System announcements
    this.socket.on('system-announcement', (announcement) => {
      console.log('📢 System announcement:', announcement);
      this.handleSystemAnnouncement(announcement);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'Connection error occurred');
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

  private joinUserRooms() {
    if (!this.socket || !this.userId) return;

    // Join user-specific rooms
    this.socket.emit('join-room', { room: `user-${this.userId}` });
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.socket?.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      toast.error('Connection lost. Please refresh the page.');
    }
  }

  private handleNewNotification(notification: any) {
    // Show toast notification based on priority
    const message = notification.title;
    
    switch (notification.priority) {
      case 'urgent':
      case 'high':
        toast.error(message, { 
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

    // Emit to components that need to update notification counts
    this.emit('new-notification', notification);
  }

  private handleCartUpdate(data: any) {
    let message = '';
    
    switch (data.action) {
      case 'added':
        message = `${data.course?.title || 'Course'} added to cart`;
        toast.success(message);
        break;
      case 'removed':
        message = 'Course removed from cart';
        toast.info(message);
        break;
      case 'cleared':
        message = 'Cart cleared';
        toast.info(message);
        break;
    }
  }

  private handleSystemAnnouncement(announcement: any) {
    toast.info(announcement.title, {
      description: announcement.message,
      duration: 10000
    });
  }

  // Public methods for emitting events
  markNotificationAsRead(notificationId: string) {
    this.socket?.emit('mark-notification-read', { notificationId });
  }

  updateProgress(courseId: string, lessonId: string, progress: number) {
    this.socket?.emit('update-progress', { courseId, lessonId, progress });
  }

  joinCourseRoom(courseId: string) {
    this.socket?.emit('join-room', { room: `course-${courseId}` });
  }

  leaveCourseRoom(courseId: string) {
    this.socket?.emit('leave-room', { room: `course-${courseId}` });
  }

  // Chat functionality (if implemented)
  sendMessage(message: string, courseId?: string, channelId?: string) {
    this.socket?.emit('send-message', { message, courseId, channelId });
  }

  startTyping(courseId?: string, channelId?: string) {
    this.socket?.emit('typing-start', { courseId, channelId });
  }

  stopTyping(courseId?: string, channelId?: string) {
    this.socket?.emit('typing-stop', { courseId, channelId });
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
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Start heartbeat interval
  startHeartbeat() {
    setInterval(() => {
      if (this.isConnected()) {
        this.sendHeartbeat();
      }
    }, 30000); // Every 30 seconds
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;