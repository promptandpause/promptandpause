'use client'

/**
 * Shared design-system primitives for premium "accent cards" used across
 * wellness tools, dashboard cards, and future feature surfaces.
 *
 * Exports:
 *   - `Accent` type + `accentStyles`   — per-accent palette tokens
 *   - `ToolCard`                        — gradient action card with hover lift
 *   - `IconOrb`                         — gradient circular icon container
 *   - `AccentOrb`                       — larger hero orb (for interior screens)
 *   - `BackButton`                      — pill-shaped spring back affordance
 *   - `CompletionState`                 — shared "Well done" success state
 *
 * All components respect `prefers-reduced-motion` via framer-motion defaults.
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type Accent = 'emerald' | 'blue' | 'violet' | 'rose' | 'amber'

export const accentStyles: Record<
  Accent,
  { glow: string; surface: string; border: string; ring: string; fill: string; ringBand: string; glowOrb: string }
> = {
  emerald: {
    glow: 'bg-emerald-400/25',
    surface:
      'from-emerald-50/90 via-white/70 to-white/60 dark:from-emerald-500/10 dark:via-white/[0.02] dark:to-transparent',
    border:
      'border-emerald-200/60 dark:border-emerald-400/15 hover:border-emerald-300/80 dark:hover:border-emerald-400/30',
    ring: 'focus-visible:ring-emerald-400/40',
    fill: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-white',
    ringBand: 'from-emerald-400/35 to-emerald-300/10',
    glowOrb: 'bg-emerald-400/35',
  },
  blue: {
    glow: 'bg-sky-400/25',
    surface:
      'from-sky-50/90 via-white/70 to-white/60 dark:from-sky-500/10 dark:via-white/[0.02] dark:to-transparent',
    border:
      'border-sky-200/60 dark:border-sky-400/15 hover:border-sky-300/80 dark:hover:border-sky-400/30',
    ring: 'focus-visible:ring-sky-400/40',
    fill: 'bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 text-white',
    ringBand: 'from-sky-400/35 to-sky-300/10',
    glowOrb: 'bg-sky-400/35',
  },
  violet: {
    glow: 'bg-violet-400/25',
    surface:
      'from-violet-50/90 via-white/70 to-white/60 dark:from-violet-500/10 dark:via-white/[0.02] dark:to-transparent',
    border:
      'border-violet-200/60 dark:border-violet-400/15 hover:border-violet-300/80 dark:hover:border-violet-400/30',
    ring: 'focus-visible:ring-violet-400/40',
    fill: 'bg-gradient-to-br from-violet-400 via-violet-500 to-violet-600 text-white',
    ringBand: 'from-violet-400/35 to-violet-300/10',
    glowOrb: 'bg-violet-400/35',
  },
  rose: {
    glow: 'bg-rose-400/25',
    surface:
      'from-rose-50/90 via-white/70 to-white/60 dark:from-rose-500/10 dark:via-white/[0.02] dark:to-transparent',
    border:
      'border-rose-200/60 dark:border-rose-400/15 hover:border-rose-300/80 dark:hover:border-rose-400/30',
    ring: 'focus-visible:ring-rose-400/40',
    fill: 'bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 text-white',
    ringBand: 'from-rose-400/35 to-rose-300/10',
    glowOrb: 'bg-rose-400/35',
  },
  amber: {
    glow: 'bg-amber-400/25',
    surface:
      'from-amber-50/90 via-white/70 to-white/60 dark:from-amber-500/10 dark:via-white/[0.02] dark:to-transparent',
    border:
      'border-amber-200/60 dark:border-amber-400/15 hover:border-amber-300/80 dark:hover:border-amber-400/30',
    ring: 'focus-visible:ring-amber-400/40',
    fill: 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white',
    ringBand: 'from-amber-400/35 to-amber-300/10',
    glowOrb: 'bg-amber-400/35',
  },
}

/* ───────────────────────────── ToolCard ───────────────────────────── */

