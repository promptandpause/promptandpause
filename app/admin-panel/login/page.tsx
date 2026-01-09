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

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const hasCheckedAuthRef = useRef(false)

  const redirectPath = searchParams.get('redirect') || '/admin-panel'

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 border border-blue-200 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Admin Panel</h1>
          <p className="text-sm text-neutral-500">Sign in to access the admin dashboard</p>
        </div>

        {/* Login Card */}
        <Card className="bg-white border-neutral-200">
          <CardHeader>
            <CardTitle className="text-neutral-900 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Admin Authentication
            </CardTitle>
            <CardDescription className="text-neutral-500">
              Restricted to @promptandpause.com accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-900">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@promptandpause.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-900">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400"
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
                    Sign In to Admin Panel
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <div className="text-sm text-neutral-600 space-y-2">
                <p className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Admin access is restricted to authorized personnel only</span>
                </p>
                <p className="text-xs text-neutral-500">
                  If you need admin access, contact your system administrator
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-500">
            Prompt & Pause Admin Panel
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  )
}
