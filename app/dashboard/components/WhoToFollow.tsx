"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserPlus, faCheck } from '@fortawesome/free-solid-svg-icons'

const AVATAR_GRADIENTS = [
  'from-emerald-200 to-slate-200',
  'from-sky-200 to-slate-200',
  'from-violet-200 to-slate-200',
  'from-amber-200 to-slate-200',
  'from-rose-200 to-slate-200',
  'from-teal-200 to-slate-200',
]

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
      <div className={`rounded-3xl border p-5 ${isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'glass border-slate-100 soft-shadow'}`}>
        <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Who to follow</h3>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <div className={`h-10 w-10 rounded-full ${isDark ? 'bg-white/8' : 'bg-slate-100'} animate-pulse`} />
            <div className="flex-1 space-y-1">
              <div className={`h-3 w-20 rounded ${isDark ? 'bg-white/8' : 'bg-slate-100'} animate-pulse`} />
              <div className={`h-2.5 w-14 rounded ${isDark ? 'bg-white/5' : 'bg-slate-100'} animate-pulse`} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className={`rounded-3xl border p-5 ${isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'glass border-slate-100 soft-shadow'}`}>
        <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Who to follow</h3>
        <p className={`text-sm ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
          No suggestions yet. Follow friends to see their reflections in your feed.
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-3xl border p-5 ${isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'glass border-slate-100 soft-shadow'}`}>
      <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Who to follow</h3>
      <div className="space-y-4">
        {users.map((user, i) => {
          const displayName = user.display_name || user.full_name || 'Unknown'
          const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
          const isFollowed = followedIds.has(user.id)
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Link href={`/${user.username}`} className="shrink-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className={`text-xs font-semibold ${isDark ? 'bg-[#1B2436] text-white/40' : `bg-gradient-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} text-slate-600`}`}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0">
                  <Link href={`/${user.username}`} className={`text-sm font-semibold truncate block hover:underline ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {displayName}
                  </Link>
                  <p className={`text-xs truncate ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
                    @{user.username}
                  </p>
                </div>
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
                      : 'border-slate-200 text-slate-500'
                    : isDark
                      ? 'bg-[#6366F1] border-[#6366F1] text-white hover:bg-[#4F46E5]'
                      : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {isFollowed ? (
                  <><FontAwesomeIcon icon={faCheck} className="mr-1 text-xs" /> Followed</>
                ) : (
                  <><FontAwesomeIcon icon={faUserPlus} className="mr-1 text-xs" /> Follow</>
                )}
              </Button>
            </motion.div>
          )
        })}
      </div>
      <Link
        href="/friends"
        className={`block text-sm mt-4 transition-colors ${isDark ? 'text-[#818CF8] hover:text-[#A5B4FC]' : 'text-indigo-500 hover:text-indigo-600'}`}
      >
        Show more
      </Link>
    </div>
  )
}
