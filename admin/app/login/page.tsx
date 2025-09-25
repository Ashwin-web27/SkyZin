"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { authAPI } from "@/lib/api"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await authAPI.login(email, password)
      toast.success("Login successful!")
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      toast.error(error instanceof Error ? error.message : "Login failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div aria-hidden className="size-8 rounded bg-primary" />
            <span className="text-xl font-semibold">Admin Portal</span>
          </div>
          <CardTitle className="text-balance">Sign in to your account</CardTitle>
          <CardDescription>Admin access for the e-learning platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@yoursite.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <Link href="#" className="text-sm text-primary underline-offset-4 hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={async () => {
                // Quick test access for development
                localStorage.setItem('admin_token', 'temp-admin-token-for-testing')
                localStorage.setItem('admin_user', JSON.stringify({
                  _id: 'temp-admin-id',
                  name: 'Admin User',
                  email: 'admin@elearning.com',
                  role: 'admin',
                  status: 'Active'
                }))
                toast.success("Quick access granted!")
                router.push("/dashboard")
              }}
            >
              Quick Test Access
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
