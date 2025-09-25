import { authApiClient, ApiResponse } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  enrolledCourses?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
  user: User;
}

export class AuthService {
  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await authApiClient.post<AuthResponse>('/register', userData);
    
    if (response.success && response.data?.accessToken) {
      authApiClient.setToken(response.data.accessToken);
      this.saveUserData(response.data.user);
      this.saveRefreshToken(response.data.refreshToken);
    }
    
    return response;
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await authApiClient.post<AuthResponse>('/login', credentials);
    
    if (response.success && response.data?.accessToken) {
      authApiClient.setToken(response.data.accessToken);
      this.saveUserData(response.data.user);
      this.saveRefreshToken(response.data.refreshToken);
    }
    
    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await authApiClient.post<void>('/logout');
    
    // Clear tokens and user data regardless of API response
    this.clearAuthData();
    
    return response;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return authApiClient.get<User>('/profile');
  }

  async refreshToken(): Promise<ApiResponse<{ accessToken: string }>> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await authApiClient.post<{ accessToken: string }>('/refresh', {
      refreshToken
    });

    if (response.success && response.data?.accessToken) {
      authApiClient.setToken(response.data.accessToken);
    }

    return response;
  }

  private saveUserData(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_data', JSON.stringify(user));
    }
  }

  private saveRefreshToken(refreshToken: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_refresh_token', refreshToken);
    }
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_refresh_token');
    }
    return null;
  }

  getUserData(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  isAuthenticated(): boolean {
    return authApiClient.isAuthenticated() && !!this.getUserData();
  }

  clearAuthData() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_refresh_token');
    }
    authApiClient.clearToken();
  }
}

export const authService = new AuthService();