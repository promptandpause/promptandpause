"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { useTier } from "@/hooks/useTier"
import GlobalDataSync from "./components/global-data-sync"
import { DashboardSidebar } from "./components/DashboardSidebar"
import { useTheme } from "@/contexts/ThemeContext"
import { useTranslation } from "@/hooks/useTranslation"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { trackEventOncePerSession } from "@/lib/services/eventsService"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"

import {
  ProfileModule,
  MoodModule,
  PromptModule,
  QuickActionsModule,
  StreakModule,
  AffirmationModule,
  FocusAreasModule,
  FeedModule,
  UpgradeModule,
  ModuleErrorBoundary,
} from "./modules"

const MoodTracker = dynamic(() => import("./components/mood-tracker"), { ssr: false })
const WeeklyReflectionCard = dynamic(() => import("./components/weekly-reflection-card"), { ssr: false })
const MonthlyReflectionCard = dynamic(() => import("./components/monthly-reflection-card"), { ssr: false })
const FromYourPastCard = dynamic(() => import("./components/from-your-past-card"), { ssr: false })
const ReturnToSelfCard = dynamic(() => import("./components/return-to-self-card"), { ssr: false })
const SettingsLinkCard = dynamic(() => import("./components/settings-link-card"), { ssr: false })
const HistorySearchCard = dynamic(() => import("./components/history-search-card"), { ssr: false })
const PushNotificationPrompt = dynamic(() =>
  import("@/components/notifications/PushNotificationPrompt").then(mod => ({ default: mod.PushNotificationPrompt })),
  { ssr: false }
)

export default function DashboardPage() {
  return (
    <AuthGuard redirectPath="/dashboard">
      <DashboardContent />
    </AuthGuard>
  )
}

function DashboardContent() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const { tier } = useTier()
  const { t } = useTranslation()
  const supabase = getSupabaseClient()
  const [userName, setUserName] = useState("")
  const [greetingKey, setGreetingKey] = useState<"dashboard.goodMorning" | "dashboard.goodAfternoon" | "dashboard.goodEvening">("dashboard.goodMorning")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreetingKey("dashboard.goodMorning")
    else if (hour < 18) setGreetingKey("dashboard.goodAfternoon")
    else setGreetingKey("dashboard.goodEvening")

    trackEventOncePerSession("session_start", "session_start", {
      hour,
      tz_offset: new Date().getTimezoneOffset(),
    })

    async function loadName() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const res = await fetch("/api/user/profile")
        if (res.ok) {
          const { data } = await res.json()
          setUserName(data?.full_name?.split(" ")[0] || "")
        }
      } catch {}
    }
    loadName()
  }, [supabase])

  return (
    <div data-dashboard className={`min-h-screen ${isDark ? "bg-[#0A0A0A]" : "bg-[#FFFFFF]"}`}>
      <GlobalDataSync />

      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 pb-32 md:pb-10 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-16 md:pt-10 pb-6">

            {/* Greeting — clean Twitter-style header */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="mb-6"
            >
              <h1 className={`text-2xl md:text-3xl font-semibold tracking-tight ${isDark ? "text-white" : "text-[#0F1419]"}`}>
                {t(greetingKey)}{userName ? `, ${userName}` : ""}
              </h1>
              <p className={`text-sm mt-1 ${isDark ? "text-white/40" : "text-[#8B98A5]"}`}>
                {t("dashboard.breatheMoment")}
              </p>
            </motion.div>

            {/* Bebo-inspired 3-column modular grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">

              {/* ── Left Column: Core modules ── */}
              <div className="lg:col-span-8 space-y-5 lg:space-y-6">

                {/* Return-to-Self card (shown conditionally) */}
                <ReturnToSelfCard />

                {/* Profile Module */}
                <ProfileModule />

                {/* Mood / Rhythm Module */}
                <MoodModule />

                {/* Today's Prompt Module */}
                <PromptModule />

                {/* Quick Actions */}
                <QuickActionsModule />

                {/* Premium: Weekly + Monthly Reflections */}
                {tier === "premium" && (
                  <div className="space-y-5 lg:space-y-6">
                    <ModuleErrorBoundary>
                      <WeeklyReflectionCard />
                    </ModuleErrorBoundary>
                    <ModuleErrorBoundary>
                      <MonthlyReflectionCard />
                    </ModuleErrorBoundary>
                    <ModuleErrorBoundary>
                      <FromYourPastCard />
                    </ModuleErrorBoundary>
                  </div>
                )}

                {/* Settings Link */}
                <ModuleErrorBoundary>
                  <SettingsLinkCard />
                </ModuleErrorBoundary>

                {/* Upgrade Banner (free users) */}
                {tier !== "premium" && <UpgradeModule />}
              </div>

              {/* ── Right Column (desktop sidebar modules) ── */}
              <div className="hidden lg:block lg:col-span-4 space-y-5 lg:space-y-6 lg:sticky lg:top-6">
                <StreakModule />
                <AffirmationModule />
                <FocusAreasModule />
                <FeedModule />
                <ModuleErrorBoundary>
                  <HistorySearchCard />
                </ModuleErrorBoundary>
              </div>

            </div>
          </div>
        </main>
      </div>

      <PushNotificationPrompt />
    </div>
  )
}
