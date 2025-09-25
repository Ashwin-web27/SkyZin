'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Users, 
  Clock, 
  Shield, 
  AlertTriangle,
  RefreshCw,
  LogOut,
  Calendar,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface ActiveSession {
  userId: string;
  name: string;
  email: string;
  role: string;
  device: string;
  loginTime: string;
  lastActivity: string;
  ipAddress: string;
  location: {
    country?: string;
    city?: string;
  };
}

interface SessionStats {
  totalActiveSessions: number;
  sessions: ActiveSession[];
}

interface CourseExpiryStats {
  totalEnrollments: number;
  expiredCourses: number;
  activeCourses: number;
  expiringIn7Days: number;
  expiryRate: string;
}

interface ExpiringCourse {
  userId: string;
  userEmail: string;
  userName: string;
  courseId: string;
  courseName: string;
  expiresAt: string;
  daysUntilExpiry: number;
  progress: number;
}

interface ExpiryReport {
  statistics: CourseExpiryStats;
  expiringCourses: {
    in7Days: ExpiringCourse[];
    in1Day: ExpiringCourse[];
  };
  generatedAt: string;
}

const SessionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('sessions');
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [expiryReport, setExpiryReport] = useState<ExpiryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSessionStats(),
        loadExpiryReport()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/admin/active-sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessionStats(data.data);
      }
    } catch (error) {
      console.error('Error loading session stats:', error);
    }
  };

  const loadExpiryReport = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/admin/course-expiry-report`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExpiryReport(data.data);
      }
    } catch (error) {
      console.error('Error loading expiry report:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  const forceLogoutUser = async (userId: string, userEmail: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/admin/force-logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast.success(`User ${userEmail} has been logged out`);
        await loadSessionStats(); // Refresh session data
      } else {
        toast.error('Failed to logout user');
      }
    } catch (error) {
      console.error('Error forcing logout:', error);
      toast.error('Error occurred while logging out user');
    }
  };

  const extendCourseExpiry = async (userId: string, courseId: string, courseName: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/admin/extend-course-expiry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          courseId, 
          monthsToAdd: 6 // Default 6 months extension
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Extended ${courseName} by 6 months`);
        await loadExpiryReport(); // Refresh expiry data
      } else {
        toast.error('Failed to extend course expiry');
      }
    } catch (error) {
      console.error('Error extending course expiry:', error);
      toast.error('Error occurred while extending course');
    }
  };

  const getDeviceIcon = (deviceDescription: string) => {
    const device = deviceDescription.toLowerCase();
    if (device.includes('mobile') || device.includes('android') || device.includes('iphone')) {
      return <Smartphone className="w-4 h-4" />;
    }
    if (device.includes('tablet') || device.includes('ipad')) {
      return <Tablet className="w-4 h-4" />;
    }
    return <Monitor className="w-4 h-4" />;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getActivityStatus = (lastActivity: string) => {
    const diffMs = new Date().getTime() - new Date(lastActivity).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 5) return { status: 'active', color: 'bg-green-500' };
    if (diffMins < 30) return { status: 'idle', color: 'bg-yellow-500' };
    return { status: 'away', color: 'bg-red-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading session data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Session Management</h2>
          <p className="text-muted-foreground">
            Monitor user sessions and course expiry
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionStats?.totalActiveSessions || 0}</div>
            <p className="text-xs text-muted-foreground">Users currently online</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiryReport?.statistics.activeCourses || 0}</div>
            <p className="text-xs text-muted-foreground">Non-expired enrollments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiryReport?.statistics.expiringIn7Days || 0}</div>
            <p className="text-xs text-muted-foreground">Courses expiring in 7 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiry Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiryReport?.statistics.expiryRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Overall course expiry rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Courses</TabsTrigger>
          <TabsTrigger value="expired">Expired Courses</TabsTrigger>
        </TabsList>

        {/* Active Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active User Sessions</CardTitle>
              <CardDescription>
                Users currently logged in and their session details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!sessionStats?.sessions.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active sessions found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Login Time</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionStats.sessions.map((session) => {
                      const activityStatus = getActivityStatus(session.lastActivity);
                      return (
                        <TableRow key={session.userId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{session.name}</div>
                              <div className="text-sm text-muted-foreground">{session.email}</div>
                              <Badge variant={session.role === 'admin' ? 'destructive' : 'secondary'}>
                                {session.role}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(session.device)}
                              <span className="text-sm">{session.device}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {session.location.city}, {session.location.country}
                              <div className="text-xs text-muted-foreground">{session.ipAddress}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(session.loginTime).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatTimeAgo(session.lastActivity)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${activityStatus.color}`} />
                              <span className="text-sm capitalize">{activityStatus.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => forceLogoutUser(session.userId, session.email)}
                            >
                              <LogOut className="w-3 h-3 mr-1" />
                              Force Logout
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expiring Courses Tab */}
        <TabsContent value="expiring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Expiring in 1 Day */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Expiring Tomorrow ({expiryReport?.expiringCourses.in1Day.length || 0})
                </CardTitle>
                <CardDescription>Courses expiring within 24 hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {expiryReport?.expiringCourses.in1Day.map((course) => (
                  <div key={`${course.userId}-${course.courseId}`} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{course.userName}</div>
                        <div className="text-sm text-muted-foreground">{course.userEmail}</div>
                      </div>
                      <Badge variant="destructive">
                        {course.daysUntilExpiry} day{course.daysUntilExpiry !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="text-sm font-medium">{course.courseName}</div>
                    <div className="text-xs text-muted-foreground mb-2">
                      Progress: {course.progress}%
                    </div>
                    <Button
                      size="sm"
                      onClick={() => extendCourseExpiry(course.userId, course.courseId, course.courseName)}
                    >
                      Extend 6 Months
                    </Button>
                  </div>
                ))}
                {!expiryReport?.expiringCourses.in1Day.length && (
                  <div className="text-center py-4 text-muted-foreground">
                    No courses expiring tomorrow
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expiring in 7 Days */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  Expiring This Week ({expiryReport?.expiringCourses.in7Days.length || 0})
                </CardTitle>
                <CardDescription>Courses expiring within 7 days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {expiryReport?.expiringCourses.in7Days.map((course) => (
                  <div key={`${course.userId}-${course.courseId}`} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{course.userName}</div>
                        <div className="text-sm text-muted-foreground">{course.userEmail}</div>
                      </div>
                      <Badge variant="outline">
                        {course.daysUntilExpiry} day{course.daysUntilExpiry !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="text-sm font-medium">{course.courseName}</div>
                    <div className="text-xs text-muted-foreground mb-2">
                      Progress: {course.progress}%
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => extendCourseExpiry(course.userId, course.courseId, course.courseName)}
                    >
                      Extend 6 Months
                    </Button>
                  </div>
                ))}
                {!expiryReport?.expiringCourses.in7Days.length && (
                  <div className="text-center py-4 text-muted-foreground">
                    No courses expiring this week
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expired Courses Tab */}
        <TabsContent value="expired">
          <Card>
            <CardHeader>
              <CardTitle>Course Expiry Statistics</CardTitle>
              <CardDescription>Overview of course expiry metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{expiryReport?.statistics.totalEnrollments || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Enrollments</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-500">{expiryReport?.statistics.expiredCourses || 0}</div>
                  <div className="text-sm text-muted-foreground">Expired Courses</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-500">{expiryReport?.statistics.activeCourses || 0}</div>
                  <div className="text-sm text-muted-foreground">Active Courses</div>
                </div>
              </div>
              <div className="mt-6">
                <div className="text-sm text-muted-foreground">
                  Report generated: {expiryReport?.generatedAt ? new Date(expiryReport.generatedAt).toLocaleString() : 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SessionManagement;