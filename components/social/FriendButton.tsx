"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { UserPlus, UserCheck, UserX, Clock, Loader2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface FriendButtonProps {
  profileUserId: string
  className?: string
}

type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted'

export function FriendButton({ profileUserId, className }: FriendButtonProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [status, setStatus] = useState<FriendStatus | 'loading'>('loading')
  const [isPending, setIsPending] = useState(false)
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!user) return
    checkStatus()
  }, [user, profileUserId])

  async function checkStatus() {
    try {
      const res = await fetch(`/api/social/friends`)
      const { data } = await res.json()
      const match = data?.find(
        (f: any) => f.requester_id === profileUserId || f.addressee_id === profileUserId
      )
      if (!match) {
        setStatus('none')
        return
      }
      if (match.status === 'accepted') {
        setStatus('accepted')
      } else if (match.requester_id === user?.id) {
        setStatus('pending_sent')
      } else {
        setStatus('pending_received')
      }
    } catch {
      setStatus('none')
    }
  }

  async function handleAction() {
    setIsPending(true)
    try {
      if (status === 'none') {
        const res = await fetch('/api/social/friends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addressee_id: profileUserId }),
        })
        if (res.ok) setStatus('pending_sent')
      } else if (status === 'pending_received') {
        const res = await fetch(`/api/social/friends/${profileUserId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'accept' }),
        })
        if (res.ok) setStatus('accepted')
      } else if (status === 'accepted') {
        setStatus('none')
      }
    } catch {}
    setIsPending(false)
  }

  if (!user || user.id === profileUserId) return null

  if (status === 'loading') {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ...
      </Button>
    )
  }

  const variants = {
    none: {
      label: 'Add Friend',
      icon: UserPlus,
      style: isDark
        ? 'border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
        : 'border-[#EFF3F4] text-[#536471] hover:bg-white hover:border-[#1D9BF0]/30',
    },
    pending_sent: {
      label: 'Requested',
      icon: Clock,
      style: isDark
        ? 'border-[#1D9BF0]/30 text-[#1D9BF0]/60 cursor-default'
        : 'border-[#B3D9F2] text-[#1D9BF0]/60 cursor-default',
    },
    pending_received: {
      label: 'Accept Request',
      icon: UserCheck,
      style: isDark
        ? 'border-[#1D9BF0]/40 text-[#1D9BF0] hover:bg-[#1D9BF0]/10'
        : 'border-[#B3D9F2] text-[#1D9BF0] hover:bg-[#E8F5FE]',
    },
    accepted: {
      label: 'Friends',
      icon: UserCheck,
      style: isDark
        ? 'border-[#1D9BF0]/30 text-[#1D9BF0]/70 hover:border-red-400/30 hover:text-red-400/70'
        : 'border-[#B3D9F2] text-[#1D9BF0] hover:border-red-300 hover:text-red-500',
    },
  }

  const v = variants[status]

  return (
    <motion.div whileTap={{ scale: 0.95 }}>
      <Button
        variant="outline"
        size="sm"
        disabled={status === 'pending_sent' || isPending}
        onClick={handleAction}
        className={cn(v.style, 'transition-all', className)}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <v.icon className="h-4 w-4 mr-2" />
        )}
        {v.label}
      </Button>
    </motion.div>
  )
}

function useAuth() {
  const [user, setUser] = useState<any>(null)
  useEffect(() => {
    import('@/lib/supabase/client').then(({ getSupabaseClient }) => {
      const supabase = getSupabaseClient()
      supabase.auth.getUser().then(({ data }) => setUser(data.user))
    })
  }, [])
  return { user }
}
