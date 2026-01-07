"use client"
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GradientCanvas } from "../gradient-canvas";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function VerifyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = useMemo(() => getSupabaseClient(), [])
  const [showOptions, setShowOptions] = useState(false)
  const [email, setEmail] = useState("");
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Check if user is already verified from URL params or session
  useEffect(() => {
    async function checkVerification() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && user.email_confirmed_at) {
        setVerified(true)
        toast({
          title: "Email verified!",
          description: "Your email has been verified successfully.",
        })
        // Redirect to onboarding after 2 seconds
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
    <main className="w-screen h-screen flex">
      <div className="relative w-full lg:w-1/2 h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#07121a] via-[#081820] to-[#143521]">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 w-full max-w-sm px-4">
          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl shadow-2xl sm:p-8">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-white">Verify your email</h1>
                <p className="text-xs text-white/70">
                  {verifying
                    ? "Checking verification status..."
                    : verified
                      ? "Your email has been verified."
                      : "Open the link in your verification email."}
                </p>
              </div>

              {verifying ? (
                <div className="text-center py-4">
                  <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-xs text-white/70">Verifying...</p>
                </div>
              ) : verified ? (
                <div className="text-center py-4">
                  <div className="h-16 w-16 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-white mb-2">Email verified.</p>
                  <p className="text-xs text-white/70">Redirecting to onboarding...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4 px-4 bg-white/10 border border-white/15 rounded-xl">
                    <p className="text-xs text-white/70 mb-2">
                      We've sent you a verification email. Please check your inbox and click the verification link.
                    </p>
                    <p className="text-xs text-white/70">
                      Don't forget to check your spam folder if you don't see it.
                    </p>
                  </div>

                  <Button
                    className="h-11 w-full rounded-xl shadow-none bg-transparent text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200 ease flex items-center justify-center border border-white/20"
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
                          className="h-11 w-full bg-white/10 border border-white/20 outline-none px-3 rounded-xl shadow-sm focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/50 disabled:opacity-50"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isResending}
                          required
                        />
                        <Button
                          type="submit"
                          disabled={isResending}
                          className="h-11 w-full rounded-xl bg-white text-black hover:bg-white/90 transition-colors duration-200 ease disabled:opacity-50"
                        >
                          {isResending ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                              Sending...
                            </div>
                          ) : (
                            "Resend Verification Email"
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>

                  <p className="text-center text-xs text-white/70">
                    Already verified?{' '}
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
      <div className="hidden lg:block lg:w-1/2 h-full bg-black">
        <GradientCanvas />
      </div>
    </main>
  );
}
