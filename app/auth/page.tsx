"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import AuthenticationCard from "@/components/auth/AuthenticationCard"
import AuthShell from "@/components/auth/AuthShell"
import AnimatedBackground from "@/components/ui/AnimatedBackground"

function AuthPageContent() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")
  const initialStep = mode === "signup" ? "signup" : "login"

  return (
    <AuthShell
      heroEyebrow="Prompt & Pause"
      heroTitle="Pause. Reflect. Grow."
      heroSubtitle="One thoughtful prompt, less than five minutes. Your notebook for when life feels loud."
    >
      <AuthenticationCard initialStep={initialStep} />
    </AuthShell>
  )
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden bg-black">
          <AnimatedBackground />
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 flex-1 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
            </div>
          </div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  )
}
