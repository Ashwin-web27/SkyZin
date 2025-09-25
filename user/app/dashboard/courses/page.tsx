"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddToCartButton from "@/components/dashboard/add-to-cart-button";
import { coursesAPI, Course } from "@/lib/api";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Clock, BookOpen, Star, Users, Award, TrendingUp } from "lucide-react";
import { formatPrice, calculateDiscountPercentage } from "@/lib/utils/currency";

// Mock course data with INR pricing as fallback
const mockCourses: Course[] = [
  {
    _id: "rpa-uipath-complete",
    title: "Complete RPA Development with UiPath",
    description: "Master Robotic Process Automation (RPA) with UiPath from beginner to advanced level. Learn to build automation workflows, handle exceptions, and deploy enterprise-grade RPA solutions.",
    shortDescription: "Master RPA with UiPath - from basics to enterprise automation solutions",
    thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=250&fit=crop",
    category: "Automation",
    subcategory: "RPA",
    level: "beginner",
    duration: 2400, // 40 hours
    price: 12499, // ₹12,499 (converted from $149.99)
    originalPrice: 16599, // ₹16,599 (converted from $199.99)
    instructorName: "Sarah Johnson",
    instructorImage: "https://images.unsplash.com/photo-1494790108755-2616b612b1ad?w=150&h=150&fit=crop&crop=face",
    rating: 4.7,
    totalRatings: 1245,
    totalStudents: 8760,
    tags: ["RPA", "UiPath", "Automation", "Process Automation", "Enterprise", "No-Code"],
    isActive: true,
    featured: true,
    trending: true
  },
  {
    _id: "aws-solutions-architect",
    title: "AWS Certified Solutions Architect - Complete Guide",
    description: "Master Amazon Web Services (AWS) and become a certified Solutions Architect. Learn to design, deploy, and manage scalable, secure, and cost-effective cloud solutions on AWS.",
    shortDescription: "Master AWS cloud architecture and pass the Solutions Architect certification exam",
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop",
    category: "Cloud Computing",
    subcategory: "AWS",
    level: "intermediate",
    duration: 3000, // 50 hours
    price: 16599, // ₹16,599 (converted from $199.99)
    originalPrice: 24899, // ₹24,899 (converted from $299.99)
    instructorName: "Michael Chen",
    instructorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    rating: 4.8,
    totalRatings: 2156,
    totalStudents: 12450,
    tags: ["AWS", "Cloud Computing", "Solutions Architect", "Certification", "Infrastructure", "DevOps"],
    isActive: true,
    featured: true,
    trending: false
  },
  {
    _id: "generative-ai-mastery",
    title: "Generative AI Mastery: From GPT to DALL-E",
    description: "Master Generative AI technologies including GPT, DALL-E, Midjourney, and Stable Diffusion. Learn to build AI applications, prompt engineering, and integrate AI into your projects.",
    shortDescription: "Master Generative AI - Build AI applications with GPT, DALL-E, and more",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop",
    category: "Artificial Intelligence",
    subcategory: "Generative AI",
    level: "intermediate",
    duration: 2800, // 46+ hours
    price: 14949, // ₹14,949 (converted from $179.99)
    originalPrice: 20749, // ₹20,749 (converted from $249.99)
    instructorName: "Dr. Emily Rodriguez",
    instructorImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
    rating: 4.9,
    totalRatings: 1876,
    totalStudents: 9340,
    tags: ["Generative AI", "GPT", "DALL-E", "Machine Learning", "ChatGPT", "AI Applications", "Prompt Engineering"],
    isActive: true,
    featured: true,
    trending: true
  },
  {
    _id: "python-data-science",
    title: "Python for Data Science & Machine Learning",
    description: "Complete Python bootcamp for data science. Learn NumPy, Pandas, Matplotlib, Seaborn, Scikit-learn, and build real-world projects.",
    shortDescription: "Master Python for data science and machine learning",
    thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=250&fit=crop",
    category: "Programming",
    subcategory: "Data Science",
    level: "beginner",
    duration: 2100, // 35 hours
    price: 10789, // ₹10,789 (converted from $129.99)
    originalPrice: 14949, // ₹14,949 (converted from $179.99)
    instructorName: "Alex Thompson",
    instructorImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    rating: 4.6,
    totalRatings: 3420,
    totalStudents: 15680,
    tags: ["Python", "Data Science", "Machine Learning", "Pandas", "NumPy", "Scikit-learn"],
    isActive: true,
    featured: true,
    trending: false
  },
  {
    _id: "react-fullstack-developer",
    title: "React & Node.js - The Complete Full Stack Course",
    description: "Build full-stack web applications with React, Node.js, Express, and MongoDB. Learn modern development practices and deploy to production.",
    shortDescription: "Become a full-stack developer with React and Node.js",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop",
    category: "Web Development",
    subcategory: "Full Stack",
    level: "intermediate",
    duration: 2700, // 45 hours
    price: 13289, // ₹13,289 (converted from $159.99)
    originalPrice: 18259, // ₹18,259 (converted from $219.99)
    instructorName: "Jessica Lee",
    instructorImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
    rating: 4.5,
    totalRatings: 2890,
    totalStudents: 11250,
    tags: ["React", "Node.js", "Full Stack", "JavaScript", "MongoDB", "Express"],
    isActive: true,
    featured: false,
    trending: true
  },
  {
    _id: "cybersecurity-essentials",
    title: "Cybersecurity Fundamentals & Ethical Hacking",
    description: "Learn cybersecurity fundamentals, ethical hacking techniques, and how to protect systems from cyber threats. Includes hands-on labs and certification prep.",
    shortDescription: "Master cybersecurity and ethical hacking fundamentals",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop",
    category: "Cybersecurity",
    subcategory: "Ethical Hacking",
    level: "intermediate",
    duration: 2200, // 36+ hours
    price: 14119, // ₹14,119 (converted from $169.99)
    originalPrice: 19089, // ₹19,089 (converted from $229.99)
    instructorName: "David Wilson",
    instructorImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    rating: 4.7,
    totalRatings: 1567,
    totalStudents: 7890,
    tags: ["Cybersecurity", "Ethical Hacking", "Network Security", "Penetration Testing", "Security"],
    isActive: true,
    featured: false,
    trending: false
  }
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Removed WebSocket - using regular API calls for better stability

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Try to fetch from API with better data processing
        try {
          const response = await fetch('http://localhost:5000/api/courses', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            const result = await response.json();
            const courseData = result.data?.courses || result.courses || result || [];
            
            if (Array.isArray(courseData) && courseData.length > 0) {
              // Process courses to ensure all required fields are present
              const processedCourses = courseData.map((course: any) => {
                // Handle image URLs - ensure they work with various formats (png, jpg, webp)
                const thumbnailUrl = course.thumbnail 
                  ? (course.thumbnail.startsWith('http') 
                      ? course.thumbnail 
                      : `http://localhost:5000${course.thumbnail}`)
                  : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop'
                
                const instructorImageUrl = course.instructorImage 
                  ? (course.instructorImage.startsWith('http') 
                      ? course.instructorImage 
                      : `http://localhost:5000${course.instructorImage}`)
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructorName || course.instructor?.name || 'Unknown')}&background=6366f1&color=fff&size=150`
                
                return {
                  ...course,
                  _id: course._id || course.id || `course-${Date.now()}`,
                  title: course.title || 'Untitled Course',
                  description: course.description || 'No description available',
                  price: typeof course.price === 'number' ? course.price : (parseFloat(course.price) || 0),
                  originalPrice: course.originalPrice ? (typeof course.originalPrice === 'number' ? course.originalPrice : parseFloat(course.originalPrice)) : null,
                  instructorName: course.instructorName || course.instructor?.name || 'Unknown Instructor',
                  instructorImage: instructorImageUrl,
                  thumbnail: thumbnailUrl,
                  category: course.category || 'General',
                  level: course.level || 'Beginner',
                  duration: course.duration || 120,
                  rating: course.rating || 4.0,
                  totalRatings: course.totalRatings || 0,
                  totalStudents: course.totalStudents || 0,
                  featured: course.featured || false,
                  trending: course.trending || false,
                  comingSoon: course.comingSoon || false,
                  isNewlyAvailable: course.isNewlyAvailable || false,
                  isActive: course.isActive !== undefined ? course.isActive : true,
                  tags: course.tags || []
                }
              });
              
              setCourses(processedCourses);
              console.log(`Loaded ${processedCourses.length} courses from API`);
            } else {
              console.log("API returned empty data, using mock courses");
              setCourses(mockCourses);
              toast.info("No courses found. Using sample data.");
            }
          } else {
            throw new Error(`API returned status ${response.status}`);
          }
        } catch (apiError) {
          console.log("API unavailable:", apiError);
          setCourses(mockCourses);
          toast.info("Backend server not available. Showing sample courses.");
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCourses(mockCourses);
        toast.error("Failed to load courses. Showing sample data.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
    
    // No polling - user can refresh manually for updates
  }, []);

  // Using shared currency utility
  
  const capitalizeLevel = (level: string) => level.charAt(0).toUpperCase() + level.slice(1);
  const formatDuration = (minutes: number) => `${Math.round(minutes / 60)}h`;
  
  // Filter and sort courses
  const featuredCourses = courses.filter(course => course.featured && !course.comingSoon);
  const trendingCourses = courses.filter(course => course.trending && !course.comingSoon);
  const comingSoonCourses = courses.filter(course => course.comingSoon);
  const nowAvailableCourses = courses.filter(course => course.isNewlyAvailable && !course.comingSoon);
  const allCourses = courses.filter(course => course.isActive && !course.comingSoon);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-white">Available Courses</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-white/10 bg-white">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-28 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const renderCourseCard = (course: Course) => (
    <Card key={course._id} className="border-white/10 bg-white group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        {/* Course Image */}
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          <img
            src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop'}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              // Fallback to a generic course image if the thumbnail fails to load
              e.currentTarget.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop';
              e.currentTarget.onerror = null; // Prevent infinite loop
            }}
            onLoad={(e) => {
              // Ensure image loaded successfully
              e.currentTarget.style.opacity = '1';
            }}
            style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
          />
          <div className="absolute top-3 left-3 flex gap-2">
            {course.comingSoon && (
              <Badge className="bg-blue-500 text-white">
                <Clock className="w-3 h-3 mr-1" />
                Coming Soon
              </Badge>
            )}
            {course.isNewlyAvailable && !course.comingSoon && (
              <Badge className="bg-green-500 text-white">
                🆕 New
              </Badge>
            )}
            {course.featured && !course.comingSoon && (
              <Badge className="bg-yellow-500 text-white">
                <Award className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            {course.trending && !course.comingSoon && (
              <Badge className="bg-red-500 text-white">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
          </div>
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-black/70 text-white">
              {capitalizeLevel(course.level)}
            </Badge>
          </div>
        </div>

        {/* Course Content */}
        <div className="p-6">
          <div className="mb-3">
            <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
              {course.title}
            </h3>
            <p className="text-sm text-slate-600 line-clamp-2 mb-3">
              {course.description}
            </p>
          </div>

          {/* Instructor and Stats */}
          <div className="flex items-center justify-between mb-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <img
                src={course.instructorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructorName)}&background=6366f1&color=fff&size=32`}
                alt={course.instructorName}
                className="w-6 h-6 rounded-full bg-slate-200"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructorName)}&background=6366f1&color=fff&size=32`;
                }}
              />
              <span>{course.instructorName}</span>
            </div>
            <div className="flex items-center gap-4">
              {course.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {typeof course.rating === 'object' ? course.rating.average : course.rating}
                  </span>
                  <span className="text-slate-500">
                    ({typeof course.rating === 'object' ? course.rating.count : course.totalRatings})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Course Info */}
          <div className="flex items-center justify-between mb-4 text-sm text-slate-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(course.duration)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{course.totalStudents?.toLocaleString()}</span>
              </div>
            </div>
            <Badge variant="outline" className="text-indigo-600 border-indigo-600">
              {course.category}
            </Badge>
          </div>

          {/* Tags */}
          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {course.tags.slice(0, 4).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Price and Add to Cart */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {course.comingSoon ? (
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-blue-600">Coming Soon</span>
                  {course.expectedLaunchDate && (
                    <span className="text-sm text-slate-500">
                      Expected: {new Date(course.expectedLaunchDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <span className="text-2xl font-bold text-slate-900">
                    ₹{(course.price || 0).toLocaleString('en-IN')}
                  </span>
                  {course.originalPrice && course.originalPrice > (course.price || 0) && (
                    <span className="text-lg text-slate-500 line-through">
                      ₹{course.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </>
              )}
            </div>
            {course.comingSoon ? (
              <Button disabled className="bg-blue-500 text-white">
                <Clock className="mr-2 h-4 w-4" />
                Notify Me
              </Button>
            ) : (
              <AddToCartButton course={course} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Explore Courses</h1>
          <p className="text-white/70">Discover amazing courses to boost your skills and career</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-white/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No courses available</h3>
          <p className="text-white/70">Check back later for new courses!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Now Available Courses */}
          {nowAvailableCourses.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <span className="h-6 w-6 text-green-400 font-bold text-lg">🆕</span>
                <h2 className="text-2xl font-bold text-white">Now Available</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {nowAvailableCourses.map(renderCourseCard)}
              </div>
            </section>
          )}

          {/* Featured Courses */}
          {featuredCourses.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Award className="h-6 w-6 text-yellow-400" />
                <h2 className="text-2xl font-bold text-white">Featured Courses</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredCourses.map(renderCourseCard)}
              </div>
            </section>
          )}

          {/* Trending Courses */}
          {trendingCourses.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-6 w-6 text-red-400" />
                <h2 className="text-2xl font-bold text-white">Trending Now</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {trendingCourses.map(renderCourseCard)}
              </div>
            </section>
          )}

          {/* All Courses */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-bold text-white">All Courses</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {allCourses.map(renderCourseCard)}
            </div>
          </section>

          {/* Coming Soon Courses - Moved to last */}
          {comingSoonCourses.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-6 w-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">Coming Soon</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {comingSoonCourses.map(renderCourseCard)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
