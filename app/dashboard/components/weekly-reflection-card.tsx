"use client"

import { useEffect, useState } from "react"
import { useTheme } from "@/contexts/ThemeContext"
import { Button } from "@/components/ui/button"
import WeeklyReflectionModal from "./weekly-reflection-modal"

type WeeklyInsightsData = {
  weekStart: string
  weekEnd: string
  insights: {
    headline?: string
    observations?: string[]
    reflection?: string
    question?: string
    summary?: string
    provider: string
    model: string
  }
  generatedAt: string
}

export default function WeeklyReflectionCard() {
  const { theme } = useTheme()
  const [data, setData] = useState<WeeklyInsightsData | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const res = await fetch("/api/premium/weekly-digest", { cache: "no-store" })
        const json = await res.json()
        if (!mounted) return
        if (json?.success) {
          setData(json.data)
        }
      } catch {
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  if (!data) return null

  const headline = (data.insights.headline || data.insights.summary || "").trim()
  const overview = (data.insights.reflection || "").trim() || (data.insights.observations?.[0] || "").trim()

  if (!headline) return null

  return (
    <section
      className={`rounded-2xl p-5 md:p-6 transition-all duration-200 relative overflow-hidden ${
        theme === "dark"
          ? "bg-gradient-to-br from-[#C4B5E0]/[0.08] to-white/[0.03] border border-[#C4B5E0]/[0.12] hover:border-[#C4B5E0]/20"
          : "bg-gradient-to-br from-[#F5F0FF] to-white/80 border border-[#D1C4E9]/60 hover:border-[#D1C4E9] hover:shadow-sm"
      }`}
    >
      <div className={`absolute top-0 left-0 w-full h-[2px] ${theme === 'dark' ? 'bg-gradient-to-r from-[#C4B5E0]/50 to-transparent' : 'bg-gradient-to-r from-[#7E6BA5]/30 to-transparent'}`} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-[10px] uppercase tracking-[0.16em] font-semibold mb-1.5 ${theme === "dark" ? "text-[#C4B5E0]/60" : "text-[#7E6BA5]/70"}`}>Weekly reflection</p>
          <h3 className={`font-semibold text-base md:text-lg ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{headline}</h3>
          {overview && (
            <p className={`mt-2 text-sm leading-relaxed line-clamp-2 ${theme === "dark" ? "text-white/70" : "text-gray-700"}`}>{overview}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          <Button
            onClick={() => setOpen(true)}
            variant="outline"
            className={theme === "dark" ? "border-white/20 bg-white/5 text-white hover:bg-white/10" : "border-gray-300 bg-white/70 text-gray-800 hover:bg-white"}
          >
            Read weekly reflection
          </Button>
        </div>
      </div>

      <WeeklyReflectionModal open={open} onOpenChange={setOpen} data={data} />
    </section>
  )
}
