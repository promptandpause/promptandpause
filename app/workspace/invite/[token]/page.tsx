"use client"

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { Users, ShieldCheck, Lock } from 'lucide-react'

type ErrorKind = 'none' | 'wrongEmail' | 'notSignedIn' | 'expired' | 'invalid' | 'generic'

export default function AcceptInvitePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<ErrorKind>('none')

  const next = typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''
  const signInHref = `/?next=${next}#mode=signin`
  const signUpHref = `/?next=${next}#mode=signup`

  async function accept() {
    setSubmitting(true)
    setError(null)
    setErrorKind('none')
    try {
      const res = await fetch('/api/org/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const body = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          setError('Please sign in with the email address the invite was sent to before accepting.')
          setErrorKind('notSignedIn')
        } else if (body.error === 'This invite was sent to a different email address') {
          setError('You\u2019re signed in with a different email address than the invite was sent to.')
          setErrorKind('wrongEmail')
        } else if (body.error === 'This invite has expired') {
          setError('This invite has expired. Ask a workspace admin to resend it.')
          setErrorKind('expired')
        } else if (body.error === 'This invite is invalid or has already been used') {
          setError('This invite is invalid or has already been used.')
          setErrorKind('invalid')
        } else {
          setError(body.error || 'Something went wrong')
          setErrorKind('generic')
        }
        setSubmitting(false)
        return
      }
      router.push(`/workspace/${body.organizationId}`)
    } catch {
      setError('Something went wrong. Try again.')
      setErrorKind('generic')
      setSubmitting(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-6 ${isDark ? 'bg-[#0A0E18]' : 'bg-[#F9FBFB]'}`}>
      <div className={`max-w-sm w-full text-center p-6 rounded-2xl border ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-slate-100'}`}>
        <div className={`h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-500/10'}`}>
          <Users className="h-6 w-6 text-indigo-600" />
        </div>

        <h1 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          You've been invited to a workspace
        </h1>
        <p className={`text-sm mb-5 ${isDark ? 'text-white/50' : 'text-slate-600'}`}>
          Accept the invite to start reflecting with your team.
        </p>

        {error && (
          <p className={`text-xs mb-4 ${isDark ? 'text-red-400' : 'text-red-500'}`}>{error}</p>
        )}

        {(errorKind === 'notSignedIn' || errorKind === 'wrongEmail') && (
          <div className="flex flex-col gap-2 mb-5">
            <a
              href={signInHref}
              className="w-full py-2.5 rounded-full text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            >
              Sign in with the invited email
            </a>
            <a
              href={signUpHref}
              className={`w-full py-2.5 rounded-full text-sm font-semibold transition-colors ${isDark ? 'bg-white/[0.06] text-white hover:bg-white/[0.1]' : 'bg-white text-slate-900 hover:bg-slate-100 border border-slate-200'}`}
            >
              Create an account with that email
            </a>
          </div>
        )}

        <div className={`text-left text-xs rounded-xl p-3.5 mb-5 flex gap-2.5 ${isDark ? 'bg-white/[0.03] text-white/50' : 'bg-white text-slate-600'}`}>
          <Lock className="h-4 w-4 shrink-0 mt-0.5 text-indigo-600" />
          <span>
            Joining a workspace never changes what&apos;s visible in your personal reflections. Workspace admins can only
            ever see your name, email, and whether you&apos;ve been active — never what you write.
          </span>
        </div>

        <button
          onClick={accept}
          disabled={submitting}
          className="w-full py-2.5 rounded-full text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-60"
        >
          {submitting ? 'Joining\u2026' : 'Accept invite'}
        </button>
      </div>
    </div>
  )
}
