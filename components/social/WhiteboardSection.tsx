"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PenLine, Loader2, Trash2, AlertCircle } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import type { WhiteboardEntry } from '@/lib/types/social'

function timeAgo(date: string): string {
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

interface WhiteboardSectionProps {
  profileUserId: string
  entries: WhiteboardEntry[]
  isOwnProfile?: boolean
}

export function WhiteboardSection({ profileUserId, entries: initialEntries, isOwnProfile }: WhiteboardSectionProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { user } = useAuth()
  const [entries, setEntries] = useState(initialEntries)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const currentUserId = user?.id || null

  useEffect(() => {
    setEntries(initialEntries)
  }, [initialEntries])

  async function handlePost() {
    if (!text.trim() || posting) return
    setPosting(true)
    setError('')
    try {
      const res = await fetch('/api/social/whiteboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_user_id: profileUserId,
          content_type: 'text',
          content: { text: text.trim() },
        }),
      })
      if (res.ok) {
        const { data } = await res.json()
        setEntries(prev => [data, ...prev])
        setText('')
      } else {
        const { error: msg } = await res.json()
        setError(msg || 'Failed to post')
      }
    } catch {
      setError('Network error')
    }
    setPosting(false)
  }

  async function handleDelete(entryId: string) {
    setDeletingId(entryId)
    try {
      const res = await fetch(`/api/social/whiteboard?id=${entryId}`, { method: 'DELETE' })
      if (res.ok) {
        setEntries(prev => prev.filter(e => e.id !== entryId))
      }
    } catch {}
    setDeletingId(null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handlePost()
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Post to whiteboard */}
      {currentUserId && (
        <div className={`rounded-2xl p-3 sm:p-4 ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/80 border border-slate-100'}`}>
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentUserId === profileUserId
                ? 'Write something on your whiteboard...'
                : 'Leave a note...'
            }
            className={`min-h-[72px] sm:min-h-[80px] resize-none text-sm border-0 bg-transparent p-0 ${
              isDark ? 'text-white/80 placeholder:text-white/20' : 'text-slate-900 placeholder:text-slate-400'
            } focus:ring-0`}
          />
          {error && (
            <p className={`flex items-center gap-1.5 text-xs mt-2 ${isDark ? 'text-red-400' : 'text-red-500'}`}>
              <AlertCircle size={12} />
              {error}
            </p>
          )}
          <div className="flex items-center justify-between mt-2 sm:mt-3">
            <span className={`text-xs ${isDark ? 'text-white/20' : 'text-slate-500'}`}>
              {text.length > 0 && `${text.length} characters`}
            </span>
            <Button
              size="sm"
              onClick={handlePost}
              disabled={!text.trim() || posting}
              className={`text-xs ${
                isDark
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              {posting ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <PenLine className="h-3 w-3 mr-1.5" />}
              Post
            </Button>
          </div>
        </div>
      )}

      {/* Entries */}
      {entries.length === 0 ? (
        <div className={`text-center py-10 sm:py-12 rounded-2xl ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
          <PenLine size={24} className={`mx-auto mb-2 ${isDark ? 'text-white/15' : 'text-slate-300'}`} />
          <p className={`text-sm ${isDark ? 'text-white/30' : 'text-slate-500'}`}>
            No notes yet
          </p>
          {currentUserId && (
            <p className={`text-xs mt-1 ${isDark ? 'text-white/15' : 'text-slate-300'}`}>
              Be the first to leave a note
            </p>
          )}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {entries.map((entry, i) => {
            const canDelete = currentUserId && (currentUserId === entry.author_id || isOwnProfile)
            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                className={`rounded-2xl p-3 sm:p-4 flex gap-3 group ${
                  isDark
                    ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05]'
                    : 'bg-white/60 border border-slate-100 hover:bg-white/90 hover:shadow-sm'
                } transition-all duration-200`}
              >
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 mt-0.5">
                  <AvatarImage src={entry.author?.avatar_url || undefined} />
                  <AvatarFallback className={`text-[10px] ${isDark ? 'bg-[#0A0E18] text-white/40' : 'bg-slate-100 text-slate-500'}`}>
                    {(entry.author?.full_name || '?')[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-xs font-medium truncate ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                      {entry.author?.display_name || entry.author?.full_name || 'Someone'}
                    </p>
                    <span className={`text-[10px] ${isDark ? 'text-white/20' : 'text-slate-300'}`}>
                      {timeAgo(entry.created_at)}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 leading-relaxed whitespace-pre-wrap break-words ${
                    isDark ? 'text-white/80' : 'text-slate-900'
                  }`}>
                    {entry.content?.text}
                  </p>
                </div>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                    className={`shrink-0 opacity-0 group-hover:opacity-100 transition-all p-1.5 self-start rounded-lg ${
                      isDark
                        ? 'text-white/20 hover:bg-white/10 hover:text-red-400'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-red-500'
                    }`}
                  >
                    {deletingId === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 size={14} />}
                  </button>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      )}
    </div>
  )
}
