"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge as UIBadge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { supabaseReflectionService, supabaseMoodService, supabaseAnalyticsService } from "@/lib/services/supabaseReflectionService";
import { MoodType } from "@/lib/types/reflection";
import { useToast } from "@/hooks/use-toast";
import { useTier } from "@/hooks/useTier";
import { useGeneratePrompt } from "@/hooks/useGeneratePrompt";
import { useReflectionStats } from "@/hooks/useReflectionStats";
import { getSupabaseClient } from "@/lib/supabase/client";
import VoicePromptPlayer from "./voice-prompt-player";
import { useTheme } from "@/contexts/ThemeContext";
import { PromptLimitBanner } from "@/components/tier/TierGate";

const moods: MoodType[] = ["😔", "😐", "😊", "😄", "🤔", "😌", "🙏", "💪"]
const availableTags = ["Gratitude", "Relationships", "Career", "Self-care", "Personal Growth", "Health", "Achievement", "Nature", "Creativity", "Family"]

export default function TodaysPrompt() {
  const { toast } = useToast()
  const supabase = getSupabaseClient()
  const { theme } = useTheme()
  const { tier } = useTier()
  const { generatePrompt: generatePromptAsync, isLoading: isGenerating } = useGeneratePrompt()
  const { stats: reflectionStats } = useReflectionStats()
  const [reflection, setReflection] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<"helped" | "irrelevant" | null>(null);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [savedReflectionId, setSavedReflectionId] = useState<string | null>(null)
  const [todaysPrompt, setTodaysPrompt] = useState("")
  const [focusAreaUsed, setFocusAreaUsed] = useState<string | null>(null)
  const [promptProvider, setPromptProvider] = useState<string | null>(null)
  const [promptModel, setPromptModel] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  // Self-Journal state
  const [showSelfJournal, setShowSelfJournal] = useState(false)
  const [journalText, setJournalText] = useState("")
  const [journalMood, setJournalMood] = useState<MoodType>("😊")
  const [journalTags, setJournalTags] = useState<string[]>([])
  const [journalSaving, setJournalSaving] = useState(false)
  
  // Update word count when reflection changes
  useEffect(() => {
    const words = reflection.trim().split(/\s+/).filter(Boolean).length
    setWordCount(words)
  }, [reflection])
  
  // Word count feedback (no enforced limit)
  function getEncouragingMessage(words: number): string | null {
    if (words === 0) return null
    if (words < 15) return "Good start."
    if (words < 40) return "Keep going, if you want to."
    if (words < 80) return "Keep going."
    if (words < 140) return "This is taking shape."
    if (words < 220) return "That's a solid reflection."
    return "Plenty here. Stop when you're ready."
  }
  
  // Load today's reflection or prompt from backend
  useEffect(() => {
    let isMounted = true

    async function init() {
      try {
        // Get user name for voice personalization
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const response = await fetch('/api/user/profile')
          if (response.ok) {
            const { data: profile } = await response.json()
            setUserName(profile?.full_name || user.email?.split('@')[0] || null)
          }
        }

        const todayReflection = await supabaseReflectionService.getTodaysReflection()
        if (!isMounted) return

        if (todayReflection) {
          setSubmitted(true)
          setReflection(todayReflection.reflection_text)
          setSelectedMood(todayReflection.mood)
          setSelectedTags(todayReflection.tags)
          setSavedReflectionId(todayReflection.id)
          setFeedback(todayReflection.feedback || null)
          setTodaysPrompt(todayReflection.prompt_text)
          return
        }

        // Try fetch today's prompt from API
        const res = await fetch('/api/prompts/today', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setTodaysPrompt(data.data.prompt_text)
          // Store focus area and provider info
          setFocusAreaUsed(data.data.focus_area_used || null)
          setPromptProvider(data.data.ai_provider || null)
          setPromptModel(data.data.ai_model || null)
        } else if (res.status === 404) {
          setTodaysPrompt("")
        }
      } catch (error) {
        setTodaysPrompt("")
      }
    }

    init()
    return () => { isMounted = false }
  }, [supabase])
  
  // Save logic
  async function handleSave() {
    if (reflection.trim().length === 0 || !todaysPrompt) return;

    try {
      const saved = await supabaseReflectionService.saveReflection({
        prompt_text: todaysPrompt,
        reflection_text: reflection.trim(),
        mood: selectedMood || "😊",
        tags: selectedTags,
      })

      if (!saved) throw new Error('Failed to save reflection')

      setSavedReflectionId(saved.id)
      setSubmitted(true)
      toast({
        title: "Saved",
        description: "Your reflection has been saved.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save reflection. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  // Handle feedback update
  async function handleFeedback(feedbackType: "helped" | "irrelevant") {
    setFeedback(feedbackType)
    if (savedReflectionId) {
      try {
        await supabaseReflectionService.updateReflectionFeedback(savedReflectionId, feedbackType)
        toast({
          title: "Feedback Saved",
          description: "Thank you for your feedback!",
        })
      } catch (e) {
      }
    }
  }
  
  // Toggle tag selection
  function toggleTag(tag: string) {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    )
  }

  function toggleJournalTag(tag: string) {
    setJournalTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    )
  }

  async function handleSaveJournal() {
    if (journalText.trim().length === 0) {
      toast({ title: "Add something first", description: "Your journal is empty.", variant: "destructive" })
      return
    }
    try {
      setJournalSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not signed in")

      const { error } = await supabase
        .from('self_journals')
        .insert({
          user_id: user.id,
          journal_text: journalText.trim(),
          mood: journalMood,
          tags: journalTags,
        })

      if (error) throw error

      toast({ title: "Journal saved", description: "Your self-journal has been saved privately." })
      setShowSelfJournal(false)
      setJournalText("")
      setJournalTags([])
      setJournalMood("😊")
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save journal", variant: "destructive" })
    } finally {
      setJournalSaving(false)
    }
  }

  return (
    <>
      {/* Prompt limit banner for free users */}
      {tier === 'free' && <div className="mb-4 md:mb-6"><PromptLimitBanner /></div>}
      
      <section className={`rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col gap-4 md:gap-6 relative transition-all duration-200 ${theme === 'dark' ? 'glass-light shadow-soft-lg' : 'glass-medium shadow-soft-md'}`} style={{ pointerEvents: 'auto' }}>
        <div className="flex items-center justify-between gap-3 mb-1">
          <h3 className={`text-lg md:text-xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Today</h3>
        </div>
      {todaysPrompt && (
        <>
          <blockquote className={`italic text-base md:text-xl mb-0 font-medium leading-relaxed ${theme === 'dark' ? 'text-white/90' : 'text-gray-900'}`}>
            "{todaysPrompt}"
          </blockquote>
          
          {/* Voice Prompt Player - Premium Feature */}
          {tier === 'premium' && (
            <div className="mb-3 md:mb-4">
              <VoicePromptPlayer promptText={todaysPrompt} userName={userName} />
            </div>
          )}
        </>
      )}
      {!todaysPrompt && (
        <div className="flex flex-col md:flex-row items-center justify-between py-3 md:py-4 gap-3 md:gap-4">
          <div className={`text-sm md:text-base ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>No prompt generated yet.</div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button 
              type="button"
              onClick={async () => {
                try {
                  const result = await generatePromptAsync()
                  if (result) {
                    setTodaysPrompt(result.prompt_text)
                    toast({ title: 'Prompt generated', description: `${result.focus_area_used ? 'Focus area: ' + result.focus_area_used : 'General reflection'}` })
                  } else {
                    toast({ title: 'Error', description: 'Failed to generate prompt', variant: 'destructive' })
                  }
                } catch (e) {
                  toast({ title: 'Error', description: 'Failed to generate prompt', variant: 'destructive' })
                }
              }}
              disabled={isGenerating}
              className={`w-full sm:w-auto text-sm ${theme === 'dark' ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/40' : 'bg-green-100 hover:bg-green-200 text-gray-900 border border-green-300'}`}
            >
              {isGenerating ? 'Generating...' : "Generate today's prompt"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowSelfJournal(true)}
              className={`w-full sm:w-auto text-sm font-semibold ${theme === 'dark' ? 'bg-white/10 text-white border border-white/20 hover:bg-white/15' : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'}`}
            >
              Self-Journal
            </Button>
          </div>
        </div>
      )}
      {!submitted ? (
        <>
          {/* Enhanced Textarea with Focus Animations */}
          <div className="mb-3">
            <textarea
              className={`w-full min-h-[140px] md:min-h-[120px] max-h-52 rounded-xl border-2 px-3 md:px-4 py-2.5 md:py-3 focus:outline-none resize-none text-sm md:text-base transition-all duration-200 ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-orange-400 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(251,146,60,0.3)]' : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:bg-orange-50/30 focus:shadow-[0_0_0_3px_rgba(251,146,60,0.2)]'}`}
              placeholder="Write your reflection..."
              maxLength={1200}
              value={reflection}
              onChange={(e) => {
                setReflection(e.target.value)
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={submitted}
            />
            {/* Word count indicator */}
            <div className={`flex items-center justify-between mt-1.5 text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
              <span className="italic">{getEncouragingMessage(wordCount) || ''}</span>
              <span>{wordCount} words</span>
            </div>
          </div>
          
          {/* Mood Selector with Stagger Animation */}
          <div className="mb-3 relative z-10">
            <label className={`text-xs md:text-sm font-semibold mb-2 block ${theme === 'dark' ? 'text-white/90' : 'text-gray-800'}`}>How are you feeling?</label>
            <motion.div 
              className="flex gap-1.5 md:gap-2 flex-wrap" 
              style={{ pointerEvents: 'auto' }}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                  }
                }
              }}
            >
              {moods.map((mood, index) => (
                <motion.button
                  key={mood}
                  type="button"
                  onClick={() => setSelectedMood(mood)}
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { 
                      opacity: 1, 
                      scale: 1,
                      transition: {
                        type: "spring",
                        bounce: 0.5,
                        duration: 0.4
                      }
                    }
                  }}
                  whileHover={{ scale: 1.1, rotate: selectedMood === mood ? 0 : 5 }}
                  whileTap={{ scale: 0.95 }}
                  className={`text-xl md:text-2xl p-2 md:p-3 rounded-lg transition-colors duration-200 cursor-pointer motion-reduce:!transform-none ${
                    selectedMood === mood
                      ? "bg-orange-500/30 ring-2 ring-orange-400"
                      : theme === 'dark' 
                        ? "bg-white/5 hover:bg-white/10"
                        : "bg-gray-50 hover:bg-white/80"
                  }`}
                >
                  {mood}
                </motion.button>
              ))}
            </motion.div>
            <p className={`text-xs mt-1.5 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>Selected: {selectedMood || 'None'}</p>
          </div>
          
          {/* Tag Selector with Stagger Animation */}
          <div className="mb-3 md:mb-4 relative z-40">
            <label className={`text-xs md:text-sm font-semibold mb-2 block flex items-center gap-2 ${theme === 'dark' ? 'text-white/90' : 'text-gray-800'}`}>
              <span className="text-base md:text-lg">🏷️</span> Add tags (optional)
            </label>
            <motion.div 
              className="flex gap-1.5 md:gap-2 flex-wrap"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.04,
                  }
                }
              }}
            >
              {availableTags.map((tag, index) => (
                <motion.button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleTag(tag)
                  }}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { 
                      opacity: 1, 
                      y: 0,
                      transition: {
                        type: "spring",
                        bounce: 0.4,
                        duration: 0.3
                      }
                    }
                  }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-semibold border-2 cursor-pointer transition-colors duration-200 motion-reduce:!transform-none ${
                    selectedTags.includes(tag)
                      ? theme === 'dark'
                        ? "bg-gradient-to-r from-orange-500/40 to-red-500/40 text-orange-200 border-orange-500/60 hover:bg-orange-500/50 shadow-lg ring-2 ring-orange-400/50"
                        : "bg-gradient-to-r from-orange-500/50 to-red-500/50 text-gray-900 border-orange-600 hover:bg-orange-500/60 shadow-lg ring-2 ring-orange-300/50"
                      : theme === 'dark'
                        ? "bg-white/5 text-white/80 border-white/20 hover:bg-white/10 hover:border-white/30 shadow-md hover:shadow-lg"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-md hover:shadow-lg"
                  }`}
                >
                  {tag}
                </motion.button>
              ))}
            </motion.div>
            <p className={`text-xs mt-1.5 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>Selected: {selectedTags.length > 0 ? selectedTags.join(', ') : 'None'}</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full md:w-auto">
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  handleSave()
                }}
                disabled={reflection.trim().length === 0}
                className="w-full md:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-5 md:px-7 py-2.5 md:py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base shadow-lg hover:shadow-xl"
              >
                Reflect
              </Button>
            </motion.div>
            
            {/* Animated Word Counter with Encouraging Message */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between md:justify-start gap-2 md:gap-4 flex-1">
              <div className="flex items-center gap-2">
                <motion.span
                  key={wordCount}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.5, duration: 0.3 }}
                  className={`text-sm font-semibold ${
                    wordCount >= 150 
                      ? theme === 'dark' ? 'text-orange-300' : 'text-orange-600'
                      : wordCount >= 100
                        ? theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
                        : theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                  }`}
                >
                  {wordCount}
                </motion.span>
                <span className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>words</span>
                {getEncouragingMessage(wordCount) && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-xs italic ml-1 ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}
                  >
                    {getEncouragingMessage(wordCount)}
                  </motion.span>
                )}
              </div>
              
                          </div>
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 md:space-y-4 mt-1 md:mt-2">
          <div className={`p-3 md:p-4 rounded-xl ${theme === 'dark' ? 'bg-green-500/20 border border-green-500/30' : 'bg-green-500/20 border border-green-400/30'}`}>
            <div className={`font-semibold text-base md:text-lg mb-2 ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>Saved.</div>
            <div className={`text-xs md:text-sm mb-2 leading-relaxed ${theme === 'dark' ? 'text-white/80' : 'text-gray-700'}`}>{reflection}</div>
            <div className="flex items-center gap-2 mt-2 md:mt-3">
              <span className="text-xl md:text-2xl">{selectedMood}</span>
              <div className="flex gap-1 flex-wrap">
                {selectedTags.map(tag => (
                  <UIBadge key={tag} className={`text-xs ${theme === 'dark' ? 'bg-white/10 text-white/80 border-white/20' : 'bg-white/80 text-gray-700 border-gray-300'}`}>
                    {tag}
                  </UIBadge>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className={`text-xs md:text-sm font-medium ${theme === 'dark' ? 'text-white/80' : 'text-gray-800'}`}>How was this prompt for you?</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                size="sm" 
                variant={feedback === "helped" ? "default" : "ghost"} 
                onClick={() => handleFeedback("helped")}
                className={`text-xs md:text-sm ${feedback === "helped" ? "bg-green-500 hover:bg-green-600" : theme === 'dark' ? "text-white/70 hover:bg-white/10" : "text-gray-700 hover:bg-white/80"}`}
              >
                👍 This helped me
              </Button>
              <Button 
                size="sm" 
                variant={feedback === "irrelevant" ? "destructive" : "ghost"} 
                onClick={() => handleFeedback("irrelevant")}
                className={`text-xs md:text-sm ${feedback === "irrelevant" ? theme === 'dark' ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-red-500/20 text-red-400 border border-red-400/30" : theme === 'dark' ? "text-white/70 hover:bg-white/10" : "text-gray-700 hover:bg-white/80"}`}
              >
                👎 Not relevant
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Self-Journal Modal */}
      {showSelfJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSelfJournal(false)} />
          <div className={`relative w-full max-w-2xl rounded-2xl p-5 md:p-6 shadow-2xl ${theme === 'dark' ? 'glass-light' : 'glass-medium'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-lg md:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Self-Journal</h3>
                <p className={`text-xs md:text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>No timer, no AI. Saved privately. Does not affect streaks or mood stats.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowSelfJournal(false)}>Close</Button>
            </div>

            <div className="space-y-3">
              <textarea
                className={`w-full min-h-[180px] rounded-xl border-2 px-3 md:px-4 py-3 focus:outline-none resize-none text-sm md:text-base transition-all duration-200 ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-green-400 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(74,222,128,0.2)]' : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:bg-green-50/30 focus:shadow-[0_0_0_3px_rgba(34,197,94,0.2)]'}`}
                placeholder="Write anything on your mind..."
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                disabled={journalSaving}
              />

              <div>
                <label className={`text-xs md:text-sm font-semibold mb-2 block ${theme === 'dark' ? 'text-white/90' : 'text-gray-800'}`}>How are you feeling?</label>
                <div className="flex gap-1.5 md:gap-2 flex-wrap">
                  {moods.map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => setJournalMood(mood)}
                      className={`text-xl md:text-2xl p-2 md:p-3 rounded-lg transition-colors duration-200 cursor-pointer ${
                        journalMood === mood
                          ? "bg-green-500/30 ring-2 ring-green-400"
                          : theme === 'dark' 
                            ? "bg-white/5 hover:bg-white/10"
                            : "bg-gray-50 hover:bg-white"
                      }`}
                      disabled={journalSaving}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`text-xs md:text-sm font-semibold mb-2 block ${theme === 'dark' ? 'text-white/90' : 'text-gray-800'}`}>Add tags (optional)</label>
                <div className="flex gap-1.5 md:gap-2 flex-wrap">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleJournalTag(tag)}
                      className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-semibold border-2 cursor-pointer transition-colors duration-200 ${
                        journalTags.includes(tag)
                          ? theme === 'dark'
                            ? "bg-green-500/30 text-white border-green-400 hover:bg-green-500/40"
                            : "bg-green-100 text-gray-900 border-green-300 hover:bg-green-200"
                          : theme === 'dark'
                            ? "bg-white/5 text-white/80 border-white/20 hover:bg-white/10"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                      disabled={journalSaving}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setShowSelfJournal(false)} disabled={journalSaving}>Cancel</Button>
                <Button 
                  onClick={handleSaveJournal}
                  disabled={journalSaving || journalText.trim().length === 0}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  {journalSaving ? "Saving..." : "Save Journal"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </section>
    </>
  );
}
