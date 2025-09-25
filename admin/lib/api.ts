const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'instructor' | 'admin';
  status: 'Active' | 'Blocked' | 'Deleted';
  phone?: string;
  avatar?: string;
  enrolledCourses?: string[];
  isActive?: boolean;
  lastLoginAt?: string;
  stats?: {
    enrollmentCount: number;
    completedCount: number;
    completionRate: number;
    cartItemsCount: number;
    totalSpent: number;
    lastLoginAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number;
  instructor: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  } | string;
  instructorName: string;
  thumbnail?: string;
  category: string;
  status: 'Published' | 'Draft' | 'Archived';
  tags: string[];
  lessons: Lesson[];
  isActive: boolean;
  featured?: boolean;
  trending?: boolean;
  rating: {
    average: number;
    count: number;
  };
  analytics?: {
    enrollmentCount: number;
    completionRate: number;
    revenue: number;
    averageRating: number;
    reviewCount: number;
  };
  stats?: {
    enrollmentCount: number;
    completedCount: number;
    completionRate: number;
    revenue: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  _id: string;
  title: string;
  content: string;
  videoUrl?: string;
  duration: number;
  order: number;
}

export interface Payment {
  _id: string;
  user: string;
  course: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transactionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  _id: string;
  student: string;
  course: string;
  enrolledAt: string;
  progress: number;
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

export interface UserDetail extends User {
  enrollments: Array<{
    _id: string;
    course: {
      _id: string;
      title: string;
      price: number;
      thumbnail?: string;
      category: string;
      level: string;
    };
    status: 'enrolled' | 'in_progress' | 'completed';
    progress?: {
      percentage: number;
      completedLessons: number;
      totalLessons: number;
    };
    enrollmentDate: string;
  }>;
  cart: {
    items: Array<{
      course: {
        _id: string;
        title: string;
        price: number;
        thumbnail?: string;
      };
      addedAt: string;
    }>;
  };
  stats: {
    totalEnrollments: number;
    completedCourses: number;
    inProgressCourses: number;
    totalSpent: number;
    cartValue: number;
    averageProgress: number;
  };
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    role: string;
    status: string;
    search?: string;
  };
}

export interface Instructor extends User {
  role: 'instructor';
  bio?: string;
  specialization?: string[];
  stats?: {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    totalEnrollments: number;
    totalRevenue: number;
    averageRating: number;
    totalReviews: number;
    joinedDate: string;
  };
}

export interface InstructorDetail extends Instructor {
  courses: Course[];
  recentEnrollments: Array<{
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    course: {
      _id: string;
      title: string;
      price: number;
    };
    enrollmentDate: string;
  }>;
  stats: {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    archivedCourses: number;
    totalEnrollments: number;
    totalRevenue: number;
    totalStudents: number;
    averageRating: number;
    totalReviews: number;
    totalLessons: number;
    totalDuration: number;
    monthlyRevenue: number;
  };
}

export interface InstructorsResponse {
  instructors: Instructor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    status: string;
    search?: string;
  };
}

export interface InstructorAnalytics {
  period: string;
  instructorTrends: Array<{
    _id: string;
    count: number;
  }>;
  statusDistribution: Array<{
    _id: string;
    count: number;
  }>;
  courseCreationTrends: Array<{
    _id: string;
    count: number;
  }>;
  totals: {
    totalInstructors: number;
    activeInstructors: number;
    blockedInstructors: number;
    newInstructors: number;
  };
}

export interface CreateInstructorRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}

export interface UserAnalytics {
  period: string;
  trends: Array<{
    _id: string;
    count: number;
    userCount: number;
    adminCount: number;
    instructorCount: number;
  }>;
  statusDistribution: Array<{
    _id: string;
    count: number;
  }>;
  roleDistribution: Array<{
    _id: string;
    count: number;
  }>;
  totals: {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    newUsers: number;
  };
}

export interface DashboardStats {
  summary: {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    totalEnrollments: number;
    newEnrollments: number;
    totalUsers: number;
    newUsers: number;
    periodRevenue: number;
    periodSales: number;
    totalRevenue: number;
  };
  topCourses: Array<{
    _id: string;
    title: string;
    enrollmentCount: number;
    price: number;
    rating: { average: number; count: number };
  }>;
  recentEnrollments: Array<{
    _id: string;
    user: { firstName: string; lastName: string; email: string };
    course: { title: string; price: number };
    enrolledAt: string;
  }>;
  revenueTrend: Array<{
    _id: string;
    revenue: number;
    count: number;
  }>;
}

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_token');
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
  
  // For development: always try to include an auth token
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  } else {
    // Use temporary development token for testing
    defaultHeaders.Authorization = `Bearer temp-admin-token-for-testing`;
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
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiRequest<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    console.log('Admin login response:', response);
    
    if (response.success && response.data) {
      // Store token in localStorage with admin prefix
      const token = response.data.accessToken || response.data.token;
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(response.data.user));
      
      return {
        success: true,
        token: token,
        user: response.data.user
      };
    }
    
    throw new Error(response.message || 'Login failed');
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },

  getCurrentUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('admin_user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    return !!getAuthToken();
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async (period = '30d'): Promise<DashboardStats> => {
    const response = await apiRequest<DashboardStats>(`/admin/dashboard/analytics?period=${period}`);
    return response.data as DashboardStats;
  },
};

