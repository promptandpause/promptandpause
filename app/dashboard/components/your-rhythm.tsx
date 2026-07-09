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
  const isDark = theme === 'dark'
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
      className={`rounded-2xl p-5 md:p-6 transition-all ${
        isDark ? 'bg-white/5 border border-white/8' : 'bg-[#F7F9FA] border border-[#EFF3F4]'
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-xs uppercase tracking-[0.14em] font-medium mb-2 ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>Your rhythm</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>{streak}</span>
              <span className={`text-xs ${isDark ? 'text-white/50' : 'text-[#8B98A5]'}`}>current streak</span>
            </div>
          </div>
          <p className={`text-xs max-w-[140px] text-right leading-relaxed ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>Consistency matters more than length.</p>
        </div>

        <div className="flex justify-between gap-1.5">
          {days.map((d) => (
            <div
              key={d.date}
              className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                d.mood
                  ? isDark ? 'bg-white/8' : 'bg-white border border-[#EFF3F4]'
                  : isDark ? 'bg-white/5' : 'bg-[#EFF3F4]'
              }`}
              aria-label={d.date}
              title={d.date}
            >
              {d.mood
                ? <span className="text-base leading-none">{d.mood}</span>
                : <span className={`text-xs ${isDark ? 'text-white/15' : 'text-[#C4C0B8]'}`}>—</span>
              }
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
