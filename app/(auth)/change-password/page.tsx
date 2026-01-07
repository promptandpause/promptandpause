"use client"
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AuthLottie } from "../_components/auth-lottie";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/lib/supabase/client";

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
    <main className="w-screen h-screen flex">
      <div className="relative w-full lg:w-1/2 h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#07121a] via-[#081820] to-[#143521]">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 w-full max-w-sm px-4">
          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl shadow-2xl sm:p-8">
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <a href="https://www.promptandpause.com" className="inline-flex hover:opacity-90 transition-opacity">
                  <img
                    src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
                    alt="Prompt & Pause"
                    className="h-10 w-auto invert"
                  />
                </a>
                <p className="mt-2 text-xs font-medium tracking-wide text-white/70">Pause. Reflect. Grow.</p>
              </div>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-white">Change your password</h1>
                <p className="text-xs text-white/70">Enter a new password for your account.</p>
              </div>

              {!isAuthorized ? (
                <div className="text-center py-4">
                  <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-xs text-white/70">Verifying...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    className="h-11 w-full rounded-xl shadow-none bg-transparent text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200 ease flex items-center justify-center border border-white/20"
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
                          className="h-11 w-full bg-white/10 border border-white/20 outline-none px-3 rounded-xl shadow-sm focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/50 disabled:opacity-50"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          className="h-11 w-full bg-white/10 border border-white/20 outline-none px-3 rounded-xl shadow-sm focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/50 disabled:opacity-50"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="h-11 w-full rounded-xl bg-white text-black hover:bg-white/90 transition-colors duration-200 ease disabled:opacity-50"
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                              Updating...
                            </div>
                          ) : (
                            "Change Password"
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>

                  <p className="text-center text-xs text-white/70">
                    Finished?{' '}
                    <a href="/login" className="underline hover:text-white transition-colors duration-200 ease">
                      Back to Login
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex lg:w-1/2 h-full items-center justify-center bg-black">
        <AuthLottie
          src="/lottie/Forgot Password Animation.json"
          className="w-full max-w-xl px-10"
        />
      </div>
    </main>
  );
}
