"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authAPI } from "@/lib/api"
import { OverviewCards } from "@/components/admin/overview-cards"
import { RevenueChart, UsersGrowthChart } from "@/components/admin/charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<any>(null)

  useEffect(() => {
    // Check if user is authenticated
    if (!authAPI.isAuthenticated()) {
      router.push("/login")
      return
    }

    // Get user data
    const userData = authAPI.getCurrentUser()
    setUser(userData)
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {/* Authentication Success Banner */}
      {user && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              🎉 Authentication Success!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 mb-2">
              Welcome <strong>{user.name}</strong>! Your admin authentication is working perfectly.
            </p>
            <div className="text-sm text-green-600">
              <p>✅ Admin login successful</p>
              <p>✅ MongoDB integration working</p>
              <p>✅ JWT authentication active</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <OverviewCards onStatsUpdate={setDashboardStats} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">User Growth</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <UsersGrowthChart totalUsers={dashboardStats?.totalUsers} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <RevenueChart totalRevenue={dashboardStats?.totalRevenue} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
