"use client"

import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Flag, UserX } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

const REASONS: { value: string; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'self_harm', label: 'Self-harm or suicide content' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Other' },
]

interface ReportBlockMenuProps {
  targetType: 'reflection' | 'comment'
  targetId: string
  authorId: string
  authorName?: string
  onBlocked?: () => void
}

export function ReportBlockMenu({ targetType, targetId, authorId, authorName, onBlocked }: ReportBlockMenuProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [open, setOpen] = useState(false)
  const [showReasons, setShowReasons] = useState(false)
  const [reported, setReported] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setShowReasons(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function submitReport(reason: string) {
    try {
      await fetch('/api/social/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: targetType, target_id: targetId, reason }),
      })
      setReported(true)
    } catch {}
    setShowReasons(false)
    setTimeout(() => setOpen(false), 1200)
  }

  async function blockUser() {
    if (!confirm(`Block ${authorName || 'this person'}? You won't see each other's reflections, comments, or profiles, and any friend/follow connection will be removed.`)) {
      return
    }
    setBlocking(true)
    try {
      const res = await fetch('/api/social/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: authorId }),
      })
      if (res.ok) {
        onBlocked?.()
      }
    } catch {}
    setBlocking(false)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className={`p-1 rounded-full transition-colors ${isDark ? 'text-white/30 hover:bg-white/10 hover:text-white/60' : 'text-[#8B98A5] hover:bg-[#EFF3F4] hover:text-[#536471]'}`}
        aria-label="More options"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          className={`absolute right-0 top-7 z-50 w-56 rounded-xl shadow-lg overflow-hidden border ${
            isDark ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-[#EFF3F4]'
          }`}
        >
          {!showReasons ? (
            <>
              <button
                onClick={() => setShowReasons(true)}
                disabled={reported}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors ${
                  isDark ? 'text-white/80 hover:bg-white/5' : 'text-[#0F1419] hover:bg-[#F7F9FA]'
                }`}
              >
                <Flag size={15} />
                {reported ? 'Reported' : `Report ${targetType}`}
              </button>
              <button
                onClick={blockUser}
                disabled={blocking}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors border-t ${
                  isDark ? 'text-red-400 hover:bg-white/5 border-white/[0.06]' : 'text-red-500 hover:bg-[#F7F9FA] border-[#EFF3F4]'
                }`}
              >
                <UserX size={15} />
                {blocking ? 'Blocking…' : `Block ${authorName || 'user'}`}
              </button>
            </>
          ) : (
            <div className="py-1.5">
              <p className={`px-3.5 pb-1.5 text-xs font-semibold ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                Why are you reporting this?
              </p>
              {REASONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => submitReport(r.value)}
                  className={`w-full px-3.5 py-2 text-sm text-left transition-colors ${
                    isDark ? 'text-white/80 hover:bg-white/5' : 'text-[#0F1419] hover:bg-[#F7F9FA]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
