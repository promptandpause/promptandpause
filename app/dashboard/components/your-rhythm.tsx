"use client"

import { useEffect, useState } from "react"
import { useTheme } from "@/contexts/ThemeContext"
import { supabaseMoodService } from "@/lib/services/supabaseReflectionService"
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
  const [days, setDays] = useState<Day[]>([])

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
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
        setDays(items)
      } catch {
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const daysReflected = days.filter(d => d.mood).length

  return (
    <section
      className={`rounded-3xl p-5 md:p-6 border transition-all ${
        isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white/70 border-slate-100 shadow-soft-card'
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-[10px] uppercase tracking-[0.14em] font-semibold mb-2 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Mood trends</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{daysReflected}/7</span>
              <span className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-400'}`}>days reflected this week</span>
            </div>
          </div>
          <p className={`text-xs max-w-[140px] text-right leading-relaxed ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Consistency matters more than length.</p>
        </div>

        <div className="flex justify-between gap-1.5">
          {days.map((d, i) => (
            <div
              key={d.date}
              className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                i === days.length - 1
                  ? isDark ? 'bg-[#818CF8]/15 border border-[#818CF8]/30' : 'bg-indigo-50 border border-indigo-100'
                  : d.mood
                    ? isDark ? 'bg-white/8' : 'bg-white border border-slate-100'
                    : isDark ? 'bg-white/5' : 'bg-slate-100'
              }`}
              aria-label={d.date}
              title={d.date}
            >
              {d.mood
                ? <span className="text-base leading-none">{d.mood}</span>
                : <span className={`text-xs ${isDark ? 'text-white/15' : 'text-slate-300'}`}>—</span>
              }
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
