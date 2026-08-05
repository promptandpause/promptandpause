"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faFaceFrownOpen,
  faFaceMeh,
  faFaceSmile,
  faFaceGrin,
  faCircleQuestion,
  faFaceSmileWink,
  faHeart,
  faHandsPraying,
  faHandFist,
  faFire,
} from "@fortawesome/free-solid-svg-icons"
import type { IconProp } from "@fortawesome/fontawesome-svg-core"
import { useTheme } from "@/contexts/ThemeContext"
import { supabaseMoodService, supabaseReflectionService, supabaseAnalyticsService } from "@/lib/services/supabaseReflectionService"
import type { MoodType } from "@/lib/types/reflection"
import { ModuleShell, ModuleErrorBoundary } from "./ModuleShell"

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const moodConfig: Record<string, { icon: IconProp; label: string; color: string; bg: string }> = {
  "😔": { icon: faFaceFrownOpen, label: "Sad", color: "text-rose-500", bg: "bg-rose-100 dark:bg-rose-500/15" },
  "😐": { icon: faFaceMeh, label: "Neutral", color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-500/15" },
  "😊": { icon: faFaceSmile, label: "Happy", color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-500/15" },
  "😄": { icon: faFaceGrin, label: "Joyful", color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-500/15" },
  "🤔": { icon: faCircleQuestion, label: "Thoughtful", color: "text-violet-500", bg: "bg-violet-100 dark:bg-violet-500/15" },
  "😌": { icon: faFaceSmileWink, label: "Calm", color: "text-sky-500", bg: "bg-sky-100 dark:bg-sky-500/15" },
  "🙏": { icon: faHandsPraying, label: "Grateful", color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-500/15" },
  "💪": { icon: faHandFist, label: "Strong", color: "text-violet-500", bg: "bg-violet-100 dark:bg-violet-500/15" },
}

interface WeekDay {
  date: string
  dayName: string
  mood?: MoodType
  hasReflection: boolean
  reflectionSnippet?: string
}

export function MoodModule() {
  return (
    <ModuleErrorBoundary>
      <MoodModuleInner />
    </ModuleErrorBoundary>
  )
}

function getMoodColor(mood?: MoodType) {
  if (!mood) return "bg-slate-100 dark:bg-white/[0.08]"
  const happy: MoodType[] = ["😊", "😄", "🙏"]
  const neutral: MoodType[] = ["😐", "🤔"]
  const sad: MoodType[] = ["😔"]
  const calm: MoodType[] = ["😌"]
  const strong: MoodType[] = ["💪"]
  if (happy.includes(mood)) return "bg-emerald-200 dark:bg-emerald-500/20"
  if (calm.includes(mood)) return "bg-sky-200 dark:bg-sky-500/20"
  if (strong.includes(mood)) return "bg-violet-200 dark:bg-violet-500/20"
  if (neutral.includes(mood)) return "bg-amber-200 dark:bg-amber-500/20"
  if (sad.includes(mood)) return "bg-rose-200 dark:bg-rose-500/20"
  return "bg-pink-200 dark:bg-pink-500/20"
}

function MoodModuleInner() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [weekData, setWeekData] = useState<WeekDay[]>([])
  const [activeDay, setActiveDay] = useState<number>(6)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [todayIndex, setTodayIndex] = useState<number>(0)

  useEffect(() => {
    loadWeekData()
    supabaseAnalyticsService.getCurrentStreak().then(setCurrentStreak)
  }, [])

  const loadWeekData = async () => {
    const today = new Date()
    const currentDayOfWeek = today.getDay()
    const mondayOffset = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
    const week: WeekDay[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - mondayOffset + i)
      const dateStr = date.toISOString().split("T")[0]
      const moodEntry = await supabaseMoodService.getMoodForDate(dateStr)
      const reflections = await supabaseReflectionService.getReflectionsByDateRange(dateStr, dateStr)
      const reflection = reflections[0]
      week.push({
        date: dateStr,
        dayName: daysOfWeek[i],
        mood: moodEntry?.mood,
        hasReflection: !!reflection,
        reflectionSnippet: reflection ? reflection.reflection_text.slice(0, 80) + "..." : undefined,
      })
    }
    setWeekData(week)
    setActiveDay(mondayOffset)
    setTodayIndex(mondayOffset)
  }

  const activeData = weekData[activeDay]

  const moodLabels: Record<string, string> = {
    "😔": "Sad", "😐": "Neutral", "😊": "Happy", "😄": "Joyful",
    "🤔": "Thoughtful", "😌": "Calm", "🙏": "Grateful", "💪": "Strong",
  }

  const moodsThisWeek = weekData.filter(d => d.mood).map(d => d.mood!)
  const counts: Record<string, number> = {}
  moodsThisWeek.forEach(m => { counts[m] = (counts[m] || 0) + 1 })
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3)

  return (
    <ModuleShell
      icon={<FontAwesomeIcon icon={faHeart} />}
      title="Your Mood"
      subtitle="This week at a glance"
      accent="indigo"
      action={
        currentStreak > 0 ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300 border border-amber-200/60 dark:border-amber-400/20">
            <FontAwesomeIcon icon={faFire} className="text-[10px]" />
            {currentStreak} day{currentStreak === 1 ? "" : "s"} in a row
          </span>
        ) : undefined
      }
    >
      <div className="flex justify-between mb-4">
        {weekData.map((day, i) => {
          const isToday = i === todayIndex
          const isActive = activeDay === i
          const config = day.mood ? moodConfig[day.mood] : null
          return (
            <button key={i} onClick={() => setActiveDay(i)} className="flex flex-col items-center gap-1.5 transition-all">
              <div
                className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-base transition-all ${
                  getMoodColor(day.mood)
                } ${isActive ? "ring-2 ring-indigo-400 ring-offset-2 dark:ring-offset-[#0A0E18]" : ""} ${
                  !day.mood ? (isDark ? "border border-white/10" : "") : ""
                }`}
              >
                {day.mood ? (
                  <FontAwesomeIcon icon={moodConfig[day.mood].icon} className={`text-base ${moodConfig[day.mood].color}`} />
                ) : (
                  <span className={`text-xs ${isDark ? "text-white/20" : "text-slate-300"}`}>—</span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isToday ? "text-indigo-500" : isDark ? "text-white/40" : "text-slate-400"}`}>
                {isToday ? "Now" : day.dayName}
              </span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeData && (
          <motion.div
            key={activeDay}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className={`rounded-2xl p-4 ${isDark ? "bg-white/[0.03] border border-white/[0.04]" : "bg-slate-50/80 border border-slate-100"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-medium ${isDark ? "text-white/40" : "text-slate-400"}`}>
                {activeDay === todayIndex ? "Today" : activeData.dayName}
              </p>
              <p className={`text-xs ${isDark ? "text-white/40" : "text-slate-400"}`}>
                {new Date(activeData.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </p>
            </div>
            {activeData.hasReflection ? (
              <div className="space-y-2">
                {activeData.mood && (
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={moodConfig[activeData.mood].icon} className={`text-2xl ${moodConfig[activeData.mood].color}`} />
                    <span className={`text-sm ${isDark ? "text-white/70" : "text-slate-500"}`}>
                      {moodLabels[activeData.mood] || "Mood recorded"}
                    </span>
                  </div>
                )}
                {activeData.reflectionSnippet && (
                  <p className={`text-xs leading-relaxed ${isDark ? "text-white/50" : "text-slate-400"}`}>
                    {activeData.reflectionSnippet}
                  </p>
                )}
              </div>
            ) : (
              <p className={`text-xs ${isDark ? "text-white/30" : "text-slate-400"}`}>
                {activeDay === todayIndex ? "Write a reflection for today" : "No reflection for this day"}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {sorted.length > 0 && (
        <div className={`mt-3 rounded-2xl p-3 ${isDark ? "bg-white/[0.03] border border-white/[0.04]" : "bg-slate-50/80 border border-slate-100"}`}>
          <p className={`text-[10px] mb-2 ${isDark ? "text-white/40" : "text-slate-400"}`}>Top feelings</p>
          <div className="flex gap-2 flex-wrap">
            {sorted.map(([emoji, count]) => (
              <span key={emoji} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
                isDark ? "bg-white/[0.06] text-white/70" : "bg-white text-slate-500 border border-slate-100"
              }`}>
                <FontAwesomeIcon icon={moodConfig[emoji].icon} className={`text-sm ${moodConfig[emoji].color}`} />
                {moodLabels[emoji] || emoji}
                {count > 1 && <span className={isDark ? "text-white/30" : "text-slate-400"}>×{count}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </ModuleShell>
  )
}
