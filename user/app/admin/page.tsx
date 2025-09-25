'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';
import SessionManagement from '@/components/admin/SessionManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Shield,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();

  useEffect(() => {
    checkAuthAndRole();
  }, []);

  const checkAuthAndRole = () => {
    // Check if user is authenticated
    if (!authAPI.isAuthenticated()) {
      toast.error('Please log in to access the admin panel');
      router.push('/login');
      return;
    }

    // Get user from localStorage
    const user = authAPI.getCurrentUser();
    if (!user) {
      toast.error('User data not found. Please log in again.');
      router.push('/login');
      return;
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      router.push('/dashboard');
      return;
    }

    setUserRole(user.role);
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Admin Control Panel
              </h1>
              <p className="text-white/70">
                Monitor and manage your platform with real-time insights
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-8 bg-slate-800/50 border-slate-700">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="sessions"
              className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <AdminDashboard />
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="mt-0">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <SessionManagement />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>
                    Configure platform settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="w-12 h-12 mx-auto mb-4" />
                    <p>Settings panel coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}