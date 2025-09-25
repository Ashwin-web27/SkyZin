"use client"

import type React from "react"

import { Sidebar } from "@/components/admin/sidebar"
import { Topbar } from "@/components/admin/topbar"
import { useState } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-dvh">
      <div className="flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <div className="flex-1 min-w-0">
          <Topbar onToggleSidebar={() => setCollapsed((c) => !c)} />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
