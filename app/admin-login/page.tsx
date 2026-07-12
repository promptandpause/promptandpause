'use client'

import { Suspense } from 'react'
import { useCallback, useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function sanitizeRedirectPath(raw: string | null): string {
  const fallback = '/admin-panel'
  if (!raw) return fallback
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback
  if (/[:\\/]{2}/.test(raw)) return fallback
  if (!raw.startsWith('/admin-panel') && !raw.startsWith('/admin-login')) return fallback
  return raw
}

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password')
  const hasCheckedAuthRef = useRef(false)

  const redirectPath = sanitizeRedirectPath(searchParams.get('redirect'))

  const checkExistingAuth = useCallback(async () => {
    if (hasCheckedAuthRef.current) return
    hasCheckedAuthRef.current = true
    try {
      const otpResponse = await fetch('/api/admin/check-session')
      if (otpResponse.ok) {
        const otpData = await otpResponse.json()
        if (otpData.authenticated) { router.push(redirectPath); return }
      }
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const response = await fetch('/api/admin/verify-access')
        const data = await response.json()
        if (data.hasAccess) { router.push(redirectPath); return }
      }
    } catch (error) { console.error('Auth check failed:', error) }
    finally { setCheckingAuth(false) }
  }, [redirectPath, router])

  useEffect(() => { checkExistingAuth() }, [checkExistingAuth])

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (!email.endsWith('@promptandpause.com')) {
        setError('Admin access is restricted to @promptandpause.com email addresses'); setLoading(false); return
      }
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError(signInError.message); setLoading(false); return }
      if (!data.user) { setError('Authentication failed'); setLoading(false); return }
      const verifyResponse = await fetch('/api/admin/verify-access')
      const verifyData = await verifyResponse.json()
      if (!verifyData.hasAccess) { await supabase.auth.signOut(); setError('Access denied'); setLoading(false); return }
      router.push(redirectPath); router.refresh()
    } catch (error: any) { setError(error.message || 'An unexpected error occurred'); setLoading(false) }
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (!email.endsWith('@promptandpause.com')) { setError('Access restricted'); setLoading(false); return }
      const response = await fetch('/api/admin/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await response.json()
      if (!response.ok) { setError(data.error || 'Failed to send code'); setLoading(false); return }
      setCodeSent(true)
    } catch (err: any) { setError(err.message || 'Failed to send code') }
    finally { setLoading(false) }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (!email || !otp) { setError('Email and code are required'); setLoading(false); return }
      const response = await fetch('/api/admin/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp }) })
      const data = await response.json()
      if (!response.ok) { setError(data.error || 'Invalid code'); setLoading(false); return }
      router.push(redirectPath)
    } catch (err: any) { setError(err.message || 'Failed to verify code') }
    finally { setLoading(false) }
  }

  const switchMethod = () => {
    setLoginMethod(loginMethod === 'password' ? 'otp' : 'password')
    setError(''); setCodeSent(false); setOtp(''); setPassword('')
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Checking authentication...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20 mb-5">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Admin Panel</h1>
          <p className="text-sm text-slate-500">Prompt & Pause</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl">
          <div className="p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
              <p className="text-sm text-slate-500 mt-1">
                {loginMethod === 'password' ? 'Restricted to @promptandpause.com accounts' : 'Receive a one-time code via email'}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {loginMethod === 'password' ? (
              <form onSubmit={handlePasswordLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input id="email" type="email" placeholder="admin@promptandpause.com" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required disabled={loading} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input id="password" type="password" placeholder="Enter your password" value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required disabled={loading} />
                  </div>
                </div>
                <Button type="submit" disabled={loading}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-blue-500/20 transition-all">
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in...</> : 'Sign In'}
                </Button>
              </form>
            ) : (
              <form onSubmit={codeSent ? handleVerifyCode : handleSendCode} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otp-email" className="text-sm font-medium text-slate-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input id="otp-email" type="email" placeholder="admin@promptandpause.com" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required disabled={loading || codeSent} />
                  </div>
                </div>
                {codeSent && (
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm font-medium text-slate-700">6-digit Code</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input id="otp" type="text" placeholder="000000" value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="h-11 pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl text-lg tracking-[0.5em] text-center focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        required disabled={loading} maxLength={6} />
                    </div>
                  </div>
                )}
                <Button type="submit" disabled={loading}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-blue-500/20 transition-all">
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{codeSent ? 'Verifying...' : 'Sending code...'}</> : (codeSent ? 'Verify Code' : 'Send Code')}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button type="button" onClick={switchMethod} className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                {loginMethod === 'password' ? 'Use email code instead' : 'Use password instead'}
              </button>
            </div>
          </div>

          <div className="px-7 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-500">Admin access is restricted to authorized personnel only.</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">Prompt & Pause Admin Panel</p>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  )
}