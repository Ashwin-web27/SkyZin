"use client"

import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react"

// Generate realistic growth data based on current user count
const generateUsersData = (currentTotal = 1247) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const data = []
  const baseUsers = Math.max(100, currentTotal - 800) // Start from a reasonable base
  
  for (let i = 0; i < 12; i++) {
    const growth = Math.floor(baseUsers + (currentTotal - baseUsers) * (i / 11))
    const variation = Math.floor(Math.random() * 50 - 25) // Small random variation
    data.push({
      month: months[i],
      users: Math.max(baseUsers, growth + variation)
    })
  }
  
  // Ensure the last month shows current total
  data[11].users = currentTotal
  return data
}

// Generate realistic monthly revenue data
const generateRevenueData = (totalRevenue = 16688482) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const data = []
  const monthlyAverage = Math.floor(totalRevenue / 12)
  
  for (let i = 0; i < 12; i++) {
    // Simulate seasonal growth with some variation
    const seasonalMultiplier = 0.7 + (i / 12) * 0.6 // Growth throughout the year
    const variation = 0.8 + Math.random() * 0.4 // Random variation ±20%
    const monthlyRevenue = Math.floor(monthlyAverage * seasonalMultiplier * variation)
    
    data.push({
      month: months[i],
      revenue: monthlyRevenue
    })
  }
  
  return data
}

const revenueDataDaily = Array.from({ length: 30 }).map((_, i) => ({
  day: i + 1,
  revenue: Math.round(300 + Math.random() * 700),
}))
const revenueDataYearly = [
  { year: "2021", revenue: 120_000 },
  { year: "2022", revenue: 198_000 },
  { year: "2023", revenue: 265_000 },
  { year: "2024", revenue: 318_000 },
  { year: "2025", revenue: 342_910 },
]

export function UsersGrowthChart({ totalUsers = 1247 }: { totalUsers?: number }) {
  const [usersData, setUsersData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    setLoading(true)
    // Small delay to show loading state
    const timer = setTimeout(() => {
      setUsersData(generateUsersData(totalUsers))
      setLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [totalUsers])
  
  if (loading || usersData.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-slate-50 rounded">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-slate-500">Loading user growth data...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={usersData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="month" 
            className="text-xs" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-xs" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip 
            formatter={(value: any) => [`${value.toLocaleString()} users`, 'Users']}
            labelFormatter={(label) => `Month: ${label}`}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="users" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2} 
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RevenueChart({ totalRevenue = 16688482, granular = false }: { totalRevenue?: number, granular?: boolean }) {
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    setLoading(true)
    // Small delay to show loading state
    const timer = setTimeout(() => {
      if (granular) {
        setRevenueData(revenueDataDaily)
      } else {
        setRevenueData(generateRevenueData(totalRevenue))
      }
      setLoading(false)
    }, 700) // Slightly different delay for staggered loading
    
    return () => clearTimeout(timer)
  }, [totalRevenue, granular])
  
  const xKey = granular ? "day" : "month"
  
  const formatRevenue = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
    return `₹${value}`
  }
  
  if (loading || revenueData.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-slate-50 rounded">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-slate-500">Loading revenue data...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={revenueData}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey={xKey} 
            className="text-xs" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-xs" 
            tick={{ fontSize: 12 }}
            tickFormatter={formatRevenue}
          />
          <Tooltip 
            formatter={(value: any) => [formatRevenue(value), 'Revenue']}
            labelFormatter={(label) => granular ? `Day ${label}` : `Month: ${label}`}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="hsl(var(--primary))" 
            fill="url(#rev)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export const revenueDataYearlyPublic = revenueDataYearly
