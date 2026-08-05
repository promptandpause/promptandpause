"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWandMagicSparkles, faPaperPlane, faGlobe, faUserGroup, faLock, faCheck, faBuilding, faSpinner } from '@fortawesome/free-solid-svg-icons'

type Visibility = 'private' | 'friends_only' | 'public' | 'workspace'

interface WorkspaceSummary {
  id: string
  name: string
  slug: string
}

export function QuickShare({ onShared }: { onShared?: () => void }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('public')
  const [submitting, setSubmitting] = useState(false)

  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([])
  const [workspaceId, setWorkspaceId] = useState('')

  useEffect(() => {
    fetch('/api/org/mine')
      .then(r => (r.ok ? r.json() : Promise.resolve({ organizations: [] })))
      .then(({ organizations }) => {
        const orgs = (organizations || []) as WorkspaceSummary[]
        setWorkspaces(orgs)
        if (orgs.length > 0) setWorkspaceId(orgs[0].id)
      })
      .catch(() => {})
  }, [])

  async function handleShare() {
    if (!text.trim()) return
    if (visibility === 'workspace' && !workspaceId) {
      toast({ title: 'Pick a workspace', description: 'Choose which workspace to share this to.', variant: 'destructive' })
      return
    }
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
          workspace_id: visibility === 'workspace' ? workspaceId : null,
          allow_comments: true,
        }),
      })
      if (res.ok) {
        toast({
          title: visibility === 'workspace' ? 'Shared to your workspace' : 'Shared to your feed',
        })
        setText('')
        setOpen(false)
        onShared?.()
      } else {
        const body = await res.json().catch(() => ({}))
        toast({ title: 'Error', description: body?.message || body?.error || 'Failed to share', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    }
    setSubmitting(false)
  }

  const isWorkspaceMember = workspaces.length > 0

  const visOptions: { value: Visibility; icon: React.ReactNode; label: string }[] = [
    { value: 'public', icon: <FontAwesomeIcon icon={faGlobe} className="text-xs" />, label: 'Public' },
    { value: 'friends_only', icon: <FontAwesomeIcon icon={faUserGroup} className="text-xs" />, label: 'Friends' },
    { value: 'private', icon: <FontAwesomeIcon icon={faLock} className="text-xs" />, label: 'Private' },
    ...(isWorkspaceMember ? [{ value: 'workspace' as Visibility, icon: <FontAwesomeIcon icon={faBuilding} className="text-xs" />, label: 'Workspace' }] : []),
  ]

  return (
    <div className={`rounded-3xl border ${isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'glass border-slate-100 soft-shadow'}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-3 w-full px-5 py-4 transition-colors rounded-3xl cursor-pointer ${
          isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50/60'
        }`}
      >
        <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-[#818CF8]/15 text-[#818CF8]' : 'bg-indigo-50 text-indigo-400'}`}>
          <FontAwesomeIcon icon={faWandMagicSparkles} />
        </span>
        <span className={`text-sm flex-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
          Share your reflection...
        </span>
        <FontAwesomeIcon icon={faPaperPlane} className={`text-sm ${isDark ? 'text-white/20' : 'text-slate-300'}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}
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
                    : 'bg-[#F9FBFB] text-slate-700 placeholder:text-slate-400 border border-slate-100'
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
                            ? 'bg-[#818CF8]/20 text-[#818CF8]'
                            : 'bg-indigo-50 text-indigo-600'
                          : isDark
                            ? 'text-white/30 hover:text-white/50'
                            : 'text-slate-400 hover:text-slate-600'
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
                      ? 'bg-[#6366F1] text-white hover:bg-[#4F46E5] disabled:opacity-50'
                      : 'bg-[#6366F1] text-white hover:bg-[#4F46E5] disabled:opacity-50'
                  }`}
                >
                  {submitting ? <FontAwesomeIcon icon={faSpinner} spin className="text-xs" /> : <FontAwesomeIcon icon={faCheck} className="text-xs" />}
                  {submitting ? 'Sharing...' : 'Share'}
                </Button>
              </div>

              {visibility === 'workspace' && (
                <select
                  value={workspaceId}
                  onChange={e => setWorkspaceId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm border outline-none focus:border-[#6366F1] ${
                    isDark
                      ? 'bg-white/[0.06] border-white/[0.1] text-white'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  {workspaces.map(ws => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
              )}

              {visibility === 'public' && isWorkspaceMember && (
                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                  This posts to your personal public feed — visible to everyone, not just your workspace.
                </p>
              )}

              {visibility === 'workspace' && (
                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                  Only members of this workspace can see it.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
