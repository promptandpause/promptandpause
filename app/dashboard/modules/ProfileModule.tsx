"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { UserCircle, Flame, Notepad } from "phosphor-react"
import { useTheme } from "@/contexts/ThemeContext"
import { useTier } from "@/hooks/useTier"
import { getSupabaseClient } from "@/lib/supabase/client"
import { supabaseAnalyticsService } from "@/lib/services/supabaseReflectionService"
import { IconOrb } from "@/components/ui/accent-card"
import { Crown } from "lucide-react"
import { ModuleShell, ModuleErrorBoundary } from "./ModuleShell"
import Link from "next/link"

export function ProfileModule() {
  return (
    <ModuleErrorBoundary>
      <ProfileModuleInner />
    </ModuleErrorBoundary>
  )
}

function ProfileModuleInner() {
  const { theme } = useTheme()
  const { tier } = useTier()
  const supabase = getSupabaseClient()
  const isDark = theme === "dark"
  const [userName, setUserName] = useState("")
  const [streak, setStreak] = useState(0)
  const [reflectionCount, setReflectionCount] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const [profileRes, streakVal, refRes] = await Promise.all([
          fetch("/api/user/profile"),
          supabaseAnalyticsService.getCurrentStreak(),
          supabase.from("reflections").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        ])
        if (profileRes.ok) {
          const { data } = await profileRes.json()
          setUserName(data?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "Friend")
        } else {
          setUserName(user.email?.split("@")[0] || "Friend")
        }
        setStreak(streakVal)
        setReflectionCount(refRes.count || 0)
      } catch {
        setUserName("Friend")
      }
    }
    load()
  }, [supabase])

  return (
    <ModuleShell
      icon={<UserCircle size={18} weight="bold" />}
      title={userName || "Loading..."}
      subtitle={`${reflectionCount} reflection${reflectionCount !== 1 ? "s" : ""} written`}
      accent="blue"
      action={
        tier === "premium" ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300 border border-amber-200/60 dark:border-amber-400/20">
            <Crown className="w-3 h-3" />
            Premium
          </span>
        ) : (
          <Link
            href="/settings"
            className="text-[10px] font-medium text-[#1D9BF0] hover:underline"
          >
            Upgrade
          </Link>
        )
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          whileHover={{ scale: 1.02, y: -1 }}
          transition={{ type: "spring", stiffness: 400, damping: 26 }}
          className={`rounded-xl p-3.5 flex items-center gap-3 ${
            isDark ? "bg-white/[0.03]" : "bg-[#F7F9FA]"
          }`}
        >
          <span className={`flex items-center justify-center w-9 h-9 rounded-lg ${
            isDark ? "bg-amber-400/10 text-amber-300" : "bg-amber-50 text-amber-600"
          }`}>
            <Flame size={18} weight="bold" />
          </span>
          <div>
            <p className={`text-lg font-bold tabular-nums ${isDark ? "text-white" : "text-[#0F1419]"}`}>
              {streak}
            </p>
            <p className={`text-[10px] ${isDark ? "text-white/40" : "text-[#8B98A5]"}`}>day streak</p>
          </div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02, y: -1 }}
          transition={{ type: "spring", stiffness: 400, damping: 26 }}
          className={`rounded-xl p-3.5 flex items-center gap-3 ${
            isDark ? "bg-white/[0.03]" : "bg-[#F7F9FA]"
          }`}
        >
          <span className={`flex items-center justify-center w-9 h-9 rounded-lg ${
            isDark ? "bg-[#1D9BF0]/10 text-[#1D9BF0]" : "bg-[#E8F5FE] text-[#1D9BF0]"
          }`}>
            <Notepad size={18} weight="bold" />
          </span>
          <div>
            <p className={`text-lg font-bold tabular-nums ${isDark ? "text-white" : "text-[#0F1419]"}`}>
              {reflectionCount}
            </p>
            <p className={`text-[10px] ${isDark ? "text-white/40" : "text-[#8B98A5]"}`}>total</p>
          </div>
        </motion.div>
      </div>
    </ModuleShell>
  )
}
