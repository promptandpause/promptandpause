"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { DashboardSidebar } from "../components/DashboardSidebar"
import { useTheme } from "@/contexts/ThemeContext"
import { BookmarkSimple, Leaf, Trash, Spinner } from "phosphor-react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"

type Reflection = {
  id: string
  prompt_text: string
  reflection_text: string
  mood: string
  tags: string[]
  date: string
  created_at: string
}

type BookmarkRow = {
  id: string
  reflection_id: string
  kind: 'saved' | 'revisit'
  revisit_on: string | null
  created_at: string
  reflections: Reflection | null
}

export default function SavedPage() {
  const { theme } = useTheme()
  const { toast } = useToast()
  const isDark = theme === 'dark'
  const [saved, setSaved] = useState<BookmarkRow[]>([])
  const [revisits, setRevisits] = useState<BookmarkRow[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const [savedRes, revisitRes] = await Promise.all([
        fetch('/api/bookmarks?kind=saved', { cache: 'no-store' }),
        fetch('/api/bookmarks?kind=revisit', { cache: 'no-store' }),
      ])
      const savedJson = savedRes.ok ? await savedRes.json() : { data: [] }
      const revisitJson = revisitRes.ok ? await revisitRes.json() : { data: [] }
      setSaved((savedJson.data || []).filter((b: BookmarkRow) => b.reflections))
      setRevisits((revisitJson.data || []).filter((b: BookmarkRow) => b.reflections))
    } catch {
      toast({ title: 'Error', description: 'Could not load your bookmarks.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function remove(bookmarkId: string, kind: 'saved' | 'revisit') {
    setRemovingId(bookmarkId)
    try {
      const res = await fetch(`/api/bookmarks/${bookmarkId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove')
      if (kind === 'saved') {
        setSaved(prev => prev.filter(b => b.id !== bookmarkId))
      } else {
        setRevisits(prev => prev.filter(b => b.id !== bookmarkId))
      }
      toast({ title: 'Removed', description: 'Bookmark cleared.' })
    } catch {
      toast({ title: 'Error', description: 'Could not remove. Try again.', variant: 'destructive' })
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <AuthGuard redirectPath="/dashboard/saved">
      <div
        data-dashboard
        className={`min-h-screen ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}
      >
        <div className="flex h-screen overflow-hidden">
          <DashboardSidebar />

          <main className="flex-1 pb-32 md:pb-10 overflow-y-auto scrollbar-thin">
            <div className="max-w-[1100px] mx-auto px-4 md:px-8 pt-16 md:pt-10 pb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              >
              <header className="mb-6 md:mb-8">
                <h1 className={`text-2xl md:text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                  Saved
                </h1>
                <p className={`text-sm mt-1.5 ${isDark ? 'text-white/50' : 'text-[#8B98A5]'}`}>
                  Reflections you marked to revisit or return to.
                </p>
              </header>
              </motion.div>

              {loading ? (
                <div className={`flex items-center gap-2 py-10 ${isDark ? 'text-white/50' : 'text-[#8B98A5]'}`}>
                  <Spinner size={16} weight="bold" className="animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : (
                <div className="space-y-10">
                  <Section
                    title="To revisit"
                    icon={<Leaf size={16} weight="bold" aria-hidden="true" />}
                    emptyText="Nothing flagged for revisit yet."
                    items={revisits}
                    kind="revisit"
                    removingId={removingId}
                    onRemove={remove}
                    isDark={isDark}
                  />
                  <Section
                    title="Saved for later"
                    icon={<BookmarkSimple size={16} weight="bold" aria-hidden="true" />}
                    emptyText="You haven't saved any reflections yet."
                    items={saved}
                    kind="saved"
                    removingId={removingId}
                    onRemove={remove}
                    isDark={isDark}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}

function Section({
  title,
  icon,
  emptyText,
  items,
  kind,
  removingId,
  onRemove,
  isDark,
}: {
  title: string
  icon: React.ReactNode
  emptyText: string
  items: BookmarkRow[]
  kind: 'saved' | 'revisit'
  removingId: string | null
  onRemove: (bookmarkId: string, kind: 'saved' | 'revisit') => void
  isDark: boolean
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className={isDark ? 'text-white/60' : 'text-[#536471]'}>{icon}</span>
        <h2 className={`text-base font-semibold ${isDark ? 'text-white/80' : 'text-[#0F1419]'}`}>
          {title}
        </h2>
        <span className={`text-xs ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
          ({items.length})
        </span>
      </div>

      {items.length === 0 ? (
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {items.map((b) => {
              const r = b.reflections!
              return (
                <motion.li
                  key={b.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-2xl p-4 md:p-5 border ${isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-white/70 border-[#EFF3F4]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs uppercase tracking-wide font-semibold ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                        {kind === 'revisit' && b.revisit_on
                          ? `For ${b.revisit_on}`
                          : formatDate(r.date)}
                      </p>
                      {r.prompt_text && (
                        <blockquote className={`mt-1.5 italic text-sm md:text-base leading-relaxed ${isDark ? 'text-white/80' : 'text-[#0F1419]'}`}>
                          &ldquo;{r.prompt_text}&rdquo;
                        </blockquote>
                      )}
                      <p className={`mt-2 text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-white/70' : 'text-[#536471]'}`}>
                        {truncate(r.reflection_text, 320)}
                      </p>
                      {r.tags && r.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {r.tags.map(t => (
                            <span
                              key={t}
                              className={`text-xs px-2 py-0.5 rounded-full border ${isDark ? 'bg-white/5 text-white/70 border-white/10' : 'bg-white text-[#536471] border-[#E0DDD6]'}`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(b.id, kind)}
                      disabled={removingId === b.id}
                      aria-label="Remove bookmark"
                      className={`flex-shrink-0 p-2 rounded-lg transition-colors ${isDark ? 'text-white/40 hover:text-white/80 hover:bg-white/10' : 'text-[#8B98A5] hover:text-[#0F1419] hover:bg-[#EFF3F4]'} disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {removingId === b.id
                        ? <Spinner size={16} weight="bold" className="animate-spin" />
                        : <Trash size={16} weight="bold" />}
                    </button>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </section>
  )
}

function truncate(s: string, n: number) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}
