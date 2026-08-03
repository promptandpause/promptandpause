"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import GlobalDataSync from "./components/global-data-sync"
import { DashboardSidebar } from "./components/DashboardSidebar"
import { RandomFeed } from "./components/RandomFeed"
import { QuickShare } from "@/components/social/QuickShare"
import YourRhythm from "./components/your-rhythm"
import { TrendingTopics } from "./components/TrendingTopics"
import { WhoToFollow } from "./components/WhoToFollow"
import { useTheme } from "@/contexts/ThemeContext"
import { useTranslation } from "@/hooks/useTranslation"

import { useEffect, useState, useCallback } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { trackEventOncePerSession } from "@/lib/services/eventsService"
import { motion, AnimatePresence } from "framer-motion"
import { Rss, Spinner, Wind, Heart, PencilLine, Sun, ChatCircle, Sparkle } from "phosphor-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CommentSection } from "@/components/social/CommentSection"
import { ReportBlockMenu } from "@/components/social/ReportBlockMenu"

interface FeedItem {
  id: string
  prompt_text: string
  reflection_text: string
  mood: string
  tags: string[]
  created_at: string
  user_id: string
  profile: {
    id: string
    full_name: string
    display_name: string
    username: string
    avatar_url: string
  }
  like_count: number
  is_liked_by_me: boolean
}

export default function DashboardPage() {
  return (
    <AuthGuard redirectPath="/dashboard">
      <DashboardContent />
    </AuthGuard>
  )
}

