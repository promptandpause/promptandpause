"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import GlobalDataSync from "../components/global-data-sync"
import { DashboardSidebar } from "../components/DashboardSidebar"
import { useTheme } from "@/contexts/ThemeContext"
import { useTranslation } from "@/hooks/useTranslation"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import {
  MoodModule,
  AffirmationModule,
  ModuleErrorBoundary,
} from "../modules"
import dynamic from "next/dynamic"

const TodaysPrompt = dynamic(() => import("../components/todays-prompt"), { ssr: false })

export default function ReflectPage() {
  return (
    <AuthGuard redirectPath="/dashboard/reflect">
      <ReflectContent />
    </AuthGuard>
  )
}

function ReflectContent() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const { t } = useTranslation()
  const supabase = getSupabaseClient()
  const [userName, setUserName] = useState("")

  useEffect(() => {
    async function load() {
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
    load()
  }, [supabase])

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0A0E18]" : "bg-[#F9FBFB]"}`}>
      <GlobalDataSync />

      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-[680px] mx-auto px-4 md:px-8 pt-16 md:pt-10 pb-10">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="mb-6"
            >
              <h1 className={`text-2xl md:text-3xl font-semibold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                Reflect
              </h1>
              <p className={`text-sm mt-1 ${isDark ? "text-white/40" : "text-slate-400"}`}>
                Your private space to write, process, and grow.
              </p>
            </motion.div>

            <div className="space-y-6">
              <ModuleErrorBoundary>
                <TodaysPrompt />
              </ModuleErrorBoundary>

              <MoodModule />

              <ModuleErrorBoundary>
                <AffirmationModule />
              </ModuleErrorBoundary>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
