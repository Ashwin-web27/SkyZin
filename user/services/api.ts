const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const USER_API_URL = process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:5000/api/users';
const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:5000/api/auth';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_URL) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('user_token');
    }
  }

  private saveToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_token', token);
      this.token = token;
    }
  }

  private removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_token');
      this.token = null;
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Debug logging
    console.log('🚀 API Request:', {
      url,
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body
    });

    try {
      const response = await fetch(url, config);
      
      console.log('📡 API Response:', {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          this.removeToken();
          // For user app, you might want to redirect to login or show login modal
          // window.location.href = '/login';
        }
      }

      const data = await response.json();
      console.log('📦 API Data:', data);
      return data;
    } catch (error) {
      console.error('❌ API request failed:', {
        url,
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params 
      ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null)).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`);
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  setToken(token: string) {
    this.saveToken(token);
  }

  clearToken() {
    this.removeToken();
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

// Create instances for different API endpoints
export const apiClient = new ApiClient(API_URL);
export const userApiClient = new ApiClient(USER_API_URL);
export const authApiClient = new ApiClient(AUTH_API_URL);

export type { ApiResponse };