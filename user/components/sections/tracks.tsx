"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { coursesAPI, Course } from "@/lib/api"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import Link from "next/link"

export function Tracks() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await coursesAPI.getAllCourses()
        console.log('Fetched courses data:', data) // Debug log
        
        // Ensure data is an array before slicing
        if (Array.isArray(data)) {
          // Get featured courses or limit to first 3
          setCourses(data.slice(0, 3))
        } else {
          console.warn('Expected array but got:', typeof data, data)
          setCourses([])
          toast.error("Unexpected data format from server")
        }
      } catch (error) {
        console.error("Error fetching courses for tracks:", error)
        toast.error("Failed to load featured courses")
        setCourses([]) // Ensure we set empty array on error
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  const formatPrice = (price: number) => `$${price.toFixed(2)}`
  const capitalizeLevel = (level: string) => level.charAt(0).toUpperCase() + level.slice(1)

  if (loading) {
    return (
      <div>
        <h3 className="mb-2 text-center text-sm uppercase tracking-wide text-white/60">Our Tracks</h3>
        <h2 className="mb-6 text-center text-2xl font-semibold">Learn by Doing</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-slate-200 bg-white text-slate-900 shadow-sm">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="mb-2 text-center text-sm uppercase tracking-wide text-white/60">Our Tracks</h3>
      <h2 className="mb-6 text-center text-2xl font-semibold">Learn by Doing</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-white/70">No featured courses available at the moment.</p>
          </div>
        ) : (
          courses
            .filter((course) => course.isActive)
            .map((course) => (
              <Card key={course._id} className="border-slate-200 bg-white text-slate-900 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="min-h-16 text-sm text-slate-600 line-clamp-3">
                    {course.description}
                  </p>
                  <div className="mt-2 text-xs text-slate-500">
                    {capitalizeLevel(course.level)} • {course.duration} hours
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">{formatPrice(course.price)}</span>
                  <Button asChild size="sm" className="rounded-full bg-indigo-600 hover:bg-indigo-500">
                    <Link href={`/dashboard/course/${course._id}`}>
                      View Course
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
        )}
      </div>
    </div>
  )
}
