'use client'

import { Suspense } from 'react'
import { useCallback, useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'
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
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('otp')
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
      setStep(2)
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
    setError(''); setStep(1); setOtp(''); setPassword('')
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Checking authentication...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Card className="w-full max-w-md shadow-lg border-none">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl mb-4">
              P
            </div>
            <CardTitle className="text-2xl">Admin Portal</CardTitle>
            <CardDescription>
              {loginMethod === 'password'
                ? 'Enter your credentials to access the admin panel'
                : step === 1
                  ? 'Enter your email to receive an OTP'
                  : 'Enter the 6-digit code sent to your inbox'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loginMethod === 'password' ? (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" placeholder="admin@promptandpause.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Enter your password" value={password}
                    onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                </div>
                <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}
                </Button>
                <Button variant="link" className="w-full text-xs text-muted-foreground" onClick={switchMethod}>
                  Use email code instead
                </Button>
              </form>
            ) : step === 1 ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" placeholder="admin@promptandpause.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Send Magic Code'}
                </Button>
                <Button variant="link" className="w-full text-xs text-muted-foreground" onClick={switchMethod}>
                  Use password instead
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Security Code</Label>
                  <Input id="otp" type="text" placeholder="000000" className="text-center tracking-[1em] font-mono text-xl" maxLength={6}
                    value={otp} onChange={(e) => setOtp(e.target.value)} required disabled={loading} />
                </div>
                <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : 'Verify & Access'}
                </Button>
                <Button variant="link" className="w-full text-xs text-muted-foreground" onClick={() => { setStep(1); setError(''); setOtp('') }}>
                  Back to email entry
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-6">Prompt & Pause Admin Panel</p>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  )
}
