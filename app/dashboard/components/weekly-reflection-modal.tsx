"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTheme } from "@/contexts/ThemeContext"

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

export default function WeeklyReflectionModal({
  open,
  onOpenChange,
  data,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: WeeklyInsightsData
}) {
  const { theme } = useTheme()

  const headline = (data.insights.headline || data.insights.summary || "").trim()
  const observations = (data.insights.observations || []).filter(Boolean).slice(0, 3)
  const reflection = (data.insights.reflection || "").trim()
  const question = (data.insights.question || "").trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={theme === "dark" ? "max-w-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white" : "max-w-2xl backdrop-blur-xl bg-white/80 border border-gray-200 text-gray-900"}>
        <DialogHeader>
          <DialogTitle className={theme === "dark" ? "text-xl font-semibold text-white" : "text-xl font-semibold text-gray-900"}>Weekly reflection</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {headline && (
            <div>
              <p className={theme === "dark" ? "text-white/60 text-xs" : "text-gray-500 text-xs"}>Headline</p>
              <p className={theme === "dark" ? "text-white text-base" : "text-gray-900 text-base"}>{headline}</p>
            </div>
          )}

          {observations.length > 0 && (
            <div>
              <p className={theme === "dark" ? "text-white/60 text-xs" : "text-gray-500 text-xs"}>Observations</p>
              <ul className="mt-2 space-y-2">
                {observations.map((o, i) => (
                  <li key={i} className={theme === "dark" ? "text-white/80 text-sm" : "text-gray-700 text-sm"}>
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reflection && (
            <div>
              <p className={theme === "dark" ? "text-white/60 text-xs" : "text-gray-500 text-xs"}>Reflection</p>
              <p className={theme === "dark" ? "mt-2 text-white/80 text-sm leading-relaxed" : "mt-2 text-gray-700 text-sm leading-relaxed"}>{reflection}</p>
            </div>
          )}

          {question && (
            <div>
              <p className={theme === "dark" ? "text-white/60 text-xs" : "text-gray-500 text-xs"}>One question</p>
              <p className={theme === "dark" ? "mt-2 text-white text-sm" : "mt-2 text-gray-900 text-sm"}>{question}</p>
            </div>
          )}

          <p className={theme === "dark" ? "text-[10px] text-white/35" : "text-[10px] text-gray-400"}>Generated with AI. Read when you’re ready.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
