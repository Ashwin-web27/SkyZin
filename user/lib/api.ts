const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Types
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  role: 'student' | 'instructor';
  enrolledCourses: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number;
  instructor: string;
  instructorName: string;
  thumbnail?: string;
  category: string;
  status: 'Published' | 'Draft' | 'Archived';
  tags: string[];
  lessons: Array<{
    title: string;
    content: string;
    videoUrl?: string;
    duration: number;
    order: number;
  }>;
  isActive: boolean;
  rating: {
    average: number;
    count: number;
  };
  enrolledCount: number;
  lessonsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Helper function to make API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getAuthToken();
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401 || data.message?.includes('token') || data.message?.includes('Access token is required')) {
        // Clear invalid tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        // Create a more specific error for authentication
        const authError = new Error(data.message || 'Authentication required');
        (authError as any).isAuthError = true;
        throw authError;
      }
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error: any) {
    console.error('API request error:', error);
    // Don't re-clear tokens if it's already an auth error
    if (error.message?.includes('token') && !error.isAuthError) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      error.isAuthError = true;
    }
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.success && response.data) {
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data as LoginResponse;
  },

  register: async (name: string, email: string, password: string): Promise<LoginResponse> => {
    const response = await apiRequest<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    
    if (response.success && response.data) {
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data as LoginResponse;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    const token = getAuthToken();
    if (!token) return false;
    
    // Basic token validation - check if it's not expired
    try {
      // Parse JWT token (basic check without verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      if (payload.exp && payload.exp < currentTime) {
        // Token is expired, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
      
      return true;
    } catch (error) {
      // If token is malformed, clear it
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    
    return {
      success: response.success || false,
      message: response.data?.message || response.message || 'Password reset email sent'
    };
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
    
    return {
      success: response.success || false,
      message: response.data?.message || response.message || 'Password reset successful'
    };
  },

  verifyResetToken: async (token: string): Promise<{ success: boolean; email?: string; message: string }> => {
    try {
      const response = await apiRequest<{ email: string; message: string }>('/auth/verify-reset-token', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      
      return {
        success: response.success || false,
        email: response.data?.email,
        message: response.data?.message || response.message || 'Token verified'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Invalid or expired token'
      };
    }
  },
};

// Courses API
export const coursesAPI = {
  getAllCourses: async (): Promise<Course[]> => {
    const response = await apiRequest<any>('/courses');
    // Backend returns { success: true, data: { courses: [...], pagination: {...} } }
    return response.data?.courses || [];
  },

  getCourseById: async (id: string): Promise<Course> => {
    const response = await apiRequest<any>(`/courses/${id}`);
    // Backend returns { success: true, data: courseObject }
    return response.data as Course;
  },

  enrollInCourse: async (courseId: string): Promise<void> => {
    await apiRequest(`/enrollment/enroll/${courseId}`, {
      method: 'POST',
    });
  },
};

// Enrollment API
export const enrollmentAPI = {
  enrollInCourse: async (courseId: string): Promise<void> => {
    await apiRequest(`/enrollment/enroll/${courseId}`, {
      method: 'POST',
    });
  },

  getMyCourses: async (): Promise<any[]> => {
    const response = await apiRequest<any[]>('/enrollment/my-courses');
    return response.data || [];
  },

  updateProgress: async (courseId: string, lessonId: string, completed: boolean, timeSpent?: number): Promise<void> => {
    await apiRequest(`/enrollment/progress/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify({ lessonId, completed, timeSpent }),
    });
  },

  getProgress: async (courseId: string): Promise<any> => {
    const response = await apiRequest<any>(`/enrollment/progress/${courseId}`);
    return response.data;
  },

  unenrollFromCourse: async (courseId: string): Promise<void> => {
    await apiRequest(`/enrollment/unenroll/${courseId}`, {
      method: 'POST',
    });
  },
};

// Cart API with authentication fallback
export const cartAPI = {
  addToCart: async (courseId: string): Promise<any> => {
    try {
      if (!authAPI.isAuthenticated()) {
        throw new Error('Not authenticated');
      }
      const response = await apiRequest<any>(`/cart/add/${courseId}`, {
        method: 'POST',
      });
      return response.data;
    } catch (error: any) {
      if (error.isAuthError || !authAPI.isAuthenticated()) {
        // Fall back to local cart for non-authenticated users
        throw new Error('Authentication required for server cart');
      }
      throw error;
    }
  },

  getCart: async (): Promise<any> => {
    try {
      if (!authAPI.isAuthenticated()) {
        throw new Error('Not authenticated');
      }
      const response = await apiRequest<any>('/cart');
      return response.data;
    } catch (error: any) {
      if (error.isAuthError || !authAPI.isAuthenticated()) {
        // Return empty cart structure for consistency
        throw new Error('Authentication required');
      }
      throw error;
    }
  },

  removeFromCart: async (courseId: string): Promise<void> => {
    try {
      if (!authAPI.isAuthenticated()) {
        throw new Error('Not authenticated');
      }
      await apiRequest(`/cart/remove/${courseId}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      if (error.isAuthError || !authAPI.isAuthenticated()) {
        throw new Error('Authentication required');
      }
      throw error;
    }
  },

  clearCart: async (): Promise<void> => {
    try {
      if (!authAPI.isAuthenticated()) {
        throw new Error('Not authenticated');
      }
      await apiRequest('/cart/clear', {
        method: 'DELETE',
      });
    } catch (error: any) {
      if (error.isAuthError || !authAPI.isAuthenticated()) {
        throw new Error('Authentication required');
      }
      throw error;
    }
  },

  checkout: async (paymentMethod: string, paymentDetails?: any): Promise<any> => {
    try {
      if (!authAPI.isAuthenticated()) {
        throw new Error('Authentication required for checkout');
      }
      const response = await apiRequest<any>('/cart/checkout', {
        method: 'POST',
        body: JSON.stringify({ paymentMethod, paymentDetails }),
      });
      return response.data;
    } catch (error: any) {
      if (error.isAuthError) {
        throw new Error('Please log in to complete checkout');
      }
      throw error;
    }
  },

  getPurchaseHistory: async (page = 1, limit = 10): Promise<any> => {
    try {
      if (!authAPI.isAuthenticated()) {
        throw new Error('Authentication required');
      }
      const response = await apiRequest<any>(`/cart/purchase-history?page=${page}&limit=${limit}`);
      return response;
    } catch (error: any) {
      if (error.isAuthError || !authAPI.isAuthenticated()) {
        throw new Error('Authentication required');
      }
      throw error;
    }
  },
};

// User API
export const userAPI = {
  getProfile: async (): Promise<User> => {
    const response = await apiRequest<User>('/users/profile');
    return response.data as User;
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await apiRequest<User>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return response.data as User;
  },

  getDashboardStats: async (): Promise<any> => {
    try {
      if (!authAPI.isAuthenticated()) {
        // Return local data for non-authenticated users
        const localCart = JSON.parse(localStorage.getItem('localCart') || '[]');
        const localEnrolled = JSON.parse(localStorage.getItem('localEnrolledCourses') || '[]');
        
        const continueLearning = localEnrolled
          .filter((course: any) => course.progress < 100)
          .slice(0, 3);
        
        return {
          user: {
            name: 'Guest User',
            email: 'guest@example.com'
          },
          stats: {
            enrolledCoursesCount: localEnrolled.length,
            averageProgress: localEnrolled.length > 0 
              ? Math.round(localEnrolled.reduce((sum: number, course: any) => sum + (course.progress || 0), 0) / localEnrolled.length)
              : 0,
            cartItemsCount: localCart.length
          },
          continueLearning: continueLearning,
          recommendedCourses: [],
          cartItems: localCart
        };
      }
      
      const response = await apiRequest<any>('/users/dashboard/stats');
      return response.data;
    } catch (error: any) {
      if (error?.message?.includes('Authentication required') ||
          error?.message?.includes('token') ||
          error.isAuthError) {
        // Fallback to local data
        const localCart = JSON.parse(localStorage.getItem('localCart') || '[]');
        const localEnrolled = JSON.parse(localStorage.getItem('localEnrolledCourses') || '[]');
        
        return {
          user: {
            name: 'Guest User',
            email: 'guest@example.com'
          },
          stats: {
            enrolledCoursesCount: localEnrolled.length,
            averageProgress: localEnrolled.length > 0 
              ? Math.round(localEnrolled.reduce((sum: number, course: any) => sum + (course.progress || 0), 0) / localEnrolled.length)
              : 0,
            cartItemsCount: localCart.length
          },
          continueLearning: localEnrolled.filter((course: any) => course.progress < 100).slice(0, 3),
          recommendedCourses: [],
          cartItems: localCart
        };
      }
      throw error;
    }
  },
};

// Admin API
export const adminAPI = {
  getDashboardStats: async (timeRange: string = '7d'): Promise<any> => {
    const response = await apiRequest<any>(`/admin/dashboard/stats?timeRange=${timeRange}`);
    return response.data;
  },

  getRealTimeStats: async (): Promise<any> => {
    const response = await apiRequest<any>('/admin/real-time-stats');
    return response.data;
  },

  getUsers: async (page: number = 1, limit: number = 10, search?: string, status?: string, role?: string): Promise<any> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status && { status }),
      ...(role && { role })
    });
    const response = await apiRequest<any>(`/admin/users?${params}`);
    return response.data;
  },

  getCourses: async (page: number = 1, limit: number = 10, search?: string, status?: string): Promise<any> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status && { status })
    });
    const response = await apiRequest<any>(`/admin/courses?${params}`);
    return response.data;
  },

  getPayments: async (page: number = 1, limit: number = 10, status?: string): Promise<any> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status })
    });
    const response = await apiRequest<any>(`/admin/payments?${params}`);
    return response.data;
  },

  updateUserStatus: async (userId: string, status: string): Promise<any> => {
    const response = await apiRequest<any>(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    return response.data;
  },

  getAnalytics: async (timeRange: string = '7d', type?: string, groupBy: string = 'day'): Promise<any> => {
    const params = new URLSearchParams({
      timeRange,
      groupBy,
      ...(type && { type })
    });
    const response = await apiRequest<any>(`/admin/analytics?${params}`);
    return response.data;
  }
};
