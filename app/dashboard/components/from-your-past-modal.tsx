"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTheme } from "@/contexts/ThemeContext"

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

export default function FromYourPastModal({
  open,
  onOpenChange,
  data,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: FromYourPastResponse
}) {
  const { theme } = useTheme()

  if (!data) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={theme === "dark" ? "max-w-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white" : "max-w-2xl backdrop-blur-xl bg-white/80 border border-gray-200 text-gray-900"}>
        <DialogHeader>
          <DialogTitle className={theme === "dark" ? "text-xl font-semibold text-white" : "text-xl font-semibold text-gray-900"}>From your past</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className={theme === "dark" ? "text-white/60 text-xs" : "text-gray-500 text-xs"}>{data.label}</p>
          <p className={theme === "dark" ? "text-white/80 text-sm leading-relaxed" : "text-gray-700 text-sm leading-relaxed"}>{data.reflection.reflectionText}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
