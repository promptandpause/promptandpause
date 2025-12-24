"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"

export function SignupForm() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseClient()
  
  const [showOptions, setShowOptions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  async function handleGoogleSignUp() {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) throw error
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign up with Google",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault()
    
    if (!email || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) throw error
      
      if (data.user) {
        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          toast({
            title: "Email already registered",
            description: "This email is already in use. Please sign in instead.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        // Check if email confirmation is enabled
        if (!data.session) {
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link. Please check your inbox.",
          })
          // Optionally redirect to verification page
          setTimeout(() => router.push('/auth/verify'), 2000)
        } else {
          // If email confirmation is disabled, redirect to onboarding
          router.push('/onboarding')
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm space-y-6 px-4 py-10">
      <div className="text-center">
        <h1 className="text-lg font-medium tracking-tight">Create your account</h1>
        <p className="text-xs text-muted-foreground">Sign up to access Prompt & Pause features</p>
      </div>
      <div className="space-y-4 w-full">
        <Button 
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          className="h-11 w-full rounded-none shadow-none bg-neutral-900 text-neutral-50 border-0 hover:bg-neutral-800 transition-colors duration-200 ease flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {isLoading ? "Signing up..." : "Continue with Google"}
        </Button>
        <div className="relative flex items-center justify-center">
          <span className="text-xs text-muted-foreground">or</span>
        </div>
        <Button
          className="h-11 w-full rounded-none shadow-none bg-white text-muted-foreground hover:bg-gray-50 transition-colors duration-200 ease flex items-center justify-center border"
          type="button"
          aria-expanded={showOptions}
          onClick={() => setShowOptions(o => !o)}
        >
          {showOptions ? "Hide" : "Show"} other options
        </Button>
        <form onSubmit={handleEmailSignUp} className={`overflow-hidden transition-all duration-300 ${showOptions ? 'max-h-60 opacity-100 mt-4' : 'max-h-0 opacity-0 pointer-events-none'}`}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="h-11 w-full bg-white border outline-none px-3 rounded shadow-sm focus:ring-2 mb-2 disabled:opacity-50" 
          />
          <input 
            type="password" 
            placeholder="Password (min 8 characters)" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="h-11 w-full bg-white border outline-none px-3 rounded shadow-sm focus:ring-2 mb-2 disabled:opacity-50" 
          />
          <input 
            type="password" 
            placeholder="Confirm Password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            className="h-11 w-full bg-white border outline-none px-3 rounded shadow-sm focus:ring-2 mb-2 disabled:opacity-50" 
          />
          <Button 
            type="submit"
            disabled={isLoading}
            className="h-11 w-full rounded bg-neutral-900 text-neutral-50 hover:bg-neutral-800 transition-colors duration-200 ease mb-2 disabled:opacity-50"
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <a href="/auth/signin" className="underline hover:text-neutral-900 transition-colors duration-200 ease">Sign in</a>
        </p>
      </div>
    </div>
  )
}
