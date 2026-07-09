"use client"

import { useTheme } from "@/contexts/ThemeContext"

/**
 * DashboardLoading — lightweight blurred curtain shown while a dashboard
 * route segment resolves on the server.
 *
 * Design intent (matches the user's preference for the archive/journals feel):
 *   - No full-page skeleton scaffolding. That's reserved for in-page
 *     component-level loading states (e.g. Archive's Skeleton cards), where
 *     it communicates structure of the specific content being fetched.
 *   - A soft frosted-glass backdrop + breathing brand orb instead, so the
 *     previous paint isn't replaced by an aggressive grey-block skeleton.
 *   - Minimal motion: a gentle breathe on the orb + a faint shimmer band.
 *     Respects `prefers-reduced-motion` via the shared CSS primitives.
 */
export default function DashboardLoading() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div
      data-dashboard
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={`min-h-screen relative overflow-hidden ${
        isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'
      }`}
    >
      {/* Ambient brand blobs — continuous with the real dashboard backdrop. */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className={`absolute -top-40 -left-24 h-[420px] w-[420px] rounded-full blur-3xl ${
            isDark ? 'bg-violet-500/10' : 'bg-violet-300/30'
          }`}
        />
        <div
          className={`absolute -bottom-40 -right-24 h-[460px] w-[460px] rounded-full blur-3xl ${
            isDark ? 'bg-emerald-400/10' : 'bg-emerald-300/25'
          }`}
        />
      </div>

      {/* Frosted-glass curtain — softens the backdrop and gives the feeling
          of content being just-out-of-focus, clearing as the real page
          mounts. Uses the browser's compositor, so it's essentially free. */}
      <div
        className={`absolute inset-0 backdrop-blur-xl ${
          isDark ? 'bg-[#0A0A0A]/40' : 'bg-[#FFFFFF]/50'
        }`}
      />

      {/* Centered brand orb + single-line hint. No skeleton blocks — the
          underlying surface stays calm while the next segment resolves. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
        <div
          className={`pp-orb-breathe h-14 w-14 rounded-2xl shadow-lg ring-1 ${
            isDark
              ? 'bg-gradient-to-br from-violet-500/60 to-fuchsia-500/40 ring-white/10'
              : 'bg-gradient-to-br from-violet-400/80 to-fuchsia-400/70 ring-black/5'
          }`}
        />
        <span
          className={`text-xs tracking-wide ${
            isDark ? 'text-white/50' : 'text-[#536471]/70'
          }`}
        >
          One moment…
        </span>
      </div>
    </div>
  )
}
