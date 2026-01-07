"use client"
import { useState } from "react";
import { AuthLottie } from "../_components/auth-lottie";
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
                <h1 className="text-2xl font-semibold tracking-tight text-white">Reset your password</h1>
                <p className="text-xs text-white/70">We’ll email you a reset link.</p>
              </div>

              <div className="space-y-4">
                <Button
                  className="h-11 w-full rounded-xl shadow-none bg-transparent text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200 ease flex items-center justify-center border border-white/20"
                  type="button"
                  aria-expanded={showOptions}
                  onClick={() => setShowOptions((o) => !o)}
                >
                  {showOptions ? "Hide" : "Show"} reset form
                </Button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    showOptions ? 'max-h-60 opacity-100 mt-4' : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <form
                    onSubmit={async (e) => {
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
                          redirectTo: `${window.location.origin}/change-password`,
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
                    }}
                  >
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Email"
                        className="h-11 w-full bg-white/10 border border-white/20 outline-none px-3 rounded-xl shadow-sm focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/50 disabled:opacity-50"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading || submitted}
                        required
                      />
                      <Button
                        type="submit"
                        disabled={isLoading || submitted}
                        className="h-11 w-full rounded-xl bg-white text-black hover:bg-white/90 transition-colors duration-200 ease disabled:opacity-50"
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

                      {submitted && (
                        <div className="text-xs text-white/70 text-center">
                          Check your inbox for reset instructions. You can close this page.
                        </div>
                      )}
                    </div>
                  </form>
                </div>

                <p className="text-center text-xs text-white/70">
                  Remembered your password?{' '}
                  <a href="/login" className="underline hover:text-white transition-colors duration-200 ease">
                    Back to Login
                  </a>
                </p>
              </div>
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
