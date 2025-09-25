'use client';

import { toast } from 'sonner';

// Types
interface DeviceInfo {
  fingerprint?: string;
  userAgent: string;
  platform: string;
  browser: string;
  screenResolution: string;
  timezone: string;
  language: string;
  colorDepth: string;
  hardwareConcurrency: string;
  maxTouchPoints: string;
  webgl?: string;
  canvas?: string;
}

interface SessionInfo {
  deviceDescription?: string;
  loginTime?: string;
  sessionToken?: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: any;
    sessionInfo?: SessionInfo;
  };
  error?: string;
  details?: any;
}

class SessionManager {
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private readonly SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  private onSessionExpired?: () => void;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeSessionMonitoring();
    }
  }

  /**
   * Generate device fingerprint for unique device identification
   */
  generateDeviceFingerprint(): DeviceInfo {
    const deviceInfo: DeviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      browser: this.getBrowserInfo(),
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      colorDepth: screen.colorDepth.toString(),
      hardwareConcurrency: navigator.hardwareConcurrency?.toString() || '0',
      maxTouchPoints: ('maxTouchPoints' in navigator) ? navigator.maxTouchPoints.toString() : '0'
    };

    // Add WebGL fingerprint
    deviceInfo.webgl = this.getWebGLInfo();
    
    // Add Canvas fingerprint
    deviceInfo.canvas = this.getCanvasFingerprint();

    return deviceInfo;
  }

  /**
   * Get browser information
   */
  private getBrowserInfo(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('chrome') && !ua.includes('edg')) return 'chrome';
    if (ua.includes('firefox')) return 'firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
    if (ua.includes('edg')) return 'edge';
    if (ua.includes('opera')) return 'opera';
    return 'unknown';
  }

  /**
   * Get WebGL renderer info for fingerprinting
   */
  private getWebGLInfo(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'no-webgl';
      
      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);
      return `${vendor}-${renderer}`;
    } catch (error) {
      return 'webgl-error';
    }
  }

  /**
   * Generate canvas fingerprint
   */
  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';
      
      canvas.width = 200;
      canvas.height = 50;
      
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.font = '11pt Arial';
      ctx.fillText('Device fingerprint test 🔒', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.font = '18pt Arial';
      ctx.fillText('Security check', 4, 45);
      
      return canvas.toDataURL().slice(-50); // Last 50 chars
    } catch (error) {
      return 'canvas-error';
    }
  }

  /**
   * Enhanced login with device tracking
   */
  async login(email: string, password: string, forceLogout: boolean = false): Promise<LoginResponse> {
    try {
      const deviceInfo = this.generateDeviceFingerprint();
      
      const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          forceLogout,
          deviceInfo,
          location: await this.getLocationInfo()
        }),
      });

      const data: LoginResponse = await response.json();

      if (response.status === 409 && data.error === 'ACTIVE_SESSION_EXISTS') {
        // Handle active session on another device
        return {
          ...data,
          needsForceLogin: true
        } as LoginResponse & { needsForceLogin: boolean };
      }

      if (data.success && data.data) {
        // Store tokens and session info
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        localStorage.setItem('sessionInfo', JSON.stringify(data.data.sessionInfo));
        localStorage.setItem('deviceFingerprint', JSON.stringify(deviceInfo));
        
        // Start session monitoring
        this.startSessionMonitoring();
        
        toast.success(data.message);
      } else if (!data.success) {
        toast.error(data.message);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  /**
   * Get approximate location info (you can integrate with a geolocation API)
   */
  private async getLocationInfo(): Promise<{ country?: string; city?: string }> {
    try {
      // This is a placeholder - you would integrate with a geolocation service
      // For now, we'll try to get timezone-based location
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const parts = timezone.split('/');
      return {
        country: 'Unknown',
        city: parts[1] || 'Unknown'
      };
    } catch (error) {
      return { country: 'Unknown', city: 'Unknown' };
    }
  }

  /**
   * Start session monitoring
   */
  private startSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = setInterval(() => {
      this.validateSession();
    }, this.SESSION_CHECK_INTERVAL);

    console.log('Session monitoring started');
  }

  /**
   * Stop session monitoring
   */
  private stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * Validate current session with server
   */
  private async validateSession(): Promise<boolean> {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        this.handleSessionExpired('No access token found');
        return false;
      }

      const deviceInfo = this.generateDeviceFingerprint();
      
      const response = await fetch(`${this.API_BASE_URL}/auth/validate-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceInfo }),
      });

      if (response.status === 401) {
        const data = await response.json();
        this.handleSessionExpired(data.message || 'Session expired');
        return false;
      }

      if (response.ok) {
        // Session is valid, continue monitoring
        return true;
      }

      return false;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Handle session expiration
   */
  private handleSessionExpired(reason: string): void {
    console.log('Session expired:', reason);
    
    // Clear stored data
    this.clearSession();
    
    // Stop monitoring
    this.stopSessionMonitoring();
    
    // Show notification
    toast.error('Your session has expired. Please log in again.', {
      duration: 5000,
    });
    
    // Callback for handling session expiry (redirect to login, etc.)
    if (this.onSessionExpired) {
      this.onSessionExpired();
    } else {
      // Default behavior - redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  /**
   * Set callback for session expiration
   */
  setOnSessionExpired(callback: () => void): void {
    this.onSessionExpired = callback;
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        await fetch(`${this.API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearSession();
      this.stopSessionMonitoring();
      toast.success('Logged out successfully');
    }
  }

  /**
   * Clear session data
   */
  private clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sessionInfo');
    localStorage.removeItem('deviceFingerprint');
  }

  /**
   * Get current session info
   */
  getSessionInfo(): SessionInfo | null {
    try {
      const sessionInfo = localStorage.getItem('sessionInfo');
      return sessionInfo ? JSON.parse(sessionInfo) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user is currently logged in
   */
  isLoggedIn(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Initialize session monitoring on page load
   */
  private initializeSessionMonitoring(): void {
    // Check if user is logged in and start monitoring
    if (this.isLoggedIn()) {
      this.startSessionMonitoring();
      
      // Validate session immediately
      this.validateSession();
    }

    // Listen for storage changes (logout from another tab)
    window.addEventListener('storage', (event) => {
      if (event.key === 'accessToken' && !event.newValue) {
        // Access token was removed, handle logout
        this.stopSessionMonitoring();
        if (this.onSessionExpired) {
          this.onSessionExpired();
        }
      }
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isLoggedIn()) {
        // Page became visible, validate session
        this.validateSession();
      }
    });
  }

  /**
   * Force logout on another device
   */
  async forceLogin(email: string, password: string): Promise<LoginResponse> {
    return this.login(email, password, true);
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Export types and utility functions
export type { DeviceInfo, SessionInfo, LoginResponse };

// Hook for React components
export function useSession() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(sessionManager.isLoggedIn());
  const [sessionInfo, setSessionInfo] = React.useState(sessionManager.getSessionInfo());

  React.useEffect(() => {
    const checkSession = () => {
      setIsLoggedIn(sessionManager.isLoggedIn());
      setSessionInfo(sessionManager.getSessionInfo());
    };

    // Check initially
    checkSession();

    // Set up session expiry callback
    sessionManager.setOnSessionExpired(() => {
      setIsLoggedIn(false);
      setSessionInfo(null);
    });

    // Listen for storage changes
    const handleStorageChange = () => checkSession();
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    isLoggedIn,
    sessionInfo,
    login: sessionManager.login.bind(sessionManager),
    logout: sessionManager.logout.bind(sessionManager),
    forceLogin: sessionManager.forceLogin.bind(sessionManager)
  };
}

// Need to import React for the hook
import React from 'react';