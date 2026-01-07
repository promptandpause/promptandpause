"use client"

import { Suspense } from 'react'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Navigation from '../../Navigation'
import Footer from '../../footer'

type RedeemResult = {
  success: boolean
  message?: string
  subscription_end_date?: string
  duration_months?: number
  error?: string
}

function GiftRedeemContent() {
  const searchParams = useSearchParams()

  const initialToken = useMemo(() => {
    const t = searchParams.get('token') || ''
    return t.trim()
  }, [searchParams])

  const [token, setToken] = useState(initialToken)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RedeemResult | null>(null)
  const [httpStatus, setHttpStatus] = useState<number | null>(null)

  useEffect(() => {
    setToken((prev) => (prev ? prev : initialToken))
  }, [initialToken])

  const trimmedToken = token.trim()
  const tokenLooksValid = trimmedToken.length === 32

  const loginHref = useMemo(() => {
    const nextUrl = token ? `/gifts/redeem?token=${encodeURIComponent(trimmedToken)}` : '/gifts/redeem'
    return `/login?next=${encodeURIComponent(nextUrl)}`
  }, [token, trimmedToken])

  const endDateLabel = useMemo(() => {
    if (!result?.subscription_end_date) return null
    const d = new Date(result.subscription_end_date)
    if (Number.isNaN(d.getTime())) return result.subscription_end_date
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }, [result?.subscription_end_date])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()

    setResult(null)
    setHttpStatus(null)

    if (!tokenLooksValid) {
      setResult({ success: false, error: 'Please enter the 32-character gift code.' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/gifts/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemption_token: trimmedToken }),
      })

      setHttpStatus(res.status)

      const json = (await res.json().catch(() => null)) as RedeemResult | null

      if (!res.ok) {
        setResult({
          success: false,
          error: json?.error || 'Unable to redeem this gift right now. Please try again.',
        })
        return
      }

      setResult(json || { success: true, message: 'Gift redeemed successfully.' })
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Unexpected error. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white text-black">
        <div className="pt-28 pb-16 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6 sm:p-10">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Redeem your gift</h1>
              <p className="mt-3 text-neutral-600 leading-relaxed">
                Enter the 32-character gift code from your email. You’ll need to be signed in to apply the gift to your
                account.
              </p>

              <form onSubmit={onSubmit} className="mt-8 space-y-4">
                <label className="block">
                  <span className="block text-sm font-medium text-neutral-700">Gift code</span>
                  <input
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste your 32-character code"
                    inputMode="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 font-mono text-sm tracking-wider outline-none focus:ring-2 focus:ring-black/10"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                    <span>Length: {trimmedToken.length}/32</span>
                    <button
                      type="button"
                      onClick={() => {
                        setToken('')
                        setResult(null)
                        setHttpStatus(null)
                      }}
                      className="underline underline-offset-4 hover:text-black"
                    >
                      Clear
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-black text-white px-5 py-3 font-medium hover:bg-neutral-800 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Redeeming…' : 'Redeem gift'}
                </button>
              </form>

              {httpStatus === 401 && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-900">
                    You need to sign in before you can redeem a gift.
                  </p>
                  <div className="mt-3">
                    <Link
                      href={loginHref}
                      className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                      Go to login
                    </Link>
                  </div>
                </div>
              )}

              {result && (
                <div
                  className={`mt-6 rounded-2xl border p-4 ${
                    result.success
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-red-200 bg-red-50 text-red-900'
                  }`}
                >
                  <p className="text-sm leading-relaxed">
                    {result.success ? result.message || 'Gift redeemed successfully.' : result.error || 'Something went wrong.'}
                  </p>

                  {result.success && (
                    <div className="mt-3 text-sm text-emerald-900/90 space-y-1">
                      {typeof result.duration_months === 'number' && (
                        <p>
                          Gift applied: <span className="font-medium">{result.duration_months} month{result.duration_months === 1 ? '' : 's'}</span>
                        </p>
                      )}
                      {endDateLabel && (
                        <p>
                          Active until: <span className="font-medium">{endDateLabel}</span>
                        </p>
                      )}
                      <div className="pt-2">
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                        >
                          Go to dashboard
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-10 border-t border-neutral-200 pt-6">
                <h2 className="text-base font-semibold">Need help?</h2>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  If your code isn’t working, double-check that you copied all 32 characters (no spaces). If it still
                  fails, contact support and include the email you received the gift on.
                </p>
                <div className="mt-3">
                  <Link href="/contact" className="text-sm font-medium underline underline-offset-4 hover:text-black">
                    Contact support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function GiftRedeemPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    }>
      <GiftRedeemContent />
    </Suspense>
  )
}
