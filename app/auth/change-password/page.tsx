"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GradientCanvas } from "../gradient-canvas";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function ChangePasswordPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const { toast } = useToast()
  const [showOptions, setShowOptions] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Check if user is authorized to change password (from reset link)
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
        setTimeout(() => router.push('/auth/signin'), 2000)
      }
    }
    checkAuth()
  }, [])

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
      
      // Redirect to dashboard after 2 seconds
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
      <div className="w-full lg:w-1/2 h-screen flex items-center justify-center bg-white">
        <div className="w-full max-w-sm space-y-6 px-4">
          <div className="text-center">
            <h1 className="text-lg font-medium tracking-tight">Change Your Password</h1>
            <p className="text-xs text-muted-foreground">Enter a new password for your account</p>
          </div>
          
          {!isAuthorized ? (
            <div className="text-center py-4">
              <div className="animate-spin h-8 w-8 border-2 border-neutral-900 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-xs text-muted-foreground">Verifying...</p>
            </div>
          ) : (
            <>
              <Button
                className="h-11 w-full rounded-none shadow-none bg-muted text-muted-foreground hover:bg-muted/80 transition-colors duration-200 ease flex items-center justify-center"
                type="button"
                aria-expanded={showOptions}
                onClick={() => setShowOptions(o => !o)}
              >
                {showOptions ? "Hide" : "Show"} password form
              </Button>
              
              <div className={`overflow-hidden transition-all duration-300 ${showOptions ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <form onSubmit={handlePasswordChange}>
                  <input
                    type="password"
                    placeholder="New Password (min 8 characters)"
                    className="h-11 w-full bg-white border outline-none px-3 rounded shadow-sm focus:ring-2 mb-2 disabled:opacity-50"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    className="h-11 w-full bg-white border outline-none px-3 rounded shadow-sm focus:ring-2 mb-2 disabled:opacity-50"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="h-11 w-full rounded bg-neutral-900 text-neutral-50 hover:bg-neutral-800 transition-colors duration-200 ease mb-2 disabled:opacity-50"
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
                </form>
              </div>
              
              <p className="text-center text-xs text-muted-foreground">
                Finished?{' '}
                <a href="/auth/signin" className="underline hover:text-neutral-900 transition-colors duration-200 ease">Back to Login</a>
              </p>
            </>
          )}
        </div>
      </div>
      <div className="hidden lg:block lg:w-1/2 h-screen">
        <GradientCanvas />
      </div>
    </main>
  );
}
