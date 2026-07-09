"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { DashboardSidebar } from '@/app/dashboard/components/DashboardSidebar'
import { useTheme } from '@/contexts/ThemeContext'
import { FeedCard } from '@/components/social/FeedCard'
import { Spinner, Rss, Users } from 'phosphor-react'
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
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="flex items-center justify-between mb-6"
              >
                <div>
                  <h1 className={`text-2xl md:text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                    Feed
                  </h1>
                  <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                    Reflections shared by your friends
                  </p>
                </div>
                <Link
                  href="/friends"
                  className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-all ${
                    isDark
                      ? 'bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white'
                      : 'bg-white/80 text-[#536471] hover:bg-white hover:border-[#EFF3F4] border border-[#EFF3F4]'
                  }`}
                >
                  <Users size={16} weight="bold" />
                  Friends
                </Link>
              </motion.div>

              {/* Feed */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Spinner size={24} weight="bold" className={`animate-spin ${isDark ? 'text-white/20' : 'text-[#8B98A5]'}`} />
                  <p className={`text-sm ${isDark ? 'text-white/20' : 'text-[#8B98A5]'}`}>Loading feed...</p>
                </div>
              ) : feed.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-10 text-center ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white/60 border border-[#EFF3F4]'}`}
                >
                  <Rss size={40} weight="bold" className={`mx-auto mb-4 ${isDark ? 'text-white/15' : 'text-[#D0CFC0]'}`} />
                  <h3 className={`font-semibold mb-1 ${isDark ? 'text-white/60' : 'text-[#536471]'}`}>
                    Your feed is empty
                  </h3>
                  <p className={`text-sm max-w-sm mx-auto mb-4 ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>
                    Add friends to see their shared reflections here. Reflections are private by default — friends choose to share.
                  </p>
                  <Link
                    href="/friends"
                    className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl ${
                      isDark
                        ? 'bg-white/10 text-white hover:bg-white/15'
                        : 'bg-[#0F1419] text-white hover:bg-[#536471]'
                    }`}
                  >
                    <Users size={16} weight="bold" />
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
                            : 'bg-white/80 text-[#536471] hover:bg-white border border-[#EFF3F4]'
                        }`}
                      >
                        {loadingMore ? (
                          <Spinner size={16} weight="bold" className="animate-spin mx-auto" />
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
