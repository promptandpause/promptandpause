"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Eye, EyeOff, Check, AlertCircle, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"
import AuthShell from "@/components/auth/AuthShell"
import { Suspense } from "react"

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const passwordRequirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (pwd) => pwd.length >= 8 },
  { label: "One uppercase letter", test: (pwd) => /[A-Z]/.test(pwd) },
  { label: "One lowercase letter", test: (pwd) => /[a-z]/.test(pwd) },
  { label: "One number", test: (pwd) => /\d/.test(pwd) },
  { label: "One special character", test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
]

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden bg-black">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 flex-1 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
            </div>
          </div>
        </div>
      }
    >
      <ChangePasswordPageContent />
    </Suspense>
  )
}

function ChangePasswordPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseClient()
  const { toast } = useToast()
  
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const getPasswordStrength = (password: string) => {
    const passedRequirements = passwordRequirements.filter((req) => req.test(password)).length
    if (passedRequirements === 0) return { strength: 0, label: "", color: "" }
    if (passedRequirements <= 2) return { strength: 25, label: "Weak", color: "bg-red-500" }
    if (passedRequirements <= 3) return { strength: 50, label: "Fair", color: "bg-yellow-500" }
    if (passedRequirements <= 4) return { strength: 75, label: "Good", color: "bg-blue-500" }
    return { strength: 100, label: "Strong", color: "bg-green-500" }
  }

  // Check if user is authorized to change password (from reset link)
  useEffect(() => {
    async function checkAuth() {
      try {
        // Check if there's a reset token in the URL
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        
        if (accessToken && refreshToken) {
          // Exchange tokens for session
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            setError("Invalid or expired reset link")
            return
          }
          
          setIsAuthorized(true)
        } else {
          // Check if user has an active session
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            setIsAuthorized(true)
          } else {
            setError("Please use the password reset link from your email or sign in first.")
          }
        }
      } catch (err) {
        setError("An error occurred while checking authorization")
      }
    }
    
    checkAuth()
  }, [searchParams, supabase])

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error", 
        description: "Passwords do not match",
        variant: "destructive"
      })
      return
    }
    
    if (!passwordRequirements.every(req => req.test(newPassword))) {
      toast({
        title: "Error",
        description: "Password does not meet all requirements",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw error
      }

      setSuccess(true)
      toast({
        title: "Password Changed! 🎉",
        description: "Your password has been updated successfully.",
      })
      
      // Redirect to login after 2 seconds
      setTimeout(() => router.push('/login'), 2000)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <AuthShell
        heroEyebrow="Prompt & Pause"
        heroTitle="Authorization Failed"
        heroSubtitle="There was an issue with your password reset link"
      >
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-white/70 mb-6">{error}</p>
          <Button
            onClick={() => router.push('/login')}
            className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40"
          >
            Back to Sign In
          </Button>
        </div>
      </AuthShell>
    )
  }

  if (success) {
    return (
      <AuthShell
        heroEyebrow="Prompt & Pause"
        heroTitle="Password Changed!"
        heroSubtitle="Your password has been updated successfully"
      >
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/70 mb-6">Redirecting you to sign in...</p>
          <Button
            onClick={() => router.push('/login')}
            className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40"
          >
            Sign In Now
          </Button>
        </div>
      </AuthShell>
    )
  }

  if (!isAuthorized) {
    return (
      <AuthShell
        heroEyebrow="Prompt & Pause"
        heroTitle="Checking Authorization"
        heroSubtitle="Please wait while we verify your access"
      >
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full"></div>
          </div>
          <p className="text-white/70">Verifying your reset link...</p>
        </div>
      </AuthShell>
    )
  }

  const passwordStrength = getPasswordStrength(newPassword)
  const isPasswordValid = newPassword && confirmPassword && newPassword === confirmPassword && passwordRequirements.every(req => req.test(newPassword))

  return (
    <AuthShell
      heroEyebrow="Prompt & Pause"
      heroTitle="Change Password"
      heroSubtitle="Enter your new password below"
    >
      <div className="w-full max-w-md">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-white/90">
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {newPassword && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Password strength</span>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength.strength === 100
                        ? "text-white/90"
                        : passwordStrength.strength >= 75
                          ? "text-white/80"
                          : passwordStrength.strength >= 50
                            ? "text-white/70"
                            : "text-white/50"
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${passwordStrength.strength}%` }}
                  />
                </div>
                <div className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          req.test(newPassword) ? "bg-white/80" : "bg-white/20"
                        }`}
                      />
                      <span
                        className={`text-xs ${req.test(newPassword) ? "text-white/80" : "text-white/40"}`}
                      >
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-new-password" className="text-white/90">
              Confirm New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <Input
                id="confirm-new-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400">Passwords do not match</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || !isPasswordValid}
            className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/login')}
            className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
          >
            Back to Sign In
          </Button>
        </form>
      </div>
    </AuthShell>
  )
}
