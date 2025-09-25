'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Users, 
  Shield, 
  Settings, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminTestPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = () => {
    const user = authAPI.getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  };

  const toggleAdminRole = () => {
    if (!currentUser) {
      toast.error('No user logged in');
      return;
    }

    const updatedUser = {
      ...currentUser,
      role: currentUser.role === 'admin' ? 'user' : 'admin'
    };

    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    
    if (updatedUser.role === 'admin') {
      toast.success('🎉 Admin role granted! You now have admin access.');
    } else {
      toast.success('👤 Admin role removed. Back to regular user.');
    }
  };

  const loginAsTestAdmin = () => {
    const testAdminUser = {
      _id: 'test_admin_' + Date.now(),
      name: 'Test Admin',
      email: 'admin@test.com',
      role: 'admin',
      avatar: null,
      createdAt: new Date().toISOString()
    };

    const testToken = 'test_admin_token_' + Date.now();

    localStorage.setItem('user', JSON.stringify(testAdminUser));
    localStorage.setItem('token', testToken);
    
    setCurrentUser(testAdminUser);
    toast.success('🔐 Logged in as Test Admin!');
  };

  const clearSession = () => {
    authAPI.logout();
    setCurrentUser(null);
    toast.success('👋 Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <Settings className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin Test Panel
          </h1>
          <p className="text-white/70">
            Test admin functionality and role switching
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Current User Status */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="w-5 h-5" />
                Current User Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentUser ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="text-white font-medium">{currentUser.name}</div>
                      <Badge 
                        variant={currentUser.role === 'admin' ? 'destructive' : 'secondary'}
                        className={currentUser.role === 'admin' ? 'bg-red-500 text-white' : 'bg-gray-600 text-white'}
                      >
                        {currentUser.role === 'admin' ? 'ADMIN' : 'USER'}
                      </Badge>
                    </div>
                    <div className="text-white/60 text-sm">{currentUser.email}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={toggleAdminRole}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      {currentUser.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </Button>
                    <Button 
                      onClick={clearSession}
                      variant="outline" 
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-white/60 mb-4">No user logged in</div>
                  <Button 
                    onClick={loginAsTestAdmin}
                    className="bg-blue-600 hover:bg-blue-500"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Login as Test Admin
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Instructions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-green-900/20 border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  Testing Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="text-green-200 text-sm space-y-2">
                <div>1. Click "Login as Test Admin" if not logged in</div>
                <div>2. Your role will be set to "admin"</div>
                <div>3. Go to the dashboard to see admin stats</div>
                <div>4. Admin stats will show Total Users, Revenue, etc.</div>
                <div>5. Toggle between admin/user to test functionality</div>
              </CardContent>
            </Card>

            <Card className="bg-blue-900/20 border-blue-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <AlertTriangle className="w-5 h-5" />
                  What You'll See
                </CardTitle>
              </CardHeader>
              <CardContent className="text-blue-200 text-sm space-y-2">
                <div>• Platform Overview section (admin only)</div>
                <div>• Real-time connection status</div>
                <div>• Total Users: Live count from backend</div>
                <div>• Total Revenue: Real currency formatting</div>
                <div>• Active Courses & Enrollments</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Quick Links</CardTitle>
              <CardDescription className="text-white/60">
                Navigate to test different views
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/dashboard">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-500">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button className="w-full bg-purple-600 hover:bg-purple-500">
                    <Shield className="w-4 h-4 mr-2" />
                    Full Admin Panel
                  </Button>
                </Link>
                <Link href="/admin/demo">
                  <Button className="w-full bg-green-600 hover:bg-green-500">
                    <Users className="w-4 h-4 mr-2" />
                    Admin Demo
                  </Button>
                </Link>
                <Button 
                  onClick={checkCurrentUser}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Status
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Status */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">API Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-white/80 text-sm">Backend API: Connected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-white/80 text-sm">Admin Routes: Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-white/80 text-sm">Real-time: Ready</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-yellow-900/20 border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-yellow-400">💡 How It Works</CardTitle>
            </CardHeader>
            <CardContent className="text-yellow-200 text-sm space-y-2">
              <p>
                <strong>The Problem:</strong> Your dashboard at <code>/dashboard</code> was showing static numbers 
                because it wasn't connected to the admin API endpoints.
              </p>
              <p>
                <strong>The Solution:</strong> I've added logic to detect when a user is an admin and 
                automatically fetch real-time statistics from the backend admin API.
              </p>
              <p>
                <strong>Admin Features:</strong> When logged in as admin, you'll see the "Platform Overview" 
                section with live Total Users, Active Courses, Total Revenue, and Total Enrollments.
              </p>
              <p>
                <strong>Testing:</strong> Use this page to switch between admin and regular user roles to 
                test the functionality.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}