function DashboardContent() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const { t } = useTranslation()
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [userName, setUserName] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [greetingKey, setGreetingKey] = useState<"dashboard.goodMorning" | "dashboard.goodAfternoon" | "dashboard.goodEvening">("dashboard.goodMorning")
  const [tab, setTab] = useState<"for_you" | "following" | "likes">("for_you")
  const [followingFeed, setFollowingFeed] = useState<FeedItem[]>([])
  const [followingLoading, setFollowingLoading] = useState(false)
  const [followingPage, setFollowingPage] = useState(1)
  const [followingHasMore, setFollowingHasMore] = useState(false)
  const [followingLoadingMore, setFollowingLoadingMore] = useState(false)
  const [likesFeed, setLikesFeed] = useState<FeedItem[]>([])
  const [likesLoading, setLikesLoading] = useState(false)
  const [likesCursor, setLikesCursor] = useState<string | null>(null)
  const [likesHasMore, setLikesHasMore] = useState(false)
  const [likesLoadingMore, setLikesLoadingMore] = useState(false)
  const [openComments, setOpenComments] = useState<Set<string>>(new Set())

  function toggleComments(id: string) {
    setOpenComments(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreetingKey("dashboard.goodMorning")
    else if (hour < 18) setGreetingKey("dashboard.goodAfternoon")
    else setGreetingKey("dashboard.goodEvening")

    trackEventOncePerSession("session_start", "session_start", {
      hour,
      tz_offset: new Date().getTimezoneOffset(),
    })

    async function loadName() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setCurrentUserId(user.id)
        const res = await fetch("/api/user/profile")
        if (res.ok) {
          const { data } = await res.json()
          setUserName(data?.full_name?.split(" ")[0] || "")
        }
      } catch {}
    }
    loadName()
  }, [supabase])

  const loadFollowingFeed = useCallback(async () => {
    setFollowingLoading(true)
    try {
      const res = await fetch("/api/social/feed?page=1&limit=20")
      const { data, pagination } = await res.json()
      const items = (data || []).map((item: any) => ({
        ...item.reflection,
        profile: item.author,
        like_count: item.like_count || 0,
        is_liked_by_me: item.is_liked_by_me || false,
      }))
      setFollowingFeed(items)
      setFollowingPage(1)
      setFollowingHasMore(!!pagination?.hasMore)
    } catch {}
    setFollowingLoading(false)
  }, [])

  async function loadMoreFollowing() {
    if (followingLoadingMore || !followingHasMore) return
    setFollowingLoadingMore(true)
    try {
      const nextPage = followingPage + 1
      const res = await fetch(`/api/social/feed?page=${nextPage}&limit=20`)
      const { data, pagination } = await res.json()
      const items = (data || []).map((item: any) => ({
        ...item.reflection,
        profile: item.author,
        like_count: item.like_count || 0,
        is_liked_by_me: item.is_liked_by_me || false,
      }))
      setFollowingFeed(prev => [...prev, ...items])
      setFollowingPage(nextPage)
      setFollowingHasMore(!!pagination?.hasMore)
    } catch {}
    setFollowingLoadingMore(false)
  }

  const loadLikesFeed = useCallback(async () => {
    setLikesLoading(true)
    try {
      const res = await fetch("/api/social/liked-feed")
      const { data, nextCursor, hasMore } = await res.json()
      setLikesFeed(data || [])
      setLikesCursor(nextCursor || null)
      setLikesHasMore(!!hasMore)
    } catch {}
    setLikesLoading(false)
  }, [])

  async function loadMoreLikes() {
    if (likesLoadingMore || !likesHasMore || !likesCursor) return
    setLikesLoadingMore(true)
    try {
      const res = await fetch(`/api/social/liked-feed?before=${encodeURIComponent(likesCursor)}`)
      const { data, nextCursor, hasMore } = await res.json()
      setLikesFeed(prev => [...prev, ...(data || [])])
      setLikesCursor(nextCursor || null)
      setLikesHasMore(!!hasMore)
    } catch {}
    setLikesLoadingMore(false)
  }

  useEffect(() => {
    if (tab === "following") {
      loadFollowingFeed()
    } else if (tab === "likes") {
      loadLikesFeed()
    }
  }, [tab, loadFollowingFeed, loadLikesFeed])

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0A0A0A]" : "bg-[#FFFFFF]"}`}>
      <GlobalDataSync />

      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1400px] mx-auto flex gap-8 px-0 xl:px-6">
          <div className="flex-1 min-w-0 max-w-[680px] border-r border-[#EFF3F4] dark:border-white/[0.06]">
          {/* Twitter-style header */}
          <div className={`sticky top-0 z-10 backdrop-blur-md ${
            isDark ? "bg-[#0A0A0A]/80 border-b border-white/[0.06]" : "bg-white/80 border-b border-[#EFF3F4]"
          }`}>
            <div className="px-4 h-12 flex items-center">
              <h1 className={`text-xl font-semibold ${isDark ? "text-white" : "text-[#0F1419]"}`}>
                {tab === "for_you" ? t(greetingKey) : tab === "following" ? "Following" : "Likes"}{tab === "for_you" && userName ? `, ${userName}` : ""}
              </h1>
            </div>
            <div className="flex">
              <button
                className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
                  tab === "for_you"
                    ? `border-b-2 border-[#1D9BF0] ${isDark ? "text-white" : "text-[#0F1419]"}`
                    : `${isDark ? "text-white/40 hover:text-white/60" : "text-[#536471] hover:text-[#0F1419]"}`
                }`}
                onClick={() => setTab("for_you")}
              >
                For You
              </button>
              <button
                className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
                  tab === "following"
                    ? `border-b-2 border-[#1D9BF0] ${isDark ? "text-white" : "text-[#0F1419]"}`
                    : `${isDark ? "text-white/40 hover:text-white/60" : "text-[#536471] hover:text-[#0F1419]"}`
                }`}
                onClick={() => setTab("following")}
              >
                Following
              </button>
              <button
                className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
                  tab === "likes"
                    ? `border-b-2 border-[#1D9BF0] ${isDark ? "text-white" : "text-[#0F1419]"}`
                    : `${isDark ? "text-white/40 hover:text-white/60" : "text-[#536471] hover:text-[#0F1419]"}`
                }`}
                onClick={() => setTab("likes")}
              >
                Likes
              </button>
            </div>
          </div>

          {/* Compose / Quick Share */}
          <div className={`px-4 py-3 border-b ${isDark ? "border-white/[0.06]" : "border-[#EFF3F4]"}`}>
            <QuickShare onShared={() => {}} />
          </div>

          {/* Quick Actions + Streak Row */}
          <div className={`px-4 py-3 border-b ${isDark ? "border-white/[0.06]" : "border-[#EFF3F4]"}`}>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <QuickActionBtn
                icon={<Wind size={16} weight="bold" />}
                label="Breathe"
                href="/wellness?open=breathing"
                isDark={isDark}
              />
              <QuickActionBtn
                icon={<Heart size={16} weight="bold" />}
                label="Check In"
                href="/wellness"
                isDark={isDark}
              />
              <QuickActionBtn
                icon={<PencilLine size={16} weight="bold" />}
                label="Reflect"
                href="/reflect"
                isDark={isDark}
              />
              <QuickActionBtn
                icon={<Sun size={16} weight="bold" />}
                label="Gratitude"
                href="/wellness?open=gratitude"
                isDark={isDark}
              />
            </div>
            <YourRhythm />
          </div>

          {/* Feed */}
          <div className="pb-16">
            <AnimatePresence mode="wait">
              {tab === "for_you" ? (
                <motion.div key="for_you" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <RandomFeed />
                </motion.div>
              ) : tab === "following" ? (
                <motion.div key="following" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {followingLoading ? (
                    <div className="flex justify-center py-12">
                      <Spinner size={24} weight="bold" className={`animate-spin ${isDark ? "text-white/20" : "text-[#8B98A5]"}`} />
                    </div>
                  ) : followingFeed.length === 0 ? (
                    <div className={`text-center py-16 px-8 ${isDark ? "text-white/30" : "text-[#8B98A5]"}`}>
                      <Rss size={40} weight="bold" className={`mx-auto mb-4 ${isDark ? "text-white/15" : "text-[#D0CFC0]"}`} />
                      <p className="text-sm font-medium mb-1">Your feed is empty</p>
                      <p className="text-xs">Add friends to see their shared reflections here.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {followingFeed.map((item) => {
                        const displayName = item.profile?.display_name || item.profile?.full_name || "Unknown"
                        return (
                          <div
                            key={item.id}
                            className={`px-4 py-3 cursor-pointer transition-colors ${
                              isDark
                                ? "hover:bg-white/[0.02] border-b border-white/[0.06]"
                                : "hover:bg-[#F7F9FA] border-b border-[#EFF3F4]"
                            }`}
                            onClick={() => item.profile?.username && router.push(`/${item.profile.username}`)}
                          >
                            <div className="flex gap-3">
                              <div className="shrink-0">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isDark ? "bg-[#161618]" : "bg-[#EFF3F4]"}`}>
                                  {item.profile?.avatar_url ? (
                                    <img src={item.profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                                  ) : (
                                    <span className={`text-sm font-semibold ${isDark ? "text-white/40" : "text-[#536471]"}`}>
                                      {displayName.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#0F1419]"}`}>
                                      {displayName}
                                    </span>
                                    <span className={`text-sm ${isDark ? "text-white/30" : "text-[#536471]"}`}>
                                      @{item.profile?.username}
                                    </span>
                                  </div>
                                  <ReportBlockMenu
                                    targetType="reflection"
                                    targetId={item.id}
                                    authorId={item.user_id}
                                    authorName={displayName}
                                    currentUserId={currentUserId}
                                    onBlocked={() => setFollowingFeed(prev => prev.filter(f => f.user_id !== item.user_id))}
                                  />
                                </div>
                                <p className={`text-sm leading-relaxed mt-0.5 ${isDark ? "text-white/80" : "text-[#0F1419]"}`}>
                                  {item.reflection_text}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-lg leading-none">{item.mood}</span>
                                  {item.tags?.slice(0, 3).map((tag: string) => (
                                    <span key={tag} className="text-xs text-[#1D9BF0]">#{tag}</span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-6 mt-2">
                                  <button className={`flex items-center gap-1.5 text-xs transition-colors ${isDark ? 'text-white/30 hover:text-[#1D9BF0]' : 'text-[#536471] hover:text-[#1D9BF0]'}`}
                                    onClick={e => { e.stopPropagation(); toggleComments(item.id) }}>
                                    <ChatCircle size={14} weight="bold" /> Reply
                                  </button>
                                  <button
                                    onClick={async e => {
                                      e.stopPropagation()
                                      const res = await fetch('/api/social/likes', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ reflection_id: item.id }),
                                      })
                                      if (res.ok) {
                                        setFollowingFeed(prev => prev.map(f =>
                                          f.id === item.id
                                            ? { ...f, is_liked_by_me: !f.is_liked_by_me, like_count: f.like_count + (f.is_liked_by_me ? -1 : 1) }
                                            : f
                                        ))
                                      }
                                    }}
                                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                                      item.is_liked_by_me
                                        ? 'text-pink-500'
                                        : isDark ? 'text-white/30 hover:text-pink-400' : 'text-[#536471] hover:text-pink-500'
                                    }`}
                                  >
                                    <Heart size={14} weight={item.is_liked_by_me ? 'fill' : 'bold'} /> {item.like_count > 0 ? item.like_count : 'Like'}
                                  </button>
                                  <button className={`flex items-center gap-1.5 text-xs transition-colors ${isDark ? 'text-white/30 hover:text-[#1D9BF0]' : 'text-[#536471] hover:text-[#1D9BF0]'}`}
                                    onClick={e => { e.stopPropagation(); router.push('/dashboard/reflect') }}>
                                    <Sparkle size={14} weight="bold" /> Reflect
                                  </button>
                                </div>
                                {openComments.has(item.id) && (
                                  <div
                                    className={`mt-3 -mx-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-[#EFF3F4]'}`}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <CommentSection reflectionId={item.id} reflectionOwnerId={item.user_id} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {followingHasMore && (
                    <div className="flex justify-center py-6">
                      <button
                        onClick={loadMoreFollowing}
                        disabled={followingLoadingMore}
                        className={`text-xs font-semibold px-4 py-2 rounded-full transition-colors ${
                          isDark ? 'text-[#1D9BF0] hover:bg-white/[0.06]' : 'text-[#1D9BF0] hover:bg-[#EFF3F4]'
                        }`}
                      >
                        {followingLoadingMore ? 'Loading…' : 'Load more'}
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="likes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {likesLoading ? (
                    <div className="flex justify-center py-12">
                      <Spinner size={24} weight="bold" className={`animate-spin ${isDark ? "text-white/20" : "text-[#8B98A5]"}`} />
                    </div>
                  ) : likesFeed.length === 0 ? (
                    <div className={`text-center py-16 px-8 ${isDark ? "text-white/30" : "text-[#8B98A5]"}`}>
                      <Heart size={40} weight="bold" className={`mx-auto mb-4 ${isDark ? "text-white/15" : "text-[#D0CFC0]"}`} />
                      <p className="text-sm font-medium mb-1">No likes yet</p>
                      <p className="text-xs">Reflections you like will show up here.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {likesFeed.map((item) => {
                        const displayName = item.profile?.display_name || item.profile?.full_name || "Unknown"
                        return (
                          <div
                            key={item.id}
                            className={`px-4 py-3 cursor-pointer transition-colors ${
                              isDark
                                ? "hover:bg-white/[0.02] border-b border-white/[0.06]"
                                : "hover:bg-[#F7F9FA] border-b border-[#EFF3F4]"
                            }`}
                            onClick={() => item.profile?.username && router.push(`/${item.profile.username}`)}
                          >
                            <div className="flex gap-3">
                              <div className="shrink-0">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isDark ? "bg-[#161618]" : "bg-[#EFF3F4]"}`}>
                                  {item.profile?.avatar_url ? (
                                    <img src={item.profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                                  ) : (
                                    <span className={`text-sm font-semibold ${isDark ? "text-white/40" : "text-[#536471]"}`}>
                                      {displayName.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#0F1419]"}`}>
                                      {displayName}
                                    </span>
                                    <span className={`text-sm ${isDark ? "text-white/30" : "text-[#536471]"}`}>
                                      @{item.profile?.username}
                                    </span>
                                  </div>
                                  <ReportBlockMenu
                                    targetType="reflection"
                                    targetId={item.id}
                                    authorId={item.user_id}
                                    authorName={displayName}
                                    currentUserId={currentUserId}
                                    onBlocked={() => setLikesFeed(prev => prev.filter(f => f.user_id !== item.user_id))}
                                  />
                                </div>
                                <p className={`text-sm leading-relaxed mt-0.5 ${isDark ? "text-white/80" : "text-[#0F1419]"}`}>
                                  {item.reflection_text}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-lg leading-none">{item.mood}</span>
                                  {item.tags?.slice(0, 3).map((tag: string) => (
                                    <span key={tag} className="text-xs text-[#1D9BF0]">#{tag}</span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-6 mt-2">
                                  <button className={`flex items-center gap-1.5 text-xs transition-colors ${isDark ? 'text-white/30 hover:text-[#1D9BF0]' : 'text-[#536471] hover:text-[#1D9BF0]'}`}
                                    onClick={e => { e.stopPropagation(); toggleComments(item.id) }}>
                                    <ChatCircle size={14} weight="bold" /> Reply
                                  </button>
                                  <button
                                    onClick={async e => {
                                      e.stopPropagation()
                                      const res = await fetch('/api/social/likes', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ reflection_id: item.id }),
                                      })
                                      if (res.ok) {
                                        // Unliking here means it should disappear from this tab entirely
                                        setLikesFeed(prev =>
                                          item.is_liked_by_me
                                            ? prev.filter(f => f.id !== item.id)
                                            : prev.map(f => f.id === item.id ? { ...f, is_liked_by_me: true, like_count: f.like_count + 1 } : f)
                                        )
                                      }
                                    }}
                                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                                      item.is_liked_by_me
                                        ? 'text-pink-500'
                                        : isDark ? 'text-white/30 hover:text-pink-400' : 'text-[#536471] hover:text-pink-500'
                                    }`}
                                  >
                                    <Heart size={14} weight={item.is_liked_by_me ? 'fill' : 'bold'} /> {item.like_count > 0 ? item.like_count : 'Like'}
                                  </button>
                                  <button className={`flex items-center gap-1.5 text-xs transition-colors ${isDark ? 'text-white/30 hover:text-[#1D9BF0]' : 'text-[#536471] hover:text-[#1D9BF0]'}`}
                                    onClick={e => { e.stopPropagation(); router.push('/dashboard/reflect') }}>
                                    <Sparkle size={14} weight="bold" /> Reflect
                                  </button>
                                </div>
                                {openComments.has(item.id) && (
                                  <div
                                    className={`mt-3 -mx-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-[#EFF3F4]'}`}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <CommentSection reflectionId={item.id} reflectionOwnerId={item.user_id} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {likesHasMore && (
                    <div className="flex justify-center py-6">
                      <button
                        onClick={loadMoreLikes}
                        disabled={likesLoadingMore}
                        className={`text-xs font-semibold px-4 py-2 rounded-full transition-colors ${
                          isDark ? 'text-[#1D9BF0] hover:bg-white/[0.06]' : 'text-[#1D9BF0] hover:bg-[#EFF3F4]'
                        }`}
                      >
                        {likesLoadingMore ? 'Loading…' : 'Load more'}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Mobile inline: trends + suggestions (hidden on lg+) ─── */}
          <div className="lg:hidden px-4 pb-4 space-y-3">
            <TrendingTopics />
            <WhoToFollow />
          </div>
          </div>

          {/* ─── Desktop-only right column: fills the width that used to sit empty ─── */}
          <div className="hidden lg:block w-[320px] shrink-0 py-4">
            <div className="sticky top-4 space-y-4">
              <TrendingTopics />
              <WhoToFollow />
            </div>
          </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function QuickActionBtn({ icon, label, href, isDark }: { icon: React.ReactNode; label: string; href: string; isDark: boolean }) {
  return (
    <Link href={href}>
      <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors cursor-pointer border ${
        isDark
          ? "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
          : "bg-[#F7F9FA] border-[#EFF3F4] hover:bg-[#EFF3F4]"
      }`}>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${
          isDark ? "bg-white/[0.06] text-white/60" : "bg-white text-[#536471]"
        }`}>
          {icon}
        </span>
        <span className={`text-xs font-semibold ${isDark ? "text-white/80" : "text-[#0F1419]"}`}>{label}</span>
      </div>
    </Link>
  )
}
