"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { authAPI } from "@/lib/api"
import { toast } from "sonner"

function ResetPasswordContent() {
  const [token, setToken] = useState("")
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isValidToken, setIsValidToken] = useState(false)
  const [isPasswordReset, setIsPasswordReset] = useState(false)
  const [tokenError, setTokenError] = useState("")
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    if (tokenParam) {
      setToken(tokenParam)
      verifyToken(tokenParam)
    } else {
      setIsVerifying(false)
      setTokenError("No reset token provided")
    }
  }, [searchParams])

  const verifyToken = async (resetToken: string) => {
    try {
      setIsVerifying(true)
      const response = await authAPI.verifyResetToken(resetToken)
      
      if (response.success) {
        setIsValidToken(true)
        setEmail(response.email || "")
        setTokenError("")
      } else {
        setIsValidToken(false)
        setTokenError(response.message || "Invalid or expired token")
      }
    } catch (error: any) {
      console.error("Token verification error:", error)
      setIsValidToken(false)
      setTokenError(error.message || "Failed to verify token")
    } finally {
      setIsVerifying(false)
    }
  }

  const validatePassword = (password: string) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasNonalphas = /\W/.test(password)

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar: hasNonalphas
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      toast.error("Password does not meet requirements")
      return
    }

    try {
      setIsLoading(true)
      const response = await authAPI.resetPassword(token, newPassword)
      
      if (response.success) {
        setIsPasswordReset(true)
        toast.success("Password reset successfully!")
      } else {
        toast.error(response.message || "Failed to reset password")
      }
    } catch (error: any) {
      console.error("Password reset error:", error)
      toast.error(error.message || "Failed to reset password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push("/login")
  }

  const passwordValidation = validatePassword(newPassword)

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
                <p className="text-white">Verifying reset token...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isValidToken || tokenError) {
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
                  <AlertCircle className="h-6 w-6 text-red-400" />
                  <span className="text-xl font-semibold text-white">Invalid Token</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <h4 className="text-red-400 font-medium mb-2">Reset Link Invalid</h4>
                <p className="text-white/80 text-sm">
                  {tokenError || "This password reset link is invalid or has expired."}
                </p>
              </div>
              
              <p className="text-white/60 text-sm text-center">
                Please request a new password reset link.
              </p>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3">
              <Button 
                onClick={() => router.push("/forgot-password")}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Request New Reset Link
              </Button>
              
              <div className="text-center">
                <Link 
                  href="/login" 
                  className="text-blue-400 hover:text-blue-300 font-medium hover:underline text-sm"
                >
                  Back to Login
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  if (isPasswordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <CardTitle className="text-2xl text-white">Password Reset Successful!</CardTitle>
              </div>
              <CardDescription className="text-white/70">
                Your password has been reset successfully. You can now log in with your new password.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h4 className="text-green-400 font-medium mb-2">All Set!</h4>
                <p className="text-white/80 text-sm">
                  You can now use your new password to sign into your account.
                </p>
              </div>
            </CardContent>

            <CardFooter>
              <Button 
                onClick={handleBackToLogin}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Continue to Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
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
                <Lock className="h-6 w-6 text-white" />
                <span className="text-xl font-semibold text-white">SkyZin</span>
              </div>
            </div>
            
            <CardTitle className="text-2xl text-white">Reset Password</CardTitle>
            <CardDescription className="text-white/70">
              {email && `Set a new password for ${email}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-white">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 pr-10"
                    disabled={isLoading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/60 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 pr-10"
                    disabled={isLoading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/60 hover:text-white"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              {newPassword && (
                <div className="space-y-2">
                  <Label className="text-white text-sm">Password Requirements</Label>
                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-400' : 'text-white/60'}`}>
                      <div className={`w-1 h-1 rounded-full ${passwordValidation.minLength ? 'bg-green-400' : 'bg-white/60'}`} />
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.hasUpperCase ? 'text-green-400' : 'text-white/60'}`}>
                      <div className={`w-1 h-1 rounded-full ${passwordValidation.hasUpperCase ? 'bg-green-400' : 'bg-white/60'}`} />
                      One uppercase letter
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.hasLowerCase ? 'text-green-400' : 'text-white/60'}`}>
                      <div className={`w-1 h-1 rounded-full ${passwordValidation.hasLowerCase ? 'bg-green-400' : 'bg-white/60'}`} />
                      One lowercase letter
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.hasNumbers ? 'text-green-400' : 'text-white/60'}`}>
                      <div className={`w-1 h-1 rounded-full ${passwordValidation.hasNumbers ? 'bg-green-400' : 'bg-white/60'}`} />
                      One number
                    </div>
                  </div>
                </div>
              )}

              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-400 text-sm">Passwords do not match</p>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
                disabled={isLoading || !passwordValidation.isValid || newPassword !== confirmPassword}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <Lock size={16} className="mr-2" />
                    Reset Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center">
            <p className="text-white/60 text-sm w-full">
              Remember your password?{" "}
              <Link 
                href="/login" 
                className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
              >
                Back to Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
              <p className="text-white">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
