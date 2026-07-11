'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21.35 11.1h-9.18v2.97h5.27c-.23 1.4-1.62 4.1-5.27 4.1-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.8 0 3.02.77 3.71 1.43l2.53-2.44C16.88 3.84 15.21 3 12.17 3 7.04 3 2.93 7.11 2.93 12.24s4.11 9.24 9.24 9.24c5.33 0 8.86-3.75 8.86-9.04 0-.61-.07-1.07-.18-1.34z" fill="white"/>
    </svg>
  )
}

type AuthMode = 'signup' | 'signin'

export default function PWAWelcomePage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [mode, setMode] = useState<AuthMode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', session.user.id)
          .single()
        router.push(preferences ? '/' : '/onboarding')
      } else {
        setIsChecking(false)
      }
    }
    checkAuth()
  }, [router, supabase])

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
    } catch {
      setIsGoogleLoading(false)
    }
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setIsSubmitting(true)
    try {
      await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      setEmail('')
    } catch {}
    setIsSubmitting(false)
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data.user) {
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', data.user.id)
          .single()
        window.location.href = preferences ? '/' : '/onboarding'
      }
    } catch {}
    setIsSubmitting(false)
  }

  if (isChecking) {
    return (
      <main className="h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-[#536471] text-sm">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Branding */}
      <div className="lg:flex-1 flex flex-col items-center justify-center px-6 py-12 lg:py-0">
        <div className="max-w-sm mx-auto text-center lg:text-left">
          <img
            src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
            alt="Prompt & Pause"
            className="h-10 sm:h-12 w-auto mx-auto lg:mx-0 mb-8"
          />
          <h1 className="font-bold text-[#0F1419] text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] mb-6">
            Prompt. Pause. Reflect.
          </h1>
          <p className="text-[#536471] text-lg sm:text-xl leading-relaxed">
            AI-powered daily reflection prompts personalized to your goals and mood. Write privately or share with a community doing the same work.
          </p>
        </div>
      </div>

      {/* Right Auth */}
      <div className="lg:flex-1 flex items-center justify-center px-6 py-12 lg:py-0">
        <div className="w-full max-w-sm">
          {mode === 'signup' && (
            <>
              <p className="text-2xl sm:text-3xl font-bold text-[#0F1419] mb-6">Join today.</p>
              <div className="flex flex-col gap-3">
                <button onClick={handleGoogleSignIn} disabled={isGoogleLoading}
                  className="flex items-center justify-center gap-2 w-full rounded-full bg-[#0F1419] text-white font-medium py-2.5 px-6 hover:bg-black/90 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
                  {isGoogleLoading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <GoogleIcon />}
                  Continue with Google
                </button>
                <div className="flex items-center gap-3 my-1">
                  <div className="h-px flex-1 bg-[#EFF3F4]" />
                  <span className="text-[#536471] text-sm">or</span>
                  <div className="h-px flex-1 bg-[#EFF3F4]" />
                </div>
                <form onSubmit={handleEmailSignUp}>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="Email" disabled={isSubmitting}
                    className="w-full rounded-xl border border-[#CFD9DE] px-3 py-3 text-[#0F1419] text-base placeholder:text-[#536471] focus:border-[#1D9BF0] focus:outline-none focus:ring-1 focus:ring-[#1D9BF0] mb-3 disabled:opacity-50" />
                  <button type="submit" disabled={!email || isSubmitting}
                    className="w-full rounded-full bg-[#1D9BF0] text-white font-bold py-3 px-6 hover:bg-[#1A8CD8] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
                    {isSubmitting ? 'Sending...' : 'Continue'}
                  </button>
                </form>
                <p className="text-[13px] text-[#536471] leading-relaxed mt-1">
                  By signing up, you agree to the{' '}
                  <Link href="/terms-of-service" className="text-[#1D9BF0] hover:underline">Terms of Service</Link>{' '}and{' '}
                  <Link href="/privacy-policy" className="text-[#1D9BF0] hover:underline">Privacy Policy</Link>.
                </p>
              </div>
              <div className="mt-8 text-center">
                <p className="text-[#0F1419] text-sm">
                  Already have an account?{' '}
                  <button onClick={() => { setMode('signin'); setPassword('') }}
                    className="text-[#1D9BF0] font-bold hover:underline cursor-pointer">Sign in</button>
                </p>
              </div>
            </>
          )}

          {mode === 'signin' && (
            <>
              <p className="text-2xl sm:text-3xl font-bold text-[#0F1419] mb-6">Welcome back.</p>
              <div className="flex flex-col gap-3">
                <button onClick={handleGoogleSignIn} disabled={isGoogleLoading}
                  className="flex items-center justify-center gap-2 w-full rounded-full bg-[#0F1419] text-white font-medium py-2.5 px-6 hover:bg-black/90 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
                  {isGoogleLoading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <GoogleIcon />}
                  Continue with Google
                </button>
                <div className="flex items-center gap-3 my-1">
                  <div className="h-px flex-1 bg-[#EFF3F4]" />
                  <span className="text-[#536471] text-sm">or</span>
                  <div className="h-px flex-1 bg-[#EFF3F4]" />
                </div>
                <form onSubmit={handleEmailSignIn}>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="Email" disabled={isSubmitting}
                    className="w-full rounded-xl border border-[#CFD9DE] px-3 py-3 text-[#0F1419] text-base placeholder:text-[#536471] focus:border-[#1D9BF0] focus:outline-none focus:ring-1 focus:ring-[#1D9BF0] mb-3 disabled:opacity-50" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Password" disabled={isSubmitting}
                    className="w-full rounded-xl border border-[#CFD9DE] px-3 py-3 text-[#0F1419] text-base placeholder:text-[#536471] focus:border-[#1D9BF0] focus:outline-none focus:ring-1 focus:ring-[#1D9BF0] mb-3 disabled:opacity-50" />
                  <button type="submit" disabled={!email || !password || isSubmitting}
                    className="w-full rounded-full bg-[#1D9BF0] text-white font-bold py-3 px-6 hover:bg-[#1A8CD8] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                  </button>
                </form>
              </div>
              <div className="mt-8 text-center">
                <p className="text-[#0F1419] text-sm">
                  Don&apos;t have an account?{' '}
                  <button onClick={() => setMode('signup')}
                    className="text-[#1D9BF0] font-bold hover:underline cursor-pointer">Sign up</button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
