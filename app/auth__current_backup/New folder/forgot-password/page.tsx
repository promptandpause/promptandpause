"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"
import AuthShell from "@/components/auth/AuthShell"
import NoSSR from "@/components/auth/NoSSR"
import { Suspense } from "react"
import { Mail, Check } from "lucide-react"

function ForgotPasswordPageContent() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/change-password`,
      })

      if (error) throw error

      setIsSent(true)
      toast({
        title: "Reset Email Sent",
        description: "Check your inbox for password reset instructions",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <AuthShell
        heroEyebrow="Prompt & Pause"
        heroTitle="Check Your Email"
        heroSubtitle="We've sent password reset instructions to your inbox"
      >
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-4">Email Sent!</h2>
          <p className="text-white/70 mb-6">
            We've sent a password reset link to <strong>{email}</strong>. 
            Please check your email and follow the instructions.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40"
            >
              Back to Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsSent(false)
                setEmail("")
              }}
              className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              Send Another Email
            </Button>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      heroEyebrow="Prompt & Pause"
      heroTitle="Reset Password"
      heroSubtitle="Enter your email to receive password reset instructions"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/70">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/90">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
              placeholder="Enter your email"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/login")}
            className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
          >
            Back to Sign In
          </Button>
        </form>
      </div>
    </AuthShell>
  )
}

export default function ForgotPasswordPage() {
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
      <ForgotPasswordPageContent />
    </Suspense>
  )
}
