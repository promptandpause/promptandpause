"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "@/contexts/ThemeContext"
import { motion } from "framer-motion"
import { MagnifyingGlass, Trash, PencilSimple, CaretLeft, CaretRight, X, Plus } from "phosphor-react"
import { DashboardSidebar } from "../components/DashboardSidebar"

const moods = ["😔", "😐", "😊", "😄", "🤔", "😌", "🙏", "💪"]
const availableTags = ["Gratitude", "Relationships", "Career", "Self-care", "Personal Growth", "Health", "Achievement", "Nature", "Creativity", "Family"]

// Tag color mapping for visual categorization
const tagColors: Record<string, { bg: string; text: string; border: string; darkBg: string; darkText: string; darkBorder: string }> = {
  "Gratitude": { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", darkBg: "bg-amber-500/20", darkText: "text-amber-300", darkBorder: "border-amber-400/40" },
  "Relationships": { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-300", darkBg: "bg-pink-500/20", darkText: "text-pink-300", darkBorder: "border-pink-400/40" },
  "Career": { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", darkBg: "bg-blue-500/20", darkText: "text-blue-300", darkBorder: "border-blue-400/40" },
  "Self-care": { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300", darkBg: "bg-purple-500/20", darkText: "text-purple-300", darkBorder: "border-purple-400/40" },
  "Personal Growth": { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300", darkBg: "bg-emerald-500/20", darkText: "text-emerald-300", darkBorder: "border-emerald-400/40" },
  "Health": { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", darkBg: "bg-red-500/20", darkText: "text-red-300", darkBorder: "border-red-400/40" },
  "Achievement": { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300", darkBg: "bg-yellow-500/20", darkText: "text-yellow-300", darkBorder: "border-yellow-400/40" },
  "Nature": { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", darkBg: "bg-green-500/20", darkText: "text-green-300", darkBorder: "border-green-400/40" },
  "Creativity": { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-300", darkBg: "bg-indigo-500/20", darkText: "text-indigo-300", darkBorder: "border-indigo-400/40" },
  "Family": { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300", darkBg: "bg-purple-500/20", darkText: "text-purple-300", darkBorder: "border-purple-400/40" },
}

function getTagColorClasses(tag: string, isDark: boolean): string {
  const colors = tagColors[tag]
  if (!colors) {
    return isDark ? "bg-indigo-500/20 text-indigo-300 border border-indigo-400/40" : "bg-indigo-100 text-indigo-800 border border-indigo-300"
  }
  return isDark 
    ? `${colors.darkBg} ${colors.darkText} border ${colors.darkBorder}`
    : `${colors.bg} ${colors.text} border ${colors.border}`
}

type JournalEntry = {
  id: string
  journal_text: string
  mood: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

export default function JournalsPage() {
  const supabase = getSupabaseClient()
  const { toast } = useToast()
  const { theme } = useTheme()
  const router = useRouter()

  const [journals, setJournals] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [filterMood, setFilterMood] = useState<string | null>(null)
  const [filterDate, setFilterDate] = useState<string>("") // YYYY-MM-DD
  const [searchText, setSearchText] = useState("")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const journalsPerPage = 5

  const [editingId, setEditingId] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [mood, setMood] = useState<string>("😊")
  const [tags, setTags] = useState<string[]>([])

  // Mobile UX state
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/")
          return
        }
        const res = await fetch('/api/self-journals', { cache: 'no-store' })
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(json?.error || 'Failed to load journals')
        }
        const data = json?.data
        if (active) {
          setJournals((data || []) as JournalEntry[])
        }
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Failed to load journals", variant: "destructive" })
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [router, supabase, toast])

  const filtered = useMemo(() => {
    let f = journals
    if (filterTag) f = f.filter(j => j.tags?.includes(filterTag))
    if (filterMood) f = f.filter(j => j.mood === filterMood)
    if (filterDate) f = f.filter(j => j.created_at.startsWith(filterDate))
    if (searchText) f = f.filter(j => j.journal_text.toLowerCase().includes(searchText.toLowerCase()))
    return f.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [journals, filterTag, filterMood, filterDate, searchText])

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filtered.length / journalsPerPage))
  const startIndex = (currentPage - 1) * journalsPerPage
  const endIndex = startIndex + journalsPerPage
  const paginatedJournals = filtered.slice(startIndex, endIndex)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterTag, filterMood, filterDate, searchText])

  function toggleTag(tag: string) {
    setTags((prev) => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  function clearFilters() {
    setFilterTag(null)
    setFilterMood(null)
    setFilterDate("")
    setSearchText("")
  }

  function resetEditor() {
    setText("")
    setTags([])
    setMood("😊")
    setEditingId(null)
  }

  async function handleSave() {
    if (text.trim().length === 0) {
      toast({ title: "Add something first", description: "Your journal is empty.", variant: "destructive" })
      return
    }
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not signed in")

      if (editingId) {
        const res = await fetch(`/api/self-journals/${editingId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ journal_text: text.trim(), mood, tags }),
        })
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.error || 'Failed to update journal')
        const updated = json?.data as JournalEntry
        setJournals((prev) => prev.map(j => j.id === editingId ? updated : j))
        toast({ title: "Journal updated", description: "Your entry has been updated." })
      } else {
        const res = await fetch('/api/self-journals', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ journal_text: text.trim(), mood, tags }),
        })
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.error || 'Failed to create journal')
        const created = json?.data as JournalEntry
        if (created) setJournals((prev) => [created, ...prev])
        toast({ title: "Journal saved", description: "Your entry has been saved privately." })
      }
      resetEditor()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save journal", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/self-journals/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Failed to delete')
      setJournals((prev) => prev.filter(j => j.id !== id))
      toast({ title: "Deleted", description: "Journal entry removed." })
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete", variant: "destructive" })
    }
  }

  function startEdit(entry: JournalEntry) {
    setEditingId(entry.id)
    setText(entry.journal_text)
    setMood(entry.mood || "😊")
    setTags(entry.tags || [])
    setShowEditor(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const cardClass = theme === 'dark'
    ? 'bg-white/[0.04] border border-white/[0.06]'
    : 'bg-white/70 backdrop-blur-[12px] border border-slate-100 shadow-soft-card'

  const labelClass = theme === 'dark' ? 'text-white/50' : 'text-slate-500'

  const inputBase = `border-2 border-transparent focus:border-indigo-500/60 ${
    theme === 'dark'
      ? 'bg-white/5 text-white placeholder:text-white/40 focus:bg-white/10'
      : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white'
  }`

  const pillBase = `px-4 py-2 rounded-xl border text-xs font-bold transition-all`

  return (
    <div
      data-dashboard
      className={`min-h-screen ${theme === 'dark' ? 'bg-[#0A0E18]' : 'bg-[#F9FBFB]'}`}
    >
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 pb-32 md:pb-10 overflow-y-auto scrollbar-thin">
          <div className="max-w-4xl mx-auto px-5 py-12 lg:py-16">

            {/* Header */}
            <header className="mb-10 lg:mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className={`text-3xl lg:text-4xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>My Journals</h1>
                  <p className={`text-slate-500 font-medium mt-2 ${theme === 'dark' ? 'text-white/40' : ''}`}>Private self-journals (no AI, no pressure). Edit or add freely.</p>
                </div>
              </div>

              {/* Search & Filters */}
              <div className={`space-y-6 rounded-[32px] p-6 lg:p-8 ${cardClass}`}>
                <div className="relative">
                  <MagnifyingGlass size={18} weight="bold" className={`absolute left-5 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`} />
                  <Input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search journals..."
                    className={`pl-14 h-12 rounded-2xl ${inputBase}`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div>
                    <label className={`text-[11px] font-extrabold uppercase tracking-[0.18em] mb-3 block ${labelClass}`}>
                      Filter by date
                    </label>
                    <Input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className={`h-11 rounded-xl px-4 ${inputBase}`}
                    />
                  </div>
                  <div>
                    <label className={`text-[11px] font-extrabold uppercase tracking-[0.18em] mb-3 block ${labelClass}`}>
                      Filter by mood
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {moods.map(m => (
                        <button
                          key={m}
                          onClick={() => setFilterMood(filterMood === m ? null : m)}
                          className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                            filterMood === m
                              ? 'bg-indigo-50 border border-indigo-500 scale-110 dark:bg-indigo-500/20 dark:border-indigo-400/50'
                              : theme === 'dark'
                                ? 'bg-white/5 border border-transparent hover:bg-white/10'
                                : 'bg-slate-50 border border-transparent hover:bg-indigo-50'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`text-[11px] font-extrabold uppercase tracking-[0.18em] mb-3 block ${labelClass}`}>
                    Filter by tag
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                        className={`${pillBase} ${
                          filterTag === tag
                            ? 'bg-indigo-500 text-white border-indigo-500'
                            : getTagColorClasses(tag, theme === 'dark')
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {(filterTag || filterMood || filterDate || searchText) && (
                  <button
                    onClick={clearFilters}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    <X size={12} weight="bold" />
                    Clear all filters
                  </button>
                )}
              </div>
            </header>

            {/* New Journal Entry */}
            <section className="mb-12">
              <div className={`relative overflow-hidden rounded-[40px] border-2 p-8 lg:p-10 ${(showEditor || editingId) ? 'block' : 'hidden md:block'} ${
                theme === 'dark'
                  ? 'bg-white/[0.04] border-indigo-400/20'
                  : 'bg-white/70 backdrop-blur-[12px] border-indigo-100 shadow-xl shadow-indigo-500/5'
              }`}>
                <div className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none ${theme === 'dark' ? 'bg-indigo-500/10' : 'bg-indigo-100/60'}`} />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className={`text-2xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{editingId ? "Edit Journal" : "New Journal"}</h2>
                      <p className={`text-sm font-medium mt-1 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>No timer. Completely private.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId && (
                        <Button variant="ghost" size="sm" onClick={() => { resetEditor(); setShowEditor(false); }}>
                          Cancel edit
                        </Button>
                      )}
                      {/* Close button on mobile */}
                      <button
                        onClick={() => { setShowEditor(false); if (!editingId) resetEditor(); }}
                        className={`md:hidden p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-white/60' : 'hover:bg-slate-100 text-slate-500'}`}
                      >
                        <X size={12} weight="bold" className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <Textarea
                      placeholder="Write anything on your mind..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      disabled={saving}
                      className={`min-h-[200px] md:min-h-[220px] rounded-[24px] p-6 text-base md:text-lg font-medium border-2 border-transparent focus:border-indigo-500/20 ${
                        theme === 'dark'
                          ? 'bg-white/5 text-white placeholder:text-white/40 focus:bg-white/10'
                          : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                      }`}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                      <div>
                        <p className={`text-sm font-extrabold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>How are you feeling?</p>
                        <div className="flex flex-wrap gap-3">
                          {moods.map(m => (
                            <button
                              key={m}
                              onClick={() => setMood(m)}
                              disabled={saving}
                              className={`w-12 h-12 rounded-2xl border text-2xl flex items-center justify-center transition-all ${
                                mood === m
                                  ? 'bg-indigo-50 border-indigo-500 scale-110 dark:bg-indigo-500/20 dark:border-indigo-400/50'
                                  : theme === 'dark'
                                    ? 'bg-white/5 border-transparent hover:bg-white/10'
                                    : 'bg-slate-50 border-transparent hover:border-indigo-500/30 hover:bg-indigo-50'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className={`text-sm font-extrabold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Tags (optional)</p>
                        <div className="flex flex-wrap gap-2">
                          {availableTags.map(tag => (
                            <button
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              disabled={saving}
                              className={`${pillBase} ${
                                tags.includes(tag)
                                  ? 'bg-indigo-500 text-white border-indigo-500'
                                  : getTagColorClasses(tag, theme === 'dark')
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4">
                      <Button variant="ghost" onClick={resetEditor} disabled={saving} className="px-8 py-3 h-auto text-sm font-bold text-slate-500 hover:text-slate-900">
                        Clear
                      </Button>
                      <Button
                        onClick={() => { handleSave(); setShowEditor(false); }}
                        disabled={saving || text.trim().length === 0}
                        className="h-auto px-8 md:px-10 py-3 md:py-4 rounded-[20px] text-sm font-extrabold shadow-lg shadow-indigo-500/20"
                      >
                        {saving ? "Saving..." : editingId ? "Update Journal" : "Save Journal"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Previous Journals */}
            <section>
              <div className="flex items-center justify-between mb-6 lg:mb-8">
                <h3 className={`text-xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Your Journals ({filtered.length})
                </h3>
                <span className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                  Latest First
                </span>
              </div>

              {loading ? (
                <div className={`rounded-[32px] p-10 text-center ${cardClass}`}>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>Loading...</p>
                </div>
              ) : filtered.length === 0 ? (
                journals.length === 0 ? (
                  /* Empty state */
                  <div className={`rounded-[40px] p-10 md:p-16 text-center ${cardClass}`}>
                    <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-6 ${theme === 'dark' ? 'bg-white/10 text-white/40' : 'bg-slate-100 text-slate-400'}`}>
                      <span className="text-4xl">📓</span>
                    </div>
                    <h4 className={`text-xl font-extrabold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>No journals yet.</h4>
                    <p className={`font-medium max-w-xs mx-auto mb-10 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Start your journey today by writing your first reflection above.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto text-left">
                      <div className="p-6 rounded-3xl bg-indigo-50/70 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-400/20">
                        <span className={`text-2xl mb-3 block ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`}>✨</span>
                        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>Prompt Idea</p>
                        <p className={`text-sm font-bold leading-relaxed ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>What made you smile today?</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200/60 dark:bg-amber-500/10 dark:border-amber-400/20">
                        <span className={`text-2xl mb-3 block ${theme === 'dark' ? 'text-amber-400' : 'text-amber-500'}`}>☀️</span>
                        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-amber-300' : 'text-amber-600'}`}>Daily Reflection</p>
                        <p className={`text-sm font-bold leading-relaxed ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Describe a moment of peace you had.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Filters active, no matches */
                  <div className={`rounded-[32px] p-12 text-center ${cardClass}`}>
                    <p className={`text-sm font-medium mb-4 ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>No journals match your filters.</p>
                    <Button variant="ghost" size="sm" onClick={clearFilters} className={`text-xs font-bold ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                      <X size={12} weight="bold" className="mr-1" />
                      Clear all filters
                    </Button>
                  </div>
                )
              ) : (
                <>
                  <div className="space-y-4">
                    {paginatedJournals.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        className={`rounded-3xl p-4 md:p-5 ${cardClass}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {entry.mood && <span className="text-lg md:text-xl">{entry.mood}</span>}
                              <div className="flex gap-1.5 flex-wrap">
                                {(entry.tags || []).map(tag => (
                                  <Badge key={tag} className={`text-[10px] md:text-xs ${getTagColorClasses(tag, theme === 'dark')}`}>{tag}</Badge>
                                ))}
                              </div>
                            </div>
                            <p className={`text-sm md:text-base leading-relaxed whitespace-pre-wrap ${theme === 'dark' ? 'text-white/90' : 'text-slate-900'}`}>{entry.journal_text}</p>
                            <p className={`text-[10px] md:text-xs font-medium ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>
                              {new Date(entry.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {new Date(entry.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button variant="ghost" size="icon" onClick={() => startEdit(entry)} className={theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-900'}><PencilSimple size={16} weight="bold" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} className={theme === 'dark' ? 'text-white/60' : 'text-slate-500'}><Trash size={16} weight="bold" className="text-red-500" /></Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className={`flex items-center justify-between mt-8 pt-6 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className={`px-3 py-1 ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900'} ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <CaretLeft size={16} weight="bold" className="h-4 w-4" />
                          Previous
                        </Button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (currentPage <= 3) {
                              pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = currentPage - 2 + i
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 text-xs ${currentPage === pageNum ? '' : theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1 ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900'} ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Next
                          <CaretRight size={16} weight="bold" className="h-4 w-4" />
                        </Button>
                      </div>

                      <span className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                  )}
                </>
              )}
            </section>

          </div>
        </main>
      </div>

      {/* Floating Action Button (FAB) for Mobile - New Journal */}
      {!showEditor && !editingId && (
        <button
          onClick={() => { setShowEditor(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`md:hidden fixed bottom-28 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 bg-indigo-500 text-white shadow-indigo-500/40 hover:bg-indigo-600`}
          aria-label="New Journal"
        >
          <Plus size={24} weight="bold" />
        </button>
      )}
    </div>
  )
}
