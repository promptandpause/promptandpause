"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Heart, ArrowRight } from "lucide-react"

export default function GoodByePage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // Check for the account_deleted cookie
    const cookies = document.cookie.split(';').map(c => c.trim())
    const hasGoodbyeCookie = cookies.some(c => c.startsWith('account_deleted='))

    if (!hasGoodbyeCookie) {
      // Not authorized — redirect to homepage
      router.replace('/')
      return
    }

    setAuthorized(true)

    // Clear the cookie after displaying the page
    document.cookie = 'account_deleted=; path=/; max-age=0'
  }, [router])

  if (!authorized) {
    return null
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-6 py-16"
      style={{ background: 'linear-gradient(160deg, #F5F3EE 0%, #EBE9E3 30%, #E2E6DE 60%, #DCE6D9 100%)' }}
    >
      {/* Ambient blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(600px circle at 30% 20%, rgba(111, 169, 132, 0.15), transparent 45%),
              radial-gradient(700px circle at 70% 60%, rgba(213, 230, 217, 0.2), transparent 50%)
            `,
          }}
        />
      </div>

      <div className="max-w-lg w-full text-center space-y-8">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-[#6FA984]/15 border border-[#6FA984]/25 flex items-center justify-center">
          <Heart className="w-9 h-9 text-[#6FA984]" />
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2F3B34]">
            Goodbye & Thank You
          </h1>
          <p className="text-lg text-[#6B7F6E] leading-relaxed">
            Your account and all associated data have been permanently deleted.
          </p>
        </div>

        {/* Confirmation card */}
        <div className="backdrop-blur-xl bg-white/60 border border-[#DCE6D9] rounded-2xl p-6 text-left space-y-3">
          <h2 className="text-sm font-semibold text-[#2F3B34] uppercase tracking-wider">
            What was removed
          </h2>
          <ul className="space-y-2 text-sm text-[#4A5A49]">
            <li className="flex items-start gap-2">
              <span className="text-[#6FA984] mt-0.5">•</span>
              Your profile and account credentials
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#6FA984] mt-0.5">•</span>
              All reflections and journal entries
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#6FA984] mt-0.5">•</span>
              Prompt history and preferences
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#6FA984] mt-0.5">•</span>
              Subscription and billing data
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#6FA984] mt-0.5">•</span>
              Any connected integrations
            </li>
          </ul>
        </div>

        {/* Email notice */}
        <p className="text-sm text-[#6B7F6E]">
          A confirmation email has been sent to your address.
        </p>

        {/* Message */}
        <div className="backdrop-blur-xl bg-white/40 border border-[#DCE6D9] rounded-2xl p-6">
          <p className="text-[#4A5A49] leading-relaxed italic">
            "We appreciate the time you spent reflecting with us. We hope it brought you some moments of calm and clarity. You're always welcome back."
          </p>
          <p className="text-sm text-[#6B7F6E] mt-3 font-medium">
            — The Prompt & Pause Team
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#6FA984] hover:bg-[#5A8F6E] text-white rounded-xl font-medium transition-colors"
          >
            Visit Homepage
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#DCE6D9] hover:border-[#6FA984] text-[#2F3B34] rounded-xl font-medium transition-colors"
          >
            Create New Account
          </Link>
        </div>

        {/* Footer */}
        <div className="pt-8">
          <p className="text-xs text-[#6B7F6E]/60">
            Pause. Reflect. Grow.
          </p>
          <p className="text-xs text-[#6B7F6E]/40 mt-1">
            © 2026 Prompt & Pause. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
