"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, ArrowLeft, Send, CheckCircle } from "lucide-react"
import { authAPI } from "@/lib/api"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.trim()) {
      toast.error("Please enter your email address")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address")
      return
    }

    try {
      setIsLoading(true)
      const response = await authAPI.forgotPassword(email.trim())
      
      if (response.success) {
        setIsEmailSent(true)
        toast.success("Password reset email sent successfully!")
      } else {
        toast.error(response.message || "Failed to send reset email")
      }
    } catch (error: any) {
      console.error("Forgot password error:", error)
      toast.error(error.message || "Failed to send reset email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push("/login")
  }

  const handleResendEmail = async () => {
    try {
      setIsLoading(true)
      const response = await authAPI.forgotPassword(email.trim())
      
      if (response.success) {
        toast.success("Password reset email resent successfully!")
      } else {
        toast.error(response.message || "Failed to resend reset email")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to resend reset email")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToLogin}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2"
              >
                <ArrowLeft size={20} />
              </Button>
              <div className="flex items-center gap-2">
                <Mail className="h-6 w-6 text-white" />
                <span className="text-xl font-semibold text-white">SkyZin</span>
              </div>
            </div>
            
            {!isEmailSent ? (
              <>
                <CardTitle className="text-2xl text-white">Forgot Password?</CardTitle>
                <CardDescription className="text-white/70">
                  No worries! Enter your email address and we'll send you a link to reset your password.
                </CardDescription>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <CardTitle className="text-2xl text-white">Check Your Email</CardTitle>
                </div>
                <CardDescription className="text-white/70">
                  We've sent a password reset link to <strong className="text-white">{email}</strong>
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {!isEmailSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40"
                    disabled={isLoading}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <h4 className="text-green-400 font-medium mb-2">Email Sent Successfully!</h4>
                  <p className="text-white/80 text-sm">
                    Please check your email and click on the password reset link to create a new password.
                  </p>
                </div>

                <div className="text-center space-y-3">
                  <p className="text-white/60 text-sm">
                    Didn't receive the email? Check your spam folder or
                  </p>
                  
                  <Button 
                    variant="outline"
                    onClick={handleResendEmail}
                    className="border-white/20 text-white hover:bg-white/10 hover:border-white/40"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Resending...
                      </>
                    ) : (
                      <>
                        <Mail size={16} className="mr-2" />
                        Resend Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <div className="text-center">
              <p className="text-white/60 text-sm">
                Remember your password?{" "}
                <Link 
                  href="/login" 
                  className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
                >
                  Back to Login
                </Link>
              </p>
            </div>

            <div className="text-center">
              <p className="text-white/40 text-xs">
                Don't have an account?{" "}
                <Link 
                  href="/register" 
                  className="text-purple-400 hover:text-purple-300 hover:underline"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}