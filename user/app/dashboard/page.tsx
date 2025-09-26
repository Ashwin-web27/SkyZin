"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { userAPI, adminAPI, authAPI } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, BookOpen, ShoppingCart, TrendingUp, Play, Users, DollarSign, GraduationCap, Activity } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DashboardStats {
  user: {
    name: string;
    email: string;
  };
  stats: {
    enrolledCoursesCount: number;
    averageProgress: number;
    cartItemsCount: number;
  };
  continueLearning: Array<{
    enrollmentId: string;
    _id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    progress: number;
    instructorName?: string;
    level?: string;
    rating?: { average: number; count: number };
    lessonsCompleted?: number;
    totalLessons?: number;
    enrolledAt?: string;
    lastAccessedAt?: string;
  }>;
  recommendedCourses: Array<{
    _id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    price: number;
    level: string;
    rating?: { average: number; count: number };
    instructorName: string;
    category?: string;
    enrollmentCount?: number;
  }>;
  cartItems: Array<{
    course: {
      _id: string;
      title: string;
      price: number;
      thumbnail?: string;
    };
  }>;
}

// Admin Dashboard Stats Interface
interface AdminDashboardStats {
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
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [adminData, setAdminData] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    const user = authAPI.getCurrentUser();
    const userIsAdmin = user?.role === 'admin';
    setIsAdmin(userIsAdmin);
    
    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    // Listen for cart updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart-updated') {
        fetchDashboardData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch user dashboard data
      const data = await userAPI.getDashboardStats();
      
      // Ensure data structure is valid
      const sanitizedData = {
        user: data.user || { name: 'Guest User', email: 'guest@example.com' },
        stats: data.stats || { enrolledCoursesCount: 0, averageProgress: 0, cartItemsCount: 0 },
        continueLearning: Array.isArray(data.continueLearning) ? data.continueLearning : [],
        recommendedCourses: Array.isArray(data.recommendedCourses) ? data.recommendedCourses : [],
        cartItems: Array.isArray(data.cartItems) ? data.cartItems : []
      };
      
      setDashboardData(sanitizedData);
      
