"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "@/contexts/ThemeContext"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Trash2, Pencil, Flame, ChevronLeft, ChevronRight, X, Eye, Filter, Plus, ChevronDown, ChevronUp } from "lucide-react"
import { DashboardSidebar } from "../components/DashboardSidebar"
import { BubbleBackground } from "@/components/ui/bubble-background"

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
    return isDark ? "bg-green-500/20 text-green-300 border border-green-400/40" : "bg-green-100 text-green-800 border border-green-300"
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
  const [heatmapDays, setHeatmapDays] = useState<{ date: string; count: number }[]>([])
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [showAllJournals, setShowAllJournals] = useState(false)
  const journalsPerPage = 5

  const [editingId, setEditingId] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [mood, setMood] = useState<string>("😊")
  const [tags, setTags] = useState<string[]>([])
  
  // Mobile UX state
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }
        const res = await fetch('/api/self-journals', { cache: 'no-store' })
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(json?.error || 'Failed to load journals')
        }
        const data = json?.data
        if (active) {
          const list = (data || []) as JournalEntry[]
          setJournals(list)

          // Build last 12 weeks heatmap (84 days)
          const today = new Date()
          const start = new Date(today.getTime() - 83 * 24 * 60 * 60 * 1000)
          const counts: Record<string, number> = {}
          list.forEach(j => {
            const d = new Date(j.created_at)
            const key = d.toISOString().slice(0, 10)
            counts[key] = (counts[key] || 0) + 1
          })
          const days: { date: string; count: number }[] = []
          for (let i = 0; i < 84; i++) {
            const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000)
            const key = d.toISOString().slice(0, 10)
            days.push({ date: key, count: counts[key] || 0 })
          }
          setHeatmapDays(days)
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
  const totalPages = Math.ceil(filtered.length / journalsPerPage)
  const startIndex = (currentPage - 1) * journalsPerPage
  const endIndex = startIndex + journalsPerPage
  const paginatedJournals = showAllJournals ? filtered : filtered.slice(startIndex, endIndex)
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterTag, filterMood, filterDate, searchText])

  function toggleTag(tag: string) {
    setTags((prev) => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
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
      setText("")
      setTags([])
      setMood("😊")
      setEditingId(null)
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

  const heatmapLegend = [
    { label: "0", className: theme === 'dark' ? 'bg-white/10 border border-white/10' : 'bg-gray-100 border border-gray-200' },
    { label: "1", className: 'bg-emerald-200 border border-emerald-300' },
    { label: "2", className: 'bg-emerald-300 border border-emerald-400' },
    { label: "3", className: 'bg-emerald-400 border border-emerald-500' },
    { label: "4+", className: 'bg-emerald-500 border border-emerald-600' },
  ]

  function intensityClass(count: number) {
    if (count === 0) return theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-gray-200'
    if (count === 1) return 'bg-emerald-200 border border-emerald-300'
    if (count === 2) return 'bg-emerald-300 border border-emerald-400'
    if (count === 3) return 'bg-emerald-400 border border-emerald-500'
    return 'bg-emerald-500 border border-emerald-600 text-white'
  }

  return (
    <div 
      data-dashboard
      className="min-h-screen relative" 
      style={theme === 'light' 
        ? { background: 'linear-gradient(135deg, #F8F7FF 0%, #C4B5FD 45%, #7C3AED 100%)' } 
        : { background: 'linear-gradient(to bottom right, #0F0D15, #1A1625, #0F0D15)' }}
    >
      <BubbleBackground interactive className="fixed inset-0 -z-10" />
      <div className={`fixed inset-0 -z-10 ${theme === 'light' ? 'bg-white/35' : 'bg-black/25'}`} />

      <div className="relative z-10 p-3 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 pb-24 md:pb-6">
        {/* Universal Sidebar - Desktop & Mobile */}
        <DashboardSidebar />

        {/* Main Content Area */}
        <div className="col-span-1 md:col-span-10 space-y-4 md:space-y-6">
          {/* Header Card */}
          <Card className={`backdrop-blur-xl border-2 rounded-3xl p-3 md:p-6 ${theme === 'dark' ? 'bg-white/5 border-white/10 shadow-2xl shadow-black/50' : 'bg-white/90 border-gray-400 shadow-xl'}`}>
            <div className="space-y-3 md:space-y-4">
              {/* Title Row with Filter Toggle (Mobile) */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className={`text-xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>My Journals</h1>
                  <p className={`text-xs md:text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'} hidden md:block`}>Private self-journals (no AI, no streaks). Edit or add freely.</p>
                </div>
                {/* Mobile Filter Toggle Button */}
                <button
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    filtersExpanded || filterTag || filterMood || filterDate || searchText
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-400'
                      : theme === 'dark' 
                        ? 'bg-white/10 text-white/80 border border-white/20' 
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  {(filterTag || filterMood || filterDate || searchText) && (
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  )}
                  {filtersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Search Bar - Always visible */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  className={`pl-10 h-10 w-full ${theme === 'dark' ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Search journals..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              
              {/* Collapsible Filters - Hidden on mobile by default, always visible on desktop */}
              <div className={`space-y-3 ${filtersExpanded ? 'block' : 'hidden'} md:block`}>
                {/* Date Filter */}
                <div className="max-w-[200px]">
                  <label className={`text-[11px] font-semibold mb-1 block ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                    Filter by date
                  </label>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className={`h-9 ${theme === 'dark' ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
                
                {/* Mood Filter Row - Horizontally scrollable on mobile */}
                <div>
                  <label className={`text-[11px] font-semibold mb-1.5 block ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                    Filter by mood
                  </label>
                  <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
                    <div className="flex gap-1.5 md:flex-wrap w-max md:w-auto">
                      {moods.map(m => (
                        <button
                          key={m}
                          onClick={() => setFilterMood(filterMood === m ? null : m)}
                          className={`w-9 h-9 md:w-8 md:h-8 rounded-full text-lg md:text-base flex items-center justify-center border transition-all flex-shrink-0 ${filterMood === m ? 'bg-green-500/20 border-green-400 scale-110' : theme === 'dark' ? 'border-white/20 bg-white/10 hover:bg-white/15' : 'border-gray-200 bg-white/60 hover:bg-gray-100'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Tags Row - Horizontally scrollable on mobile */}
                <div>
                  <label className={`text-[11px] font-semibold mb-1.5 block ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                    Filter by tag
                  </label>
                  <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
                    <div className="flex gap-1.5 md:flex-wrap w-max md:w-auto">
                      {availableTags.map(tag => (
                        <Badge
                          key={tag}
                          onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                          className={`cursor-pointer transition-colors whitespace-nowrap flex-shrink-0 ${filterTag === tag ? 'bg-green-600 text-white border-green-600' : getTagColorClasses(tag, theme === 'dark')}`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Clear Filters */}
                {(filterTag || filterMood || filterDate || searchText) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setFilterTag(null); setFilterMood(null); setFilterDate(""); setSearchText(""); }} 
                    className={`text-xs ${theme === 'dark' ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear all filters
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Editor Card - Hidden on mobile by default, shown via FAB or when editing */}
          <Card className={`backdrop-blur-xl border-2 rounded-3xl p-3 md:p-6 ${theme === 'dark' ? 'bg-white/5 border-white/10 shadow-2xl shadow-black/50' : 'bg-white/90 border-gray-400 shadow-xl'} ${(showEditor || editingId) ? 'block' : 'hidden md:block'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className={`text-lg md:text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{editingId ? "Edit Journal" : "New Journal"}</h2>
                <p className={`text-xs md:text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>No timer. Completely private.</p>
              </div>
              <div className="flex items-center gap-2">
                {editingId && (
                  <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setText(""); setTags([]); setMood("😊"); setShowEditor(false); }}>
                    Cancel edit
                  </Button>
                )}
                {/* Close button on mobile */}
                <button
                  onClick={() => { setShowEditor(false); if (!editingId) { setText(""); setTags([]); setMood("😊"); } }}
                  className={`md:hidden p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-white/60' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <Textarea
                placeholder="Write anything on your mind..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={saving}
                className="min-h-[120px]"
              />
              <div>
                <p className={`text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-white/80' : 'text-gray-800'}`}>Mood</p>
                <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
                  <div className="flex gap-1.5 md:flex-wrap w-max md:w-auto">
                    {moods.map(m => (
                      <button
                        key={m}
                        onClick={() => setMood(m)}
                        className={`px-3 py-2 rounded-lg text-lg border flex-shrink-0 ${mood === m ? 'bg-green-500/20 border-green-400' : theme === 'dark' ? 'border-white/20 bg-white/10 text-white/80' : 'border-gray-200 bg-white/60 text-gray-800'}`}
                        disabled={saving}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className={`text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-white/80' : 'text-gray-800'}`}>Tags (optional)</p>
                <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
                  <div className="flex gap-1.5 md:flex-wrap w-max md:w-auto">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0 whitespace-nowrap ${tags.includes(tag) ? 'bg-green-500/25 border-green-400' : theme === 'dark' ? 'border-white/20 bg-white/10 text-white/80' : 'border-gray-200 bg-white/60 text-gray-800'}`}
                        disabled={saving}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setText(""); setTags([]); setMood("😊"); setEditingId(null); }} disabled={saving}>Clear</Button>
                <Button 
                  onClick={() => { handleSave(); setShowEditor(false); }} 
                  disabled={saving || text.trim().length === 0} 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                >
                  {saving ? "Saving..." : editingId ? "Update Journal" : "Save Journal"}
                </Button>
              </div>
            </div>
          </Card>

          {/* List Card */}
          <Card className={`backdrop-blur-xl border-2 rounded-3xl p-3 md:p-6 ${theme === 'dark' ? 'bg-white/5 border-white/10 shadow-2xl shadow-black/50' : 'bg-white/90 border-gray-400 shadow-xl'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Your Journals ({filtered.length})
              </h3>
              {!showAllJournals && filtered.length > journalsPerPage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllJournals(true)}
                  className={`text-xs ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  See All
                </Button>
              )}
              {showAllJournals && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllJournals(false)}
                  className={`text-xs ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <X className="h-3 w-3 mr-1" />
                  Show Less
                </Button>
              )}
            </div>
            
            <AnimatePresence>
              {loading ? (
                <p className={`${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Loading...</p>
              ) : filtered.length === 0 ? (
                <p className={`${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>No journals yet.</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedJournals.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`rounded-2xl p-4 ${theme === 'dark' ? 'glass-light' : 'glass-medium'} border ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {entry.mood && <span className="text-lg md:text-xl">{entry.mood}</span>}
                              <div className="flex gap-1 flex-wrap">
                                {(entry.tags || []).map(tag => (
                                  <Badge key={tag} className={`text-[10px] md:text-xs ${getTagColorClasses(tag, theme === 'dark')}`}>{tag}</Badge>
                                ))}
                              </div>
                            </div>
                            <p className={`text-sm md:text-base leading-relaxed ${theme === 'dark' ? 'text-white/90' : 'text-gray-900'}`}>{entry.journal_text}</p>
                            <p className={`text-[10px] md:text-xs font-light ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
                              {new Date(entry.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {new Date(entry.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button variant="ghost" size="icon" onClick={() => startEdit(entry)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {!showAllJournals && totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className={`px-3 py-1 ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'} ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <ChevronLeft className="h-4 w-4" />
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
                                className={`w-8 h-8 text-xs ${currentPage === pageNum ? 'bg-green-500 text-white' : theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
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
                          className={`px-3 py-1 ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'} ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <span className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                  )}
                </>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
      
      {/* Floating Action Button (FAB) for Mobile - New Journal */}
      {!showEditor && !editingId && (
        <button
          onClick={() => { setShowEditor(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`md:hidden fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/30'
              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/40'
          }`}
          aria-label="New Journal"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}
