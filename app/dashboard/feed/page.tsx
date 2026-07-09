"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { DashboardSidebar } from '@/app/dashboard/components/DashboardSidebar'
import { useTheme } from '@/contexts/ThemeContext'
import { FeedCard } from '@/components/social/FeedCard'
import { Loader2, Rss, Users } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import Link from 'next/link'
import type { FeedItem } from '@/lib/types/social'

export default function FeedPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { t } = useTranslation()
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadFeed = useCallback(async (pageNum: number, append = false) => {
    if (!append) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await fetch(`/api/social/feed?page=${pageNum}&limit=20`)
      const { data, pagination } = await res.json()
      if (append) {
        setFeed(prev => [...prev, ...(data || [])])
      } else {
        setFeed(data || [])
      }
      setHasMore(pagination?.hasMore || false)
    } catch {}
    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => { loadFeed(1) }, [loadFeed])

  return (
    <AuthGuard redirectPath="/dashboard/feed">
      <div className={`min-h-screen ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}>
        <div className="flex h-screen overflow-hidden">
          <DashboardSidebar />
          <main className="flex-1 pb-32 md:pb-10 overflow-y-auto scrollbar-thin">
            <div className="max-w-[800px] mx-auto px-4 md:px-8 pt-16 md:pt-10 pb-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className={`text-2xl md:text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#3D3D3D]'}`}>
                    Feed
                  </h1>
                  <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-[#8A8A7A]'}`}>
                    Reflections shared by your friends
                  </p>
                </div>
                <Link
                  href="/dashboard/friends"
                  className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-all ${
                    isDark
                      ? 'bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white'
                      : 'bg-white/80 text-[#5A5A4E] hover:bg-white hover:border-[#D4D0C8] border border-[#E8E5DE]'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Friends
                </Link>
              </div>

              {/* Feed */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className={`h-6 w-6 animate-spin ${isDark ? 'text-white/20' : 'text-[#B0AFA0]'}`} />
                  <p className={`text-sm ${isDark ? 'text-white/20' : 'text-[#B0AFA0]'}`}>Loading feed...</p>
                </div>
              ) : feed.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-10 text-center ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white/60 border border-[#E8E5DE]'}`}
                >
                  <Rss className={`h-10 w-10 mx-auto mb-4 ${isDark ? 'text-white/15' : 'text-[#D0CFC0]'}`} />
                  <h3 className={`font-semibold mb-1 ${isDark ? 'text-white/60' : 'text-[#5A5A4E]'}`}>
                    Your feed is empty
                  </h3>
                  <p className={`text-sm max-w-sm mx-auto mb-4 ${isDark ? 'text-white/30' : 'text-[#8A8A7A]'}`}>
                    Add friends to see their shared reflections here. Reflections are private by default — friends choose to share.
                  </p>
                  <Link
                    href="/dashboard/friends"
                    className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl ${
                      isDark
                        ? 'bg-white/10 text-white hover:bg-white/15'
                        : 'bg-[#3D3D3D] text-white hover:bg-[#5A5A4E]'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    Find Friends
                  </Link>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {feed.map((item, i) => (
                    <FeedCard key={`${item.reflection.id}-${i}`} item={item} />
                  ))}
                  {hasMore && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => {
                          const nextPage = page + 1
                          setPage(nextPage)
                          loadFeed(nextPage, true)
                        }}
                        disabled={loadingMore}
                        className={`text-sm px-6 py-2 rounded-xl transition-all ${
                          isDark
                            ? 'bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white'
                            : 'bg-white/80 text-[#5A5A4E] hover:bg-white border border-[#E8E5DE]'
                        }`}
                      >
                        {loadingMore ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        ) : (
                          'Load more'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
