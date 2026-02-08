"use client"

import { Suspense } from "react"
import AuthShell from "@/components/auth/AuthShell"
import { LoginForm } from "../_components/login-form"

const cardClasses = "rounded-3xl border border-[#DCE6D9] bg-white/90 shadow-[0_35px_120px_rgba(47,59,52,0.08)] p-6 sm:p-8"

export default function LoginPage() {
  return (
    <AuthShell>
      <div className={cardClasses}>
        <Suspense fallback={<div className="text-[#6B7F6E] text-center text-sm">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </AuthShell>
  )
}
