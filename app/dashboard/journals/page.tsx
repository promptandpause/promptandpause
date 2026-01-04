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
import { motion, AnimatePresence } from "framer-motion"
import { Filter, Search, Trash2, Pencil, Flame } from "lucide-react"
import { DashboardSidebar } from "../components/DashboardSidebar"
import { BubbleBackground } from "@/components/ui/bubble-background"

const moods = ["😔", "😐", "😊", "😄", "🤔", "😌", "🙏", "💪"]
const availableTags = ["Gratitude", "Relationships", "Career", "Self-care", "Personal Growth", "Health", "Achievement", "Nature", "Creativity", "Family"]

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

  const [editingId, setEditingId] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [mood, setMood] = useState<string>("😊")
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/signin")
          return
        }
        const { data, error } = await supabase
          .from("self_journals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error
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
    return journals.filter((j) => {
      const matchesTag = filterTag ? (j.tags || []).includes(filterTag) : true
      const matchesMood = filterMood ? j.mood === filterMood : true
      const matchesDate = filterDate
        ? j.created_at.slice(0, 10) === filterDate
        : true
      const matchesSearch = searchText
        ? j.journal_text.toLowerCase().includes(searchText.toLowerCase())
        : true
      return matchesTag && matchesMood && matchesDate && matchesSearch
    })
  }, [journals, filterTag, filterMood, filterDate, searchText])

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
        const { error } = await supabase
          .from("self_journals")
          .update({
            journal_text: text.trim(),
            mood,
            tags,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId)
          .eq("user_id", user.id)
        if (error) throw error
        setJournals((prev) => prev.map(j => j.id === editingId ? { ...j, journal_text: text.trim(), mood, tags, updated_at: new Date().toISOString() } : j))
        toast({ title: "Journal updated", description: "Your entry has been updated." })
      } else {
        const { data, error } = await supabase
          .from("self_journals")
          .insert({
            user_id: user.id,
            journal_text: text.trim(),
            mood,
            tags,
          })
          .select()
          .single()
        if (error) throw error
        if (data) setJournals((prev) => [data as JournalEntry, ...prev])
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
      const { error } = await supabase
        .from("self_journals")
        .delete()
        .eq("id", id)
      if (error) throw error
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
      className="min-h-screen relative" 
      style={theme === 'light' 
        ? { background: 'linear-gradient(135deg, #f4f0eb 0%, #a1a79e 45%, #384c37 100%)' } 
        : { background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)' }}
    >
      <BubbleBackground interactive className="fixed inset-0 -z-10" />
      <div className={`fixed inset-0 -z-10 ${theme === 'light' ? 'bg-white/35' : 'bg-black/25'}`} />

      <div className="relative z-10 px-3 md:px-6 py-6 md:py-8 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        <DashboardSidebar />

        <div className="col-span-1 md:col-span-9 space-y-4 md:space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>My Journals</h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Private self-journals (no AI, no streaks). Edit or add freely.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Search text..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className={`text-[11px] font-semibold ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Filter by date</label>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <div className="flex gap-1 flex-wrap">
                  {moods.map(m => (
                    <button
                      key={m}
                      onClick={() => setFilterMood(filterMood === m ? null : m)}
                      className={`px-2 py-1 rounded-lg text-sm border ${filterMood === m ? 'bg-green-500/20 border-green-400' : 'border-gray-200 bg-white/60'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                    className={`cursor-pointer ${filterTag === tag ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {tag}
                  </Badge>
                ))}
                {filterTag || filterMood || filterDate || searchText ? (
                  <Button variant="ghost" size="sm" onClick={() => { setFilterTag(null); setFilterMood(null); setFilterDate(""); setSearchText(""); }}>
                    Clear filters
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className={`rounded-3xl p-4 md:p-6 ${theme === 'dark' ? 'glass-light shadow-soft-lg' : 'glass-medium shadow-soft-md'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className={`text-lg md:text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{editingId ? "Edit Journal" : "New Journal"}</h2>
                <p className={`text-xs md:text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>No timer. Completely private.</p>
              </div>
              {editingId && (
                <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setText(""); setTags([]); setMood("😊") }}>
                  Cancel edit
                </Button>
              )}
            </div>
            <div className="space-y-3">
              <Textarea
                placeholder="Write anything on your mind..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={saving}
              />
              <div>
                <p className={`text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-white/80' : 'text-gray-800'}`}>Mood</p>
                <div className="flex gap-1.5 flex-wrap">
                  {moods.map(m => (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      className={`px-3 py-2 rounded-lg text-lg border ${mood === m ? 'bg-green-500/20 border-green-400' : 'border-gray-200 bg-white/60'}`}
                      disabled={saving}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className={`text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-white/80' : 'text-gray-800'}`}>Tags (optional)</p>
                <div className="flex gap-1.5 flex-wrap">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${tags.includes(tag) ? 'bg-green-500/25 border-green-400' : 'border-gray-200 bg-white/60'}`}
                      disabled={saving}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setText(""); setTags([]); setMood("😊"); setEditingId(null); }} disabled={saving}>Clear</Button>
                <Button onClick={handleSave} disabled={saving || text.trim().length === 0} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  {saving ? "Saving..." : editingId ? "Update Journal" : "Save Journal"}
                </Button>
              </div>
            </div>
          </div>

          {/* List */}
          <div className={`rounded-3xl p-4 md:p-5 ${theme === 'dark' ? 'glass-light' : 'glass-medium'} space-y-3`}>
            <AnimatePresence>
              {loading ? (
                <p className={`${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Loading...</p>
              ) : filtered.length === 0 ? (
                <p className={`${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>No journals yet.</p>
              ) : (
                filtered.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`rounded-2xl p-4 ${theme === 'dark' ? 'glass-light' : 'glass-medium'} border ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          {entry.mood && <span className="text-xl">{entry.mood}</span>}
                          <div className="flex gap-1 flex-wrap">
                            {(entry.tags || []).map(tag => (
                              <Badge key={tag} className="bg-green-500/20 text-green-800 border border-green-400/40">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                        <p className={`${theme === 'dark' ? 'text-white/90' : 'text-gray-900'}`}>{entry.journal_text}</p>
                        <p className="text-xs text-gray-500">{new Date(entry.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(entry)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Heatmap */}
          <div className={`rounded-3xl p-4 md:p-5 ${theme === 'dark' ? 'glass-light shadow-soft-lg' : 'glass-medium shadow-soft-md'} space-y-3`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Flame className={`h-5 w-5 ${theme === 'dark' ? 'text-amber-300' : 'text-amber-600'}`} />
                <div>
                  <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Last 12 weeks</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Journal cadence heatmap</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {heatmapLegend.map(item => (
                  <div key={item.label} className="flex items-center gap-1 text-[11px] text-gray-600">
                    <div className={`h-4 w-4 rounded-sm ${item.className}`} />
                    <span className={`${theme === 'dark' ? 'text-white/70' : 'text-gray-700'}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {heatmapDays.map((d) => (
                <div
                  key={d.date}
                  title={`${d.date} — ${d.count} journal${d.count === 1 ? '' : 's'}`}
                  className={`h-6 sm:h-7 rounded-md transition-all ${intensityClass(d.count)}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
