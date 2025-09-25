"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Play, Star, Users, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { enrollmentAPI, authAPI } from '@/lib/api';
import { toast } from 'sonner';

interface LocalEnrollment {
  enrollmentId: string;
  course: {
    _id: string;
    title: string;
    description: string;
    instructor: string;
    price: number;
    duration: string;
    level: string;
    thumbnail: string;
    rating: {
      average: number;
      count: number;
    };
    lessons: any[];
  };
  progress: number;
  lessonsCompleted: string[];
  enrolledAt: string;
  lastAccessedAt: string;
}

export default function MyCoursesPage() {
  const [localCourses, setLocalCourses] = useState<LocalEnrollment[]>([]);
  const [serverCourses, setServerCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      if (!authAPI.isAuthenticated()) {
        // Load local enrolled courses for non-authenticated users
        const localEnrolled = JSON.parse(localStorage.getItem('localEnrolledCourses') || '[]');
        setLocalCourses(localEnrolled);
      } else {
        // Fetch from server for authenticated users
        const enrollments = await enrollmentAPI.getMyCourses();
        setServerCourses(enrollments);
      }
    } catch (error: any) {
      console.error('Error fetching my courses:', error);
      if (error?.message?.includes('Access token is required') || 
          error?.message?.includes('401') || 
          error?.message?.includes('Unauthorized')) {
        // If authentication error, fall back to local courses
        authAPI.logout();
        const localEnrolled = JSON.parse(localStorage.getItem('localEnrolledCourses') || '[]');
        setLocalCourses(localEnrolled);
      } else {
        toast.error('Failed to load your courses');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinueCourse = (courseId: string) => {
    // Update last accessed time
    const updated = localCourses.map(enrollment => 
      enrollment.course._id === courseId 
        ? { ...enrollment, lastAccessedAt: new Date().toISOString() }
        : enrollment
    );
    setLocalCourses(updated);
    localStorage.setItem('localEnrolledCourses', JSON.stringify(updated));
  };

  const formatDuration = (duration: string) => {
    return duration;
  };

  const formatRating = (rating: { average: number; count: number }) => {
    return `${rating.average.toFixed(1)} (${rating.count} reviews)`;
  };

  // Combine all courses
  const allCourses = [...localCourses, ...serverCourses];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Courses</h1>
            <p className="text-white/60 mt-2">
              Continue your learning journey
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-white/10 bg-white overflow-hidden">
              <div className="aspect-video relative overflow-hidden animate-pulse bg-slate-200" />
              <CardHeader className="pb-4">
                <div className="h-6 bg-slate-200 rounded animate-pulse mb-2" />
                <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-16" />
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-20" />
                  </div>
                  <div className="h-2 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 bg-slate-200 rounded animate-pulse w-24" />
                </div>
              </CardContent>
              <CardFooter>
                <div className="h-10 bg-slate-200 rounded animate-pulse w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">My Courses</h1>
          <p className="text-white/60 mt-2">
            Continue your learning journey
          </p>
        </div>
      </div>

      {allCourses.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="mx-auto h-16 w-16 text-white/40 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-white">No Enrolled Courses</h3>
          <p className="text-white/60 mb-6">
            Start your learning journey by enrolling in courses
          </p>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-500">
            <Link href="/dashboard/courses">Browse Courses</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allCourses.map((enrollment) => {
            // Normalize data structure between local and server courses
            const courseData = enrollment.course || enrollment;
            const enrollmentId = enrollment.enrollmentId || enrollment._id || `${courseData._id}-${Date.now()}`;
            const progress = enrollment.progress || 0;
            const lessonsCompleted = enrollment.lessonsCompleted || [];
            const enrolledAt = enrollment.enrolledAt;
            const instructor = courseData.instructorName || courseData.instructor || 'Unknown Instructor';
            const rating = courseData.rating || { average: 0, count: 0 };
            const duration = courseData.duration || '0h';
            const lessonsCount = courseData.lessons?.length || 0;
            
            return (
            <Card key={enrollmentId} className="border-white/10 bg-white overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={courseData.thumbnail || "/placeholder-course.jpg"}
                  alt={courseData.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary">{courseData.level}</Badge>
                </div>
              </div>
              
              <CardHeader className="pb-4">
                <CardTitle className="text-lg line-clamp-2">
                  {courseData.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  by {instructor}
                </p>
              </CardHeader>

              <CardContent className="pb-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(duration)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {formatRating(rating)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {lessonsCompleted.length} of {lessonsCount} lessons completed
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {enrolledAt && `Enrolled ${formatDistanceToNow(new Date(enrolledAt), { addSuffix: true })}`}
                  </p>
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  asChild 
                  className="w-full"
                  onClick={() => handleContinueCourse(courseData._id)}
                >
                  <Link href={`/dashboard/courses/${courseData._id}`}>
                    <Play className="h-4 w-4 mr-2" />
                    Continue Course
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}