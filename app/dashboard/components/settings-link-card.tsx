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
          : "bg-white/70 border border-[#E8E5DE] hover:border-[#D4D0C8] hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-[10px] uppercase tracking-[0.16em] font-semibold mb-2 ${isDark ? "text-white/35" : "text-[#8A8A7A]"}`}>Settings</p>
          <p className={`text-[13px] leading-relaxed ${isDark ? "text-white/60" : "text-[#5A5A4E]"}`}>Focus areas, prompt time, privacy, and export.</p>
        </div>
        <Button asChild variant="outline" className={isDark ? "border-white/15 bg-white/5 text-white hover:bg-white/10 rounded-lg" : "border-[#E0DDD6] bg-white text-[#3D3D3D] hover:bg-[#F0EDE6] rounded-lg"}>
          <Link href="/dashboard/settings">Open settings</Link>
        </Button>
      </div>
    </section>
  )
}
