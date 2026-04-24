"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sprout } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { Reflection } from "@/lib/types/reflection"
import { IconOrb } from "@/components/ui/accent-card"

/**
 * Return-to-Self Card
 *
 * Surfaces the user's most recent past reflection when they come back on a
 * new day — so a returning visit feels continuous with their prior self
 * rather than starting from scratch.
 *
 * Shown only when:
 *   - The user has at least one past reflection, AND
 *   - Their most recent reflection is NOT from today
 *
 * This keeps the dashboard uncluttered for first-time users and for users
 * who've already checked in today.
 */
export default function ReturnToSelfCard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [lastReflection, setLastReflection] = useState<Reflection | null>(null)
  const [topTag, setTopTag] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/reflections', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        const reflections: Reflection[] = json?.data || []
        if (cancelled || reflections.length === 0) return

        const todayStr = new Date().toISOString().split('T')[0]
        // reflections come back ordered by date desc
        const latest = reflections[0]
        if (!latest || latest.date === todayStr) return

        // Compute top tag over the last 14 days for a gentle "theme".
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 14)
        const cutoffStr = cutoff.toISOString().split('T')[0]
        const recent = reflections.filter(r => r.date >= cutoffStr)
        const counts: Record<string, number> = {}
        recent.forEach(r => (r.tags || []).forEach(t => {
          counts[t] = (counts[t] || 0) + 1
        }))
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]

        if (!cancelled) {
          setLastReflection(latest)
          setTopTag(top && top[1] >= 2 ? top[0] : null)
        }
      } catch {
        // Silent — this card is non-critical.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading || !lastReflection) return null

  const daysAgo = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(lastReflection.date).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  )
  const whenLabel =
    daysAgo <= 1 ? 'yesterday' : daysAgo < 7 ? `${daysAgo} days ago` : 'recently'

  const snippet = (lastReflection.prompt_text || '').trim().slice(0, 120)

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`relative overflow-hidden rounded-3xl p-5 md:p-6 border backdrop-blur-xl ${
        isDark
          ? 'bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-transparent border-white/[0.08] shadow-[0_20px_60px_-24px_rgba(0,0,0,0.5)]'
          : 'bg-gradient-to-br from-white/90 via-white/70 to-white/60 border-[#E8E5DE] shadow-[0_20px_50px_-28px_rgba(76,120,98,0.18)]'
      }`}
    >
      <span aria-hidden className={`pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full blur-3xl ${isDark ? 'bg-emerald-400/10' : 'bg-emerald-300/25'}`} />
      <div className="relative flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <IconOrb accent="emerald" size="sm">
            <Sprout className="w-4 h-4 text-white" strokeWidth={2} />
          </IconOrb>
          <div>
            <p className={`text-[11px] uppercase tracking-wide font-semibold ${isDark ? 'text-white/50' : 'text-[#8A8A7A]'}`}>Welcome back</p>
            <p className={`text-sm md:text-base font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#3D3D3D]'}`}>Picking up from {whenLabel}</p>
          </div>
        </div>
      </div>
      <p className={`relative text-sm md:text-base leading-relaxed ${isDark ? 'text-white/85' : 'text-[#3D3D3D]'}`}>
        Last time, you sat with:
      </p>
      {snippet && (
        <blockquote className={`mt-2 italic text-sm md:text-base leading-relaxed ${isDark ? 'text-white/70' : 'text-[#5A5A4E]'}`}>
          &ldquo;{snippet}{lastReflection.prompt_text.length > 120 ? '…' : ''}&rdquo;
        </blockquote>
      )}
      {topTag && (
        <p className={`text-xs mt-3 ${isDark ? 'text-white/50' : 'text-[#8A8A7A]'}`}>
          A recurring theme for you lately: <span className="font-medium">{topTag}</span>.
        </p>
      )}
      <div className="mt-4">
        <Link
          href="/dashboard/history"
          className={`inline-flex items-center gap-1.5 text-xs md:text-sm font-medium underline-offset-4 hover:underline ${isDark ? 'text-[#B8C9E0]' : 'text-[#5B7FA5]'}`}
        >
          Revisit your thoughts
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </motion.section>
  )
}
