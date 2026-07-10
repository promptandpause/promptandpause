"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PenLine, Loader2, Trash2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import type { WhiteboardEntry } from '@/lib/types/social'

interface WhiteboardSectionProps {
  profileUserId: string
  entries: WhiteboardEntry[]
  isOwnProfile?: boolean
}

export function WhiteboardSection({ profileUserId, entries: initialEntries, isOwnProfile }: WhiteboardSectionProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [entries, setEntries] = useState(initialEntries)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    fetch('/api/social/friends', { method: 'HEAD' })
      .then(() => fetch('/api/user/profile'))
      .then(r => r.ok ? r.json() : Promise.resolve(null))
      .then(d => { setCurrentUserId(d?.data?.id || null); setAuthLoading(false) })
      .catch(() => setAuthLoading(false))
  }, [])

  async function handlePost() {
    if (!text.trim()) return
    setPosting(true)
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
      }
    } catch {}
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

  return (
    <div className="space-y-4">
      {/* Post to whiteboard — only for logged-in users */}
      {!authLoading && currentUserId && (
        <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/80 border border-[#EFF3F4]'}`}>
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={
              currentUserId === profileUserId
                ? 'Write something on your own whiteboard...'
                : 'Leave something on their whiteboard...'
            }
            className={`min-h-[80px] resize-none text-sm border-0 bg-transparent p-0 ${
              isDark ? 'text-white/80 placeholder:text-white/20' : 'text-[#0F1419] placeholder:text-[#8B98A5]'
            } focus:ring-0`}
          />
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              onClick={handlePost}
              disabled={!text.trim() || posting}
              className={`text-xs ${
                isDark
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-[#1D9BF0] text-white hover:bg-[#1A8CD8]'
              }`}
            >
              {posting ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <PenLine className="h-3 w-3 mr-1.5" />}
              Post
            </Button>
          </div>
        </div>
      )}

      {/* Whiteboard entries */}
      {entries.length === 0 ? (
        <p className={`text-sm text-center py-8 ${isDark ? 'text-white/20' : 'text-[#8B98A5]'}`}>
          Whiteboard is empty. Be the first to write something!
        </p>
      ) : (
        entries.map((entry, i) => {
          const canDelete = currentUserId && (currentUserId === entry.author_id || isOwnProfile)
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-2xl p-4 flex gap-3 group ${
                isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white/60 border border-[#EFF3F4]'
              }`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={entry.author?.avatar_url || undefined} />
                <AvatarFallback className={`text-[10px] ${isDark ? 'bg-[#161618] text-white/40' : 'bg-[#EFF3F4] text-[#8B98A5]'}`}>
                  {entry.author?.full_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${isDark ? 'text-white/50' : 'text-[#8B98A5]'}`}>
                  {entry.author?.display_name || entry.author?.full_name || 'Someone'}
                </p>
                <p className={`text-sm mt-1 ${isDark ? 'text-white/70' : 'text-[#536471]'}`}>
                  {entry.content?.text}
                </p>
              </div>
              {canDelete && (
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                  className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                    isDark ? 'hover:bg-white/10 text-white/30 hover:text-red-400' : 'hover:bg-[#EFF3F4] text-[#8B98A5] hover:text-red-500'
                  }`}
                >
                  {deletingId === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              )}
            </motion.div>
          )
        })
      )}
    </div>
  )
}
