"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { HelpCircle, LogOut, Crown, Archive, Settings, LayoutDashboard, Search, Calendar, Filter, Download, ChevronDown, ChevronUp, FileText, FileSpreadsheet, LifeBuoy } from "lucide-react"
import Link from "next/link"
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
import { TierGate, UpgradePrompt } from "@/components/tier/TierGate"
import { useTranslation } from "@/hooks/useTranslation"
import { DashboardSidebar } from "../components/DashboardSidebar"
import { useTheme } from "@/contexts/ThemeContext"
import { IconOrb } from "@/components/ui/accent-card"


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
  const { tier, features = {}, isLoading: tierLoading } = useTier()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("All")
  const [expandedReflections, setExpandedReflections] = useState<string[]>([])
  const [showAll, setShowAll] = useState(false)
  const [archivedReflections, setArchivedReflections] = useState<Reflection[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div 
      data-dashboard
      className={`min-h-screen ${theme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}
    >
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 pb-32 md:pb-10 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-10 pt-16 md:pt-10">
          <div className="space-y-5 md:space-y-6">
          {/* Header Card */}
          <Card className={`rounded-2xl p-4 md:p-6 border shadow-none ${theme === 'dark' ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white/70 border-[#EFF3F4]'}`}>
            <div className="flex flex-col md:flex-row md:items-center md:items-center md:justify-between gap-3 md:gap-4">
              <div className="flex items-center gap-3">
                <IconOrb accent="blue" size="md">
                  <Archive className="w-5 h-5 text-white" strokeWidth={1.75} />
                </IconOrb>
                <div>
                  <h2 className={`text-xl md:text-3xl font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#0F1419]'}`}>Archive</h2>
                  <p className={`text-xs md:text-sm ${theme === 'dark' ? 'text-white/40' : 'text-[#8B98A5]'}`}>Browse your past reflections.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-2 md:pb-0">
                {/* Search - Premium Feature */}
                {tier === 'premium' ? (
                  <div className="relative flex-1 md:flex-initial">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`} />
                    <Input
                      placeholder={t('archive.search')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`pl-10 h-9 md:h-10 rounded-xl text-sm min-w-[120px] ${
                        theme === 'dark'
                          ? 'bg-white/8 border border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                          : 'bg-white border border-[#EFF3F4] text-[#0F1419] placeholder:text-[#8B98A5] focus:border-[#1D9BF0]'
                      }`}
                    />
                  </div>
                ) : (
                  <div className="relative flex-1 md:flex-initial">
                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`} />
                      <Input
                        placeholder="🔒 Premium"
                        disabled
                        className={`pl-10 h-9 md:h-10 rounded-xl text-sm cursor-not-allowed opacity-50 min-w-[120px] ${
                          theme === 'dark'
                            ? 'bg-white/5 border border-white/8 text-white/40 placeholder:text-white/30'
                            : 'bg-[#EFF3F4] border border-[#EFF3F4] text-[#8B98A5] placeholder:text-[#C4C0B8]'
                        }`}
                      />
                    </div>
                  </div>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={`h-9 md:h-10 text-sm whitespace-nowrap ${
                      theme === 'dark'
                        ? 'text-white border border-white/10 hover:bg-white/8'
                        : 'text-[#536471] border border-[#EFF3F4] hover:bg-[#EFF3F4]'
                    }`}>
                      <Filter className={`mr-1 md:mr-2 h-4 w-4 ${
                        theme === 'dark' ? 'text-white' : 'text-[#536471]'
                      }`} />
                      <span className="hidden md:inline">{selectedFilter}</span>
                      <span className="md:hidden">All</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className={`${
                    theme === 'dark'
                      ? 'bg-[#1A1F2E] border border-white/10'
                      : 'bg-[#F7F9FA] border border-[#EFF3F4]'
                  }`}>
                    <DropdownMenuItem 
                      className={`cursor-pointer ${
                        theme === 'dark'
                          ? 'text-white hover:bg-white/8 focus:bg-white/8'
                          : 'text-[#0F1419] hover:bg-[#EFF3F4] focus:bg-[#EFF3F4]'
                      }`}
                      onClick={() => setSelectedFilter("All")}
                    >
                      All Reflections
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={`cursor-pointer ${
                        theme === 'dark'
                          ? 'text-white hover:bg-white/8 focus:bg-white/8'
                          : 'text-[#0F1419] hover:bg-[#EFF3F4] focus:bg-[#EFF3F4]'
                      }`}
                      onClick={() => setSelectedFilter("This Week")}
                    >
                      This Week
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={`cursor-pointer ${
                        theme === 'dark'
                          ? 'text-white hover:bg-white/8 focus:bg-white/8'
                          : 'text-[#0F1419] hover:bg-[#EFF3F4] focus:bg-[#EFF3F4]'
                      }`}
                      onClick={() => setSelectedFilter("This Month")}
                    >
                      This Month
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Export - Premium Feature */}
                {tier === 'premium' ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className={`transition-colors h-9 md:h-10 text-sm ${
                        theme === 'dark'
                          ? 'bg-white/8 hover:bg-white/12 border border-white/10 text-white'
                          : 'bg-white hover:bg-[#EFF3F4] border border-[#EFF3F4] text-[#536471]'
                      }`}>
                        <Download className="mr-1 md:mr-2 h-4 w-4" />
                        <span className="hidden md:inline">Export</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className={`${
                      theme === 'dark'
                        ? 'bg-[#1A1F2E] border border-white/10'
                        : 'bg-[#F7F9FA] border border-[#EFF3F4]'
                    }`}>
                      <DropdownMenuItem 
                        className={`cursor-pointer ${
                          theme === 'dark'
                            ? 'text-white hover:bg-white/8 focus:bg-white/8'
                            : 'text-[#0F1419] hover:bg-[#EFF3F4] focus:bg-[#EFF3F4]'
                        }`}
                        onClick={exportToCSV}
                      >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={`cursor-pointer ${
                          theme === 'dark'
                            ? 'text-white hover:bg-white/8 focus:bg-white/8'
                            : 'text-[#0F1419] hover:bg-[#EFF3F4] focus:bg-[#EFF3F4]'
                        }`}
                        onClick={exportToText}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Export as Text
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="relative group">
                    <Button 
                      disabled
                      className={`cursor-not-allowed opacity-50 h-9 md:h-10 text-sm ${
                        theme === 'dark'
                          ? 'bg-white/5 border border-white/8 text-white/30'
                          : 'bg-[#EFF3F4] border border-[#EFF3F4] text-[#8B98A5]'
                      }`}
                    >
                      <Download className="mr-1 md:mr-2 h-4 w-4" />
                      <span className="hidden md:inline">Export 🔒</span>
                      <span className="md:hidden">🔒</span>
                    </Button>
                    <div className="absolute hidden group-hover:block top-full mt-2 right-0 z-50">
                      <UpgradePrompt feature="exportReflections" size="sm" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Reflections List */}
          <Card className={`rounded-2xl p-4 md:p-6 border shadow-none ${
            theme === 'dark' ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white/70 border-[#EFF3F4]'
          }`}>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h3 className={`text-lg md:text-xl font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-[#0F1419]'
                }`}>Past Reflections</h3>
                {loading ? (
                  <Skeleton className={`h-4 w-32 mt-1 ${theme === 'dark' ? 'bg-white/8' : 'bg-[#EFF3F4]'}`} />
                ) : (
                  <p className={`text-xs md:text-sm mt-1 ${theme === 'dark' ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                    {filteredReflections.length} reflection{filteredReflections.length !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>
              {!loading && filteredReflections.length > 3 && (
                <Button
                  variant="ghost"
                  onClick={() => setShowAll(!showAll)}
                  className={`transition-colors ${
                    theme === 'dark' ? 'text-white hover:bg-white/8' : 'text-[#536471] hover:bg-[#EFF3F4]'
                  }`}
                >
                  {showAll ? (
                    <>Show Less <ChevronUp className="ml-2 h-4 w-4" /></>
                  ) : (
                    <>See More ({filteredReflections.length - 3} more) <ChevronDown className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {loading ? (
                Array(3).fill(0).map((_, index) => (
                  <Card key={index} className={`rounded-2xl p-5 border shadow-none ${
                    theme === 'dark' ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white border-[#EFF3F4]'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Skeleton className={`h-10 w-10 rounded-full ${theme === 'dark' ? 'bg-white/8' : 'bg-[#EFF3F4]'}`} />
                      <div className="flex-1 space-y-2">
                        <Skeleton className={`h-4 w-24 ${theme === 'dark' ? 'bg-white/8' : 'bg-[#EFF3F4]'}`} />
                        <Skeleton className={`h-5 w-full ${theme === 'dark' ? 'bg-white/8' : 'bg-[#EFF3F4]'}`} />
                        <Skeleton className={`h-4 w-3/4 ${theme === 'dark' ? 'bg-white/8' : 'bg-[#EFF3F4]'}`} />
                      </div>
                    </div>
                  </Card>
                ))
              ) : filteredReflections.length === 0 ? (
                <div className="text-center py-12">
                  <p className={`text-lg ${theme === 'dark' ? 'text-white/50' : 'text-[#8B98A5]'}`}>No reflections found</p>
                  <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-white/30' : 'text-[#8B98A5]'}`}>
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
                    >
                      <Card className={`rounded-2xl p-4 md:p-5 transition-all duration-200 border shadow-none ${
                        theme === 'dark' ? 'bg-white/[0.04] border-white/[0.06] hover:bg-white/8' : 'bg-white border-[#EFF3F4] hover:bg-[#F7F9FA]'
                      }`}>
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                              <span className="text-2xl md:text-3xl flex-shrink-0">{item.mood}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs md:text-sm ${theme === 'dark' ? 'text-white/40' : 'text-[#8B98A5]'}`}>{item.date}</p>
                                <p className={`font-medium italic text-sm md:text-base mt-1 line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-[#0F1419]'}`}>{item.prompt_text}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleReflection(item.id)}
                              className={`transition-colors ${theme === 'dark' ? 'text-white hover:bg-white/8' : 'text-[#536471] hover:bg-[#EFF3F4]'}`}
                            >
                              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                                <ChevronDown className={`h-5 w-5 ${theme === 'dark' ? 'text-white' : 'text-[#536471]'}`} />
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
                                <div className="space-y-3 pt-2">
                                  <p className={`text-sm leading-relaxed pl-12 ${theme === 'dark' ? 'text-white/70' : 'text-[#536471]'}`}>
                                    {item.reflection_text}
                                  </p>
                                  <div className="flex gap-2 pl-12 flex-wrap">
                                    {item.tags.map((tag, idx) => (
                                      <Badge
                                        key={idx}
                                        className={`cursor-pointer ${
                                          theme === 'dark'
                                            ? 'bg-white/8 text-white/70 border border-white/10 hover:bg-white/12'
                                            : 'bg-[#EFF3F4] text-[#536471] border border-[#EFF3F4] hover:bg-[#EFF3F4]'
                                        }`}
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })
              )}
            </div>
          </Card>
          </div>
          </div>
        </main>
      </div>
    </div>
  )
}

