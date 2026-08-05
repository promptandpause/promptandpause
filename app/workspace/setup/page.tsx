"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

// Stripe redirects here immediately after checkout, but the organization
// row itself is only created once the webhook fires -- which can lag the
// redirect by a couple of seconds. This page polls setup-status until the
// org shows up, then forwards to it.
export default function WorkspaceSetupPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<'polling' | 'ready' | 'canceled' | 'error'>('polling')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('canceled')) {
      setStatus('canceled')
      return
    }

    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      setStatus('error')
      setErrorMsg('Missing checkout session')
      return
    }

    let attempts = 0
    const maxAttempts = 15 // ~30s at 2s intervals

    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/org/setup-status?session_id=${encodeURIComponent(sessionId)}`)
        const body = await res.json()

        if (!res.ok) {
          clearInterval(interval)
          setStatus('error')
          setErrorMsg(body.error || 'Something went wrong')
          return
        }

        if (body.ready) {
          clearInterval(interval)
          setStatus('ready')
          setTimeout(() => router.push(`/workspace/${body.organization.id}`), 1000)
          return
        }
      } catch {}

      if (attempts >= maxAttempts) {
        clearInterval(interval)
        setStatus('error')
        setErrorMsg("This is taking longer than expected. If your payment went through, refresh this page in a minute.")
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [searchParams, router])

  return (
    <div className={`min-h-screen flex items-center justify-center px-6 ${isDark ? 'bg-[#0A0E18]' : 'bg-[#F9FBFB]'}`}>
      <div className="text-center max-w-sm">
        {status === 'polling' && (
          <>
            <Loader2 className={`h-8 w-8 mx-auto mb-4 animate-spin ${isDark ? 'text-indigo-600' : 'text-indigo-600'}`} />
            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Setting up your workspace\u2026</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>This only takes a few seconds.</p>
          </>
        )}
        {status === 'ready' && (
          <>
            <CheckCircle2 className="h-8 w-8 mx-auto mb-4 text-emerald-500" />
            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Your workspace is ready</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Taking you there now\u2026</p>
          </>
        )}
        {status === 'canceled' && (
          <>
            <p className={`text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Checkout canceled</p>
            <Link href="/workspace" className="text-sm text-indigo-600 hover:underline">
              Back to workspaces
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{errorMsg}</p>
            <Link href="/workspace" className="text-sm text-indigo-600 hover:underline">
              Back to workspaces
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
