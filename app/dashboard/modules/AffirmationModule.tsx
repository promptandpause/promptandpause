"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Quotes } from "phosphor-react"
import { useTheme } from "@/contexts/ThemeContext"
import { useTranslation } from "@/hooks/useTranslation"
import { ModuleShell, ModuleErrorBoundary } from "./ModuleShell"

export function AffirmationModule() {
  return (
    <ModuleErrorBoundary>
      <AffirmationModuleInner />
    </ModuleErrorBoundary>
  )
}

const quotes = [
  "You're doing great—one step at a time.",
  "Be gentle with yourself today.",
  "Every small step counts.",
  "You are enough, just as you are.",
  "Progress, not perfection.",
  "You've already handled hard things before.",
]

function AffirmationModuleInner() {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === "dark"

  const [quote, setQuote] = useState(quotes[0])

  useEffect(() => {
    const controller = new AbortController()
    const today = new Date()
    const seed = Number(`${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`)
    const todayKey = today.toISOString().split("T")[0]
    setQuote(quotes[seed % quotes.length])

    const cachedText = typeof window !== "undefined" ? window.localStorage.getItem("dailyAffirmationText") : null
    const cachedDate = typeof window !== "undefined" ? window.localStorage.getItem("dailyAffirmationDate") : null
    if (cachedText && cachedDate === todayKey) {
      setQuote(cachedText)
      return () => controller.abort()
    }

    async function loadAffirmation() {
      try {
        const res = await fetch("/api/affirmations/daily", { signal: controller.signal })
        if (!res.ok) return
        const data = await res.json()
        if (data?.text) {
          setQuote(data.text)
          if (typeof window !== "undefined") {
            window.localStorage.setItem("dailyAffirmationText", data.text)
            window.localStorage.setItem("dailyAffirmationDate", todayKey)
          }
        }
      } catch {}
    }
    loadAffirmation()
    return () => controller.abort()
  }, [])

  return (
    <ModuleShell
      icon={<Quotes size={18} weight="bold" />}
      title="Daily Affirmation"
      subtitle={t("dashboard.dailyReminder")}
      accent="amber"
    >
      <motion.div
        key={quote}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <span className={`absolute -top-1 -left-1 text-3xl leading-none font-serif opacity-20 select-none ${isDark ? "text-[#818CF8]" : "text-indigo-400"}`}>
          &ldquo;
        </span>
        <p className={`font-serif italic text-sm md:text-[15px] leading-relaxed pl-4 ${isDark ? "text-white/85" : "text-slate-800"}`}>
          {quote}
        </p>
      </motion.div>
    </ModuleShell>
  )
}
