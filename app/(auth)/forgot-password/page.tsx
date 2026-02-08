"use client"
import { useState } from "react"
import AuthShell from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"

const cardClasses = "rounded-3xl border border-[#DCE6D9] bg-white/90 shadow-[0_35px_120px_rgba(47,59,52,0.08)] p-6 sm:p-8"

export default function ForgotPasswordPage() {
  const supabase = getSupabaseClient()
  const { toast } = useToast()
  const [showOptions, setShowOptions] = useState(false)
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  return (
    <AuthShell>
      <div className={cardClasses}>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[#2F3B34]">Reset your password</h1>
            <p className="text-xs text-[#6B7F6E]">We'll email you a reset link.</p>
          </div>

          <div className="space-y-4">
            <Button
              className="h-11 w-full rounded-xl shadow-none bg-transparent text-[#6B7F6E]/80 hover:text-[#6B7F6E] hover:bg-white/10 transition-colors duration-200 ease flex items-center justify-center border border-[#4A5A49]/30"
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
                    className="h-11 w-full bg-white border border-[#DCE6D9] outline-none px-3 rounded-xl shadow-sm focus:ring-2 focus:ring-[#6FA984]/20 text-[#2F3B34] placeholder:text-[#6B7F6E] disabled:opacity-50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || submitted}
                    required
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || submitted}
                    className="h-11 w-full rounded-xl bg-[#6FA984] text-white hover:bg-[#5A8F6E] transition-colors duration-200 ease disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-[#6FA984] border-t-transparent rounded-full"></div>
                        Sending...
                      </div>
                    ) : submitted ? (
                      "Email sent!"
                    ) : (
                      "Send reset instructions"
                    )}
                  </Button>

                  {submitted && (
                    <div className="text-xs text-[#6B7F6E] text-center">
                      Check your inbox for reset instructions. You can close this page.
                    </div>
                  )}
                </div>
              </form>
            </div>

            <p className="text-center text-xs text-[#6B7F6E]">
              Remembered your password?{' '}
              <a href="/login" className="underline hover:text-[#6FA984] transition-colors duration-200 ease">
                Back to Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </AuthShell>
  )
}