// Courses API with video upload support
export const coursesAPI = {
  getAllCourses: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  }): Promise<Course[]> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    
    const response = await apiRequest<{ courses: Course[]; pagination: any }>(`/admin/course-management?${searchParams}`);
    return response.data?.courses || [];
  },

  getCourseById: async (id: string): Promise<Course> => {
    const response = await apiRequest<{ course: Course }>(`/admin/course-management/${id}`);
    return response.data?.course as Course;
  },

  createCourse: async (courseData: any): Promise<Course> => {
    const response = await apiRequest<Course>('/admin/course-management', {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
    return response.data as Course;
  },

  updateCourse: async (id: string, courseData: any): Promise<Course> => {
    const response = await apiRequest<Course>(`/admin/course-management/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData)
    });
    return response.data as Course;
  },

  deleteCourse: async (id: string): Promise<void> => {
    await apiRequest(`/admin/course-management/${id}`, {
      method: 'DELETE',
    });
  },

  toggleCourseStatus: async (id: string): Promise<Course> => {
    const response = await apiRequest<Course>(`/admin/course-management/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: 'toggle' })
    });
    return response.data as Course;
  },

  // Lesson management
  addLesson: async (courseId: string, lessonData: FormData): Promise<Lesson> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/courses/${courseId}/lessons`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: lessonData
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result.data;
  },

  updateLesson: async (courseId: string, lessonId: string, lessonData: FormData): Promise<Lesson> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/courses/${courseId}/lessons/${lessonId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: lessonData
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result.data;
  },

  deleteLesson: async (courseId: string, lessonId: string): Promise<void> => {
    await apiRequest(`/admin/course-management/${courseId}/lessons/${lessonId}`, {
      method: 'DELETE',
    });
  },

  updateLessons: async (courseId: string, lessons: any[]): Promise<{ lessons: any[] }> => {
    const response = await apiRequest<{ lessons: any[] }>(`/admin/course-management/${courseId}/lessons`, {
      method: 'PUT',
      body: JSON.stringify({ lessons })
    });
    return response.data as { lessons: any[] };
  },
};

// Users API
export const usersAPI = {
  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<UsersResponse> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.role && params.role !== 'all') searchParams.set('role', params.role);
      if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.startDate) searchParams.set('startDate', params.startDate);
      if (params?.endDate) searchParams.set('endDate', params.endDate);
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

      const response = await apiRequest<UsersResponse>(`/admin/users?${searchParams}`);
      return response.data as UsersResponse;
    } catch (error) {
      console.warn('Users API failed, using mock data:', error);
      // Return mock data for development testing
      return {
        users: [
          {
            _id: 'mock-user-1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'user' as const,
            status: 'Active' as const,
            phone: '+1234567890',
            avatar: '',
            createdAt: '2024-01-15T10:00:00.000Z',
            updatedAt: '2024-01-15T10:00:00.000Z',
            stats: {
              enrollmentCount: 3,
              completedCount: 1,
              completionRate: 33,
              cartItemsCount: 0,
              totalSpent: 7499
            }
          },
          {
            _id: 'mock-user-2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'instructor' as const,
            status: 'Active' as const,
            phone: '+1987654321',
            avatar: '',
            createdAt: '2024-01-10T08:30:00.000Z',
            updatedAt: '2024-01-10T08:30:00.000Z',
            stats: {
              enrollmentCount: 0,
              completedCount: 0,
              completionRate: 0,
              cartItemsCount: 0,
              totalSpent: 0
            }
          },
          {
            _id: 'mock-admin-1',
            name: 'Admin User',
            email: 'admin@elearning.com',
            role: 'admin' as const,
            status: 'Active' as const,
            phone: '+1555123456',
            avatar: '',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            stats: {
              enrollmentCount: 0,
              completedCount: 0,
              completionRate: 0,
              cartItemsCount: 0,
              totalSpent: 0
            }
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 3,
          pages: 1
        },
        filters: {
          role: params?.role || 'all',
          status: params?.status || 'all',
          search: params?.search
        }
      };
    }
  },

  getUserById: async (id: string): Promise<UserDetail> => {
    const response = await apiRequest<{ user: User; enrollments: any[]; cart: any; stats: any }>(`/admin/users/${id}`);
    if (!response.data) throw new Error('User not found');
    
    return {
      ...response.data.user,
      enrollments: response.data.enrollments,
      cart: response.data.cart,
      stats: response.data.stats
    } as UserDetail;
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
    const response = await apiRequest<User>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return response.data as User;
  },

  toggleUserStatus: async (id: string): Promise<User> => {
    const response = await apiRequest<User>(`/admin/users/${id}/status`, {
      method: 'PATCH',
    });
    return response.data as User;
  },

  deleteUser: async (id: string, force = false): Promise<void> => {
    const searchParams = force ? '?force=true' : '';
    await apiRequest(`/admin/users/${id}${searchParams}`, {
      method: 'DELETE',
    });
  },

  getUserAnalytics: async (period = 'month'): Promise<UserAnalytics> => {
    const response = await apiRequest<UserAnalytics>(`/admin/users/analytics?period=${period}`);
    return response.data as UserAnalytics;
  },

  exportUsers: async (filters?: {
    role?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> => {
    const searchParams = new URLSearchParams();
    if (filters?.role && filters.role !== 'all') searchParams.set('role', filters.role);
    if (filters?.status && filters.status !== 'all') searchParams.set('status', filters.status);
    if (filters?.startDate) searchParams.set('startDate', filters.startDate);
    if (filters?.endDate) searchParams.set('endDate', filters.endDate);
    
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/users/export?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Export failed');
    return await response.blob();
  },
};

// Instructors API
export const instructorsAPI = {
  getAllInstructors: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<InstructorsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const response = await apiRequest<InstructorsResponse>(`/admin/instructors?${searchParams}`);
    return response.data as InstructorsResponse;
  },

  getInstructorById: async (id: string): Promise<InstructorDetail> => {
    const response = await apiRequest<{ instructor: Instructor; courses: Course[]; recentEnrollments: any[]; stats: any }>(`/admin/instructors/${id}`);
    if (!response.data) throw new Error('Instructor not found');
    
    return {
      ...response.data.instructor,
      courses: response.data.courses,
      recentEnrollments: response.data.recentEnrollments,
      stats: response.data.stats
    } as InstructorDetail;
  },

  createInstructor: async (instructorData: CreateInstructorRequest): Promise<Instructor> => {
    const response = await apiRequest<Instructor>('/admin/instructors', {
      method: 'POST',
      body: JSON.stringify(instructorData),
    });
    return response.data as Instructor;
  },

  updateInstructor: async (id: string, instructorData: Partial<Instructor>): Promise<Instructor> => {
    const response = await apiRequest<Instructor>(`/admin/instructors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(instructorData),
    });
    return response.data as Instructor;
  },

  toggleInstructorStatus: async (id: string): Promise<Instructor> => {
    const response = await apiRequest<Instructor>(`/admin/instructors/${id}/status`, {
      method: 'PATCH',
    });
    return response.data as Instructor;
  },

  deleteInstructor: async (id: string, force = false): Promise<void> => {
    const searchParams = force ? '?force=true' : '';
    await apiRequest(`/admin/instructors/${id}${searchParams}`, {
      method: 'DELETE',
    });
  },

  assignInstructorToCourse: async (instructorId: string, courseId: string): Promise<{ course: Course; instructor: Instructor }> => {
    const response = await apiRequest<{ course: Course; instructor: Instructor }>(`/admin/instructors/${instructorId}/assign-course`, {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
    return response.data as { course: Course; instructor: Instructor };
  },

  getInstructorAnalytics: async (period = 'month'): Promise<InstructorAnalytics> => {
    const response = await apiRequest<InstructorAnalytics>(`/admin/instructors/analytics?period=${period}`);
    return response.data as InstructorAnalytics;
  },

  exportInstructors: async (filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> => {
    const searchParams = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') searchParams.set('status', filters.status);
    if (filters?.startDate) searchParams.set('startDate', filters.startDate);
    if (filters?.endDate) searchParams.set('endDate', filters.endDate);
    
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/instructors/export?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Export failed');
    return await response.blob();
  },
};

// Payments API
export const paymentsAPI = {
  getAllPayments: async (): Promise<Payment[]> => {
    const response = await apiRequest<Payment[]>('/admin/payments');
    return response.data || [];
  },

  getPaymentById: async (id: string): Promise<Payment> => {
    const response = await apiRequest<Payment>(`/admin/payments/${id}`);
    return response.data as Payment;
  },

  updatePaymentStatus: async (id: string, status: Payment['status']): Promise<Payment> => {
    const response = await apiRequest<Payment>(`/admin/payments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response.data as Payment;
  },
};

// Enrollments API
export const enrollmentsAPI = {
  getAllEnrollments: async (): Promise<Enrollment[]> => {
    const response = await apiRequest<Enrollment[]>('/admin/enrollments');
    return response.data || [];
  },

  getEnrollmentById: async (id: string): Promise<Enrollment> => {
    const response = await apiRequest<Enrollment>(`/admin/enrollments/${id}`);
    return response.data as Enrollment;
  },
};