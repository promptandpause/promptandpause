"use client"

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { Users, ShieldCheck, Lock } from 'lucide-react'

export default function AcceptInvitePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function accept() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/org/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error || 'Something went wrong')
        setSubmitting(false)
        return
      }
      router.push(`/workspace/${body.organizationId}`)
    } catch {
      setError('Something went wrong. Try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-6 ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}>
      <div className={`max-w-sm w-full text-center p-6 rounded-2xl border ${isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-[#F7F9FA] border-[#EFF3F4]'}`}>
        <div className={`h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-[#1D9BF0]/20' : 'bg-[#1D9BF0]/10'}`}>
          <Users className="h-6 w-6 text-[#1D9BF0]" />
        </div>

        <h1 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
          You've been invited to a workspace
        </h1>
        <p className={`text-sm mb-5 ${isDark ? 'text-white/50' : 'text-[#536471]'}`}>
          Make sure you're signed in with the email address the invite was sent to before accepting.
        </p>

        <div className={`text-left text-xs rounded-xl p-3.5 mb-5 flex gap-2.5 ${isDark ? 'bg-white/[0.03] text-white/50' : 'bg-white text-[#536471]'}`}>
          <Lock className="h-4 w-4 shrink-0 mt-0.5 text-[#1D9BF0]" />
          <span>
            Joining a workspace never changes what's visible in your personal reflections. Workspace admins can only
            ever see your name, email, and whether you've been active \u2014 never what you write.
          </span>
        </div>

        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

        <button
          onClick={accept}
          disabled={submitting}
          className="w-full py-2.5 rounded-full text-sm font-semibold bg-[#1D9BF0] text-white hover:bg-[#1A8CD8] transition-colors disabled:opacity-60"
        >
          {submitting ? 'Joining\u2026' : 'Accept invite'}
        </button>
      </div>
    </div>
  )
}
