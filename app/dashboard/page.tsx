"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { useTier } from "@/hooks/useTier"
import { PromptLimitBanner } from "@/components/tier/TierGate"
import TodaysPrompt from "./components/todays-prompt"
import WeeklyReflectionCard from "./components/weekly-reflection-card"
import MonthlyReflectionCard from "./components/monthly-reflection-card"
import FromYourPastCard from "./components/from-your-past-card"
import YourRhythm from "./components/your-rhythm"
import SettingsLinkCard from "./components/settings-link-card"
import GlobalDataSync from "./components/global-data-sync"
import { DashboardSidebar } from "./components/DashboardSidebar"
import { useTheme } from "@/contexts/ThemeContext"
import HistorySearchCard from "./components/history-search-card"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"

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
              {tier === 'premium' && <WeeklyReflectionCard />}
              {tier === 'premium' && <MonthlyReflectionCard />}
              {tier === 'premium' && <FromYourPastCard />}
              <YourRhythm />
              <SettingsLinkCard />
            </div>

            {/* Right Sidebar - Pre-loaded components */}
            <div className="hidden md:block md:col-span-3 space-y-4 md:space-y-6">
              <HowItWorksCard theme={theme} />
              <FocusAreasCard theme={theme} />
              <ExpectationsCard theme={theme} />
              <SupportCard theme={theme} />
              <HistorySearchCard />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

function CardShell({
  children,
  theme,
}: {
  children: React.ReactNode
  theme: string
}) {
  return (
    <section
      className={`rounded-2xl md:rounded-3xl p-5 md:p-6 transition-all duration-200 ${
        theme === "dark" ? "glass-light shadow-soft-lg" : "glass-medium shadow-soft-md"
      }`}
    >
      {children}
    </section>
  )
}

function HowItWorksCard({ theme }: { theme: string }) {
  return (
    <CardShell theme={theme}>
      <div className="space-y-2">
        <p className={theme === "dark" ? "text-white/60 text-xs uppercase tracking-[0.14em]" : "text-gray-500 text-xs uppercase tracking-[0.14em]"}>
          How this space works
        </p>
        <div className={theme === "dark" ? "text-white/80 text-sm space-y-2" : "text-gray-800 text-sm space-y-2"}>
          <p>One daily question, at your pace.</p>
          <p>Insights appear occasionally, not every day.</p>
          <p>Your reflections are private and yours alone.</p>
        </div>
      </div>
    </CardShell>
  )
}

function FocusAreasCard({ theme }: { theme: string }) {
  const supabase = getSupabaseClient()
  const [focusAreas, setFocusAreas] = useState<string[] | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from("user_preferences")
          .select("focus_areas")
          .eq("user_id", user.id)
          .single()
        if (mounted) setFocusAreas((data as any)?.focus_areas || [])
      } catch (e) {
        if (mounted) setFocusAreas([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [supabase])

  return (
    <CardShell theme={theme}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={theme === "dark" ? "text-white/60 text-xs uppercase tracking-[0.14em]" : "text-gray-500 text-xs uppercase tracking-[0.14em]"}>
              Your focus areas
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className={theme === "dark" ? "text-xs text-white/60 hover:text-white underline-offset-4 hover:underline" : "text-xs text-gray-600 hover:text-gray-900 underline-offset-4 hover:underline"}
          >
            Edit
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {(focusAreas && focusAreas.length > 0 ? focusAreas : ["Add your focus areas"]).map((area, idx) => (
            <span
              key={idx}
              className={`px-3 py-1.5 rounded-full text-xs ${
                theme === "dark" ? "bg-white/10 text-white/80 border border-white/10" : "bg-white text-gray-800 border border-gray-200"
              }`}
            >
              {area}
            </span>
          ))}
        </div>
      </div>
    </CardShell>
  )
}

function ExpectationsCard({ theme }: { theme: string }) {
  return (
    <CardShell theme={theme}>
      <div className="space-y-2">
        <p className={theme === "dark" ? "text-white/60 text-xs uppercase tracking-[0.14em]" : "text-gray-500 text-xs uppercase tracking-[0.14em]"}>
          What to expect
        </p>
        <div className={theme === "dark" ? "text-white/80 text-sm space-y-2" : "text-gray-800 text-sm space-y-2"}>
          <p>Daily prompt: once a day, at your chosen time.</p>
          <p>Weekly reflection: appears occasionally.</p>
          <p>Monthly reflection: appears after month-end.</p>
        </div>
      </div>
    </CardShell>
  )
}

function SupportCard({ theme }: { theme: string }) {
  return (
    <CardShell theme={theme}>
      <div className="space-y-2">
        <p className={theme === "dark" ? "text-white/60 text-xs uppercase tracking-[0.14em]" : "text-gray-500 text-xs uppercase tracking-[0.14em]"}>
          Need help?
        </p>
        <div className={theme === "dark" ? "text-white/80 text-sm space-y-2" : "text-gray-800 text-sm space-y-2"}>
          <p>Questions or feedback? Reply to any email or contact support.</p>
        </div>
      </div>
    </CardShell>
  )
}
