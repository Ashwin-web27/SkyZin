import { userApiClient, ApiResponse } from './api';

// Course Types
export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  price: number;
  originalPrice?: number;
  thumbnail?: string;
  category: string;
  level: string;
  duration: number;
  rating: {
    average: number;
    count: number;
  };
  enrolledCount: number;
  lessonsCount: number;
  tags: string[];
  createdAt: string;
  isEnrolled?: boolean;
}

export interface CourseDetail extends Course {
  lessons: any[];
  reviews: any[];
  instructor: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface CoursesResponse {
  courses: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Enrollment Types
export interface Enrollment {
  id: string;
  course: {
    id: string;
    title: string;
    thumbnail?: string;
    price: number;
    instructor: string;
  };
  enrollmentDate: string;
  progress: number;
  status: string;
  completionDate?: string;
  certificate?: {
    issued: boolean;
    issuedAt?: string;
    certificateUrl?: string;
    certificateId?: string;
  };
}

export interface EnrollmentsResponse {
  enrollments: Enrollment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Profile Types
export interface ProfileUpdateRequest {
  name?: string;
  email?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Payment Types
export interface PaymentIntentRequest {
  courseId: string;
  amount: number;
  paymentMethod: 'card' | 'paypal' | 'bank_transfer' | 'wallet';
  paymentGateway: 'stripe' | 'paypal' | 'razorpay' | 'square';
}

export interface PaymentIntentResponse {
  paymentId: string;
  transactionId: string;
  status: string;
  amount: number;
}

export class UserService {
  // Profile Management
  async getProfile(): Promise<ApiResponse<any>> {
    return userApiClient.get('/profile');
  }

  async updateProfile(profileData: ProfileUpdateRequest): Promise<ApiResponse<any>> {
    return userApiClient.put('/profile', profileData);
  }

  async changePassword(passwordData: PasswordChangeRequest): Promise<ApiResponse<void>> {
    return userApiClient.put('/password', passwordData);
  }

  // Course Browsing
  async getCourses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    level?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    minPrice?: number;
    maxPrice?: number;
  }): Promise<ApiResponse<CoursesResponse>> {
    return userApiClient.get<CoursesResponse>('/courses', params);
  }

  async getCourseById(id: string): Promise<ApiResponse<CourseDetail>> {
    return userApiClient.get<CourseDetail>(`/courses/${id}`);
  }

  // Enrollment Management
  async enrollInCourse(courseId: string): Promise<ApiResponse<Enrollment>> {
    return userApiClient.post<Enrollment>('/enroll', { courseId });
  }

  async getMyEnrollments(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<EnrollmentsResponse>> {
    return userApiClient.get<EnrollmentsResponse>('/enrollments', params);
  }

  async updateCourseProgress(courseId: string, lessonId: string, timeSpent: number = 0): Promise<ApiResponse<{
    progress: number;
    status: string;
  }>> {
    return userApiClient.post(`/courses/${courseId}/progress`, {
      lessonId,
      timeSpent
    });
  }

  // Payment Management
  async createPaymentIntent(paymentData: PaymentIntentRequest): Promise<ApiResponse<PaymentIntentResponse>> {
    return userApiClient.post<PaymentIntentResponse>('/payments/intent', paymentData);
  }

  // Cart Integration (using existing cart utilities)
  async addToCart(course: {
    id: string;
    title: string;
    price: number;
  }) {
    // This integrates with existing cart utility
    const { addToCart } = await import('../lib/cart');
    addToCart(course);
  }

  async removeFromCart(courseId: string) {
    const { removeFromCart } = await import('../lib/cart');
    removeFromCart(courseId);
  }

  async clearCart() {
    const { clearCart } = await import('../lib/cart');
    clearCart();
  }

  async getCartItems() {
    const { readCart } = await import('../lib/cart');
    return readCart();
  }

  // Enrollment Integration (using existing enrollment utilities)
  async addEnrollments(courses: Array<{ id: string; title: string; price?: number }>) {
    const { addEnrollments } = await import('../lib/enrollment');
    addEnrollments(courses);
  }

  async updateEnrollmentProgress(courseId: string, progress: number) {
    const { updateEnrollmentProgress } = await import('../lib/enrollment');
    updateEnrollmentProgress(courseId, progress);
  }

  async getLocalEnrollments() {
    const { readEnrollments } = await import('../lib/enrollment');
    return readEnrollments();
  }
}

export const userService = new UserService();