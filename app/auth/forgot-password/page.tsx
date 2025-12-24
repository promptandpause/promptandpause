"use client"
import { useState } from "react";
import { GradientCanvas } from "../gradient-canvas";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = getSupabaseClient()
  const { toast } = useToast()
  const [showOptions, setShowOptions] = useState(false)
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  return (
    <main className="w-screen h-screen flex">
      <div className="w-full lg:w-1/2 h-screen flex items-center justify-center bg-white">
        <div className="w-full max-w-sm space-y-6 px-4">
          <div className="text-center">
            <h1 className="text-lg font-medium tracking-tight">Reset Your Password</h1>
            <p className="text-xs text-muted-foreground">We'll send you instructions to reset your password</p>
          </div>
          <Button
            className="h-11 w-full rounded-none shadow-none bg-muted text-muted-foreground hover:bg-muted/80 transition-colors duration-200 ease flex items-center justify-center"
            type="button"
            aria-expanded={showOptions}
            onClick={() => setShowOptions(o => !o)}
          >
            {showOptions ? "Hide" : "Show"} reset form
          </Button>
          <div className={`overflow-hidden transition-all duration-300 ${showOptions ? 'max-h-52 opacity-100 mt-4' : 'max-h-0 opacity-0 pointer-events-none'}`}>
            <form onSubmit={async (e) => {
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
                setIsLoading(true)
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/auth/change-password`,
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
                setIsLoading(false)
              }
            }}>
              <input
                type="email"
                placeholder="Email"
                className="h-11 w-full bg-white border outline-none px-3 rounded shadow-sm focus:ring-2 mb-2 disabled:opacity-50"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading || submitted}
                required
              />
              <Button 
                type="submit" 
                disabled={isLoading || submitted}
                className="h-11 w-full rounded bg-neutral-900 text-neutral-50 hover:bg-neutral-800 transition-colors duration-200 ease mb-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Sending...
                  </div>
                ) : submitted ? (
                  "Email sent!"
                ) : (
                  "Send reset instructions"
                )}
              </Button>
            </form>
            {submitted && (
              <div className="text-xs text-green-700 text-center mt-2">
                Check your inbox for reset instructions. You can close this page.
              </div>
            )}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Remembered your password?{' '}
            <a href="/auth/signin" className="underline hover:text-neutral-900 transition-colors duration-200 ease">Back to Login</a>
          </p>
        </div>
      </div>
      <div className="hidden lg:block lg:w-1/2 h-screen">
        <GradientCanvas />
      </div>
    </main>
  );
}
