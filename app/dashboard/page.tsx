"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import GlobalDataSync from "./components/global-data-sync"
import { DashboardSidebar } from "./components/DashboardSidebar"
import { RandomFeed } from "./components/RandomFeed"
import { useTheme } from "@/contexts/ThemeContext"
import { useTranslation } from "@/hooks/useTranslation"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { trackEventOncePerSession } from "@/lib/services/eventsService"
import { motion } from "framer-motion"
import { Sparkle } from "phosphor-react"
import Link from "next/link"

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
    <div className={`min-h-screen ${isDark ? "bg-[#0A0A0A]" : "bg-[#FFFFFF]"}`}>
      <GlobalDataSync />

      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 overflow-y-auto scrollbar-thin border-r border-[#EFF3F4] dark:border-white/[0.06] max-w-[600px]">
          {/* Twitter-style header */}
          <div className={`sticky top-0 z-10 backdrop-blur-md ${
            isDark ? "bg-[#0A0A0A]/80 border-b border-white/[0.06]" : "bg-white/80 border-b border-[#EFF3F4]"
          }`}>
            <div className="px-4 h-12 flex items-center">
              <h1 className={`text-xl font-semibold ${isDark ? "text-white" : "text-[#0F1419]"}`}>
                {t(greetingKey)}{userName ? `, ${userName}` : ""}
              </h1>
            </div>
            <div className="flex">
              <button
                className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 border-[#1D9BF0] ${
                  isDark ? "text-white" : "text-[#0F1419]"
                }`}
              >
                For You
              </button>
              <button
                className={`flex-1 py-3 text-sm font-medium text-center ${
                  isDark ? "text-white/40 hover:text-white/60" : "text-[#536471] hover:text-[#0F1419]"
                }`}
                onClick={() => window.location.href = "/feed"}
              >
                Following
              </button>
            </div>
          </div>

          {/* Compose box */}
          <div className={`px-4 py-3 border-b ${isDark ? "border-white/[0.06]" : "border-[#EFF3F4]"}`}>
            <Link
              href="/journals"
              className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 transition-colors ${
                isDark ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-[#F7F9FA] hover:bg-[#EFF3F4]"
              }`}
            >
              <Sparkle size={18} weight="bold" className={isDark ? "text-[#1D9BF0]" : "text-[#1D9BF0]"} />
              <span className={`text-sm ${isDark ? "text-white/30" : "text-[#8B98A5]"}`}>
                Share your reflection...
              </span>
            </Link>
          </div>

          {/* Feed */}
          <div className="pb-16">
            <RandomFeed />
          </div>
        </main>
      </div>
    </div>
  )
}
