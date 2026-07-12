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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const hasCheckedAuthRef = useRef(false)

  const redirectPath = sanitizeRedirectPath(searchParams.get('redirect'))

  const checkExistingAuth = useCallback(async () => {
    // Prevent multiple checks using ref
    if (hasCheckedAuthRef.current) return
    hasCheckedAuthRef.current = true

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user?.email) {
        // Check admin access via API
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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate email domain
      if (!email.endsWith('@promptandpause.com')) {
        setError('Admin access is restricted to @promptandpause.com email addresses')
        setLoading(false)
        return
      }

      const supabase = createClient()

      // Sign in with Supabase
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

      // Check if user has admin access via API
      const verifyResponse = await fetch('/api/admin/verify-access')
      const verifyData = await verifyResponse.json()
      
      if (!verifyData.hasAccess) {
        // Sign out if not an admin
        await supabase.auth.signOut()
        setError('Access denied. This account does not have admin privileges.')
        setLoading(false)
        return
      }

      // Success - redirect to admin panel
      router.push(redirectPath)
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Checking authentication...</span>
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
          <p className="text-sm text-slate-500">Sign in to access the admin dashboard</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl">
          <div className="p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
              <p className="text-sm text-slate-500 mt-1">Restricted to @promptandpause.com accounts</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

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
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in...</> : 'Sign In to Admin Panel'}
              </Button>
            </form>
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
