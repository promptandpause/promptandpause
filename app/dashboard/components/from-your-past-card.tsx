"use client"

import { useEffect, useMemo, useState } from "react"
import { useTheme } from "@/contexts/ThemeContext"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import FromYourPastModal from "./from-your-past-modal"

type FromYourPastResponse =
  | null
  | {
      label: string
      reflection: {
        id: string
        date: string
        promptText: string
        reflectionText: string
        mood: string | null
        wordCount: number
      }
    }

const STORAGE_KEY = "fromYourPastDismissedUntil"

function safeParseDate(value: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isFinite(d.getTime()) ? d : null
}

export default function FromYourPastCard() {
  const { theme } = useTheme()
  const [data, setData] = useState<FromYourPastResponse>(null)
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const now = useMemo(() => new Date(), [])

  useEffect(() => {
    const until = safeParseDate(localStorage.getItem(STORAGE_KEY))
    if (until && until.getTime() > Date.now()) {
      setDismissed(true)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function load() {
      if (dismissed) return

      try {
        const res = await fetch("/api/premium/from-your-past", { cache: "no-store" })
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
  }, [dismissed])

  if (dismissed || !data) return null

  const excerpt = (data.reflection.reflectionText || "").replace(/\s+/g, " ").trim()

  return (
    <section
      className={`rounded-2xl md:rounded-3xl p-5 md:p-7 transition-all duration-200 ${
        theme === "dark" ? "glass-light shadow-soft-lg" : "glass-medium shadow-soft-md"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-xs mb-2 ${theme === "dark" ? "text-white/50" : "text-gray-500"}`}>{data.label}</p>
          <p className={`text-sm leading-relaxed line-clamp-3 ${theme === "dark" ? "text-white/80" : "text-gray-700"}`}>{excerpt}</p>
          <div className="mt-4">
            <Button
              onClick={() => setOpen(true)}
              variant="outline"
              className={theme === "dark" ? "border-white/20 bg-white/5 text-white hover:bg-white/10" : "border-gray-300 bg-white/70 text-gray-800 hover:bg-white"}
            >
              Open reflection
            </Button>
          </div>
        </div>

        <button
          onClick={() => {
            const until = new Date(now)
            until.setDate(until.getDate() + 31)
            localStorage.setItem(STORAGE_KEY, until.toISOString())
            setDismissed(true)
          }}
          className={theme === "dark" ? "text-white/50 hover:text-white" : "text-gray-400 hover:text-gray-700"}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <FromYourPastModal open={open} onOpenChange={setOpen} data={data} />
    </section>
  )
}
