"use client"

import { UserTable } from "@/components/admin/user-table"

export default function UsersPage() {
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold text-balance">Users</h1>
      <UserTable />
    </div>
  )
}
