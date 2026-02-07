"use client"

import Link from "next/link"
import { useTheme } from "@/contexts/ThemeContext"
import { Button } from "@/components/ui/button"

export default function SettingsLinkCard() {
  const { theme } = useTheme()

  const isDark = theme === "dark"

  return (
    <section
      className={`rounded-2xl p-5 md:p-6 transition-all ${
        isDark ? "bg-white/5 border border-white/8" : "bg-[#FAFAF7] border border-[#E8E5DE]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-xs uppercase tracking-[0.14em] font-medium mb-2 ${isDark ? "text-white/40" : "text-[#8A8A7A]"}`}>Settings</p>
          <p className={`text-sm leading-relaxed ${isDark ? "text-white/70" : "text-[#5A5A4E]"}`}>Focus areas, prompt time, privacy, and export.</p>
        </div>
        <Button asChild variant="outline" className={isDark ? "border-white/15 bg-white/5 text-white hover:bg-white/10 rounded-lg" : "border-[#E0DDD6] bg-white text-[#3D3D3D] hover:bg-[#F0EDE6] rounded-lg"}>
          <Link href="/dashboard/settings">Open settings</Link>
        </Button>
      </div>
    </section>
  )
}
