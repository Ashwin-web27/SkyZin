"use client"

import { CourseTable } from "@/components/admin/course-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function CoursesPage() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-balance">Courses</h1>
        <Button asChild>
          <Link href="/courses/new">
            <Plus className="mr-2 size-4" />
            Add Course
          </Link>
        </Button>
      </div>
      <CourseTable />
    </div>
  )
}
