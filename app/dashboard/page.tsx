"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { useTier } from "@/hooks/useTier"
import { PromptLimitBanner } from "@/components/tier/TierGate"
import TodaysPrompt from "./components/todays-prompt"
import MoodTracker from "./components/mood-tracker"
import WeeklyInsights from "./components/weekly-insights"
import MoodAnalytics from "./components/mood-analytics"
import FocusAreasManager from "./components/focus-areas-manager"
import QuickStats from "./components/quick-stats"
import ActivityCalendar from "./components/activity-calendar"
import GlobalDataSync from "./components/global-data-sync"
import { DashboardSidebar } from "./components/DashboardSidebar"
import { useTheme } from "@/contexts/ThemeContext"

export default function DashboardPage() {
  const { tier, features = {} } = useTier()
  const { theme } = useTheme()

  return (
    <AuthGuard redirectPath="/dashboard">
      <div 
        className="min-h-screen relative" 
        style={theme === 'light' 
          ? { background: 'linear-gradient(135deg, #f4f0eb 0%, #a1a79e 45%, #384c37 100%)' } 
          : { background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)' }}
      >
        {/* Global Data Sync - Auto-syncs with Supabase every 5 minutes */}
        <GlobalDataSync />

        {/* Subtle overlay for readability */}
        <div className={`fixed inset-0 -z-10 ${theme === 'light' ? 'bg-white/35' : 'bg-black/25'}`} />

        {/* Calming ambient animation (CSS only) */}
        <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 calm-ambient-blobs" />
        </div>

        <style jsx global>{`
          .calm-ambient-blobs {
            background: radial-gradient(600px circle at 20% 20%, rgba(161, 167, 158, 0.20), transparent 45%),
                        radial-gradient(700px circle at 80% 30%, rgba(136, 165, 188, 0.20), transparent 50%),
                        radial-gradient(800px circle at 30% 80%, rgba(56, 76, 55, 0.20), transparent 55%);
            animation: calm-shift 28s ease-in-out infinite alternate;
            filter: blur(12px);
          }
          @keyframes calm-shift {
            0% {
              transform: translate3d(0,0,0) scale(1);
            }
            50% {
              transform: translate3d(-1%, 1%, 0) scale(1.03);
              opacity: 0.9;
            }
            100% {
              transform: translate3d(1%, -1%, 0) scale(1.06);
              opacity: 0.85;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .calm-ambient-blobs {
              animation: none;
            }
          }
        `}</style>

        <div className="relative z-10 px-3 md:px-6 pt-3 md:pt-6 pb-24 md:pb-6 w-full max-w-[1920px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start">
            {/* Universal Sidebar - Desktop & Mobile */}
            <DashboardSidebar />

            {/* Main Content Area - Pre-loaded components */}
            <div className="col-span-1 md:col-span-7 space-y-4 md:space-y-6">
              {/* Show prompt limit warning for free users - Moved to inside TodaysPrompt */}
              <TodaysPrompt />
              <MoodTracker />
              {tier === 'premium' && <WeeklyInsights />}
              {tier === 'premium' && <MoodAnalytics />}
              <QuickStats />
            </div>

            {/* Right Sidebar - Pre-loaded components */}
            <div className="hidden md:block md:col-span-3 space-y-4 md:space-y-6">
              <ActivityCalendar />
              {tier === 'premium' && <FocusAreasManager />}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
