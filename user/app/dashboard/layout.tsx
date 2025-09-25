import type { ReactNode } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#0b1020] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 sm:px-4 py-4">
        <Sidebar />
        <main className="min-w-0 flex-1 pl-16">{children}</main>
      </div>
    </div>
  )
}
