"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Play, Star, Users, BookOpen, Lock, CheckCircle, ArrowLeft } from "lucide-react";
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

interface Lesson {
  _id: string;
  title: string;
  videoUrl?: string;
  content?: string;
  duration?: string;
  order?: number;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [enrollment, setEnrollment] = useState<LocalEnrollment | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      // Check local enrollments first
      const localEnrolled = JSON.parse(localStorage.getItem('localEnrolledCourses') || '[]');
      const localEnrollment = localEnrolled.find((enr: LocalEnrollment) => enr.course._id === courseId);

      if (localEnrollment) {
        setEnrollment(localEnrollment);
        
        // Mock lessons data (in real app, this would come from the course data)
        const mockLessons: Lesson[] = [
          {
            _id: '1',
            title: 'Introduction to the Course',
            videoUrl: 'https://example.com/video1.mp4',
            content: 'Welcome to the course! In this lesson, we will cover the basics.',
            duration: '10:30',
            order: 1
          },
          {
            _id: '2',
            title: 'Getting Started',
            videoUrl: 'https://example.com/video2.mp4',
            content: 'Let\'s dive into the fundamentals and get started with practical examples.',
            duration: '15:45',
            order: 2
          },
          {
            _id: '3',
            title: 'Advanced Concepts',
            videoUrl: 'https://example.com/video3.mp4',
            content: 'Now we\'ll explore more advanced topics and real-world applications.',
            duration: '20:15',
            order: 3
          },
          {
            _id: '4',
            title: 'Project Work',
            videoUrl: 'https://example.com/video4.mp4',
            content: 'Time to put your knowledge to practice with hands-on projects.',
            duration: '25:00',
            order: 4
          }
        ];

        setLessons(mockLessons);
        setCurrentLesson(mockLessons[0]);
      } else {
        // Course not found in local enrollments
        toast.error('Course not found or not enrolled');
        router.push('/dashboard/my-courses');
        return;
      }
    } catch (error) {
      console.error('Error loading course data:', error);
      toast.error('Error loading course data');
    } finally {
      setLoading(false);
    }
  };

  const markLessonAsCompleted = (lessonId: string) => {
    if (!enrollment) return;

    const localEnrolled = JSON.parse(localStorage.getItem('localEnrolledCourses') || '[]');
    const updatedEnrollments = localEnrolled.map((enr: LocalEnrollment) => {
      if (enr.enrollmentId === enrollment.enrollmentId) {
        const newCompletedLessons = enr.lessonsCompleted.includes(lessonId) 
          ? enr.lessonsCompleted 
          : [...enr.lessonsCompleted, lessonId];
        
        const progress = Math.round((newCompletedLessons.length / lessons.length) * 100);
        
        return {
          ...enr,
          lessonsCompleted: newCompletedLessons,
          progress,
          lastAccessedAt: new Date().toISOString()
        };
      }
      return enr;
    });

    localStorage.setItem('localEnrolledCourses', JSON.stringify(updatedEnrollments));
    
    // Update local state
    setEnrollment(prev => prev ? {
      ...prev,
      lessonsCompleted: updatedEnrollments.find((enr: LocalEnrollment) => enr.enrollmentId === enrollment.enrollmentId)?.lessonsCompleted || [],
      progress: updatedEnrollments.find((enr: LocalEnrollment) => enr.enrollmentId === enrollment.enrollmentId)?.progress || 0
    } : null);

    toast.success('Lesson marked as completed!');
  };

  const isLessonCompleted = (lessonId: string): boolean => {
    return enrollment?.lessonsCompleted.includes(lessonId) || false;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/4"></div>
          <div className="h-64 bg-white/10 rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-white/10 rounded"></div>
            <div className="h-96 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Course Not Found</h3>
          <p className="text-muted-foreground mb-6">
            This course is not in your enrolled courses.
          </p>
          <Button asChild>
            <a href="/dashboard/my-courses">Back to My Courses</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 text-white/80 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Courses
        </Button>
        
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold">{enrollment.course.title}</h1>
            <p className="text-muted-foreground">by {enrollment.course.instructor}</p>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {enrollment.course.duration}
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {enrollment.course.rating.average.toFixed(1)} ({enrollment.course.rating.count})
            </div>
            <Badge>{enrollment.course.level}</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Course Progress</span>
              <span>{enrollment.progress}%</span>
            </div>
            <Progress value={enrollment.progress} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {enrollment.lessonsCompleted.length} of {lessons.length} lessons completed
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player / Content Area */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{currentLesson?.title}</span>
                {currentLesson && (
                  <Button
                    size="sm"
                    variant={isLessonCompleted(currentLesson._id) ? "default" : "outline"}
                    onClick={() => markLessonAsCompleted(currentLesson._id)}
                    className="ml-2"
                  >
                    {isLessonCompleted(currentLesson._id) ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completed
                      </>
                    ) : (
                      'Mark Complete'
                    )}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentLesson?.videoUrl ? (
                <div className="aspect-video bg-black rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-16 w-16 text-white/50 mx-auto mb-4" />
                    <p className="text-white/70">Video Player Placeholder</p>
                    <p className="text-white/50 text-sm">In a real app, this would be a video player</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-lg mb-4 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-white/50" />
                </div>
              )}
              
              {currentLesson?.content && (
                <div className="prose prose-invert max-w-none">
                  <p>{currentLesson.content}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lesson List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Course Lessons</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson._id}
                    className={`p-4 border-b border-white/10 last:border-b-0 cursor-pointer hover:bg-white/5 transition-colors ${
                      currentLesson?._id === lesson._id ? 'bg-white/10' : ''
                    }`}
                    onClick={() => setCurrentLesson(lesson)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {isLessonCompleted(lesson._id) ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-white/30" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">
                          {index + 1}. {lesson.title}
                        </h4>
                        {lesson.duration && (
                          <p className="text-xs text-muted-foreground">
                            {lesson.duration}
                          </p>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        {currentLesson?._id === lesson._id ? (
                          <Play className="h-4 w-4 text-indigo-400" />
                        ) : (
                          <Play className="h-4 w-4 text-white/50" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}