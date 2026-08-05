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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import {
  faWind,
  faHeart as faHeartSolid,
  faPenNib,
  faSun,
  faComment,
  faWandMagicSparkles,
  faRss,
  faSpinner,
  faFaceSmile,
  faFaceFrownOpen,
  faFaceMeh,
  faFaceGrin,
  faCircleQuestion,
  faFaceSmileWink,
  faHandsPraying,
  faHandFist,
} from "@fortawesome/free-solid-svg-icons"
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons"
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

const MOOD_ICONS: Record<string, IconDefinition> = {
  "😔": faFaceFrownOpen,
  "😐": faFaceMeh,
  "😊": faFaceSmile,
  "😄": faFaceGrin,
  "🤔": faCircleQuestion,
  "😌": faFaceSmileWink,
  "🙏": faHandsPraying,
  "💪": faHandFist,
}

function MoodIcon({ mood, className }: { mood?: string; className?: string }) {
  const icon = (mood && MOOD_ICONS[mood]) || faFaceSmile
  return <FontAwesomeIcon icon={icon} className={className} />
}

const AVATAR_GRADIENTS = [
  "from-indigo-200 to-slate-200",
  "from-rose-200 to-slate-200",
  "from-amber-200 to-slate-200",
  "from-violet-200 to-slate-200",
  "from-teal-200 to-slate-200",
  "from-fuchsia-200 to-slate-200",
  "from-orange-200 to-slate-200",
  "from-emerald-200 to-slate-200",
]

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
    <div className={`min-h-screen ${isDark ? "bg-[#0A0E18]" : "bg-[#F9FBFB]"}`}>
      <GlobalDataSync />

      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1400px] mx-auto flex gap-8 px-0 xl:px-6">
          <div className="flex-1 min-w-0 max-w-[680px] border-r border-slate-100 dark:border-white/[0.06]">
          {/* Header */}
          <div className={`glass sticky top-0 z-10 border-b ${
            isDark ? "border-white/[0.06]" : "border-slate-100"
          }`}>
            <div className="px-4 h-12 flex items-center">
              <h1 className={`font-serif text-xl font-semibold tracking-tight ${isDark ? "text-white" : "text-slate-800"}`}>
                {tab === "for_you" ? t(greetingKey) : tab === "following" ? "Following" : "Likes"}{tab === "for_you" && userName ? `, ${userName}` : ""}
              </h1>
            </div>
            <div className="flex">
              <button
                className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
                  tab === "for_you"
                    ? `border-b-2 border-indigo-500 ${isDark ? "text-white" : "text-slate-900"}`
                    : `${isDark ? "text-white/40 hover:text-white/60" : "text-slate-400 hover:text-slate-900"}`
                }`}
                onClick={() => setTab("for_you")}
              >
                For You
              </button>
              <button
                className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
                  tab === "following"
                    ? `border-b-2 border-indigo-500 ${isDark ? "text-white" : "text-slate-900"}`
                    : `${isDark ? "text-white/40 hover:text-white/60" : "text-slate-400 hover:text-slate-900"}`
                }`}
                onClick={() => setTab("following")}
              >
                Following
              </button>
              <button
                className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
                  tab === "likes"
                    ? `border-b-2 border-indigo-500 ${isDark ? "text-white" : "text-slate-900"}`
                    : `${isDark ? "text-white/40 hover:text-white/60" : "text-slate-400 hover:text-slate-900"}`
                }`}
                onClick={() => setTab("likes")}
              >
                Likes
              </button>
            </div>
          </div>

          {/* Main column — matches mockup spacing */}
          <div className="px-4 space-y-6 pt-6">
            {/* Quick Share */}
            <section className="animate-fade-up">
              <QuickShare onShared={() => {}} />
            </section>

            {/* Quick Actions */}
            <section className="animate-fade-up">
              <div className="grid grid-cols-2 gap-3">
                <QuickActionBtn
                  icon={<FontAwesomeIcon icon={faWind} />}
                  label="Breathe"
                  href="/wellness?open=breathing"
                  isDark={isDark}
                  chip="bg-sky-50 text-sky-400"
                />
                <QuickActionBtn
                  icon={<FontAwesomeIcon icon={faHeartSolid} />}
                  label="Check In"
                  href="/wellness"
                  isDark={isDark}
                  chip="bg-rose-50 text-rose-400"
                />
                <QuickActionBtn
                  icon={<FontAwesomeIcon icon={faPenNib} />}
                  label="Reflect"
                  href="/reflect"
                  isDark={isDark}
                  chip="bg-indigo-50 text-indigo-400"
                />
                <QuickActionBtn
                  icon={<FontAwesomeIcon icon={faSun} />}
                  label="Gratitude"
                  href="/wellness?open=gratitude"
                  isDark={isDark}
                  chip="bg-amber-50 text-amber-400"
                />
              </div>
            </section>

            {/* Your Rhythm */}
            <section className="animate-fade-up">
              <YourRhythm />
            </section>

            {/* Feed */}
            <section className="animate-fade-up">
              <AnimatePresence mode="wait">
                {tab === "for_you" ? (
                  <motion.div key="for_you" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <RandomFeed />
                  </motion.div>
                ) : tab === "following" ? (
                  <motion.div key="following" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {followingLoading ? (
                      <div className="flex justify-center py-12">
                        <FontAwesomeIcon icon={faSpinner} spin className={`text-xl ${isDark ? "text-white/20" : "text-slate-500"}`} />
                      </div>
                    ) : followingFeed.length === 0 ? (
                      <div className={`text-center py-16 px-8 ${isDark ? "text-white/30" : "text-slate-400"}`}>
                        <FontAwesomeIcon icon={faRss} className={`mx-auto mb-4 text-4xl ${isDark ? "text-white/15" : "text-slate-200"}`} />
                        <p className="text-sm font-medium mb-1 text-slate-600 dark:text-white/40">Your feed is empty</p>
                        <p className="text-xs">Add friends to see their shared reflections here.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {followingFeed.map((item, index) => {
                          const displayName = item.profile?.display_name || item.profile?.full_name || "Unknown"
                          return (
                            <div
                              key={item.id}
                              className={`rounded-3xl border p-5 cursor-pointer transition-colors ${
                                isDark
                                  ? "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06]"
                                  : "glass border-slate-100 soft-shadow hover:bg-white"
                              }`}
                              onClick={() => item.profile?.username && router.push(`/${item.profile.username}`)}
                            >
                              <div className="flex gap-3">
                                <div className="shrink-0">
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                    isDark
                                      ? "bg-[#1B2436]"
                                      : `bg-gradient-to-br ${AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]}`
                                  }`}>
                                    {item.profile?.avatar_url ? (
                                      <img src={item.profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                                    ) : (
                                      <span className={`text-sm font-semibold ${isDark ? "text-white/40" : "text-slate-600"}`}>
                                        {displayName.charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                                        {displayName}
                                      </span>
                                      <span className={`text-sm ${isDark ? "text-white/30" : "text-slate-400"}`}>
                                        @{item.profile?.username}
                                      </span>
                                      <span className={`text-xs ${isDark ? "text-white/20" : "text-slate-300"}`}>
                                        · {timeAgo(item.created_at)}
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
                                  <p className={`text-sm leading-relaxed mt-1 ${isDark ? "text-white/80" : "text-slate-700"}`}>
                                    {item.reflection_text}
                                  </p>
                                  <div className="flex items-center gap-3 mt-3">
                                    <MoodIcon mood={item.mood} className={`text-lg ${isDark ? "text-white/60" : "text-slate-500"}`} />
                                    {item.tags?.slice(0, 3).map((tag: string) => (
                                      <span key={tag} className="text-xs text-indigo-500">#{tag}</span>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-6 mt-3">
                                    <button className={`flex items-center gap-1.5 text-xs transition-colors ${isDark ? 'text-white/30 hover:text-[#818CF8]' : 'text-slate-400 hover:text-indigo-500'}`}
                                      onClick={e => { e.stopPropagation(); toggleComments(item.id) }}>
                                      <FontAwesomeIcon icon={faComment} className="text-sm" /> Reply
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
                                          ? 'text-rose-500'
                                          : isDark ? 'text-white/30 hover:text-rose-400' : 'text-slate-400 hover:text-rose-500'
                                      }`}
                                    >
                                      <FontAwesomeIcon icon={item.is_liked_by_me ? faHeartSolid : faHeartRegular} className="text-sm" /> {item.like_count > 0 ? item.like_count : 'Like'}
                                    </button>
                                    <button className={`flex items-center gap-1.5 text-xs transition-colors ${isDark ? 'text-white/30 hover:text-[#818CF8]' : 'text-slate-400 hover:text-indigo-500'}`}
                                      onClick={e => { e.stopPropagation(); router.push('/dashboard/reflect') }}>
                                      <FontAwesomeIcon icon={faWandMagicSparkles} className="text-sm" /> Reflect
                                    </button>
                                  </div>
                                  {openComments.has(item.id) && (
                                    <div
                                      className={`mt-3 -mx-5 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}
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
                            isDark ? 'text-[#818CF8] hover:bg-white/[0.06]' : 'text-indigo-500 hover:bg-indigo-50'
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
                        <FontAwesomeIcon icon={faSpinner} spin className={`text-xl ${isDark ? "text-white/20" : "text-slate-500"}`} />
                      </div>
                    ) : likesFeed.length === 0 ? (
                      <div className={`text-center py-16 px-8 ${isDark ? "text-white/30" : "text-slate-400"}`}>
                        <FontAwesomeIcon icon={faHeartRegular} className={`mx-auto mb-4 text-4xl ${isDark ? "text-white/15" : "text-slate-200"}`} />
                        <p className="text-sm font-medium mb-1 text-slate-600 dark:text-white/40">No likes yet</p>
                        <p className="text-xs">Reflections you like will show up here.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {likesFeed.map((item, index) => {
                          const displayName = item.profile?.display_name || item.profile?.full_name || "Unknown"
                          return (
                            <div
                              key={item.id}
                              className={`rounded-3xl border p-5 cursor-pointer transition-colors ${
                                isDark
                                  ? "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06]"
                                  : "glass border-slate-100 soft-shadow hover:bg-white"
                              }`}
                              onClick={() => item.profile?.username && router.push(`/${item.profile.username}`)}
                            >
                              <div className="flex gap-3">
                                <div className="shrink-0">
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                    isDark
                                      ? "bg-[#1B2436]"
                                      : `bg-gradient-to-br ${AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]}`
                                  }`}>
                                    {item.profile?.avatar_url ? (
                                      <img src={item.profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                                    ) : (
                                      <span className={`text-sm font-semibold ${isDark ? "text-white/40" : "text-slate-600"}`}>
                                        {displayName.charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                                        {displayName}
                                      </span>
                                      <span className={`text-sm ${isDark ? "text-white/30" : "text-slate-400"}`}>
                                        @{item.profile?.username}
                                      </span>
                                      <span className={`text-xs ${isDark ? "text-white/20" : "text-slate-300"}`}>
                                        · {timeAgo(item.created_at)}
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
                                  <p className={`text-sm leading-relaxed mt-1 ${isDark ? "text-white/80" : "text-slate-700"}`}>
                                    {item.reflection_text}
                                  </p>
                                  <div className="flex items-center gap-3 mt-3">
                                    <MoodIcon mood={item.mood} className={`text-lg ${isDark ? "text-white/60" : "text-slate-500"}`} />
                                    {item.tags?.slice(0, 3).map((tag: string) => (
                                      <span key={tag} className="text-xs text-indigo-500">#{tag}</span>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-6 mt-3">
                                    <button className={`flex items-center gap-1.5 text-xs transition-colors ${isDark ? 'text-white/30 hover:text-[#818CF8]' : 'text-slate-400 hover:text-indigo-500'}`}
                                      onClick={e => { e.stopPropagation(); toggleComments(item.id) }}>
                                      <FontAwesomeIcon icon={faComment} className="text-sm" /> Reply
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
                                          ? 'text-rose-500'
                                          : isDark ? 'text-white/30 hover:text-rose-400' : 'text-slate-400 hover:text-rose-500'
                                      }`}
                                    >
                                      <FontAwesomeIcon icon={item.is_liked_by_me ? faHeartSolid : faHeartRegular} className="text-sm" /> {item.like_count > 0 ? item.like_count : 'Like'}
                                    </button>
                                    <button className={`flex items-center gap-1.5 text-xs transition-colors ${isDark ? 'text-white/30 hover:text-[#818CF8]' : 'text-slate-400 hover:text-indigo-500'}`}
                                      onClick={e => { e.stopPropagation(); router.push('/dashboard/reflect') }}>
                                      <FontAwesomeIcon icon={faWandMagicSparkles} className="text-sm" /> Reflect
                                    </button>
                                  </div>
                                  {openComments.has(item.id) && (
                                    <div
                                      className={`mt-3 -mx-5 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}
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
                            isDark ? 'text-[#818CF8] hover:bg-white/[0.06]' : 'text-indigo-500 hover:bg-indigo-50'
                          }`}
                        >
                          {likesLoadingMore ? 'Loading…' : 'Load more'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
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

function QuickActionBtn({ icon, label, href, isDark, chip }: { icon: React.ReactNode; label: string; href: string; isDark: boolean; chip?: string }) {
  return (
    <Link href={href}>
      <div className={`flex items-center gap-3 rounded-2xl p-4 transition-all cursor-pointer border ${
        isDark
          ? "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]"
          : "glass rounded-2xl border-slate-100 soft-shadow hover:bg-white"
      }`}>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isDark ? "bg-white/[0.08] text-white/70" : chip || "bg-slate-50 text-slate-500"
        }`}>
          {icon}
        </span>
        <span className={`text-sm font-semibold ${isDark ? "text-white/80" : "text-slate-700"}`}>{label}</span>
      </div>
    </Link>
  )
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(date).toLocaleDateString()
}
