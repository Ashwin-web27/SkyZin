"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  CreditCard,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/users", label: "Users", icon: Users },
  { href: "/instructors", label: "Instructors", icon: GraduationCap },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "sticky top-0 h-dvh border-r bg-sidebar transition-[width] duration-200",
        collapsed ? "w-[4.25rem]" : "w-64",
      )}
      aria-label="Sidebar"
    >
      <div className="flex h-14 items-center justify-between px-2">
        <Link href="/dashboard" className="flex items-center gap-2 px-2">
          <div aria-hidden className="size-6 rounded bg-primary" />
          {!collapsed && <span className="font-semibold">Admin</span>}
        </Link>
        <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
        </Button>
      </div>

      <nav className="px-2 py-2">
        <ul className="grid gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = pathname?.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2 py-2 text-sm",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    active && "bg-sidebar-accent text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="absolute inset-x-0 bottom-0 p-2">
        <Link
          href="/login"
          className={cn(
            "flex items-center gap-3 rounded-md px-2 py-2 text-sm",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <LogOut className="size-5" />
          {!collapsed && <span>Logout</span>}
        </Link>
      </div>
    </aside>
  )
}
