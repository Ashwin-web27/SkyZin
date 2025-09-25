'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      toast.error('Invalid reset link. Please request a new password reset.');
      router.push('/auth/forgot-password');
      return;
    }

    setToken(tokenFromUrl);
    verifyToken(tokenFromUrl);
  }, [searchParams, router]);

  const verifyToken = async (resetToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: resetToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsTokenValid(true);
      } else {
        setIsTokenValid(false);
        toast.error(data.message || 'Invalid or expired reset token');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      setIsTokenValid(false);
      toast.error('Network error. Please try again.');
    }
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    };
  };

  const passwordValidation = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast.error('Please enter a new password');
      return;
    }

    if (!passwordValidation.isValid) {
      toast.error('Password does not meet the required criteria');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          password: password.trim() 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSubmitted(true);
        toast.success('Password reset successfully!');
      } else {
        toast.error(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isTokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-300">Verifying reset token...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isTokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Invalid Reset Link</CardTitle>
            <CardDescription className="text-gray-300">
              This password reset link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-400 text-center">
              Please request a new password reset link to continue.
            </p>
            <Link href="/auth/forgot-password">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Request New Reset Link
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Password Reset Complete</CardTitle>
            <CardDescription className="text-gray-300">
              Your password has been successfully reset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-300 mb-4">
                You can now log in with your new password.
              </p>
            </div>
            <Link href="/auth/login">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Reset Password</CardTitle>
          <CardDescription className="text-gray-300">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {password && (
              <div className="space-y-2">
                <p className="text-sm text-gray-300">Password requirements:</p>
                <div className="space-y-1">
                  <div className={`flex items-center text-xs ${passwordValidation.minLength ? 'text-green-400' : 'text-gray-400'}`}>
                    {passwordValidation.minLength ? <CheckCircle size={12} className="mr-2" /> : <XCircle size={12} className="mr-2" />}
                    At least 8 characters
                  </div>
                  <div className={`flex items-center text-xs ${passwordValidation.hasUpperCase ? 'text-green-400' : 'text-gray-400'}`}>
                    {passwordValidation.hasUpperCase ? <CheckCircle size={12} className="mr-2" /> : <XCircle size={12} className="mr-2" />}
                    Uppercase letter
                  </div>
                  <div className={`flex items-center text-xs ${passwordValidation.hasLowerCase ? 'text-green-400' : 'text-gray-400'}`}>
                    {passwordValidation.hasLowerCase ? <CheckCircle size={12} className="mr-2" /> : <XCircle size={12} className="mr-2" />}
                    Lowercase letter
                  </div>
                  <div className={`flex items-center text-xs ${passwordValidation.hasNumbers ? 'text-green-400' : 'text-gray-400'}`}>
                    {passwordValidation.hasNumbers ? <CheckCircle size={12} className="mr-2" /> : <XCircle size={12} className="mr-2" />}
                    Number
                  </div>
                  <div className={`flex items-center text-xs ${passwordValidation.hasSpecialChar ? 'text-green-400' : 'text-gray-400'}`}>
                    {passwordValidation.hasSpecialChar ? <CheckCircle size={12} className="mr-2" /> : <XCircle size={12} className="mr-2" />}
                    Special character
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-200">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 pr-10 ${
                    confirmPassword && password !== confirmPassword ? 'border-red-500' : ''
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-400 text-xs">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || !passwordValidation.isValid || password !== confirmPassword}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>

            <div className="text-center">
              <Link 
                href="/auth/login" 
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
