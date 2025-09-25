"use client"

import { CourseForm } from "@/components/admin/course-form"
import { useParams } from "next/navigation"

export default function EditCoursePage() {
  const params = useParams()
  const id = params?.id as string
  return <CourseForm mode="edit" courseId={id} />
}
