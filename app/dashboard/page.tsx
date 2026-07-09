"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import GlobalDataSync from "./components/global-data-sync"
import { DashboardSidebar } from "./components/DashboardSidebar"
import { RandomFeed } from "./components/RandomFeed"
import { useTheme } from "@/contexts/ThemeContext"
import { useTranslation } from "@/hooks/useTranslation"
import { useEffect, useState, useCallback } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { trackEventOncePerSession } from "@/lib/services/eventsService"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkle, Rss, Spinner } from "phosphor-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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
  const [greetingKey, setGreetingKey] = useState<"dashboard.goodMorning" | "dashboard.goodAfternoon" | "dashboard.goodEvening">("dashboard.goodMorning")
  const [tab, setTab] = useState<"for_you" | "following">("for_you")
  const [followingFeed, setFollowingFeed] = useState<FeedItem[]>([])
  const [followingLoading, setFollowingLoading] = useState(false)

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
      const { data } = await res.json()
      const items = (data || []).map((item: any) => ({
        ...item.reflection,
        profile: item.author,
      }))
      setFollowingFeed(items)
    } catch {}
    setFollowingLoading(false)
  }, [])

  useEffect(() => {
    if (tab === "following") {
      loadFollowingFeed()
    }
  }, [tab, loadFollowingFeed])

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0A0A0A]" : "bg-[#FFFFFF]"}`}>
      <GlobalDataSync />

      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 overflow-y-auto scrollbar-thin border-r border-[#EFF3F4] dark:border-white/[0.06] max-w-[600px]">
          {/* Twitter-style header */}
          <div className={`sticky top-0 z-10 backdrop-blur-md ${
            isDark ? "bg-[#0A0A0A]/80 border-b border-white/[0.06]" : "bg-white/80 border-b border-[#EFF3F4]"
          }`}>
            <div className="px-4 h-12 flex items-center">
              <h1 className={`text-xl font-semibold ${isDark ? "text-white" : "text-[#0F1419]"}`}>
                {tab === "for_you" ? t(greetingKey) : "Following"}{tab === "for_you" && userName ? `, ${userName}` : ""}
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
            </div>
          </div>

          {/* Compose box */}
          <div className={`px-4 py-3 border-b ${isDark ? "border-white/[0.06]" : "border-[#EFF3F4]"}`}>
            <Link
              href="/journals"
              className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 transition-colors ${
                isDark ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-[#F7F9FA] hover:bg-[#EFF3F4]"
              }`}
            >
              <Sparkle size={18} weight="bold" className={isDark ? "text-[#1D9BF0]" : "text-[#1D9BF0]"} />
              <span className={`text-sm ${isDark ? "text-white/30" : "text-[#8B98A5]"}`}>
                Share your reflection...
              </span>
            </Link>
          </div>

          {/* Feed */}
          <div className="pb-16">
            <AnimatePresence mode="wait">
              {tab === "for_you" ? (
                <motion.div key="for_you" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <RandomFeed />
                </motion.div>
              ) : (
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
                            onClick={() => router.push(`/${item.profile?.username}`)}
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
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#0F1419]"}`}>
                                    {displayName}
                                  </span>
                                  <span className={`text-sm ${isDark ? "text-white/30" : "text-[#536471]"}`}>
                                    @{item.profile?.username}
                                  </span>
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
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
