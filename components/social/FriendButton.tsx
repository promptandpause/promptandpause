"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { UserPlus, UserCheck, UserX, Clock, Loader2, UserMinus, UserRoundPlus } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface FriendButtonProps {
  profileUserId: string
  className?: string
}

type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted'
type FollowStatus = 'none' | 'following'

export function FriendButton({ profileUserId, className }: FriendButtonProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [friendStatus, setFriendStatus] = useState<FriendStatus | 'loading'>('loading')
  const [followStatus, setFollowStatus] = useState<FollowStatus | 'loading'>('loading')
  const [friendRecordId, setFriendRecordId] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const isDark = theme === 'dark'

  const loadStatus = useCallback(async () => {
    try {
      const [friendRes, followRes] = await Promise.all([
        fetch('/api/social/friends'),
        fetch(`/api/social/follow?target_id=${profileUserId}`),
      ])

      // Friend status
      const { data: friends } = await friendRes.json()
      const match = friends?.find(
        (f: any) => f.requester_id === profileUserId || f.addressee_id === profileUserId
      )
      if (!match) { setFriendStatus('none'); setFriendRecordId(null) }
      else {
        setFriendRecordId(match.id)
        if (match.status === 'accepted') setFriendStatus('accepted')
        else if (match.requester_id === user?.id) setFriendStatus('pending_sent')
        else setFriendStatus('pending_received')
      }

      // Follow status
      const { data: followData } = await followRes.json()
      setFollowStatus(followData?.is_following ? 'following' : 'none')
    } catch {
      setFriendStatus('none')
      setFollowStatus('none')
    }
  }, [user, profileUserId])

  useEffect(() => {
    if (!user) return
    loadStatus()
  }, [user, loadStatus])

  async function handleFollow() {
    setIsPending(true)
    try {
      const res = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: profileUserId }),
      })
      if (res.ok) {
        const { data } = await res.json()
        setFollowStatus(data.following ? 'following' : 'none')
      }
    } catch {}
    setIsPending(false)
  }

  async function handleFriend() {
    setIsPending(true)
    try {
      if (friendStatus === 'none') {
        const res = await fetch('/api/social/friends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addressee_id: profileUserId }),
        })
        if (res.ok) setFriendStatus('pending_sent')
      } else if (friendStatus === 'pending_received' && friendRecordId) {
        const res = await fetch(`/api/social/friends/${friendRecordId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'accept' }),
        })
        if (res.ok) setFriendStatus('accepted')
      } else if (friendStatus === 'accepted' && friendRecordId) {
        const res = await fetch(`/api/social/friends/${friendRecordId}`, {
          method: 'DELETE',
        })
        if (res.ok) { setFriendStatus('none'); setFriendRecordId(null) }
      } else if (friendStatus === 'pending_sent' && friendRecordId) {
        const res = await fetch(`/api/social/friends/${friendRecordId}`, {
          method: 'DELETE',
        })
        if (res.ok) { setFriendStatus('none'); setFriendRecordId(null) }
      }
    } catch {}
    setIsPending(false)
  }

  if (!user || user.id === profileUserId) return null

  const allLoading = friendStatus === 'loading' || followStatus === 'loading'

  if (allLoading) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ...
      </Button>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Follow / Unfollow button */}
      {followStatus === 'following' ? (
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleFollow}
            className={`rounded-full text-xs font-semibold gap-1.5 transition-all ${
              isDark
                ? 'border-indigo-600/40 text-indigo-600 hover:border-red-400/40 hover:text-red-400'
                : 'border-indigo-600/40 text-indigo-600 hover:border-red-400 hover:text-red-500'
            }`}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />}
            Following
          </Button>
        </motion.div>
      ) : (
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleFollow}
            className={`rounded-full text-xs font-semibold gap-1.5 transition-all ${
              isDark
                ? 'border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                : 'border-slate-200 text-slate-900 hover:bg-slate-100'
            }`}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserRoundPlus className="h-3.5 w-3.5" />}
            Follow
          </Button>
        </motion.div>
      )}

      {/* Friend button */}
      {friendStatus === 'none' ? (
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleFriend}
            className={`rounded-full text-xs font-semibold gap-1.5 ${
              isDark
                ? 'border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                : 'border-slate-100 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            Add Friend
          </Button>
        </motion.div>
      ) : friendStatus === 'pending_sent' ? (
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFriend}
            className={`rounded-full text-xs font-semibold gap-1.5 ${
              isDark
                ? 'border-indigo-600/30 text-indigo-600/60 hover:border-red-400/30 hover:text-red-400'
                : 'border-slate-200 text-indigo-600/60 hover:border-red-300 hover:text-red-500'
            }`}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
            Requested
          </Button>
        </motion.div>
      ) : friendStatus === 'pending_received' ? (
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleFriend}
            className={`rounded-full text-xs font-semibold gap-1.5 ${
              isDark
                ? 'border-indigo-600/40 text-indigo-600 hover:bg-indigo-500/10'
                : 'border-slate-200 text-indigo-600 hover:bg-slate-100'
            }`}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
            Accept
          </Button>
        </motion.div>
      ) : (
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFriend}
            className={`rounded-full text-xs font-semibold gap-1.5 ${
              isDark
                ? 'border-indigo-600/30 text-indigo-600/70 hover:border-red-400/30 hover:text-red-400/70'
                : 'border-slate-200 text-indigo-600 hover:border-red-300 hover:text-red-500'
            }`}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
            Friends
          </Button>
        </motion.div>
      )}
    </div>
  )
}
