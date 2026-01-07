"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTheme } from "@/contexts/ThemeContext"

type MonthlySummaryData = {
  monthStart: string
  monthEnd: string
  overviewText: string
  observations: string[]
  themeReflection: string
  closingQuestion: string
}

export default function MonthlyReflectionModal({
  open,
  onOpenChange,
  data,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: MonthlySummaryData
}) {
  const { theme } = useTheme()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={theme === "dark" ? "max-w-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white" : "max-w-2xl backdrop-blur-xl bg-white/80 border border-gray-200 text-gray-900"}>
        <DialogHeader>
          <DialogTitle className={theme === "dark" ? "text-xl font-semibold text-white" : "text-xl font-semibold text-gray-900"}>Monthly reflection</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className={theme === "dark" ? "text-white/60 text-xs" : "text-gray-500 text-xs"}>Month-at-a-glance</p>
            <p className={theme === "dark" ? "mt-2 text-white/80 text-sm leading-relaxed" : "mt-2 text-gray-700 text-sm leading-relaxed"}>{data.overviewText}</p>
          </div>

          {data.observations && data.observations.length > 0 && (
            <div>
              <p className={theme === "dark" ? "text-white/60 text-xs" : "text-gray-500 text-xs"}>Observations</p>
              <ul className="mt-2 space-y-2">
                {data.observations.slice(0, 3).map((o, i) => (
                  <li key={i} className={theme === "dark" ? "text-white/80 text-sm" : "text-gray-700 text-sm"}>
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className={theme === "dark" ? "text-white/60 text-xs" : "text-gray-500 text-xs"}>Recurring themes</p>
            <p className={theme === "dark" ? "mt-2 text-white/80 text-sm leading-relaxed" : "mt-2 text-gray-700 text-sm leading-relaxed"}>{data.themeReflection}</p>
          </div>

          <div>
            <p className={theme === "dark" ? "text-white/60 text-xs" : "text-gray-500 text-xs"}>One long-view question</p>
            <p className={theme === "dark" ? "mt-2 text-white text-sm" : "mt-2 text-gray-900 text-sm"}>{data.closingQuestion}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
