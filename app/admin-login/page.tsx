'use client'

import { Suspense } from 'react'
import { useCallback, useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/**
 * Sanitize redirect path to prevent open redirect attacks.
 * Only allows relative, same-origin paths starting with '/'.
 * Blocks absolute URLs, protocol-relative URLs (//), and non-admin paths.
 */
function sanitizeRedirectPath(raw: string | null): string {
  const fallback = '/admin-panel'
  if (!raw) return fallback

  // Must start with exactly one '/' (block protocol-relative "//evil.com")
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback

  // Block any URL that contains a protocol scheme (e.g. /foo\nhttps://evil.com)
  if (/[:\\/]{2}/.test(raw)) return fallback

  // Only allow paths under known admin routes
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
      // Check for OTP session first
      const otpResponse = await fetch('/api/admin/check-session')
      if (otpResponse.ok) {
        const otpData = await otpResponse.json()
        if (otpData.authenticated) {
          router.push(redirectPath)
          return
        }
      }

      // Check for Supabase auth (password method)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user?.email) {
        const response = await fetch('/api/admin/verify-access')
        const data = await response.json()

        if (data.hasAccess) {
          router.push(redirectPath)
          return
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setCheckingAuth(false)
    }
  }, [redirectPath, router])

  useEffect(() => {
    checkExistingAuth()
  }, [checkExistingAuth])

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email.endsWith('@promptandpause.com')) {
        setError('Admin access is restricted to @promptandpause.com email addresses')
        setLoading(false)
        return
      }

      const supabase = createClient()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Authentication failed')
        setLoading(false)
        return
      }

      const verifyResponse = await fetch('/api/admin/verify-access')
      const verifyData = await verifyResponse.json()

      if (!verifyData.hasAccess) {
        await supabase.auth.signOut()
        setError('Access denied. This account does not have admin privileges.')
        setLoading(false)
        return
      }

      router.push(redirectPath)
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
      setLoading(false)
    }
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email.endsWith('@promptandpause.com')) {
        setError('Admin access is restricted to @promptandpause.com email addresses')
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send code')
        setLoading(false)
        return
      }

      setCodeSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email || !otp) {
        setError('Email and code are required')
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid code')
        setLoading(false)
        return
      }

      router.push(redirectPath)
    } catch (err: any) {
      setError(err.message || 'Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  const switchMethod = () => {
    setLoginMethod(loginMethod === 'password' ? 'otp' : 'password')
    setError('')
    setCodeSent(false)
    setOtp('')
    setPassword('')
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Checking authentication...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-slate-400">Sign in to access the admin dashboard</p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Admin Authentication
            </CardTitle>
            <CardDescription className="text-slate-400">
              {loginMethod === 'password' 
                ? 'Restricted to @promptandpause.com accounts' 
                : 'Receive a one-time code via email'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert
                variant="destructive"
                className="bg-red-500/10 border-red-500/30 text-red-400"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loginMethod === 'password' ? (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@promptandpause.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Sign In with Password
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={codeSent ? handleVerifyCode : handleSendCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@promptandpause.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      required
                      disabled={loading || codeSent}
                    />
                  </div>
                </div>

                {codeSent && (
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-white">
                      6-digit Code
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter code from email"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {codeSent ? 'Verifying...' : 'Sending code...'}
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      {codeSent ? 'Verify Code' : 'Send Code'}
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={switchMethod}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {loginMethod === 'password' 
                  ? 'Use email code instead' 
                  : 'Use password instead'}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="text-sm text-slate-400 space-y-2">
                <p className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Admin access is restricted to authorized personnel only</span>
                </p>
                <p className="text-xs text-slate-500">
                  If you need admin access, contact your system administrator
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">Prompt & Pause Admin Panel</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  )
}
