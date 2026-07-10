"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { UserPlus, Check } from 'phosphor-react'

interface SuggestedUser {
  id: string
  full_name: string
  display_name: string
  username: string
  avatar_url: string
  bio: string
}

export function WhoToFollow() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [users, setUsers] = useState<SuggestedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadSuggestions()
  }, [])

  async function loadSuggestions() {
    try {
      const res = await fetch('/api/social/suggested-users')
      const { data } = await res.json()
      setUsers(data || [])
    } catch {}
    setLoading(false)
  }

  async function handleFollow(userId: string) {
    try {
      await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: userId }),
      })
      setFollowedIds(prev => new Set(prev).add(userId))
    } catch {}
  }

  if (loading) {
    return (
      <div className={`rounded-2xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#EFF3F4]'} p-4`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>Who to follow</h3>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <div className={`h-10 w-10 rounded-full ${isDark ? 'bg-white/8' : 'bg-[#EFF3F4]'} animate-pulse`} />
            <div className="flex-1 space-y-1">
              <div className={`h-3 w-20 rounded ${isDark ? 'bg-white/8' : 'bg-[#EFF3F4]'} animate-pulse`} />
              <div className={`h-2.5 w-14 rounded ${isDark ? 'bg-white/5' : 'bg-[#EFF3F4]'} animate-pulse`} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className={`rounded-2xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#EFF3F4]'} p-4`}>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>Who to follow</h3>
        <p className={`text-sm ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>
          No suggestions yet. Follow friends to see their reflections in your feed.
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#EFF3F4]'} p-4`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>Who to follow</h3>
      <div className="space-y-3">
        {users.map(user => {
          const displayName = user.display_name || user.full_name || 'Unknown'
          const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
          const isFollowed = followedIds.has(user.id)
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <Link href={`/${user.username}`} className="shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className={`text-xs ${isDark ? 'bg-[#161618] text-white/40' : 'bg-[#EFF3F4] text-[#536471]'}`}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/${user.username}`} className={`text-sm font-semibold truncate block hover:underline ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                  {displayName}
                </Link>
                <p className={`text-xs truncate ${isDark ? 'text-white/30' : 'text-[#536471]'}`}>
                  @{user.username}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFollow(user.id)}
                disabled={isFollowed}
                className={`shrink-0 h-8 text-xs font-semibold rounded-full px-4 ${
                  isFollowed
                    ? isDark
                      ? 'border-white/10 text-white/40'
                      : 'border-[#EFF3F4] text-[#536471]'
                    : isDark
                      ? 'border-white text-white hover:bg-white/10'
                      : 'border-[#0F1419] text-[#0F1419] hover:bg-[#EFF3F4]'
                }`}
              >
                {isFollowed ? (
                  <><Check size={12} weight="bold" className="mr-1" /> Followed</>
                ) : (
                  <><UserPlus size={12} weight="bold" className="mr-1" /> Follow</>
                )}
              </Button>
            </motion.div>
          )
        })}
      </div>
      <Link
        href="/friends"
        className={`block text-sm mt-3 transition-colors ${isDark ? 'text-[#1D9BF0] hover:text-[#1A8CD8]' : 'text-[#1D9BF0] hover:text-[#1A8CD8]'}`}
      >
        Show more
      </Link>
    </div>
  )
}
