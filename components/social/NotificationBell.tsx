"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, UserPlus, MessageCircle, MessageSquare, Share2, Sparkle, Check } from 'lucide-react'

interface Notification {
  id: string
  type: 'friend_request' | 'friend_accepted' | 'new_comment' | 'whiteboard' | 'share'
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
  const dropdownRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/social/notifications')
      if (res.ok) {
        const { data, unread_count } = await res.json()
        setNotifications(data || [])
        setUnreadCount(unread_count || 0)
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
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
      default: return n.body || 'New notification'
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
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
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mt-2 w-80 max-w-[calc(100vw-16px)] rounded-2xl shadow-xl border overflow-hidden ${
              isDark ? 'bg-[#161618] border-white/[0.08]' : 'bg-white border-[#EFF3F4]'
            }`}
            style={{ maxHeight: '70vh' }}
          >
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
                      if (n.actor?.username) router.push(`/${n.actor.username}`)
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
