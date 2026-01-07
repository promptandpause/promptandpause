"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight, HelpCircle, LogOut, Crown, Archive, Settings, LayoutDashboard, Search, Calendar, Filter, Download, ChevronDown, ChevronUp, FileText, FileSpreadsheet, LifeBuoy } from "lucide-react"
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
import { BubbleBackground } from "@/components/ui/bubble-background"
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
      className="min-h-screen relative" 
      style={theme === 'light' 
        ? { background: 'linear-gradient(135deg, #f4f0eb 0%, #a1a79e 45%, #384c37 100%)' } 
        : { background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)' }}
    >
      {/* Animated Bubble Background */}
      <BubbleBackground 
        interactive
        className="fixed inset-0 -z-10"
      />
      {/* Theme overlay */}
      <div className={`fixed inset-0 -z-10 ${theme === 'light' ? 'bg-white/35' : 'bg-black/25'}`} />

      <div className="relative z-10 p-3 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 pb-24 md:pb-6">
        {/* Universal Sidebar - Desktop & Mobile */}
        <DashboardSidebar />

        {/* Main Content Area */}
        <div className="col-span-1 md:col-span-10 space-y-4 md:space-y-6">
          {/* Header Card */}
          <Card className={`backdrop-blur-xl border-2 rounded-3xl p-3 md:p-6 ${theme === 'dark' ? 'bg-white/5 border-white/10 shadow-2xl shadow-black/50' : 'bg-white/90 border-gray-400 shadow-xl'}`}>
            <div className="flex flex-col md:flex-row md:items-center md:items-center md:justify-between gap-3 md:gap-4">
              <div>
                <h2 className={`text-xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Archive</h2>
                <p className={`text-xs md:text-base ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Browse your past reflections.</p>
              </div>
              <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-2 md:pb-0">
                {/* Search - Premium Feature */}
                {tier === 'premium' ? (
                  <div className="relative flex-1 md:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={t('archive.search')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`pl-10 h-9 md:h-10 rounded-xl text-sm min-w-[120px] ${
                        theme === 'dark'
                          ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:bg-white/15'
                          : 'bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:bg-white'
                      }`}
                    />
                  </div>
                ) : (
                  <div className="relative flex-1 md:flex-initial">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="🔒 Premium"
                        disabled
                        className={`pl-10 h-9 md:h-10 rounded-xl text-sm cursor-not-allowed opacity-50 min-w-[120px] ${
                          theme === 'dark'
                            ? 'bg-white/5 border border-white/10 text-white/50 placeholder:text-white/40'
                            : 'bg-gray-50 border-2 border-gray-300 text-gray-500 placeholder:text-gray-400'
                        }`}
                      />
                    </div>
                  </div>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={`h-9 md:h-10 text-sm whitespace-nowrap ${
                      theme === 'dark'
                        ? 'text-white border border-white/20 hover:bg-white/10'
                        : 'text-gray-900 border-2 border-gray-300 hover:bg-gray-100'
                    }`}>
                      <Filter className={`mr-1 md:mr-2 h-4 w-4 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`} />
                      <span className="hidden md:inline">{selectedFilter}</span>
                      <span className="md:hidden">All</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className={`backdrop-blur-xl ${
                    theme === 'dark'
                      ? 'bg-black/80 border border-white/20'
                      : 'bg-white border-2 border-gray-300'
                  }`}>
                    <DropdownMenuItem 
                      className={`cursor-pointer ${
                        theme === 'dark'
                          ? 'text-white hover:bg-white/10 focus:bg-white/10'
                          : 'text-gray-900 hover:bg-gray-100 focus:bg-gray-100'
                      }`}
                      onClick={() => setSelectedFilter("All")}
                    >
                      All Reflections
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={`cursor-pointer ${
                        theme === 'dark'
                          ? 'text-white hover:bg-white/10 focus:bg-white/10'
                          : 'text-gray-900 hover:bg-gray-100 focus:bg-gray-100'
                      }`}
                      onClick={() => setSelectedFilter("This Week")}
                    >
                      This Week
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={`cursor-pointer ${
                        theme === 'dark'
                          ? 'text-white hover:bg-white/10 focus:bg-white/10'
                          : 'text-gray-900 hover:bg-gray-100 focus:bg-gray-100'
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
                          ? 'bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white'
                          : 'bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 text-gray-900'
                      }`}>
                        <Download className="mr-1 md:mr-2 h-4 w-4" />
                        <span className="hidden md:inline">Export</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className={`backdrop-blur-xl ${
                      theme === 'dark'
                        ? 'bg-black/80 border border-white/20'
                        : 'bg-white border-2 border-gray-300'
                    }`}>
                      <DropdownMenuItem 
                        className={`cursor-pointer ${
                          theme === 'dark'
                            ? 'text-white hover:bg-white/10 focus:bg-white/10'
                            : 'text-gray-900 hover:bg-gray-100 focus:bg-gray-100'
                        }`}
                        onClick={exportToCSV}
                      >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={`cursor-pointer ${
                          theme === 'dark'
                            ? 'text-white hover:bg-white/10 focus:bg-white/10'
                            : 'text-gray-900 hover:bg-gray-100 focus:bg-gray-100'
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
                          ? 'bg-white/5 border border-white/10 text-white/40'
                          : 'bg-gray-50 border-2 border-gray-300 text-gray-400'
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
          <Card className={`backdrop-blur-xl rounded-3xl p-4 md:p-6 shadow-xl ${
            theme === 'dark'
              ? 'bg-white/5 border border-white/10'
              : 'bg-white/90 border-2 border-gray-400'
          }`}>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h3 className={`text-lg md:text-xl font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Past Reflections</h3>
                {loading ? (
                  <Skeleton className={`h-4 w-32 mt-1 ${
                    theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'
                  }`} />
                ) : (
                  <p className={`text-xs md:text-sm mt-1 ${
                    theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                  }`}>{filteredReflections.length} reflection{filteredReflections.length !== 1 ? 's' : ''} found</p>
                )}
              </div>
              {!loading && filteredReflections.length > 3 && (
                <Button
                  variant="ghost"
                  onClick={() => setShowAll(!showAll)}
                  className={`transition-all duration-300 ${
                    theme === 'dark'
                      ? 'text-white hover:text-white hover:bg-white/10'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {showAll ? (
                    <>
                      Show Less
                      <ChevronUp className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      See More ({filteredReflections.length - 3} more)
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {loading ? (
                // Loading skeletons for reflections
                Array(3).fill(0).map((_, index) => (
                  <Card key={index} className={`backdrop-blur-xl rounded-2xl p-5 shadow-md ${
                    theme === 'dark'
                      ? 'bg-white/5 border border-white/10'
                      : 'bg-white border-2 border-gray-300'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Skeleton className={`h-10 w-10 rounded-full ${
                        theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'
                      }`} />
                      <div className="flex-1 space-y-2">
                        <Skeleton className={`h-4 w-24 ${
                          theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'
                        }`} />
                        <Skeleton className={`h-5 w-full ${
                          theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'
                        }`} />
                        <Skeleton className={`h-4 w-3/4 ${
                          theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'
                        }`} />
                      </div>
                    </div>
                  </Card>
                ))
              ) : filteredReflections.length === 0 ? (
                // Empty state
                <div className="text-center py-12">
                  <p className={`text-lg ${
                    theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                  }`}>No reflections found</p>
                  <p className={`text-sm mt-2 ${
                    theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                  }`}>
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
                    <Card
                      className={`backdrop-blur-xl rounded-2xl p-4 md:p-5 transition-all duration-300 hover:scale-[1.01] shadow-md ${
                        theme === 'dark'
                          ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                          : 'bg-white border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                            <span className="text-2xl md:text-3xl flex-shrink-0">{item.mood}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs md:text-sm ${
                                theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                              }`}>{item.date}</p>
                              <p className={`font-medium italic text-sm md:text-base mt-1 line-clamp-2 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{item.prompt_text}</p>
                            </div>
                          </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleReflection(item.id)}
                        className={`transition-all duration-300 ${
                          theme === 'dark'
                            ? 'text-white hover:text-white hover:bg-white/10'
                            : 'text-gray-900 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className={`h-5 w-5 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`} />
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
                                <p className={`text-sm leading-relaxed pl-12 ${
                                  theme === 'dark' ? 'text-white/80' : 'text-gray-700'
                                }`}>
                                  {item.reflection_text}
                                </p>
                                <div className="flex gap-2 pl-12 flex-wrap">
                                  {item.tags.map((tag, idx) => (
                                    <Badge
                                      key={idx}
                                      className={`cursor-pointer ${
                                        theme === 'dark'
                                          ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                                          : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
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
    </div>
  )
}

