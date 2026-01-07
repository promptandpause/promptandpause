"use client"

import Link from "next/link"
import { useTheme } from "@/contexts/ThemeContext"
import { Button } from "@/components/ui/button"

export default function SettingsLinkCard() {
  const { theme } = useTheme()

  return (
    <section
      className={`rounded-2xl md:rounded-3xl p-5 md:p-7 transition-all duration-200 ${
        theme === "dark" ? "glass-light shadow-soft-lg" : "glass-medium shadow-soft-md"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={theme === "dark" ? "text-white/50 text-xs mb-1" : "text-gray-500 text-xs mb-1"}>Settings</p>
          <p className={theme === "dark" ? "text-white/70 text-sm" : "text-gray-700 text-sm"}>Focus areas, prompt time, privacy, and export.</p>
        </div>
        <Button asChild variant="outline" className={theme === "dark" ? "border-white/20 bg-white/5 text-white hover:bg-white/10" : "border-gray-300 bg-white/70 text-gray-800 hover:bg-white"}>
          <Link href="/dashboard/settings">Open settings</Link>
        </Button>
      </div>
    </section>
  )
}
