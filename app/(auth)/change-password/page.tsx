"use client"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import AuthShell from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"

const cardClasses = "rounded-3xl border border-[#DCE6D9] bg-white/90 shadow-[0_35px_120px_rgba(47,59,52,0.08)] p-6 sm:p-8"

export default function ChangePasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = useMemo(() => getSupabaseClient(), [])
  const [showOptions, setShowOptions] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsAuthorized(true)
      } else {
        toast({
          title: "Unauthorized",
          description: "Please use the password reset link from your email.",
          variant: "destructive",
        })
        setTimeout(() => router.push('/login'), 2000)
      }
    }
    checkAuth()
  }, [router, supabase, toast])

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      })
      
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className={cardClasses}>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[#2F3B34]">Change your password</h1>
            <p className="text-xs text-[#6B7F6E]">Enter a new password for your account.</p>
          </div>

          {!isAuthorized ? (
            <div className="text-center py-4">
              <div className="animate-spin h-8 w-8 border-2 border-[#6FA984] border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-xs text-[#6B7F6E]">Verifying...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                className="h-11 w-full rounded-xl shadow-none bg-transparent text-[#6B7F6E]/80 hover:text-[#6B7F6E] hover:bg-white/10 transition-colors duration-200 ease flex items-center justify-center border border-[#4A5A49]/30"
                type="button"
                aria-expanded={showOptions}
                onClick={() => setShowOptions((o) => !o)}
              >
                {showOptions ? "Hide" : "Show"} password form
              </Button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  showOptions ? 'max-h-60 opacity-100 mt-4' : 'max-h-0 opacity-0 pointer-events-none'
                }`}
              >
                <form onSubmit={handlePasswordChange}>
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="New Password (min 8 characters)"
                      className="h-11 w-full bg-white border border-[#DCE6D9] outline-none px-3 rounded-xl shadow-sm focus:ring-2 focus:ring-[#6FA984]/20 text-[#2F3B34] placeholder:text-[#6B7F6E] disabled:opacity-50"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      className="h-11 w-full bg-white border border-[#DCE6D9] outline-none px-3 rounded-xl shadow-sm focus:ring-2 focus:ring-[#6FA984]/20 text-[#2F3B34] placeholder:text-[#6B7F6E] disabled:opacity-50"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="h-11 w-full rounded-xl bg-[#6FA984] text-white hover:bg-[#5A8F6E] transition-colors duration-200 ease disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-[#6FA984] border-t-transparent rounded-full"></div>
                          Updating...
                        </div>
                      ) : (
                        "Change Password"
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              <p className="text-center text-xs text-[#6B7F6E]">
                Finished?{' '}
                <a href="/login" className="underline hover:text-[#6FA984] transition-colors duration-200 ease">
                  Back to Login
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </AuthShell>
  )
}
