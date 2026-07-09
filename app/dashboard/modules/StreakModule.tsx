"use client"

import { Flame } from "phosphor-react"
import { useTheme } from "@/contexts/ThemeContext"
import { ModuleShell, ModuleErrorBoundary } from "./ModuleShell"
import { useEffect, useState } from "react"
import { supabaseAnalyticsService } from "@/lib/services/supabaseReflectionService"
import { supabaseMoodService } from "@/lib/services/supabaseReflectionService"
import type { MoodType } from "@/lib/types/reflection"

const MOODS: MoodType[] = ["😔", "😐", "😊", "😄", "🤔", "😌", "🙏", "💪"]

function normalizeMood(m: any): MoodType | null {
  if (MOODS.includes(m)) return m as MoodType
  return null
}

export function StreakModule() {
  return (
    <ModuleErrorBoundary>
      <StreakInner />
    </ModuleErrorBoundary>
  )
}

function StreakInner() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [streak, setStreak] = useState(0)
  const [days, setDays] = useState<{ date: string; mood: MoodType | null }[]>([])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const s = await supabaseAnalyticsService.getCurrentStreak()
        const today = new Date()
        const items: { date: string; mood: MoodType | null }[] = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today)
          d.setDate(today.getDate() - i)
          const dateStr = d.toISOString().slice(0, 10)
          const moodEntry = await supabaseMoodService.getMoodForDate(dateStr)
          items.push({ date: dateStr, mood: normalizeMood(moodEntry?.mood) })
        }
        if (!mounted) return
        setStreak(s)
        setDays(items)
      } catch {}
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <ModuleShell
      icon={<Flame size={18} weight="bold" />}
      title="Your Rhythm"
      subtitle="Consistency matters"
      accent="amber"
    >
      <div className="flex items-baseline gap-2 mb-4">
        <span className={`text-3xl font-bold tabular-nums ${isDark ? "text-white" : "text-[#0F1419]"}`}>{streak}</span>
        <span className={`text-xs ${isDark ? "text-white/40" : "text-[#8B98A5]"}`}>day streak</span>
      </div>

      <div className="flex justify-between gap-1">
        {days.map((d) => (
          <div
            key={d.date}
            className={`w-full aspect-square rounded-lg flex items-center justify-center text-sm ${
              d.mood
                ? isDark ? "bg-white/8" : "bg-[#F7F9FA] border border-[#EFF3F4]"
                : isDark ? "bg-white/[0.03]" : "bg-[#EFF3F4]/60"
            }`}
            title={new Date(d.date).toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" })}
          >
            {d.mood ? <span>{d.mood}</span> : <span className={`text-[10px] ${isDark ? "text-white/15" : "text-[#C4C0B8]"}`}>—</span>}
          </div>
        ))}
      </div>
    </ModuleShell>
  )
}
