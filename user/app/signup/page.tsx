"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { authService } from "@/services/authService"
import { toast } from "sonner"

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms and Privacy Policy.")
      return
    }
    
    setLoading(true)

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      const response = await authService.register({ 
        name: fullName, 
        email, 
        password 
      })
      
      if (response.success) {
        toast.success("Account created successfully!")
        router.push("/dashboard")
      } else {
        toast.error(response.message || "Registration failed. Please try again.")
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast.error(error instanceof Error ? error.message : "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[radial-gradient(1200px_600px_at_50%_-10%,#394867_20%,#0b1020_60%,#080c1a_100%)] text-white">
      {/* reuse the same backdrop aesthetic from login.jpg */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ backgroundImage: "url('/images/login.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
        aria-hidden="true"
      />
      <section className="relative z-10 container mx-auto flex min-h-[100dvh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur-md">
          <h1 className="mb-6 text-center text-3xl font-semibold tracking-wide">Create Account</h1>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="first" className="mb-2 block text-sm text-white/80">
                  First name
                </label>
                <Input
                  id="first"
                  placeholder="Alex"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="rounded-full bg-white/80 text-neutral-900 placeholder:text-neutral-600 focus:bg-white"
                />
              </div>
              <div>
                <label htmlFor="last" className="mb-2 block text-sm text-white/80">
                  Last name
                </label>
                <Input
                  id="last"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="rounded-full bg-white/80 text-neutral-900 placeholder:text-neutral-600 focus:bg-white"
                />
              </div>
            </div>
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
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="rounded-full bg-white/80 text-neutral-900 placeholder:text-neutral-600 focus:bg-white"
              />
            </div>
            <div className="flex items-start gap-2 text-xs text-white/80">
              <Checkbox 
                id="agree" 
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className="mt-0.5 border-white/40 data-[state=checked]:bg-indigo-600" 
              />
              <label htmlFor="agree" className="cursor-pointer">
                I agree to the Terms and acknowledge the Privacy Policy.
              </label>
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="mt-2 w-full rounded-full bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-70"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-white/80">
            Already have an account?{" "}
            <a href="/login" className="text-indigo-300 underline underline-offset-4">
              Sign in
            </a>
          </p>
        </div>
      </section>
    </main>
  )
}
