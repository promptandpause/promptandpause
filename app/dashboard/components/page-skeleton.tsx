"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { useTheme } from "@/contexts/ThemeContext"

/**
 * Page Skeleton Loader
 * 
 * Shows while data is being loaded from API
 * Prevents white flash and provides visual feedback
 */
export default function PageSkeleton() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const cardClass = `relative overflow-hidden rounded-2xl p-5 md:p-6 border backdrop-blur-xl ${
    isDark
      ? 'bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent border-white/[0.06]'
      : 'bg-gradient-to-br from-white/80 via-white/60 to-white/50 border-[#EFF3F4]'
  }`

  return (
    <div className="space-y-4 md:space-y-6" role="status" aria-live="polite" aria-label="Loading">
      {/* Header Skeleton */}
      <Card className={cardClass}>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-2xl pp-orb-breathe ${isDark ? 'bg-gradient-to-br from-violet-500/40 to-fuchsia-500/30' : 'bg-gradient-to-br from-violet-400/60 to-fuchsia-400/50'} shadow-sm`} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <Skeleton className="h-3.5 w-64 rounded-lg" />
          </div>
        </div>
      </Card>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className={cardClass}>
          <Skeleton className="h-5 w-32 rounded mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </Card>

        <Card className={cardClass}>
          <Skeleton className="h-5 w-32 rounded mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </Card>
      </div>

      {/* Additional Skeleton Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className={cardClass}>
            <Skeleton className="h-4 w-24 rounded mb-3" />
            <Skeleton className="h-7 w-16 rounded" />
          </Card>
        ))}
      </div>
    </div>
  )
}
