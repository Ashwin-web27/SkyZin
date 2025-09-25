"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { authService } from "@/services/authService"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authService.login({ email, password })
      
      if (response.success) {
        toast.success("Login successful!")
        router.push("/dashboard")
      } else {
        toast.error(response.message || "Login failed. Please try again.")
      }
    } catch (error) {
      console.error("Login error:", error)
      toast.error(error instanceof Error ? error.message : "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[radial-gradient(1200px_600px_at_50%_-10%,#394867_20%,#0b1020_60%,#080c1a_100%)] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ backgroundImage: "url('/images/login.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        aria-hidden="true"
      />
      <section className="relative z-10 container mx-auto flex min-h-[100dvh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur-md">
          <h1 className="mb-6 text-center text-3xl font-semibold tracking-wide">Login</h1>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-white/80">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-full bg-white/80 text-neutral-900 placeholder:text-neutral-600 focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm text-white/80">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-full bg-white/80 text-neutral-900 placeholder:text-neutral-600 focus:bg-white"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-white/80">
              <label className="flex items-center gap-2">
                <Checkbox id="keep" className="border-white/40 data-[state=checked]:bg-indigo-600" />
                <span>Keep me logged in</span>
              </label>
              <Link href="/auth/forgot-password" className="hover:underline text-indigo-300">
                Forgot password?
              </Link>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-70"
            >
              {loading ? "Redirecting..." : "Login"}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-white/70">
            By logging in, you agree to our Privacy Policy and Terms of Use.
          </p>
          <p className="mt-4 text-center text-sm text-white/80">
            New here?{" "}
            <a href="/signup" className="text-indigo-300 underline underline-offset-4">
              Create an account
            </a>
          </p>
        </div>
      </section>
    </main>
  )
}
