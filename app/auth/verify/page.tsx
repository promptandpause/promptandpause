"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function VerifyPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const { toast } = useToast()
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
  }, [])

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
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center" style={{backgroundColor: '#F2F0EF'}}>
        <div className="w-full max-w-sm space-y-6 px-4">
          <div className="text-center">
            <h1 className="text-lg font-medium tracking-tight">Verify Your Email</h1>
            <p className="text-xs text-muted-foreground">
              {verifying ? "Checking verification status..." : verified ? "Your email has been verified!" : "Click the link in your verification email"}
            </p>
          </div>
          
          {verifying ? (
            <div className="text-center py-4">
              <div className="animate-spin h-8 w-8 border-2 border-neutral-900 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-xs text-muted-foreground">Verifying...</p>
            </div>
          ) : verified ? (
            <div className="text-center py-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-green-700 mb-2">Email verified successfully!</p>
              <p className="text-xs text-muted-foreground">Redirecting to onboarding...</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="text-center py-4 px-4 bg-muted/50 rounded">
                  <p className="text-xs text-muted-foreground mb-2">
                    We've sent you a verification email. Please check your inbox and click the verification link.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Don't forget to check your spam folder if you don't see it.
                  </p>
                </div>
                
                <Button
                  className="h-11 w-full rounded-none shadow-none bg-muted text-muted-foreground hover:bg-muted/80 transition-colors duration-200 ease flex items-center justify-center"
                  type="button"
                  aria-expanded={showOptions}
                  onClick={() => setShowOptions(o => !o)}
                >
                  {showOptions ? "Hide" : "Show"} resend options
                </Button>
                
                <div className={`overflow-hidden transition-all duration-300 ${showOptions ? 'max-h-52 opacity-100 mt-4' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                  <form onSubmit={handleResendEmail}>
                    <input
                      type="email"
                      placeholder="Your Email"
                      className="h-11 w-full bg-white border outline-none px-3 rounded shadow-sm focus:ring-2 mb-2 disabled:opacity-50"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={isResending}
                      required
                    />
                    <Button 
                      type="submit" 
                      disabled={isResending}
                      className="h-11 w-full rounded bg-neutral-900 text-neutral-50 hover:bg-neutral-800 transition-colors duration-200 ease mb-2 disabled:opacity-50"
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
                  </form>
                </div>
              </div>
              
              <p className="text-center text-xs text-muted-foreground">
                Already verified?{' '}
                <a href="/auth/signin" className="underline hover:text-neutral-900 transition-colors duration-200 ease">Back to Login</a>
              </p>
            </>
          )}
        </div>
      </div>
      <div className="hidden lg:flex lg:w-1/2 h-full items-center justify-center bg-white">
        <DotLottieReact
          src="https://lottie.host/2dcd8b98-5feb-4f95-baca-5552a6eb4b1f/s3mk2bKMoJ.lottie"
          loop
          autoplay
          style={{ width: '80%', height: '80%' }}
        />
      </div>
    </main>
  );
}
