"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Loader2, Send, Trash2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { ReportBlockMenu } from '@/components/social/ReportBlockMenu'
import type { Comment } from '@/lib/types/social'

interface CommentSectionProps {
  reflectionId: string
  reflectionOwnerId?: string
}

export function CommentSection({ reflectionId, reflectionOwnerId }: CommentSectionProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/social/comments?reflection_id=${reflectionId}`)
      const { data, nextCursor, hasMore: more } = await res.json()
      setComments(data || [])
      setCursor(nextCursor || null)
      setHasMore(!!more)
    } catch {}
    setLoading(false)
  }, [reflectionId])

  useEffect(() => {
    loadComments()
    fetch('/api/user/profile')
      .then(r => r.ok ? r.json() : Promise.resolve(null))
      .then(d => setMyId(d?.data?.id || null))
      .catch(() => {})
  }, [loadComments])

  async function loadEarlier() {
    if (loadingMore || !hasMore || !cursor) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/social/comments?reflection_id=${reflectionId}&before=${encodeURIComponent(cursor)}`)
      const { data, nextCursor, hasMore: more } = await res.json()
      setComments(prev => [...(data || []), ...prev])
      setCursor(nextCursor || null)
      setHasMore(!!more)
    } catch {}
    setLoadingMore(false)
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

  async function handleDelete(commentId: string) {
    if (!confirm('Delete this comment?')) return
    const res = await fetch(`/api/social/comments?id=${commentId}`, { method: 'DELETE' })
    if (res.ok) {
      setComments(prev => prev.filter(c => c.id !== commentId))
    }
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
              : 'text-slate-900 placeholder:text-slate-400 border-slate-100 focus:border-slate-500'
          }`}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handlePost}
          disabled={!text.trim() || posting}
          className={`h-8 w-8 p-0 ${isDark ? 'text-white/40 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
        >
          {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-white/20' : 'text-slate-500'}`} />
        </div>
      ) : comments.length === 0 ? (
        <p className={`text-xs text-center py-4 ${isDark ? 'text-white/20' : 'text-slate-500'}`}>
          No comments yet
        </p>
      ) : (
        <>
          {hasMore && (
            <button
              onClick={loadEarlier}
              disabled={loadingMore}
              className={`w-full text-center text-xs font-medium py-1.5 transition-colors ${
                isDark ? 'text-indigo-600 hover:text-white' : 'text-indigo-600 hover:text-slate-900'
              }`}
            >
              {loadingMore ? 'Loading…' : 'Load earlier comments'}
            </button>
          )}
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
                <AvatarFallback className={`text-[8px] ${isDark ? 'bg-[#0A0E18] text-white/30' : 'bg-slate-50 text-slate-500'}`}>
                  {comment.author?.full_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                    {comment.author?.display_name || comment.author?.full_name || 'Someone'}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-white/20' : 'text-slate-500'}`}>
                    {getTimeAgo(comment.created_at)}
                  </span>
                  {myId && ((comment as any).author_id === myId || reflectionOwnerId === myId) && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      title={(comment as any).author_id === myId ? 'Delete your comment' : 'Remove comment from your reflection'}
                      className={`ml-auto text-[10px] flex items-center gap-1 transition-colors ${isDark ? 'text-white/20 hover:text-red-400' : 'text-slate-500 hover:text-red-500'}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                  {myId && (comment as any).author_id !== myId && (
                    <div className="ml-auto">
                      <ReportBlockMenu
                        targetType="comment"
                        targetId={comment.id}
                        authorId={(comment as any).author_id}
                        authorName={comment.author?.display_name || comment.author?.full_name || undefined}
                        onBlocked={() => setComments(prev => prev.filter(c => (c as any).author_id !== (comment as any).author_id))}
                      />
                    </div>
                  )}
                </div>
                <p className={`text-sm mt-0.5 ${isDark ? 'text-white/70' : 'text-slate-900'}`}>
                  {comment.body}
                </p>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </>
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
