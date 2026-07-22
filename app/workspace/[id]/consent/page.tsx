"use client"

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { Loader2 } from 'lucide-react'

export default function ConsentPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const orgId = params.id as string
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function giveConsent() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/org/${orgId}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consented: true }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error || 'Something went wrong')
      } else {
        window.location.href = `/workspace/${orgId}`
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`max-w-xl mx-auto px-4 py-16 ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
      <h1 className="text-2xl font-bold mb-2">Workspace analytics consent</h1>
      <p className={`text-sm mb-6 ${isDark ? 'text-white/60' : 'text-[#536471]'}`}>
        Your workspace admin can see aggregate engagement data for the team. This page explains exactly what is and isn't included.
      </p>

      <div className={`space-y-4 text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-[#0F1419]'}`}>
        <div className={`p-4 rounded-xl border ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-[#EFF3F4] bg-[#F7F9FA]'}`}>
          <h2 className="font-semibold mb-1">What we track</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Whether you were active on a given day.</li>
            <li>How many reflections the workspace wrote that day.</li>
            <li>The average mood score across the workspace that day.</li>
          </ul>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-[#EFF3F4] bg-[#F7F9FA]'}`}>
          <h2 className="font-semibold mb-1">What we never track</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your reflection content is never shown to admins or other members.</li>
            <li>You are never individually identified in any aggregate number.</li>
            <li>If fewer than 5 members are active on a day, that day shows "Not enough data yet".</li>
          </ul>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-4">{error}</p>
      )}

      <button
        onClick={giveConsent}
        disabled={submitting}
        className="mt-8 w-full py-2.5 rounded-full text-sm font-semibold bg-[#1D9BF0] text-white hover:bg-[#1A8CD8] transition-colors disabled:opacity-60"
      >
        {submitting ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span> : 'Opt in to workspace analytics'}
      </button>
    </div>
  )
}
