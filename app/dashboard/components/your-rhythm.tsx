"use client"

import { useEffect, useState } from "react"
import { useTheme } from "@/contexts/ThemeContext"
import { supabaseMoodService, supabaseAnalyticsService } from "@/lib/services/supabaseReflectionService"
import { MoodType } from "@/lib/types/reflection"

type Day = {
  date: string
  mood: MoodType | null
}

const MOODS: MoodType[] = ["😔", "😐", "😊", "😄", "🤔", "😌", "🙏", "💪"]

function normalizeMood(m: any): MoodType | null {
  if (MOODS.includes(m)) return m as MoodType
  return null
}

export default function YourRhythm() {
  const { theme } = useTheme()
  const [streak, setStreak] = useState(0)
  const [days, setDays] = useState<Day[]>([])

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const s = await supabaseAnalyticsService.getCurrentStreak()
        const today = new Date()
        const items: Day[] = []
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
      } catch {
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <section
      className={`rounded-2xl md:rounded-3xl p-5 md:p-7 transition-all duration-200 ${
        theme === "dark" ? "glass-light shadow-soft-lg" : "glass-medium shadow-soft-md"
      }`}
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className={`text-xs mb-1 ${theme === "dark" ? "text-white/50" : "text-gray-500"}`}>Your rhythm</p>
          <div className="flex items-baseline gap-2">
            <span className={theme === "dark" ? "text-white text-2xl font-semibold" : "text-gray-900 text-2xl font-semibold"}>{streak}</span>
            <span className={theme === "dark" ? "text-white/60 text-xs" : "text-gray-500 text-xs"}>current streak</span>
          </div>
          <p className={theme === "dark" ? "mt-2 text-white/60 text-xs" : "mt-2 text-gray-500 text-xs"}>Consistency matters more than length.</p>
        </div>

        <div className="flex gap-2 items-center">
          {days.map((d) => (
            <div
              key={d.date}
              className={theme === "dark" ? "w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center" : "w-8 h-8 rounded-full bg-white/70 border border-gray-200 flex items-center justify-center"}
              aria-label={d.date}
              title={d.date}
            >
              <span className="text-base leading-none">{d.mood || "•"}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
