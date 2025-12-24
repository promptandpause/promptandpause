"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

/**
 * Page Skeleton Loader
 * 
 * Shows while data is being loaded from API
 * Prevents white flash and provides visual feedback
 */
export default function PageSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
        <Skeleton className="h-8 w-48 bg-white/20 mb-2" />
        <Skeleton className="h-4 w-64 bg-white/20" />
      </Card>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl md:rounded-3xl p-6">
          <Skeleton className="h-6 w-32 bg-white/20 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full bg-white/20" />
            <Skeleton className="h-10 w-full bg-white/20" />
            <Skeleton className="h-10 w-full bg-white/20" />
          </div>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl md:rounded-3xl p-6">
          <Skeleton className="h-6 w-32 bg-white/20 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full bg-white/20" />
            <Skeleton className="h-10 w-full bg-white/20" />
            <Skeleton className="h-10 w-full bg-white/20" />
          </div>
        </Card>
      </div>

      {/* Additional Skeleton Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <Skeleton className="h-6 w-24 bg-white/20 mb-2" />
            <Skeleton className="h-8 w-16 bg-white/20" />
          </Card>
        ))}
      </div>
    </div>
  )
}
