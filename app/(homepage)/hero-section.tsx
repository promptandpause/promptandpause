"use client"

import Navigation from "./Navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import Footer from "./footer"

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21.35 11.1h-9.18v2.97h5.27c-.23 1.4-1.62 4.1-5.27 4.1-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.8 0 3.02.77 3.71 1.43l2.53-2.44C16.88 3.84 15.21 3 12.17 3 7.04 3 2.93 7.11 2.93 12.24s4.11 9.24 9.24 9.24c5.33 0 8.86-3.75 8.86-9.04 0-.61-.07-1.07-.18-1.34z" fill="white"/>
    </svg>
  )
}

type AuthMode = "signup" | "signin" | "forgot" | "change-password" | "verify"

export default function HeroSection() {
  const [mode, setMode] = useState<AuthMode>("signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = getSupabaseClient()
  const { toast } = useToast()

  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (hash === "mode=signin") setMode("signin")
    else if (hash === "mode=change-password") setMode("change-password")
    else if (hash === "mode=verify") setMode("verify")
  }, [])

  async function handleGoogleSignIn() {
    try {
      setIsGoogleLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      })
      setIsGoogleLoading(false)
    }
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    try {
      setIsSubmitting(true)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      toast({
        title: "Check your email",
        description: "We sent you a magic link to sign in.",
      })
      setEmail("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    try {
      setIsSubmitting(true)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data.user) {
        const { data: preferences } = await supabase
          .from("user_preferences")
          .select("id")
          .eq("user_id", data.user.id)
          .single()
        window.location.href = preferences ? "/" : "/onboarding"
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    try {
      setIsSubmitting(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })
      if (error) throw error
      setSubmitted(true)
      toast({
        title: "Check your email",
        description: "We've sent you password reset instructions.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!newPassword || !confirmPassword) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" })
      return
    }
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" })
      return
    }
    try {
      setIsSubmitting(true)
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      })
      setTimeout(() => { window.location.href = "/" }, 2000)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  async function handleResendVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    try {
      setIsSubmitting(true)
      const { error } = await supabase.auth.resend({ type: "signup", email })
      if (error) throw error
      toast({
        title: "Email sent",
        description: "We've resent the verification email.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative h-screen flex flex-col bg-white">
      <Navigation />

      <div id="auth-section" className="relative z-10 flex-1 flex items-center overflow-y-auto">
        <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center">
            <div className="max-w-md mx-auto lg:mx-0 w-full">
              <h1 className="font-bold text-[#0F1419] text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] mb-10 whitespace-nowrap">
                Prompt. Pause. Reflect.
              </h1>

              <div className="max-w-sm">
                {mode === "signup" && (
                  <>
                    <p className="text-2xl sm:text-3xl font-bold text-[#0F1419] mb-6">Join today.</p>
                    <div className="flex flex-col gap-3">
                      <button onClick={handleGoogleSignIn} disabled={isGoogleLoading}
                        className="flex items-center justify-center gap-2 w-full rounded-full bg-[#0F1419] text-white font-medium py-2.5 px-6 hover:bg-black/90 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
                        {isGoogleLoading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <GoogleIcon />}
                        Continue with Google
                      </button>
                      <div className="flex items-center gap-3 my-1">
                        <div className="h-px flex-1 bg-[#EFF3F4]" />
                        <span className="text-[#536471] text-sm">or</span>
                        <div className="h-px flex-1 bg-[#EFF3F4]" />
                      </div>
                      <form onSubmit={handleEmailSignUp}>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email" disabled={isSubmitting}
                          className="w-full rounded-xl border border-[#CFD9DE] px-3 py-3 text-[#0F1419] text-base placeholder:text-[#536471] focus:border-[#1D9BF0] focus:outline-none focus:ring-1 focus:ring-[#1D9BF0] mb-3 disabled:opacity-50" />
                        <button type="submit" disabled={!email || isSubmitting}
                          className="w-full rounded-full bg-[#1D9BF0] text-white font-bold py-3 px-6 hover:bg-[#1A8CD8] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
                          {isSubmitting ? "Sending..." : "Continue"}
                        </button>
                      </form>
                      <p className="text-[13px] text-[#536471] leading-relaxed mt-1">
                        By signing up, you agree to the{" "}
                        <Link href="/terms-of-service" className="text-[#1D9BF0] hover:underline">Terms of Service</Link>{" "}and{" "}
                        <Link href="/privacy-policy" className="text-[#1D9BF0] hover:underline">Privacy Policy</Link>, including{" "}
                        <Link href="/cookie-policy" className="text-[#1D9BF0] hover:underline">Cookie Use</Link>.
                      </p>
                    </div>
                    <div className="mt-8 text-center">
                      <p className="text-[#0F1419] text-sm">
                        Already have an account?{" "}
                        <button onClick={() => { setMode("signin"); setPassword("") }}
                          className="text-[#1D9BF0] font-bold hover:underline cursor-pointer">Sign in</button>
                      </p>
                    </div>
                  </>
                )}

                {mode === "signin" && (
                  <>
                    <p className="text-2xl sm:text-3xl font-bold text-[#0F1419] mb-6">Welcome back.</p>
                    <div className="flex flex-col gap-3">
                      <button onClick={handleGoogleSignIn} disabled={isGoogleLoading}
                        className="flex items-center justify-center gap-2 w-full rounded-full bg-[#0F1419] text-white font-medium py-2.5 px-6 hover:bg-black/90 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
                        {isGoogleLoading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <GoogleIcon />}
                        Continue with Google
                      </button>
                      <div className="flex items-center gap-3 my-1">
                        <div className="h-px flex-1 bg-[#EFF3F4]" />
                        <span className="text-[#536471] text-sm">or</span>
                        <div className="h-px flex-1 bg-[#EFF3F4]" />
                      </div>
                      <form onSubmit={handleEmailSignIn}>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email" disabled={isSubmitting}
                          className="w-full rounded-xl border border-[#CFD9DE] px-3 py-3 text-[#0F1419] text-base placeholder:text-[#536471] focus:border-[#1D9BF0] focus:outline-none focus:ring-1 focus:ring-[#1D9BF0] mb-3 disabled:opacity-50" />
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password" disabled={isSubmitting}
                          className="w-full rounded-xl border border-[#CFD9DE] px-3 py-3 text-[#0F1419] text-base placeholder:text-[#536471] focus:border-[#1D9BF0] focus:outline-none focus:ring-1 focus:ring-[#1D9BF0] mb-3 disabled:opacity-50" />
                        <button type="submit" disabled={!email || !password || isSubmitting}
                          className="w-full rounded-full bg-[#1D9BF0] text-white font-bold py-3 px-6 hover:bg-[#1A8CD8] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
                          {isSubmitting ? "Signing in..." : "Sign in"}
                        </button>
                        <div className="mt-2 text-right">
                          <button onClick={() => setMode("forgot")}
                            className="text-[13px] text-[#1D9BF0] hover:underline cursor-pointer">
                            Forgot password?
                          </button>
                        </div>
                      </form>
                    </div>
                    <div className="mt-8 text-center">
                      <p className="text-[#0F1419] text-sm">
                        Don&apos;t have an account?{" "}
                        <button onClick={() => setMode("signup")}
                          className="text-[#1D9BF0] font-bold hover:underline cursor-pointer">Sign up</button>
                      </p>
                    </div>
                  </>
                )}

                {mode === "forgot" && (
                  <>
                    <p className="text-2xl sm:text-3xl font-bold text-[#0F1419] mb-2">Reset your password</p>
                    <p className="text-sm text-[#536471] mb-6">We&apos;ll email you a reset link.</p>
                    <form onSubmit={handleForgotPassword}>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email" disabled={isSubmitting || submitted}
                        className="w-full rounded-xl border border-[#CFD9DE] px-3 py-3 text-[#0F1419] text-base placeholder:text-[#536471] focus:border-[#1D9BF0] focus:outline-none focus:ring-1 focus:ring-[#1D9BF0] mb-3 disabled:opacity-50" />
                      <button type="submit" disabled={!email || isSubmitting || submitted}
                        className="w-full rounded-full bg-[#1D9BF0] text-white font-bold py-3 px-6 hover:bg-[#1A8CD8] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
                        {isSubmitting ? "Sending..." : submitted ? "Email sent!" : "Send reset instructions"}
                      </button>
                    </form>
                    {submitted && (
                      <p className="text-[13px] text-[#536471] mt-3 text-center">
                        Check your inbox for reset instructions.
                      </p>
                    )}
                    <div className="mt-8 text-center">
                      <p className="text-[#0F1419] text-sm">
                        Remembered your password?{" "}
                        <button onClick={() => { setMode("signin"); setSubmitted(false) }}
                          className="text-[#1D9BF0] font-bold hover:underline cursor-pointer">Sign in</button>
                      </p>
                    </div>
                  </>
                )}

                {mode === "change-password" && (
                  <>
                    <p className="text-2xl sm:text-3xl font-bold text-[#0F1419] mb-2">Change your password</p>
                    <p className="text-sm text-[#536471] mb-6">Enter a new password for your account.</p>
                    <form onSubmit={handleChangePassword}>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New Password (min 8 characters)" disabled={isSubmitting}
                        className="w-full rounded-xl border border-[#CFD9DE] px-3 py-3 text-[#0F1419] text-base placeholder:text-[#536471] focus:border-[#1D9BF0] focus:outline-none focus:ring-1 focus:ring-[#1D9BF0] mb-3 disabled:opacity-50" />
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm New Password" disabled={isSubmitting}
                        className="w-full rounded-xl border border-[#CFD9DE] px-3 py-3 text-[#0F1419] text-base placeholder:text-[#536471] focus:border-[#1D9BF0] focus:outline-none focus:ring-1 focus:ring-[#1D9BF0] mb-3 disabled:opacity-50" />
                      <button type="submit" disabled={!newPassword || !confirmPassword || isSubmitting}
                        className="w-full rounded-full bg-[#1D9BF0] text-white font-bold py-3 px-6 hover:bg-[#1A8CD8] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
                        {isSubmitting ? "Updating..." : "Change Password"}
                      </button>
                    </form>
                    <div className="mt-8 text-center">
                      <p className="text-[#0F1419] text-sm">
                        <button onClick={() => window.location.href = "/"}
                          className="text-[#1D9BF0] font-bold hover:underline cursor-pointer">
                          Back to home
                        </button>
                      </p>
                    </div>
                  </>
                )}

                {mode === "verify" && (
                  <>
                    <p className="text-2xl sm:text-3xl font-bold text-[#0F1419] mb-2">Verify your email</p>
                    <p className="text-sm text-[#536471] mb-6">Open the link in your verification email.</p>
                    <div className="bg-[#F7F9FA] border border-[#EFF3F4] rounded-xl p-4 mb-3">
                      <p className="text-[13px] text-[#536471]">
                        We&apos;ve sent you a verification email. Please check your inbox and click the verification link.
                        Don&apos;t forget to check your spam folder.
                      </p>
                    </div>
                    <form onSubmit={handleResendVerify}>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your Email" disabled={isSubmitting}
                        className="w-full rounded-xl border border-[#CFD9DE] px-3 py-3 text-[#0F1419] text-base placeholder:text-[#536471] focus:border-[#1D9BF0] focus:outline-none focus:ring-1 focus:ring-[#1D9BF0] mb-3 disabled:opacity-50" />
                      <button type="submit" disabled={!email || isSubmitting}
                        className="w-full rounded-full bg-[#1D9BF0] text-white font-bold py-3 px-6 hover:bg-[#1A8CD8] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
                        {isSubmitting ? "Sending..." : "Resend Verification Email"}
                      </button>
                    </form>
                    <div className="mt-8 text-center">
                      <p className="text-[#0F1419] text-sm">
                        Already verified?{" "}
                        <button onClick={() => setMode("signin")}
                          className="text-[#1D9BF0] font-bold hover:underline cursor-pointer">Sign in</button>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="hidden lg:flex justify-center items-center">
              <img
                src="https://zcuymmvrohhdocrkjufk.supabase.co/storage/v1/object/public/public-images/brand-assets/PandP_APPicon_5x_high-fidelity-4x.png"
                alt="Prompt & Pause"
                className="w-72 xl:w-80 h-auto opacity-90"
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