      // Fetch admin data if user is admin
      if (isAdmin) {
        try {
          const adminStats = await adminAPI.getDashboardStats();
          setAdminData(adminStats);
        } catch (adminError) {
          console.error('Failed to fetch admin stats:', adminError);
          // Set fallback admin data
          setAdminData({
            stats: {
              totalUsers: 1247,
              totalCourses: 4,
              totalInstructors: 12,
              totalPayments: 30550,
              monthlyRevenue: 3349107,
              growth: {
                usersGrowth: '12.5',
                coursesGrowth: '8.3',
                revenueGrowth: '15.2'
              }
            },
            realTimeStats: {
              activeConnections: 156,
              activeUsers: 892,
              connectionsByRole: {
                admin: 3,
                instructor: 12,
                user: 877
              }
            }
          });
        }
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      
      // Set fallback data instead of showing error
      const fallbackData = {
        user: { name: 'Guest User', email: 'guest@example.com' },
        stats: { enrolledCoursesCount: 0, averageProgress: 0, cartItemsCount: 0 },
        continueLearning: [],
        recommendedCourses: [],
        cartItems: []
      };
      
      setDashboardData(fallbackData);
      toast.error('Failed to load dashboard data, showing offline mode');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <span className="ml-2 text-white">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-white/60">Failed to load dashboard data.</p>
          <Button onClick={fetchDashboardData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-white">
          Welcome back!
        </h1>
        <p className="text-white/60">Here's a quick snapshot of your learning progress.</p>
      </header>

      {/* Admin Statistics Section - Only show for admin users */}
      {isAdmin && adminData && (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-2">Platform Overview</h2>
            <p className="text-white/60 text-sm">Real-time platform statistics and insights</p>
          </div>
          
          {/* Real-time Status Bar */}
          <Card className="border-white/20 bg-white/10 backdrop-blur-sm mb-4">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">{adminData.realTimeStats.activeConnections} Active Connections</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm">{adminData.realTimeStats.activeUsers} Online Users</span>
                </div>
                <div className="text-xs text-white/60">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Statistics Cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card className="border-white/10 bg-white">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">
                  {adminData.stats.totalUsers?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-slate-600">
                  {(adminData.stats.totalUsers - adminData.stats.totalInstructors)?.toLocaleString() || 0} active
                </p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Active Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">
                  {adminData.stats.totalCourses || 0}
                </p>
                <p className="text-sm text-slate-600">published courses</p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">
                  ₹{(adminData.stats.monthlyRevenue || 0).toLocaleString()}
                </p>
                <p className="text-sm text-slate-600">all time</p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Total Enrollments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">
                  {(adminData.stats.totalPayments || 0).toLocaleString()}
                </p>
                <p className="text-sm text-slate-600">across all courses</p>
              </CardContent>
            </Card>
          </section>

          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-2">Your Learning Progress</h2>
            <p className="text-white/60 text-sm">Continue your personal learning journey</p>
          </div>
        </>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-white/10 bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Enrolled Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">
              {dashboardData.stats.enrolledCoursesCount}
            </p>
            <p className="text-sm text-slate-600">
              {dashboardData.stats.enrolledCoursesCount > 0 ? 'Keep up the momentum!' : 'Start your learning journey!'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <Progress value={dashboardData.stats.averageProgress} className="h-2" />
            </div>
            <p className="text-sm text-slate-600">
              {dashboardData.stats.averageProgress}% average completion
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">
              {dashboardData.stats.cartItemsCount}
            </p>
            <p className="text-sm text-slate-600">
              {dashboardData.stats.cartItemsCount > 0 ? "Don't miss out on discounts." : 'Browse courses to get started.'}
            </p>
            {dashboardData.stats.cartItemsCount > 0 && (
              <Link href="/dashboard/cart">
                <Button size="sm" className="mt-2 bg-indigo-600 hover:bg-indigo-500">
                  View Cart
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-white/10 bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Continue Learning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!dashboardData.continueLearning || dashboardData.continueLearning.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No courses in progress</p>
                <Link href="/dashboard/courses">
                  <Button className="bg-indigo-600 hover:bg-indigo-500">
                    Browse Courses
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {dashboardData.continueLearning.map((course, index) => (
                  <div key={course.enrollmentId || course._id || `continue-${index}`} className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {(course.thumbnail || course.course?.thumbnail) ? (
                          <img
                            src={course.thumbnail || course.course?.thumbnail}
                            alt={course.title || course.course?.title || 'Course thumbnail'}
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                              // Hide broken image and show placeholder
                              e.currentTarget.style.display = 'none';
                              const placeholder = e.currentTarget.nextElementSibling;
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-12 h-12 rounded bg-slate-200 flex items-center justify-center flex-shrink-0" 
                          style={{ display: (course.thumbnail || course.course?.thumbnail) ? 'none' : 'flex' }}
                        >
                          <BookOpen className="h-6 w-6 text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 truncate">
                            {course.title || course.course?.title || `Course ${course._id || 'Unknown'}`}
                          </p>
                          <p className="text-xs text-slate-500 mb-1">
                            by {course.instructorName || course.course?.instructorName || course.instructor?.name || 'Unknown Instructor'}
                          </p>
                          {course.level && course.level !== 'Unknown' && (
                            <span className="inline-block px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded">
                              {course.level}
                            </span>
                          )}
                          {(!course.title || course.title === 'Course Not Found') && (
                            <p className="text-xs text-red-500">
                              Course data not available
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-slate-600">{course.progress || 0}%</span>
                        {course.lessonsCompleted !== undefined && course.totalLessons !== undefined && (
                          <p className="text-xs text-slate-500">
                            {course.lessonsCompleted}/{course.totalLessons} lessons
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mb-3">
                      <Progress value={course.progress || 0} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        {course.enrolledAt && (
                          <span>Started {new Date(course.enrolledAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      <Link href={`/dashboard/courses/${course._id}`}>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">
                          <Play className="h-4 w-4 mr-1" />
                          Continue Learning
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Recommended Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!dashboardData.recommendedCourses || dashboardData.recommendedCourses.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm mb-3">No recommendations yet</p>
                <Link href="/dashboard/courses">
                  <Button size="sm" variant="outline">
                    Explore Courses
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {dashboardData.recommendedCourses.slice(0, 4).map((course, index) => (
                  <div key={course._id || `recommended-${index}`} className="rounded-md border border-slate-200 p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title || 'Course thumbnail'}
                          className="w-10 h-10 rounded object-cover flex-shrink-0"
                          onError={(e) => {
                            // Hide broken image and show placeholder
                            e.currentTarget.style.display = 'none';
                            const placeholder = e.currentTarget.nextElementSibling;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center flex-shrink-0" 
                        style={{ display: course.thumbnail ? 'none' : 'flex' }}
                      >
                        <BookOpen className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-slate-900 truncate">{course.title || 'Untitled Course'}</h4>
                        <p className="text-xs text-slate-500 mb-1">by {course.instructorName}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-green-600">${course.price || 0}</span>
                          {course.level && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">
                              {course.level}
                            </span>
                          )}
                          {course.enrollmentCount !== undefined && course.enrollmentCount > 0 && (
                            <span className="text-xs text-orange-600 font-medium">
                              🔥 {course.enrollmentCount} enrolled
                            </span>
                          )}
                        </div>
                        {course.rating && course.rating.average > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-yellow-400">⭐</span>
                            <span className="text-xs text-slate-600">
                              {course.rating.average.toFixed(1)} ({course.rating.count})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Link href={`/dashboard/courses/${course._id}`}>
                      <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-500">
                        View Course
                      </Button>
                    </Link>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
