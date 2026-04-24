"use client"

import { useTheme } from "@/contexts/ThemeContext"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * DashboardLoading — first-paint skeleton shown while the dashboard
 * route segment resolves. Uses the Apple-style shimmer primitives
 * from globals.css. Layout mirrors the real dashboard grid so the
 * transition into loaded content feels continuous, not jarring.
 */
export default function DashboardLoading() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const card = `relative overflow-hidden rounded-2xl p-5 md:p-6 border backdrop-blur-xl ${
    isDark
      ? 'bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent border-white/[0.06]'
      : 'bg-gradient-to-br from-white/80 via-white/60 to-white/50 border-[#E8E5DE]'
  }`

  return (
    <div
      data-dashboard
      className={`min-h-screen ${isDark ? 'bg-[#141820]' : 'bg-[#F5F3EE]'}`}
    >
      {/* Ambient brand blobs — same vocabulary as real dashboard */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className={`absolute -top-40 -left-24 h-[420px] w-[420px] rounded-full blur-3xl ${isDark ? 'bg-violet-500/10' : 'bg-violet-300/30'}`} />
        <div className={`absolute -bottom-40 -right-24 h-[460px] w-[460px] rounded-full blur-3xl ${isDark ? 'bg-emerald-400/10' : 'bg-emerald-300/25'}`} />
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-10 pt-16 md:pt-10 pb-32 md:pb-10">
        <div className="space-y-5 md:space-y-6">
          {/* Welcome header skeleton */}
          <div className={card}>
            <div className="flex items-center gap-4">
              <div
                className={`h-12 w-12 rounded-2xl pp-orb-breathe ${
                  isDark
                    ? 'bg-gradient-to-br from-violet-500/40 to-fuchsia-500/30'
                    : 'bg-gradient-to-br from-violet-400/60 to-fuchsia-400/50'
                } shadow-lg`}
              />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48 rounded-lg" />
                <Skeleton className="h-3.5 w-64 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Today composer skeleton */}
          <div className={card}>
            <div className="flex items-center gap-3 mb-5">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-3 w-40 rounded" />
              </div>
            </div>
            <Skeleton className="h-5 w-5/6 rounded mb-2" />
            <Skeleton className="h-5 w-3/4 rounded mb-6" />
            <Skeleton className="h-[120px] w-full rounded-xl mb-4" />
            <div className="flex gap-2 mb-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-10 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>

          {/* Two-column: Rhythm + QuickStats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div className={card}>
              <div className="flex items-center gap-3 mb-5">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3 w-36 rounded" />
                </div>
              </div>
              <div className="flex justify-between">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-3 w-6 rounded" />
                  </div>
                ))}
              </div>
            </div>

            <div className={card}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="h-4 w-24 rounded" />
                  </div>
                  <Skeleton className="h-6 w-10 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Accessible, hidden label for screen readers */}
      <span className="sr-only" role="status" aria-live="polite">
        Loading your dashboard…
      </span>
    </div>
  )
}
