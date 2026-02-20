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

  const cardClass = isDark
    ? 'bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6'
    : 'bg-white/70 border border-[#E8E5DE] rounded-2xl p-6'
  const skeletonClass = isDark ? 'bg-white/[0.08]' : 'bg-[#E8E5DE]/60'

  return (
    <div className="space-y-4 md:space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <Card className={cardClass}>
        <Skeleton className={`h-8 w-48 ${skeletonClass} mb-2`} />
        <Skeleton className={`h-4 w-64 ${skeletonClass}`} />
      </Card>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className={cardClass}>
          <Skeleton className={`h-6 w-32 ${skeletonClass} mb-4`} />
          <div className="space-y-3">
            <Skeleton className={`h-10 w-full ${skeletonClass}`} />
            <Skeleton className={`h-10 w-full ${skeletonClass}`} />
            <Skeleton className={`h-10 w-full ${skeletonClass}`} />
          </div>
        </Card>

        <Card className={cardClass}>
          <Skeleton className={`h-6 w-32 ${skeletonClass} mb-4`} />
          <div className="space-y-3">
            <Skeleton className={`h-10 w-full ${skeletonClass}`} />
            <Skeleton className={`h-10 w-full ${skeletonClass}`} />
            <Skeleton className={`h-10 w-full ${skeletonClass}`} />
          </div>
        </Card>
      </div>

      {/* Additional Skeleton Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className={cardClass}>
            <Skeleton className={`h-6 w-24 ${skeletonClass} mb-2`} />
            <Skeleton className={`h-8 w-16 ${skeletonClass}`} />
          </Card>
        ))}
      </div>
    </div>
  )
}
