import { adminApiClient, ApiResponse } from './api';

// Dashboard Types
export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalInstructors: number;
  totalPayments: number;
  monthlyRevenue: number;
}

export interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface RecentCourse {
  id: string;
  title: string;
  instructor: string;
  createdAt: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentUsers: RecentUser[];
  recentCourses: RecentCourse[];
}

// User Management Types
export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Blocked' | 'Pending';
  enrolled: number;
  createdAt: string;
}

export interface UsersResponse {
  users: UserRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Course Management Types
export interface CourseRow {
  id: string;
  title: string;
  instructor: string;
  price: number;
  status: 'Published' | 'Draft' | 'Archived';
  enrolledCount: number;
  createdAt: string;
  thumbnail?: string;
}

export interface CoursesResponse {
  courses: CourseRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  price: number;
  category: string;
  level: string;
  duration: number;
  instructorId: string;
}

// Instructor Types
export interface InstructorRow {
  id: string;
  name: string;
  email: string;
  totalCourses: number;
  rating: number;
  status: 'Active' | 'Blocked' | 'Pending';
  createdAt: string;
}

export interface InstructorsResponse {
  instructors: InstructorRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Payment Types
export interface PaymentRow {
  id: string;
  user: string;
  course: string;
  amount: number;
  status: 'Paid' | 'Refunded' | 'Pending' | 'Failed';
  date: string;
  transactionId: string;
}

export interface PaymentsResponse {
  payments: PaymentRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class AdminService {
  // Dashboard Methods
  async getDashboardStats(): Promise<ApiResponse<DashboardData>> {
    return adminApiClient.get<DashboardData>('/dashboard/stats');
  }

  // User Management Methods
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
  }): Promise<ApiResponse<UsersResponse>> {
    return adminApiClient.get<UsersResponse>('/users', params);
  }

  async getUserById(id: string): Promise<ApiResponse<UserRow>> {
    return adminApiClient.get<UserRow>(`/users/${id}`);
  }

  async updateUserStatus(id: string, status: string): Promise<ApiResponse<UserRow>> {
    return adminApiClient.put<UserRow>(`/users/${id}/status`, { status });
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return adminApiClient.delete<void>(`/users/${id}`);
  }

  // Course Management Methods
  async getCourses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    instructor?: string;
  }): Promise<ApiResponse<CoursesResponse>> {
    return adminApiClient.get<CoursesResponse>('/courses', params);
  }

  async createCourse(courseData: CreateCourseRequest): Promise<ApiResponse<CourseRow>> {
    return adminApiClient.post<CourseRow>('/courses', courseData);
  }

  async updateCourse(id: string, courseData: Partial<CreateCourseRequest>): Promise<ApiResponse<CourseRow>> {
    return adminApiClient.put<CourseRow>(`/courses/${id}`, courseData);
  }

  async deleteCourse(id: string): Promise<ApiResponse<void>> {
    return adminApiClient.delete<void>(`/courses/${id}`);
  }

  // Instructor Management Methods
  async getInstructors(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<InstructorsResponse>> {
    return adminApiClient.get<InstructorsResponse>('/instructors', params);
  }

  // Payment Management Methods
  async getPayments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    user?: string;
    course?: string;
  }): Promise<ApiResponse<PaymentsResponse>> {
    return adminApiClient.get<PaymentsResponse>('/payments', params);
  }
}

export const adminService = new AdminService();