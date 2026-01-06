"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, ArrowLeft, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"
import AuthShell from "@/components/auth/AuthShell"
import NoSSR from "@/components/auth/NoSSR"
import { Suspense } from "react"

function VerifyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseClient()
  const { toast } = useToast()
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`)
        nextInput?.focus()
      }
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const otpCode = otp.join("")
    if (otpCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter all 6 digits",
        variant: "destructive"
      })
      return
    }

    if (!email) {
      toast({
        title: "Error", 
        description: "Email is required",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup'
      })

      if (error) throw error

      setIsVerified(true)
      toast({
        title: "Success! 🎉",
        description: "Your email has been verified successfully.",
      })
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => router.push('/onboarding'), 2000)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid verification code",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerified) {
    return (
      <AuthShell
        heroEyebrow="Prompt & Pause"
        heroTitle="Email Verified!"
        heroSubtitle="Your account is ready to use"
      >
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/70 mb-6">Redirecting you to get started...</p>
          <Button
            onClick={() => router.push('/onboarding')}
            className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40"
          >
            Get Started Now
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      heroEyebrow="Prompt & Pause"
      heroTitle="Verify Your Email"
      heroSubtitle="Enter the 6-digit code sent to your email"
    >
      <div className="w-full max-w-md">
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/90">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                placeholder="your@email.com"
                required
                readOnly={!!searchParams.get('email')}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-white/90 text-center block">
              Verification Code
            </Label>
            <div className="flex gap-2 justify-center">
              {otp.map((_, index) => (
                <Input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  value={otp[index]}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className="w-12 h-12 text-center bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                  required
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || otp.join("").length !== 6}
            className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 disabled:opacity-50"
          >
            {isLoading ? "Verifying..." : "Verify Email"}
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

export default function VerifyPage() {
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
      <VerifyPageContent />
    </Suspense>
  )
}