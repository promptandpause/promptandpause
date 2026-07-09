"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageCircle, Globe, Users, Lock } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'
import { CommentSection } from './CommentSection'
import type { FeedItem } from '@/lib/types/social'

export function FeedCard({ item }: { item: FeedItem }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()
  const [showComments, setShowComments] = useState(false)

  const displayName = item.author.display_name || item.author.full_name || item.author.username || 'Someone'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const timeAgo = getTimeAgo(item.reflection.created_at)

  const visibilityIcon = {
    public: <Globe className="h-3 w-3" />,
    friends_only: <Users className="h-3 w-3" />,
    private: <Lock className="h-3 w-3" />,
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl overflow-hidden transition-all ${
        isDark
          ? 'bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1]'
          : 'bg-white/80 border border-[#E8E5DE] hover:border-[#D4D0C8]'
      }`}
    >
      {/* Header */}
      <div className="p-4 pb-0 flex items-center gap-3">
        <button onClick={() => router.push(`/${item.author.username}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <Avatar className="h-9 w-9">
            <AvatarImage src={item.author.avatar_url || undefined} />
            <AvatarFallback className={`text-xs ${isDark ? 'bg-[#1E2430] text-white/50' : 'bg-[#F0EFEA] text-[#8A8A7A]'}`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-[#3D3D3D]'}`}>
              {displayName}
            </p>
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] ${isDark ? 'text-white/30' : 'text-[#A0A090]'}`}>{timeAgo}</span>
              <span className={`${isDark ? 'text-white/20' : 'text-[#C0BFB0]'}`}>·</span>
              <span className={`${isDark ? 'text-white/20' : 'text-[#C0BFB0]'}`}>
                {visibilityIcon[item.reflection.visibility]}
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className={`text-xs font-medium mb-2 ${isDark ? 'text-white/40' : 'text-[#A0A090]'}`}>
          {item.reflection.prompt_text}
        </p>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-white/80' : 'text-[#3D3D3D]'}`}>
          {item.reflection.reflection_text}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-base">{item.reflection.mood}</span>
          {item.reflection.tags?.slice(0, 3).map(tag => (
            <span
              key={tag}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                isDark ? 'bg-white/[0.06] text-white/40' : 'bg-[#F0EFEA] text-[#8A8A7A]'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className={`px-4 py-2.5 border-t ${isDark ? 'border-white/[0.06]' : 'border-[#E8E5DE]'}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className={`text-xs gap-1.5 ${
            isDark
              ? 'text-white/40 hover:text-white hover:bg-white/5'
              : 'text-[#A0A090] hover:text-[#5A5A4E] hover:bg-[#F0EFEA]'
          }`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {item.comment_count > 0 ? `${item.comment_count}` : 'Comment'}
        </Button>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`border-t ${isDark ? 'border-white/[0.04]' : 'border-[#F0EFEA]'}`}
          >
            <CommentSection reflectionId={item.reflection.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString()
}
