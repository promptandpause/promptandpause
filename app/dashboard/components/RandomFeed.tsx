"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart, ChatCircle, Sparkle, UserPlus } from 'phosphor-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface FeedReflection {
  id: string
  prompt_text: string
  reflection_text: string
  mood: string
  tags: string[]
  created_at: string
  user_id: string
  is_from_friend: boolean
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

export function RandomFeed() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()
  const [feed, setFeed] = useState<FeedReflection[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadFeed()
  }, [])

  async function loadFeed() {
    try {
      const res = await fetch('/api/social/random-feed')
      const body = await res.json()
      if (!res.ok) {
        console.warn('Feed load failed:', body.error)
      }
      setFeed(body.data || [])
    } catch {
      // Offline or parse failure — leave feed empty
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className={`rounded-2xl p-5 ${isDark ? 'bg-white/[0.03]' : 'bg-white/60'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-10 w-10 rounded-full ${isDark ? 'bg-white/8' : 'bg-[#EFF3F4]'} animate-pulse`} />
              <div className="space-y-1.5 flex-1">
                <div className={`h-3 w-24 rounded ${isDark ? 'bg-white/8' : 'bg-[#EFF3F4]'} animate-pulse`} />
                <div className={`h-2.5 w-16 rounded ${isDark ? 'bg-white/5' : 'bg-[#EFF3F4]'} animate-pulse`} />
              </div>
            </div>
            <div className={`h-3 w-full rounded ${isDark ? 'bg-white/5' : 'bg-[#EFF3F4]'} animate-pulse mb-2`} />
            <div className={`h-3 w-3/4 rounded ${isDark ? 'bg-white/5' : 'bg-[#EFF3F4]'} animate-pulse`} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <AnimatePresence>
        {feed.map((item, i) => {
          const displayName = item.profile?.display_name || item.profile?.full_name || 'Unknown'
          const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 200, damping: 25 }}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                isDark
                  ? 'hover:bg-white/[0.02] border-b border-white/[0.06]'
                  : 'hover:bg-[#F7F9FA] border-b border-[#EFF3F4]'
              }`}
              onClick={() => item.profile?.username && router.push(`/${item.profile.username}`)}
            >
              <div className="flex gap-3">
                <Link href={`/${item.profile?.username}`} onClick={e => e.stopPropagation()} className="shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={item.profile?.avatar_url || undefined} />
                    <AvatarFallback className={`text-xs ${isDark ? 'bg-[#161618] text-white/40' : 'bg-[#EFF3F4] text-[#536471]'}`}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                      {displayName}
                    </span>
                    <span className={`text-sm ${isDark ? 'text-white/30' : 'text-[#536471]'}`}>
                      @{item.profile?.username}
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-white/20' : 'text-[#8B98A5]'}`}>
                      · {timeAgo(item.created_at)}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed mt-0.5 ${isDark ? 'text-white/80' : 'text-[#0F1419]'}`}>
                    {item.reflection_text}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-lg leading-none">{item.mood}</span>
                    {item.tags?.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className={`text-xs ${isDark ? 'text-[#1D9BF0]' : 'text-[#1D9BF0]'}`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-6 mt-2">
                    <button className={`flex items-center gap-1.5 text-xs transition-colors ${isDark ? 'text-white/30 hover:text-[#1D9BF0]' : 'text-[#536471] hover:text-[#1D9BF0]'}`}
                      onClick={e => { e.stopPropagation() }}>
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
                          setFeed(prev => prev.map(f =>
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
                      onClick={e => { e.stopPropagation() }}>
                      <Sparkle size={14} weight="bold" /> Reflect
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
      {feed.length === 0 && (
        <div className={`text-center py-16 ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>
          <p className="text-sm">No reflections yet from the community.</p>
        </div>
      )}
      <div ref={loaderRef} />
    </div>
  )
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(date).toLocaleDateString()
}
