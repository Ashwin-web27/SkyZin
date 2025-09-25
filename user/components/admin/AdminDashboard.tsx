'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  GraduationCap,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api';

// Types
interface DashboardStats {
  stats: {
    totalUsers: number;
    totalCourses: number;
    totalInstructors: number;
    totalPayments: number;
    monthlyRevenue: number;
    growth: {
      usersGrowth: string;
      coursesGrowth: string;
      revenueGrowth: string;
    };
  };
  realTimeStats: {
    activeConnections: number;
    activeUsers: number;
    connectionsByRole: {
      admin: number;
      instructor: number;
      user: number;
    };
  };
  analytics: any;
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
  recentCourses: Array<{
    _id: string;
    title: string;
    instructorName: string;
    createdAt: string;
    price: number;
  }>;
  recentNotifications: Array<{
    title: string;
    message: string;
    createdAt: string;
    type: string;
  }>;
}

interface StatCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color: string;
}

const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await adminAPI.getDashboardStats();
      setDashboardData(data);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard data refreshed');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading dashboard...
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <div>
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load dashboard</h3>
          <Button onClick={loadDashboardData}>Try Again</Button>
        </div>
      </div>
    );
  }

  const statCards: StatCard[] = [
    {
      title: 'Total Users',
      value: formatNumber(dashboardData.stats.totalUsers),
      subtitle: `${dashboardData.stats.totalUsers} active`,
      icon: <Users className="h-5 w-5" />,
      trend: {
        value: dashboardData.stats.growth.usersGrowth,
        isPositive: parseFloat(dashboardData.stats.growth.usersGrowth) > 0
      },
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Active Courses',
      value: dashboardData.stats.totalCourses,
      subtitle: 'published courses',
      icon: <BookOpen className="h-5 w-5" />,
      trend: {
        value: dashboardData.stats.growth.coursesGrowth,
        isPositive: parseFloat(dashboardData.stats.growth.coursesGrowth) > 0
      },
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(dashboardData.stats.monthlyRevenue),
      subtitle: 'all time',
      icon: <DollarSign className="h-5 w-5" />,
      trend: {
        value: dashboardData.stats.growth.revenueGrowth,
        isPositive: parseFloat(dashboardData.stats.growth.revenueGrowth) > 0
      },
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Total Enrollments',
      value: formatNumber(dashboardData.stats.totalPayments),
      subtitle: 'across all courses',
      icon: <GraduationCap className="h-5 w-5" />,
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time platform statistics and insights
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Real-time connection status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">
                {dashboardData.realTimeStats.activeConnections} Active Connections
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">
                {dashboardData.realTimeStats.activeUsers} Online Users
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">
                {dashboardData.realTimeStats.connectionsByRole.admin} Admins Online
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm">
                {dashboardData.realTimeStats.connectionsByRole.instructor} Instructors Online
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-r ${card.color} text-white`}>
                {card.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                {card.trend && (
                  <div className={`flex items-center gap-1 text-xs ${
                    card.trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.trend.isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {card.trend.value}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Recent Users</TabsTrigger>
          <TabsTrigger value="courses">Recent Courses</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Growth Overview</CardTitle>
                <CardDescription>Month-over-month growth metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User Growth</span>
                    <span className={`text-sm font-medium ${
                      parseFloat(dashboardData.stats.growth.usersGrowth) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {dashboardData.stats.growth.usersGrowth}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.abs(parseFloat(dashboardData.stats.growth.usersGrowth))} 
                    className="h-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Course Growth</span>
                    <span className={`text-sm font-medium ${
                      parseFloat(dashboardData.stats.growth.coursesGrowth) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {dashboardData.stats.growth.coursesGrowth}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.abs(parseFloat(dashboardData.stats.growth.coursesGrowth))} 
                    className="h-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Revenue Growth</span>
                    <span className={`text-sm font-medium ${
                      parseFloat(dashboardData.stats.growth.revenueGrowth) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {dashboardData.stats.growth.revenueGrowth}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.abs(parseFloat(dashboardData.stats.growth.revenueGrowth))} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Active users by role</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    Students
                  </span>
                  <span className="font-medium">{dashboardData.stats.totalUsers - dashboardData.stats.totalInstructors}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Instructors
                  </span>
                  <span className="font-medium">{dashboardData.stats.totalInstructors}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    Online Now
                  </span>
                  <span className="font-medium">{dashboardData.realTimeStats.activeUsers}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recent Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recently Registered Users</CardTitle>
              <CardDescription>Latest user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <Badge variant="outline">New</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recently Added Courses</CardTitle>
              <CardDescription>Latest course publications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentCourses.map((course) => (
                  <div key={course._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{course.title}</div>
                      <div className="text-sm text-muted-foreground">by {course.instructorName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        {formatCurrency(course.price)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(course.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent System Notifications</CardTitle>
              <CardDescription>Latest system announcements and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentNotifications.map((notification, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="p-1 rounded-full bg-blue-100">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-muted-foreground">{notification.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant={notification.type === 'system_announcement' ? 'default' : 'secondary'}>
                      {notification.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;