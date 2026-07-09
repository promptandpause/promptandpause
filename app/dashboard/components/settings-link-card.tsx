"use client"

import Link from "next/link"
import { useTheme } from "@/contexts/ThemeContext"
import { Button } from "@/components/ui/button"

export default function SettingsLinkCard() {
  const { theme } = useTheme()

  const isDark = theme === "dark"

  return (
    <section
      className={`rounded-2xl p-5 transition-all duration-200 ${
        isDark
          ? "bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06]"
          : "bg-white/70 border border-[#EFF3F4] hover:border-[#EFF3F4] hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-[10px] uppercase tracking-[0.16em] font-semibold mb-2 ${isDark ? "text-white/35" : "text-[#8B98A5]"}`}>Settings</p>
          <p className={`text-[13px] leading-relaxed ${isDark ? "text-white/60" : "text-[#536471]"}`}>Focus areas, prompt time, privacy, and export.</p>
        </div>
        <Button asChild variant="outline" className={isDark ? "border-white/15 bg-white/5 text-white hover:bg-white/10 rounded-lg" : "border-[#E0DDD6] bg-white text-[#0F1419] hover:bg-[#EFF3F4] rounded-lg"}>
          <Link href="/settings">Open settings</Link>
        </Button>
      </div>
    </section>
  )
}