export function ToolCard({
  onClick,
  isDark,
  accent,
  title,
  subtitle,
  icon,
  asListItem = true,
}: {
  onClick: () => void
  isDark: boolean
  accent: Accent
  title: string
  subtitle: string
  icon: React.ReactNode
  /** Whether to wrap as motion.li (default, for staggered lists) or motion.div */
  asListItem?: boolean
}) {
  const s = accentStyles[accent]
  const Wrapper: any = asListItem ? motion.li : motion.div
  return (
    <Wrapper
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } },
      }}
    >
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 400, damping: 26 }}
        className={[
          'group relative w-full text-left overflow-hidden',
          'rounded-2xl p-4 md:p-[18px] border transition-colors duration-200',
          'bg-gradient-to-br',
          s.surface,
          s.border,
          'shadow-[0_1px_2px_rgba(15,20,20,0.04)] hover:shadow-[0_12px_28px_-12px_rgba(15,20,20,0.18)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          s.ring,
        ].join(' ')}
      >
        <span
          aria-hidden
          className={`pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full blur-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-500 ${s.glow}`}
        />
        <div className="relative flex items-center gap-4">
          <div className="shrink-0">{icon}</div>
          <div className="flex-1 min-w-0">
            <p className={`text-[15px] font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#2F3B34]'}`}>
              {title}
            </p>
            <p className={`mt-0.5 text-[13px] leading-snug ${isDark ? 'text-white/55' : 'text-[#6B7F6E]'}`}>
              {subtitle}
            </p>
          </div>
          <ChevronRight
            className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${isDark ? 'text-white/35' : 'text-[#8A9B8F]'}`}
          />
        </div>
      </motion.button>
    </Wrapper>
  )
}

/* ───────────────────────────── IconOrb ───────────────────────────── */

export function IconOrb({
  accent,
  size = 'md',
  children,
}: {
  accent: Accent
  /** Small 40px (list icons), md 44px (tool cards), lg 64-80px (interior headers) */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}) {
  const s = accentStyles[accent]
  const dims =
    size === 'sm' ? 'h-10 w-10' : size === 'lg' ? 'h-16 w-16' : size === 'xl' ? 'h-20 w-20' : 'h-11 w-11'
  const band = size === 'xl' ? 'inset-[-10px]' : size === 'lg' ? 'inset-[-8px]' : 'inset-[-6px]'
  return (
    <span className="relative inline-flex items-center justify-center">
      <span className={`absolute ${band} rounded-2xl bg-gradient-to-br ${s.ringBand} blur-[6px] opacity-80`} />
      <span className={`relative inline-flex ${dims} items-center justify-center rounded-2xl shadow-sm ${s.fill}`}>
        {children}
      </span>
    </span>
  )
}

/* ─────────────────────────── AccentOrb (hero) ─────────────────────────── */
/**
 * Larger round hero orb used on interior tool screens. Has a blurred radial
 * ambient glow and a specular highlight for perceived depth.
 */
export function AccentOrb({
  accent,
  size = 'lg',
  children,
  className = '',
}: {
  accent: Accent
  size?: 'md' | 'lg' | 'xl'
  children: React.ReactNode
  className?: string
}) {
  const s = accentStyles[accent]
  const dim = size === 'xl' ? 'w-20 h-20' : size === 'md' ? 'w-14 h-14' : 'w-16 h-16'
  const glowExpand = size === 'xl' ? 'inset-[-10px]' : 'inset-[-8px]'
  return (
    <div className={`relative mx-auto ${dim} ${className}`}>
      <span className={`absolute ${glowExpand} rounded-full blur-xl ${s.glowOrb}`} />
      <div className={`relative ${dim} rounded-full flex items-center justify-center ${s.fill} shadow-[0_16px_40px_-12px_rgba(15,20,20,0.35)]`}>
        <span aria-hidden className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
        <span className="relative">{children}</span>
      </div>
    </div>
  )
}

/* ──────────────────────────── BackButton ──────────────────────────── */

export function BackButton({ isDark, onClick, label = 'Back' }: { isDark: boolean; onClick: () => void; label?: string }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
        isDark
          ? 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
          : 'text-[#6B7F6E] hover:text-[#2F3B34] bg-[#EFEDE6] hover:bg-[#E6E3DB]'
      }`}
    >
      <ChevronRight className="w-3.5 h-3.5 rotate-180" />
      {label}
    </motion.button>
  )
}

/* ─────────────────────────── CompletionState ─────────────────────────── */

export function CompletionState({
  isDark,
  accent,
  title,
  body,
  onPrimary,
  primaryLabel,
  icon,
}: {
  isDark: boolean
  accent: Accent
  title: string
  body: string
  onPrimary: () => void
  primaryLabel: string
  icon?: React.ReactNode
}) {
  return (
    <div className="text-center py-6 space-y-5">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      >
        <AccentOrb accent={accent} size="xl">
          {icon ?? <Heart className="w-9 h-9 text-white" strokeWidth={1.75} />}
        </AccentOrb>
      </motion.div>
      <div>
        <h3 className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#2F3B34]'}`}>{title}</h3>
        <p className={`mt-2 text-sm max-w-sm mx-auto ${isDark ? 'text-white/55' : 'text-[#6B7F6E]'}`}>{body}</p>
      </div>
      <motion.div
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 26 }}
        className="inline-block"
      >
        <Button
          onClick={onPrimary}
          variant="outline"
          className={`rounded-full px-5 ${isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-[#E8E5DE] text-[#2F3B34] hover:bg-white'}`}
        >
          {primaryLabel}
        </Button>
      </motion.div>
    </div>
  )
}
