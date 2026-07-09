"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Loader2, Send } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import type { Comment } from '@/lib/types/social'

interface CommentSectionProps {
  reflectionId: string
}

export function CommentSection({ reflectionId }: CommentSectionProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [reflectionId])

  async function loadComments() {
    try {
      const res = await fetch(`/api/social/comments?reflection_id=${reflectionId}`)
      const { data } = await res.json()
      setComments(data || [])
    } catch {}
    setLoading(false)
  }

  async function handlePost() {
    if (!text.trim()) return
    setPosting(true)
    try {
      const res = await fetch('/api/social/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reflection_id: reflectionId, body: text.trim() }),
      })
      if (res.ok) {
        const { data } = await res.json()
        setComments(prev => [...prev, data])
        setText('')
      }
    } catch {}
    setPosting(false)
  }

  return (
    <div className="p-4 space-y-3">
      {/* Comment input */}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePost()}
          placeholder="Write a comment..."
          className={`flex-1 text-sm bg-transparent border-0 border-b outline-none py-1.5 ${
            isDark
              ? 'text-white/70 placeholder:text-white/20 border-white/10 focus:border-white/30'
              : 'text-[#0F1419] placeholder:text-[#8B98A5] border-[#EFF3F4] focus:border-[#536471]'
          }`}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handlePost}
          disabled={!text.trim() || posting}
          className={`h-8 w-8 p-0 ${isDark ? 'text-white/40 hover:text-white' : 'text-[#8B98A5] hover:text-[#0F1419]'}`}
        >
          {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-white/20' : 'text-[#8B98A5]'}`} />
        </div>
      ) : comments.length === 0 ? (
        <p className={`text-xs text-center py-4 ${isDark ? 'text-white/20' : 'text-[#8B98A5]'}`}>
          No comments yet
        </p>
      ) : (
        <AnimatePresence>
          {comments.map(comment => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2.5"
            >
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={comment.author?.avatar_url || undefined} />
                <AvatarFallback className={`text-[8px] ${isDark ? 'bg-[#161618] text-white/30' : 'bg-[#F7F9FA] text-[#8B98A5]'}`}>
                  {comment.author?.full_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-[#536471]'}`}>
                    {comment.author?.display_name || comment.author?.full_name || 'Someone'}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-white/20' : 'text-[#8B98A5]'}`}>
                    {getTimeAgo(comment.created_at)}
                  </span>
                </div>
                <p className={`text-sm mt-0.5 ${isDark ? 'text-white/70' : 'text-[#0F1419]'}`}>
                  {comment.body}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}
