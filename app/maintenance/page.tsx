'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Wrench, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/**
 * Maintenance Page
 * Displayed to users when maintenance mode is enabled
 * Redirects to dashboard if maintenance mode is disabled
 */
export default function MaintenancePage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Check if maintenance mode is still enabled
    const checkMaintenanceMode = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('maintenance_mode')
          .select('is_enabled')
          .limit(1)
          .single()

        if (!error && data && !data.is_enabled) {
          // Maintenance mode is off, redirect to dashboard
          router.push('/dashboard')
        }
      } catch (error) {
      }
    }

    checkMaintenanceMode()

    // Check every 10 seconds if maintenance mode is still enabled
    const maintenanceCheck = setInterval(checkMaintenanceMode, 10000)

    return () => {
      clearInterval(timer)
      clearInterval(maintenanceCheck)
    }
  }, [router])

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #F5F3EE 0%, #EBE9E3 30%, #E2E6DE 60%, #DCE6D9 100%)' }}
    >
      {/* Ambient blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(600px circle at 30% 20%, rgba(111, 169, 132, 0.12), transparent 45%),
              radial-gradient(500px circle at 70% 70%, rgba(139, 92, 246, 0.08), transparent 50%)
            `,
          }}
        />
      </div>

      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="backdrop-blur-xl bg-white/60 border border-[#DCE6D9] rounded-2xl p-8 md:p-12 shadow-xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/15 blur-2xl rounded-full"></div>
              <div className="relative bg-purple-500/10 p-6 rounded-full border border-purple-400/25">
                <Wrench className="h-16 w-16 text-purple-500 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-[#2F3B34] text-center mb-4">
            We'll Be Right Back
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-[#6B7F6E] text-center mb-8">
            Prompt & Pause is currently undergoing scheduled maintenance
          </p>

          {/* Info Box */}
          <div className="bg-white/40 border border-[#DCE6D9] rounded-xl p-6 mb-8 space-y-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-[#2F3B34] mb-2">What's happening?</h3>
                <p className="text-[#6B7F6E] leading-relaxed">
                  We're performing important updates and improvements to enhance your experience. 
                  This maintenance is necessary to ensure the platform continues to run smoothly and securely.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pt-4 border-t border-[#DCE6D9]">
              <Clock className="h-6 w-6 text-[#6FA984] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-[#2F3B34] mb-2">When will we be back?</h3>
                <p className="text-[#6B7F6E] leading-relaxed">
                  We're working as quickly as possible to complete this maintenance. 
                  Most updates are completed within 30-60 minutes. Please check back soon!
                </p>
              </div>
            </div>
          </div>

          {/* Current Time */}
          <div className="text-center">
            <p className="text-sm text-[#8B98A5] mb-2">Current Time</p>
            <p className="text-2xl font-mono text-[#4A5A49]">
              {mounted && currentTime ? currentTime.toLocaleTimeString() : '--:--:--'}
            </p>
          </div>

          {/* Footer Message */}
          <div className="mt-8 pt-6 border-t border-[#DCE6D9] text-center">
            <p className="text-[#4A5A49] mb-2">
              Thank you for your patience and understanding
            </p>
            <p className="text-sm text-[#8B98A5]">
              Your reflections and data are safe and will be available once maintenance is complete
            </p>
          </div>

          {/* Branding */}
          <div className="mt-8 text-center">
            <p className="text-lg font-semibold text-[#2F3B34]">
              Prompt & Pause
            </p>
            <p className="text-sm text-[#6B7F6E]">
              Pause. Reflect. Grow.
            </p>
          </div>
        </div>

        {/* Refresh Hint */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[#8B98A5]">
            Try refreshing this page in a few minutes to see if we're back online
          </p>
        </div>
      </div>
    </div>
  )
}
