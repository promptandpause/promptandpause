"use client"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import AuthShell from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"

const cardClasses = "rounded-3xl border border-[#DCE6D9] bg-white/90 shadow-[0_35px_120px_rgba(47,59,52,0.08)] p-6 sm:p-8"

export default function VerifyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = useMemo(() => getSupabaseClient(), [])
  const [showOptions, setShowOptions] = useState(false)
  const [email, setEmail] = useState("");
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    async function checkVerification() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && user.email_confirmed_at) {
        setVerified(true)
        toast({
          title: "Email verified!",
          description: "Your email has been verified successfully.",
        })
        setTimeout(() => router.push('/onboarding'), 2000)
      } else {
        setVerifying(false)
      }
    }
    checkVerification()
  }, [router, supabase, toast])

  async function handleResendEmail(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsResending(true)
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })
      
      if (error) throw error
      
      toast({
        title: "Email sent",
        description: "We've resent the verification email. Please check your inbox.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthShell>
      <div className={cardClasses}>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[#2F3B34]">Verify your email</h1>
            <p className="text-xs text-[#6B7F6E]">
              {verifying
                ? "Checking verification status..."
                : verified
                  ? "Your email has been verified."
                  : "Open the link in your verification email."}
            </p>
          </div>

          {verifying ? (
            <div className="text-center py-4">
              <div className="animate-spin h-8 w-8 border-2 border-[#6FA984] border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-xs text-[#6B7F6E]">Verifying...</p>
            </div>
          ) : verified ? (
            <div className="text-center py-4">
              <div className="h-16 w-16 rounded-full bg-[#6FA984]/20 border border-[#6FA984]/30 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                <svg className="h-8 w-8 text-[#6FA984]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-[#2F3B34] mb-2">Email verified.</p>
              <p className="text-xs text-[#6B7F6E]">Redirecting to onboarding...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-4 px-4 bg-[#F5F3EE] border border-[#DCE6D9] rounded-xl">
                <p className="text-xs text-[#6B7F6E] mb-2">
                  We've sent you a verification email. Please check your inbox and click the verification link.
                </p>
                <p className="text-xs text-[#6B7F6E]">
                  Don't forget to check your spam folder if you don't see it.
                </p>
              </div>

              <Button
                className="h-11 w-full rounded-xl shadow-none bg-transparent text-[#6B7F6E]/80 hover:text-[#6B7F6E] hover:bg-white/10 transition-colors duration-200 ease flex items-center justify-center border border-[#4A5A49]/30"
                type="button"
                aria-expanded={showOptions}
                onClick={() => setShowOptions((o) => !o)}
              >
                {showOptions ? "Hide" : "Show"} resend options
              </Button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  showOptions ? 'max-h-60 opacity-100 mt-4' : 'max-h-0 opacity-0 pointer-events-none'
                }`}
              >
                <form onSubmit={handleResendEmail}>
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="Your Email"
                      className="h-11 w-full bg-white border border-[#DCE6D9] outline-none px-3 rounded-xl shadow-sm focus:ring-2 focus:ring-[#6FA984]/20 text-[#2F3B34] placeholder:text-[#6B7F6E] disabled:opacity-50"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isResending}
                      required
                    />
                    <Button
                      type="submit"
                      disabled={isResending}
                      className="h-11 w-full rounded-xl bg-[#6FA984] text-white hover:bg-[#5A8F6E] transition-colors duration-200 ease disabled:opacity-50"
                    >
                      {isResending ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-[#6FA984] border-t-transparent rounded-full"></div>
                          Sending...
                        </div>
                      ) : (
                        "Resend Verification Email"
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              <p className="text-center text-xs text-[#6B7F6E]">
                Already verified?{' '}
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
