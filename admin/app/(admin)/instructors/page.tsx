"use client"

import { InstructorTable } from "@/components/admin/instructor-table"

export default function InstructorsPage() {
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold text-balance">Instructors</h1>
      <InstructorTable />
    </div>
  )
}
