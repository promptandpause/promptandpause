"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PenLine, Loader2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import type { WhiteboardEntry } from '@/lib/types/social'

interface WhiteboardSectionProps {
  profileUserId: string
  entries: WhiteboardEntry[]
}

export function WhiteboardSection({ profileUserId, entries: initialEntries }: WhiteboardSectionProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [entries, setEntries] = useState(initialEntries)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

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

  return (
    <div className="space-y-4">
      {/* Post to whiteboard */}
      <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/80 border border-[#E8E5DE]'}`}>
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Leave something on their whiteboard..."
          className={`min-h-[80px] resize-none text-sm border-0 bg-transparent p-0 ${
            isDark ? 'text-white/80 placeholder:text-white/20' : 'text-[#3D3D3D] placeholder:text-[#B0AFA0]'
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
                : 'bg-[#3D3D3D] text-white hover:bg-[#5A5A4E]'
            }`}
          >
            {posting ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <PenLine className="h-3 w-3 mr-1.5" />}
            Post
          </Button>
        </div>
      </div>

      {/* Whiteboard entries */}
      {entries.length === 0 ? (
        <p className={`text-sm text-center py-8 ${isDark ? 'text-white/20' : 'text-[#B0AFA0]'}`}>
          Whiteboard is empty. Be the first to write something!
        </p>
      ) : (
        entries.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`rounded-2xl p-4 flex gap-3 ${
              isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white/60 border border-[#E8E5DE]'
            }`}
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={entry.author?.avatar_url || undefined} />
              <AvatarFallback className={`text-[10px] ${isDark ? 'bg-[#1E2430] text-white/40' : 'bg-[#F0EFEA] text-[#8A8A7A]'}`}>
                {entry.author?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${isDark ? 'text-white/50' : 'text-[#8A8A7A]'}`}>
                {entry.author?.display_name || entry.author?.full_name || 'Someone'}
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-white/70' : 'text-[#5A5A4E]'}`}>
                {entry.content?.text}
              </p>
            </div>
          </motion.div>
        ))
      )}
    </div>
  )
}
