"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBoxArchive,
  faMagnifyingGlass,
  faSliders,
  faChevronDown,
  faCheck,
  faDownload,
  faFileCsv,
  faFileLines,
  faGlobe,
  faUserGroup,
  faLock,
  faShareNodes,
} from '@fortawesome/free-solid-svg-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { supabaseReflectionService } from "@/lib/services/supabaseReflectionService"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Reflection } from "@/lib/types/reflection"
import { useTier } from "@/hooks/useTier"
import { UpgradePrompt } from "@/components/tier/TierGate"
import { useTranslation } from "@/hooks/useTranslation"
import { DashboardSidebar } from "../components/DashboardSidebar"
import { useTheme } from "@/contexts/ThemeContext"

export default function ArchivePage() {
  return (
    <AuthGuard redirectPath="/dashboard/archive">
      <ArchivePageContent />
    </AuthGuard>
  )
}

function ArchivePageContent() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const supabase = getSupabaseClient()
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const { tier, features = {}, isLoading: tierLoading } = useTier()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("All")
  const [expandedReflections, setExpandedReflections] = useState<string[]>([])
  const [showAll, setShowAll] = useState(false)
  const [archivedReflections, setArchivedReflections] = useState<Reflection[]>([])
  const [loading, setLoading] = useState(true)
  const [sharingReflectionId, setSharingReflectionId] = useState<string | null>(null)
  const [updatingVisibility, setUpdatingVisibility] = useState<string | null>(null)

  // Load reflections from Supabase
  useEffect(() => {
    let isMounted = true

    const loadReflections = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !isMounted) return

        const reflections = await supabaseReflectionService.getAllReflections()

        if (!isMounted) return

        // For free users, limit to last 50 reflections (if archiveLimit is set)
        const limitedReflections = tier === 'free' && reflections.length > 50
          ? reflections.slice(0, 50)
          : reflections

        setArchivedReflections(limitedReflections)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load reflections. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadReflections()
    return () => { isMounted = false }
  }, [supabase, tier, toast])

  const filteredReflections = archivedReflections.filter(item => {
    // For premium users, enable search functionality
    const matchesSearch = tier === 'premium'
      ? item.reflection_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.prompt_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      : true // Show all if not premium
    
    if (selectedFilter === "All") return matchesSearch
    if (selectedFilter === "This Week") {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return matchesSearch && new Date(item.date) >= weekAgo
    }
    if (selectedFilter === "This Month") {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return matchesSearch && new Date(item.date) >= monthAgo
    }
    return matchesSearch
  })

  const updateVisibility = async (id: string, visibility: 'private' | 'friends_only' | 'public') => {
    setUpdatingVisibility(id)
    setSharingReflectionId(null)
    try {
      const res = await fetch(`/api/reflections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility }),
      })
      if (!res.ok) throw new Error('Failed to update visibility')
      setArchivedReflections(prev =>
        prev.map(r => r.id === id ? { ...r, visibility } as Reflection : r)
      )
      const label = visibility === 'public' ? 'Shared publicly' : visibility === 'friends_only' ? 'Shared with friends' : 'Made private'
      toast({ title: label, description: 'Reflection visibility updated.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to update visibility.', variant: 'destructive' })
    }
    setUpdatingVisibility(null)
  }

  const toggleReflection = (id: string) => {
    setExpandedReflections(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const exportToCSV = () => {
    if (archivedReflections.length === 0) {
      toast({
        title: "No Reflections",
        description: "You don't have any reflections to export yet.",
        variant: "destructive",
      })
      return
    }
    
    const headers = ["Date", "Prompt", "Reflection", "Mood", "Tags", "Word Count"]
    const rows = archivedReflections.map(item => [
      item.date,
      item.prompt_text,
      item.reflection_text.replace(/,/g, ';'),
      item.mood,
      item.tags.join('; '),
      item.word_count.toString()
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `reflections_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    toast({
      title: "Export Successful",
      description: "Your reflections have been exported to CSV.",
    })
  }

  const exportToText = () => {
    if (archivedReflections.length === 0) {
      toast({
        title: "No Reflections",
        description: "You don't have any reflections to export yet.",
        variant: "destructive",
      })
      return
    }
    
    const content = archivedReflections.map(item => 
      `Date: ${item.date}\nPrompt: ${item.prompt_text}\nReflection: ${item.reflection_text}\nMood: ${item.mood}\nTags: ${item.tags.join(', ')}\nWord Count: ${item.word_count}\n\n${'='.repeat(80)}\n\n`
    ).join('')
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `reflections_${new Date().toISOString().split('T')[0]}.txt`
    link.click()
    
    toast({
      title: "Export Successful",
      description: "Your reflections have been exported to text file.",
    })
  }

  const filterItems = [
    { label: "All Reflections", value: "All" },
    { label: "This Week", value: "This Week" },
    { label: "This Month", value: "This Month" },
  ]

  const dropdownItemClasses = (active: boolean) => `cursor-pointer rounded-xl flex items-center justify-between gap-2 ${
    isDark
      ? 'text-white/80 hover:bg-white/10 focus:bg-white/10 hover:text-white'
      : 'text-slate-700 hover:bg-indigo-50 focus:bg-indigo-50 hover:text-indigo-600'
  } ${active ? (isDark ? 'text-white' : 'text-indigo-600 bg-indigo-50') : ''}`

  return (
    <div 
      data-dashboard
      className={`min-h-screen ${isDark ? 'bg-[#0A0E18]' : 'bg-[#F9FBFB]'}`}
    >
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 pb-32 md:pb-10 overflow-y-auto scrollbar-thin">
          <div className="max-w-[680px] mx-auto px-6 pt-6 md:pt-10">
          <div className="space-y-6">

          {/* Page title */}
          <div className="animate-fade-up">
            <h1 className={`text-2xl md:text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Archive</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Browse your past reflections.</p>
          </div>

          {/* Toolbar Card */}
          <section
            className="animate-fade-up glass rounded-3xl border-slate-100 soft-shadow p-5"
            style={{ animationDelay: '0.05s' }}
          >
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
                <FontAwesomeIcon icon={faBoxArchive} className="text-sm" />
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-base font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Your archive</p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                  {archivedReflections.length} reflection{archivedReflections.length !== 1 ? 's' : ''} saved
                </p>
              </div>
            </div>

            <div className={`mt-4 pt-4 border-t flex items-center gap-2 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
              {/* Search - Premium Feature */}
              {tier === 'premium' ? (
                <div className="relative flex-1 min-w-0">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
                  <Input
                    placeholder={t('archive.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-9 h-10 rounded-full text-sm ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                        : 'bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50'
                    }`}
                  />
                </div>
              ) : (
                <div className="relative flex-1 min-w-0">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
                  <Input
                    placeholder="Premium"
                    disabled
                    className={`pl-9 pr-9 h-10 rounded-full text-sm cursor-not-allowed opacity-60 ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white/40 placeholder:text-white/30'
                        : 'bg-slate-100/80 border border-slate-200 text-slate-400 placeholder:text-slate-400'
                    }`}
                  />
                  <FontAwesomeIcon icon={faLock} className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-white/30' : 'text-slate-400'}`} />
                </div>
              )}
              {/* Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`shrink-0 h-10 px-4 rounded-full text-sm font-medium inline-flex items-center gap-2 ${
                    isDark
                      ? 'text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
                      : 'text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-800'
                  }`}>
                    <FontAwesomeIcon icon={faSliders} className="text-xs" />
                    <span className="hidden sm:inline">{selectedFilter}</span>
                    <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className={`w-44 rounded-2xl p-1.5 ${
                  isDark
                    ? 'bg-[#1B2436] border border-white/10'
                    : 'bg-white/95 border border-slate-100 shadow-soft-card'
                }`}>
                  {filterItems.map((item) => (
                    <DropdownMenuItem 
                      key={item.value}
                      className={dropdownItemClasses(selectedFilter === item.value)}
                      onClick={() => setSelectedFilter(item.value)}
                    >
                      {item.label}
                      {selectedFilter === item.value && (
                        <FontAwesomeIcon icon={faCheck} className="text-xs text-indigo-500" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Export - Premium Feature */}
              {tier === 'premium' ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="shrink-0 h-10 px-4 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-lg shadow-indigo-500/25">
                      <FontAwesomeIcon icon={faDownload} className="text-xs" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className={`w-48 ${
                    isDark
                      ? 'bg-[#1B2436] border border-white/10'
                      : 'bg-white/95 border border-slate-100 shadow-soft-card'
                  }`}>
                    <DropdownMenuItem 
                      className={`cursor-pointer rounded-xl ${
                        isDark
                          ? 'text-white/80 hover:bg-white/10 focus:bg-white/10 hover:text-white'
                          : 'text-slate-700 hover:bg-indigo-50 focus:bg-indigo-50 hover:text-indigo-600'
                      }`}
                      onClick={exportToCSV}
                    >
                      <FontAwesomeIcon icon={faFileCsv} className="mr-3 text-sm" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={`cursor-pointer rounded-xl ${
                        isDark
                          ? 'text-white/80 hover:bg-white/10 focus:bg-white/10 hover:text-white'
                          : 'text-slate-700 hover:bg-indigo-50 focus:bg-indigo-50 hover:text-indigo-600'
                      }`}
                      onClick={exportToText}
                    >
                      <FontAwesomeIcon icon={faFileLines} className="mr-3 text-sm" />
                      Export as Text
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="relative group">
                  <Button 
                    disabled
                    className={`shrink-0 h-10 px-4 rounded-full text-sm inline-flex items-center gap-2 cursor-not-allowed opacity-60 ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white/40'
                        : 'bg-slate-100/80 border border-slate-200 text-slate-400'
                    }`}
                  >
                    <FontAwesomeIcon icon={faDownload} className="text-xs" />
                    <span className="hidden sm:inline">Export</span>
                    <FontAwesomeIcon icon={faLock} className="text-[10px]" />
                  </Button>
                  <div className="absolute hidden group-hover:block top-full mt-2 right-0 z-50">
                    <UpgradePrompt feature="exportReflections" size="sm" />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Reflections List */}
          <section
            className="animate-fade-up glass rounded-3xl border-slate-100 soft-shadow p-5 md:p-6"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-base font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Past Reflections</h3>
                {loading ? (
                  <Skeleton className={`h-3 w-24 mt-0.5 ${isDark ? 'bg-white/10' : 'bg-slate-100'}`} />
                ) : (
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                    {filteredReflections.length} reflection{filteredReflections.length !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>
              {!loading && filteredReflections.length > 3 && (
                <Button
                  variant="ghost"
                  onClick={() => setShowAll(!showAll)}
                  className={`text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 ${
                    isDark ? 'text-[#818CF8] hover:bg-white/10' : 'text-indigo-500 hover:bg-indigo-50'
                  }`}
                >
                  {showAll ? 'Show Less' : 'See More'}
                  <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] transition-transform ${showAll ? 'rotate-180' : ''}`} />
                </Button>
              )}
            </div>
            <div className={`divide-y divide-slate-100/80 ${isDark ? 'divide-white/[0.06]' : ''}`}>
              {loading ? (
                Array(3).fill(0).map((_, index) => (
                  <div key={index} className="py-5 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <Skeleton className={`h-10 w-10 rounded-xl ${isDark ? 'bg-white/10' : 'bg-slate-100'}`} />
                      <div className="flex-1 space-y-2 pt-1">
                        <Skeleton className={`h-3 w-24 ${isDark ? 'bg-white/10' : 'bg-slate-100'}`} />
                        <Skeleton className={`h-4 w-full ${isDark ? 'bg-white/10' : 'bg-slate-100'}`} />
                        <Skeleton className={`h-4 w-3/4 ${isDark ? 'bg-white/10' : 'bg-slate-100'}`} />
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredReflections.length === 0 ? (
                <div className="text-center py-10">
                  <div className={`w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto ${
                    isDark ? 'bg-white/[0.04] border-white/[0.06]' : ''
                  }`}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} className={isDark ? 'text-white/30' : 'text-slate-300'} />
                  </div>
                  <p className={`text-sm font-medium mt-3 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>No reflections found</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
                    {searchQuery ? "Try adjusting your search" : "Start writing your first reflection!"}
                  </p>
                </div>
              ) : (
                (showAll ? filteredReflections : filteredReflections.slice(0, 3)).map((item, index) => {
                  const isExpanded = expandedReflections.includes(item.id)
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="group py-5 first:pt-1 last:pb-1"
                    >
                        <div className="w-full text-left flex items-start gap-3">
                          <span className={`w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg shrink-0 group-hover:bg-white transition-colors ${
                            isDark ? 'bg-white/[0.04] border-white/[0.06] group-hover:bg-white/[0.08]' : ''
                          }`}>{item.mood}</span>
                          <div className="flex-1 min-w-0">
                            <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                              <span>{item.date}</span>
                            </div>
                            <p className={`font-serif italic text-sm md:text-[15px] leading-relaxed mt-1 line-clamp-2 ${
                              isDark
                                ? 'text-white/85'
                                : 'text-slate-800 group-hover:text-slate-900'
                            } transition-colors`}>{item.prompt_text}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleReflection(item.id)}
                            className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isExpanded
                                ? isDark
                                  ? 'text-[#818CF8] bg-white/10'
                                  : 'text-indigo-500 bg-indigo-50'
                                : isDark
                                  ? 'text-white/60 bg-white/[0.04] hover:bg-white/10'
                                  : 'text-slate-400 bg-slate-50 group-hover:bg-indigo-50 group-hover:text-indigo-500'
                            } transition-all`}
                          >
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                              <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
                            </motion.div>
                          </Button>
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className={`rounded-2xl border border-l-2 border-l-indigo-200 p-4 space-y-3 mt-3 ml-[52px] ${
                                isDark
                                  ? 'bg-white/[0.04] border-white/[0.06] border-l-indigo-400/60'
                                  : 'bg-slate-50/80 border-slate-100'
                              }`}>
                                <p className={`text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                                  {item.reflection_text}
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                  {item.tags.map((tag, idx) => (
                                    <Badge
                                      key={idx}
                                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                                        isDark
                                          ? 'bg-white/[0.06] text-white/70 border border-white/[0.08]'
                                          : 'bg-white text-slate-500 border border-slate-100'
                                      }`}
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                                {/* Share row */}
                                <div className={`flex items-center gap-2 pt-1.5 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                                  {item.visibility === 'public' ? (
                                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                      <FontAwesomeIcon icon={faGlobe} className="text-[10px]" /> Public
                                    </span>
                                  ) : item.visibility === 'friends_only' ? (
                                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                      <FontAwesomeIcon icon={faUserGroup} className="text-[10px]" /> Friends
                                    </span>
                                  ) : (
                                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                                      <FontAwesomeIcon icon={faLock} className="text-[10px]" /> Private
                                    </span>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={updatingVisibility === item.id}
                                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full h-7 ${
                                          isDark
                                            ? 'text-[#818CF8] hover:text-white hover:bg-white/10'
                                            : 'text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50'
                                        }`}
                                      >
                                        <FontAwesomeIcon icon={faShareNodes} className="text-[10px]" />
                                        {updatingVisibility === item.id ? '...' : 'Share'}
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className={`w-56 rounded-2xl ${isDark ? 'bg-[#1B2436] border-white/10' : 'bg-white/95 border-slate-100 shadow-soft-card'}`}>
                                      <DropdownMenuItem onClick={() => updateVisibility(item.id, 'public')} className={`cursor-pointer rounded-xl ${isDark ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-indigo-50'}`}>
                                        <FontAwesomeIcon icon={faGlobe} className={isDark ? 'text-[#818CF8] mr-3' : 'text-indigo-500 mr-3'} />
                                        <div className="text-left">
                                          <p className="font-medium text-sm">Share publicly</p>
                                          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Everyone can see</p>
                                        </div>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => updateVisibility(item.id, 'friends_only')} className={`cursor-pointer rounded-xl ${isDark ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-indigo-50'}`}>
                                        <FontAwesomeIcon icon={faUserGroup} className="text-emerald-500 mr-3" />
                                        <div className="text-left">
                                          <p className="font-medium text-sm">Share with friends</p>
                                          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Only your friends</p>
                                        </div>
                                      </DropdownMenuItem>
                                      <div className={`h-px mx-3 my-1 ${isDark ? 'bg-white/10' : 'bg-slate-100'}`} />
                                      <DropdownMenuItem onClick={() => updateVisibility(item.id, 'private')} className={`cursor-pointer rounded-xl ${isDark ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-indigo-50'}`}>
                                        <FontAwesomeIcon icon={faLock} className="mr-3" />
                                        <div className="text-left">
                                          <p className="font-medium text-sm">Make private</p>
                                          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Only you</p>
                                        </div>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <span className="flex-1"></span>
                                  <span className={`text-[11px] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{item.word_count} words</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                    </motion.div>
                  )
                })
              )}
            </div>
          </section>

          {/* Trust footer */}
          <p className={`text-center text-xs animate-fade-up ${isDark ? 'text-white/40' : 'text-slate-400'}`} style={{ animationDelay: '0.15s' }}>
            <FontAwesomeIcon icon={faLock} className={`text-[10px] mr-1 ${isDark ? 'text-white/30' : 'text-slate-300'}`} />
            Your reflections stay private unless you choose to share them.
          </p>

          </div>
          </div>
        </main>
      </div>
    </div>
  )
}
