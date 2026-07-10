"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Sparkle, Spinner, Globe, Users, Lock, Check } from 'phosphor-react'

type Visibility = 'private' | 'friends_only' | 'public'

export function QuickShare({ onShared }: { onShared?: () => void }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('public')
  const [submitting, setSubmitting] = useState(false)

  async function handleShare() {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_text: 'Quick Share',
          reflection_text: text.trim(),
          mood: '😊',
          tags: [],
          word_count: text.trim().split(/\s+/).length,
          visibility,
          allow_comments: true,
        }),
      })
      if (res.ok) {
        toast({ title: 'Shared to your feed' })
        setText('')
        setOpen(false)
        onShared?.()
      } else {
        const body = await res.json().catch(() => ({}))
        toast({ title: 'Error', description: body?.error || 'Failed to share', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    }
    setSubmitting(false)
  }

  const visOptions: { value: Visibility; icon: React.ReactNode; label: string }[] = [
    { value: 'public', icon: <Globe size={14} weight="bold" />, label: 'Public' },
    { value: 'friends_only', icon: <Users size={14} weight="bold" />, label: 'Friends' },
    { value: 'private', icon: <Lock size={14} weight="bold" />, label: 'Private' },
  ]

  return (
    <div className={`rounded-2xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white/80 border border-[#EFF3F4]'}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-3 w-full px-4 py-2.5 transition-colors rounded-2xl ${
          isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-[#F7F9FA]'
        }`}
      >
        <Sparkle size={18} weight="bold" className={isDark ? 'text-[#1D9BF0]' : 'text-[#1D9BF0]'} />
        <span className={`text-sm ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>
          Share your reflection...
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`border-t ${isDark ? 'border-white/[0.06]' : 'border-[#EFF3F4]'}`}
          >
            <div className="p-4 space-y-3">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="What's on your mind?"
                maxLength={10000}
                className={`w-full min-h-[100px] resize-none text-sm rounded-xl p-3 outline-none ${
                  isDark
                    ? 'bg-white/[0.06] text-white placeholder:text-white/20 border border-white/[0.08]'
                    : 'bg-[#F7F9FA] text-[#0F1419] placeholder:text-[#8B98A5] border border-[#EFF3F4]'
                }`}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {visOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setVisibility(opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        visibility === opt.value
                          ? isDark
                            ? 'bg-[#1D9BF0]/20 text-[#1D9BF0]'
                            : 'bg-[#1D9BF0]/10 text-[#1D9BF0]'
                          : isDark
                            ? 'text-white/30 hover:text-white/50'
                            : 'text-[#8B98A5] hover:text-[#536471]'
                      }`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={handleShare}
                  disabled={!text.trim() || submitting}
                  size="sm"
                  className={`rounded-full text-xs font-semibold px-4 ${
                    isDark
                      ? 'bg-[#1D9BF0] text-white hover:bg-[#1A8CD8] disabled:opacity-50'
                      : 'bg-[#1D9BF0] text-white hover:bg-[#1A8CD8] disabled:opacity-50'
                  }`}
                >
                  {submitting ? <Spinner size={14} weight="bold" className="animate-spin" /> : <Check size={14} weight="bold" />}
                  {submitting ? 'Sharing...' : 'Share'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
