"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, UserPlus, MessageCircle, MessageSquare, Share2, Sparkle, Heart, Check, X } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  type: 'friend_request' | 'friend_accepted' | 'new_comment' | 'whiteboard' | 'share' | 'like' | 'follow'
  actor_id: string | null
  reflection_id: string | null
  body: string | null
  is_read: boolean
  created_at: string
  actor: {
    id: string
    full_name: string | null
    display_name: string | null
    username: string | null
    avatar_url: string | null
  } | null
}

export function NotificationBell() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0, isMobile: false })

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/social/notifications')
      if (res.ok) {
        const { data, unread_count, nextCursor, hasMore: more } = await res.json()
        setNotifications(data || [])
        setUnreadCount(unread_count || 0)
        setCursor(nextCursor || null)
        setHasMore(!!more)
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  async function loadMore() {
    if (loadingMore || !hasMore || !cursor) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/social/notifications?before=${encodeURIComponent(cursor)}`)
      if (res.ok) {
        const { data, nextCursor, hasMore: more } = await res.json()
        setNotifications(prev => [...prev, ...(data || [])])
        setCursor(nextCursor || null)
        setHasMore(!!more)
      }
    } catch {}
    setLoadingMore(false)
  }

  // Real-time: subscribe to new notification rows for this user via Supabase
  // Realtime, instead of relying purely on polling. Requires the table to be
  // added to the supabase_realtime publication (see Sql scripts/enable_realtime_notifications.sql).
  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof getSupabaseClient>['channel']> | null = null

    async function subscribe() {
      try {
        const supabase = getSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        channel = supabase
          .channel(`notifications:${user.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'social_notifications', filter: `user_id=eq.${user.id}` },
            () => {
              // Refetch through the existing API route rather than hand-assembling the
              // row client-side, so the actor profile join / decryption stay in one place
              load()
            }
          )
          .subscribe()
      } catch {
        // Realtime unavailable (e.g. table not added to the publication yet) --
        // polling below still covers us
      }
    }
    subscribe()

    return () => {
      if (channel) getSupabaseClient().removeChannel(channel)
    }
  }, [load])

  useEffect(() => {
    load()
    // Realtime is now the primary update path; this is just a safety net in
    // case a channel drops or the browser tab was backgrounded.
    const interval = setInterval(load, 45000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (open && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect()
      const mobile = window.innerWidth < 768
      setPos({
        top: rect.bottom + 8,
        left: mobile ? 0 : rect.left + rect.width / 2,
        isMobile: mobile,
      })
    }
  }, [open])

  async function markAllRead() {
    await fetch('/api/social/notifications', { method: 'PUT' })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'friend_request': return <UserPlus className="h-4 w-4 text-[#1D9BF0]" />
      case 'friend_accepted': return <UserPlus className="h-4 w-4 text-emerald-500" />
      case 'new_comment': return <MessageCircle className="h-4 w-4 text-[#1D9BF0]" />
      case 'whiteboard': return <MessageSquare className="h-4 w-4 text-amber-500" />
      case 'share': return <Share2 className="h-4 w-4 text-[#1D9BF0]" />
      case 'like': return <Heart className="h-4 w-4 text-pink-500" />
      case 'follow': return <UserPlus className="h-4 w-4 text-[#1D9BF0]" />
      default: return <Sparkle className="h-4 w-4 text-[#1D9BF0]" />
    }
  }

  const typeLabel = (n: Notification) => {
    const name = n.actor?.display_name || n.actor?.full_name || n.actor?.username || 'Someone'
    switch (n.type) {
      case 'friend_request': return `${name} sent you a friend request`
      case 'friend_accepted': return `${name} accepted your friend request`
      case 'new_comment': return `${name} commented on your reflection`
      case 'whiteboard': return `${name} wrote on your whiteboard`
      case 'share': return `${name} shared a reflection with you`
      case 'like': return `${name} liked your reflection`
      case 'follow': return `${name} started following you`
      default: return n.body || 'New notification'
    }
  }

  return (
    <div ref={dropdownRef} className="relative inline-flex">
      <button
        ref={bellRef}
        onClick={() => { setOpen(!open); if (!open) load() }}
        className={`relative p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-[#EFF3F4]'}`}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={20} fill={unreadCount > 0 ? 'currentColor' : 'none'} className={isDark ? 'text-white/50' : 'text-[#536471]'} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-[#1D9BF0] text-[10px] font-bold text-white px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.isMobile ? '8px' : pos.left,
              right: pos.isMobile ? '8px' : 'auto',
              width: pos.isMobile ? 'auto' : 320,
              transform: pos.isMobile ? 'none' : 'translateX(-50%)',
              zIndex: 9999,
            }}
            className="rounded-2xl shadow-xl border overflow-hidden"
          >
            <div className={`relative ${isDark ? 'bg-[#161618] border-white/[0.08]' : 'bg-white border-[#EFF3F4]'}`}>
              {/* Close button */}
              <button
                onClick={() => setOpen(false)}
                className={`absolute top-3 right-3 p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white/40' : 'hover:bg-[#EFF3F4] text-[#8B98A5]'}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-[#EFF3F4]'}`}>
                <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className={`text-xs font-medium flex items-center gap-1 transition-colors ${isDark ? 'text-[#1D9BF0] hover:text-white' : 'text-[#1D9BF0] hover:text-[#0F1419]'}`}
                  >
                    <Check className="h-3 w-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto max-h-[calc(70vh-52px)]">
                {notifications.length === 0 ? (
                  <div className={`px-4 py-10 text-center text-sm ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => {
                        setOpen(false)
                        if (n.actor?.username && n.actor.username !== 'null') router.push(`/${n.actor.username}`)
                      }}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                        !n.is_read
                          ? isDark ? 'bg-[#1D9BF0]/5' : 'bg-[#1D9BF0]/5'
                          : ''
                      } ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-[#F7F9FA]'}`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {n.actor ? (
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={n.actor.avatar_url || undefined} />
                            <AvatarFallback className={`text-xs ${isDark ? 'bg-[#252529] text-white/40' : 'bg-[#EFF3F4] text-[#536471]'}`}>
                              {(n.actor.display_name || n.actor.full_name || '?')[0]}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center ${isDark ? 'bg-white/[0.06]' : 'bg-[#EFF3F4]'}`}>
                            {typeIcon(n.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${isDark ? 'text-white/80' : 'text-[#0F1419]'}`}>
                          {typeLabel(n)}
                        </p>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                      {!n.is_read && (
                        <div className="shrink-0 mt-1.5">
                          <div className="h-2 w-2 rounded-full bg-[#1D9BF0]" />
                        </div>
                      )}
                    </button>
                  ))
                )}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className={`w-full text-center py-2.5 text-xs font-semibold transition-colors ${
                      isDark ? 'text-[#1D9BF0] hover:bg-white/[0.03]' : 'text-[#1D9BF0] hover:bg-[#F7F9FA]'
                    }`}
                  >
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
