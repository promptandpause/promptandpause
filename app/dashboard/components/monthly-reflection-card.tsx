"use client"

import { useEffect, useState } from "react"
import { useTheme } from "@/contexts/ThemeContext"
import { Button } from "@/components/ui/button"
import MonthlyReflectionModal from "./monthly-reflection-modal"

type MonthlySummaryData = {
  monthStart: string
  monthEnd: string
  overviewText: string
  observations: string[]
  themeReflection: string
  closingQuestion: string
  createdAt?: string
  updatedAt?: string
}

export default function MonthlyReflectionCard() {
  const { theme } = useTheme()
  const [data, setData] = useState<MonthlySummaryData | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const res = await fetch("/api/premium/monthly-summary", { cache: "no-store" })
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

  return (
    <section
      className={`rounded-2xl md:rounded-3xl p-5 md:p-7 transition-all duration-200 ${
        theme === "dark" ? "glass-light shadow-soft-lg" : "glass-medium shadow-soft-md"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-xs mb-1 ${theme === "dark" ? "text-white/50" : "text-gray-500"}`}>This month</p>
          <p className={`text-sm leading-relaxed line-clamp-2 ${theme === "dark" ? "text-white/80" : "text-gray-700"}`}>{data.overviewText}</p>
        </div>
        <div className="flex-shrink-0">
          <Button
            onClick={() => setOpen(true)}
            variant="outline"
            className={theme === "dark" ? "border-white/20 bg-white/5 text-white hover:bg-white/10" : "border-gray-300 bg-white/70 text-gray-800 hover:bg-white"}
          >
            View monthly reflection
          </Button>
        </div>
      </div>

      <MonthlyReflectionModal open={open} onOpenChange={setOpen} data={data} />
    </section>
  )
}
