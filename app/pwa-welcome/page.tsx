'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Sparkles, Brain, TrendingUp, Shield } from 'lucide-react'

export default function PWAWelcomePage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Check if onboarding is complete
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', session.user.id)
          .single()

        if (preferences) {
          router.push('/dashboard')
        } else {
          router.push('/onboarding')
        }
      } else {
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-white text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-between px-6 py-12">
        {/* Header */}
        <div className="w-full max-w-md text-center space-y-4 pt-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-500 rounded-3xl flex items-center justify-center shadow-2xl">
              <Brain className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 bg-clip-text text-transparent">
            Prompt & Pause
          </h1>
          
          <p className="text-xl text-purple-200 font-light">
            Pause. Reflect. Grow.
          </p>
        </div>

        {/* Features */}
        <div className="w-full max-w-md space-y-6 my-8">
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">AI-Powered Prompts</h3>
                <p className="text-purple-200 text-sm">
                  Personalized daily reflection prompts tailored to your journey
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Track Your Growth</h3>
                <p className="text-purple-200 text-sm">
                  Monitor mood patterns and celebrate your progress over time
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Private & Secure</h3>
                <p className="text-purple-200 text-sm">
                  Your reflections are encrypted and completely private
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="w-full max-w-md space-y-4 pb-8">
          <Link href="/auth/signin" className="block">
            <Button 
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-2xl rounded-xl transition-all duration-300 hover:scale-105"
            >
              Sign In
            </Button>
          </Link>
          
          <Link href="/auth/signup" className="block">
            <Button 
              variant="outline"
              className="w-full h-14 text-lg font-semibold bg-white/10 backdrop-blur-xl border-2 border-white/30 text-white hover:bg-white/20 rounded-xl transition-all duration-300"
            >
              Create Account
            </Button>
          </Link>

          <div className="text-center pt-4">
            <Link 
              href="/homepage" 
              className="text-sm text-purple-300 hover:text-purple-200 underline underline-offset-4 transition-colors"
            >
              Visit our website
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-purple-300 text-xs">
          <p>© 2026 Prompt & Pause. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
