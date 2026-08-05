"use client"

import { useState, useEffect, useCallback } from "react";
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
import { trackEvent } from "@/lib/services/eventsService";
import { Leaf, BookmarkSimple, Bell, Sparkle } from "phosphor-react";
import { IconOrb } from "@/components/ui/accent-card";
import { VisibilitySelector } from "@/components/social/VisibilitySelector";

const moods: MoodType[] = ["😔", "😐", "😊", "😄", "🤔", "😌", "🙏", "💪"]
const availableTags = ["Gratitude", "Relationships", "Career", "Self-care", "Personal Growth", "Health", "Achievement", "Nature", "Creativity", "Family"]

export default function TodaysPrompt() {
  const { toast } = useToast()
  const supabase = getSupabaseClient()
  const { theme } = useTheme()
  const { tier } = useTier()
  const { generatePrompt: generatePromptAsync, isLoading: isGenerating } = useGeneratePrompt()
  const { stats: reflectionStats } = useReflectionStats()
  const [promptUsage, setPromptUsage] = useState<{ used: number; limit: number; remaining: number; resetLabel: string; isPremium: boolean } | null>(null)
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
  // Gentle session-close actions (shown after a reflection is saved)
  const [closeAction, setCloseAction] = useState<null | 'revisit' | 'save' | 'reminders_on'>(null)
  const [remindersBusy, setRemindersBusy] = useState(false)
  // Sharing visibility
  const [visibility, setVisibility] = useState<'private' | 'friends_only' | 'public'>('private')
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
  
  // Fetch prompt usage for free users
  const fetchPromptUsage = useCallback(async () => {
    if (tier === 'premium') return
    try {
      const res = await fetch('/api/prompts/usage', { cache: 'no-store' })
      if (res.ok) {
        const { data } = await res.json()
        setPromptUsage(data)
      }
    } catch {}
  }, [tier])

  useEffect(() => {
    fetchPromptUsage()
  }, [fetchPromptUsage])

  // Listen for prompt-generated events to refresh usage
  useEffect(() => {
    const handler = () => fetchPromptUsage()
    window.addEventListener('prompt-generated', handler)
    return () => window.removeEventListener('prompt-generated', handler)
  }, [fetchPromptUsage])

  const limitReached = promptUsage ? !promptUsage.isPremium && promptUsage.remaining <= 0 : false

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
        visibility,
      })

      if (!saved) throw new Error('Failed to save reflection')

      setSavedReflectionId(saved.id)
      setSubmitted(true)

      // Track activation: was this the user's first reflection?
      try {
        const statsRes = await fetch('/api/analytics/stats', { cache: 'no-store' })
        if (statsRes.ok) {
          const { data } = await statsRes.json()
          const isFirst = (data?.totalReflections || 0) <= 1
          trackEvent(isFirst ? 'reflection_first_saved' : 'reflection_saved', {
            word_count: reflection.trim().split(/\s+/).filter(Boolean).length,
            mood: selectedMood || '😊',
            tag_count: selectedTags.length,
          })
        } else {
          trackEvent('reflection_saved')
        }
      } catch {
        trackEvent('reflection_saved')
      }

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
  
  // Gentle session-close handlers — optional, no pressure.
  async function handleCloseAction(action: 'revisit' | 'save' | 'reminders_on') {
    if (closeAction) return
    setCloseAction(action)
    try {
      if ((action === 'revisit' || action === 'save') && savedReflectionId) {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reflection_id: savedReflectionId,
            kind: action === 'revisit' ? 'revisit' : 'saved',
          }),
        })
        if (!res.ok) {
          setCloseAction(null)
          toast({ title: 'Couldn\'t save', description: 'Please try again.', variant: 'destructive' })
          return
        }
        toast({
          title: action === 'revisit' ? 'Noted' : 'Saved for later',
          description: action === 'revisit'
            ? 'We\'ll gently bring this back tomorrow.'
            : 'You can find this in Saved anytime.',
        })
      } else if (action === 'reminders_on') {
        setRemindersBusy(true)
        try {
          const res = await fetch('/api/user/preferences', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ daily_reminders: true }),
          })
          if (res.ok) {
            trackEvent('reminder_opt_in', { source: 'session_close' })
            toast({ title: 'Gentle reminders on', description: 'We\'ll check in softly. You can turn this off anytime in settings.' })
          } else {
            setCloseAction(null)
            toast({ title: 'Couldn\'t update', description: 'Try again from settings.', variant: 'destructive' })
            return
          }
        } finally {
          setRemindersBusy(false)
        }
      }
      trackEvent('session_close_action', { action })
    } catch {
      setCloseAction(null)
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

      const res = await fetch('/api/self-journals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ journal_text: journalText.trim(), mood: journalMood, tags: journalTags }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Failed to save journal')

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
      {tier === 'free' && <PromptLimitBanner />}
      
      <section className={`relative overflow-hidden rounded-3xl p-5 md:p-7 flex flex-col gap-4 md:gap-5 transition-all duration-300 backdrop-blur-xl ${theme === 'dark' ? 'bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-transparent border border-white/[0.08] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]' : 'bg-white/70 border border-slate-100 shadow-soft-card'}`} style={{ pointerEvents: 'auto' }}>
        <span aria-hidden className={`pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full blur-3xl ${theme === 'dark' ? 'bg-[#6366F1]/10' : 'bg-[#6366F1]/15'}`} />
        <div className="relative flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-3">
            <IconOrb accent="indigo" size="sm">
              <Sparkle size={16} weight="bold" className="text-white" />
            </IconOrb>
            <div>
              <h3 className={`text-lg md:text-xl font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Today</h3>
              <p className={`text-[11px] md:text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>A small pause for a clearer mind</p>
            </div>
          </div>
        </div>
      {todaysPrompt && (
        <>
          <blockquote className={`font-serif italic text-base md:text-xl mb-0 font-medium leading-relaxed ${theme === 'dark' ? 'text-white/90' : 'text-slate-800'}`}>
            "{todaysPrompt}"
          </blockquote>

          <div className={`flex items-center gap-2 text-[11px] md:text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium border ${theme === 'dark' ? 'bg-white/[0.05] border-white/[0.08] text-white/60' : 'bg-white/70 border-slate-100 text-slate-500'}`}>
              <Sparkle size={11} weight="bold" className={theme === 'dark' ? 'text-[#818CF8]' : 'text-indigo-500'} />
              {focusAreaUsed ? `Focus preference: ${focusAreaUsed}` : 'General reflection'}
            </span>
          </div>

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
          <div className={`text-sm md:text-base ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
            {limitReached
              ? `You've used all ${promptUsage?.limit} prompts this week. Resets on ${promptUsage?.resetLabel || 'Monday'}. Upgrade to Premium for unlimited prompts.`
              : 'No prompt generated yet.'}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button 
              type="button"
              onClick={async () => {
                if (limitReached) {
                  toast({ title: 'Limit reached', description: `You've used all your prompts this week. Resets on ${promptUsage?.resetLabel || 'Monday'}.`, variant: 'destructive' })
                  return
                }
                try {
                  const result = await generatePromptAsync()
                  if (result) {
                    setTodaysPrompt(result.prompt_text)
                    setFocusAreaUsed(result.focus_area_used || null)
                    setPromptProvider(result.ai_provider || null)
                    setPromptModel(result.ai_model || null)
                    toast({ title: 'Prompt generated', description: `${result.focus_area_used ? 'Focus area: ' + result.focus_area_used : 'General reflection'}` })
                  } else {
                    toast({ title: 'Error', description: 'Failed to generate prompt', variant: 'destructive' })
                  }
                } catch (e) {
                  toast({ title: 'Error', description: 'Failed to generate prompt', variant: 'destructive' })
                }
              }}
              disabled={isGenerating || limitReached}
              className={`w-full sm:w-auto text-sm ${limitReached
                ? theme === 'dark' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 cursor-not-allowed' : 'bg-orange-100 text-orange-700 border border-orange-300 cursor-not-allowed'
                : theme === 'dark' ? 'bg-[#6366F1]/20 hover:bg-[#6366F1]/30 text-indigo-300 border border-[#6366F1]/40' : 'bg-indigo-50 hover:bg-indigo-100 text-slate-900 border border-indigo-200'}`}
            >
              {isGenerating ? 'Generating...' : limitReached ? 'Limit Reached' : "Generate today's prompt"}
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
              className={`w-full min-h-[160px] md:min-h-[140px] max-h-52 rounded-2xl border-2 px-3 md:px-4 py-2.5 md:py-3 focus:outline-none resize-none text-sm md:text-base transition-all duration-200 ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-indigo-400 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.25)]' : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'}`}
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
            <div className={`flex items-center justify-between mt-1.5 text-xs ${theme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>
              <span className="italic">{getEncouragingMessage(wordCount) || ''}</span>
              <span>{wordCount} words</span>
            </div>
          </div>
          
          {/* Mood Selector with Stagger Animation */}
          <div className="mb-3 relative z-10">
            <label className={`text-xs md:text-sm font-semibold mb-2 block ${theme === 'dark' ? 'text-white/90' : 'text-gray-800'}`}>How are you feeling?</label>
            <motion.div 
              className="flex gap-2 md:gap-2 overflow-x-auto md:overflow-visible md:flex-wrap scrollbar-hide px-3 py-1 md:px-0 scroll-fade-x md:!mask-image-none" 
              style={{ pointerEvents: 'auto', WebkitOverflowScrolling: 'touch' }}
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
                  className={`text-xl md:text-2xl p-2.5 md:p-3 rounded-xl transition-colors duration-200 cursor-pointer motion-reduce:!transform-none flex-shrink-0 ${
                    selectedMood === mood
                      ? "bg-indigo-100 ring-2 ring-indigo-400"
                      : theme === 'dark' 
                        ? "bg-white/5 hover:bg-white/10"
                        : "bg-slate-50 hover:bg-white"
                  }`}
                >
                  {mood}
                </motion.button>
              ))}
            </motion.div>
            <p className={`text-xs mt-1.5 ${theme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>Selected: {selectedMood || 'None'}</p>
          </div>
          
          {/* Tag Selector with Stagger Animation */}
          <div className="mb-3 md:mb-4 relative z-40">
            <label className={`text-xs md:text-sm font-semibold mb-2 block flex items-center gap-2 ${theme === 'dark' ? 'text-white/90' : 'text-slate-800'}`}>
              <span className="text-base md:text-lg">🏷️</span> Add tags (optional)
            </label>
            <motion.div 
              className="flex gap-2 md:gap-2 overflow-x-auto md:overflow-visible md:flex-wrap scrollbar-hide px-3 py-1 md:px-0 scroll-fade-x md:!mask-image-none"
              style={{ WebkitOverflowScrolling: 'touch' }}
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
                  className={`px-3 md:px-3 py-1.5 md:py-1.5 rounded-full text-xs font-semibold border-2 cursor-pointer transition-colors duration-200 motion-reduce:!transform-none flex-shrink-0 whitespace-nowrap ${
                    selectedTags.includes(tag)
                      ? theme === 'dark'
                        ? "bg-indigo-500/40 text-indigo-200 border-indigo-500/60 hover:bg-indigo-500/50 shadow-lg ring-2 ring-indigo-400/50"
                        : "bg-indigo-500 text-white border-indigo-600 hover:bg-indigo-600 shadow-lg ring-2 ring-indigo-300/50"
                      : theme === 'dark'
                        ? "bg-white/5 text-white/80 border-white/20 hover:bg-white/10 hover:border-white/30 shadow-md hover:shadow-lg"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-md hover:shadow-lg"
                  }`}
                >
                  {tag}
                </motion.button>
              ))}
            </motion.div>
            <p className={`text-xs mt-1.5 ${theme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>Selected: {selectedTags.length > 0 ? selectedTags.join(', ') : 'None'}</p>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <p className={`text-[10px] uppercase tracking-wide font-semibold ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>
              Who can see this
            </p>
            <VisibilitySelector value={visibility} onChange={setVisibility} />
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
                className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold px-5 md:px-7 py-2.5 md:py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base shadow-lg shadow-indigo-500/25 hover:shadow-xl"
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
                      ? theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'
                      : wordCount >= 100
                        ? theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'
                        : theme === 'dark' ? 'text-white/50' : 'text-slate-400'
                  }`}
                >
                  {wordCount}
                </motion.span>
                <span className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>words</span>
                {getEncouragingMessage(wordCount) && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-xs italic ml-1 ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'}`}
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
          <div className={`p-3 md:p-4 rounded-xl ${theme === 'dark' ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-indigo-50/80 border border-indigo-100'}`}>
            <div className={`font-semibold text-base md:text-lg mb-2 ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'}`}>Saved.</div>
            <div className={`text-xs md:text-sm mb-2 leading-relaxed ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>{reflection}</div>
            <div className="flex items-center gap-2 mt-2 md:mt-3">
              <span className="text-xl md:text-2xl">{selectedMood}</span>
              <div className="flex gap-1 flex-wrap">
                {selectedTags.map(tag => (
                  <UIBadge key={tag} className={`text-xs ${theme === 'dark' ? 'bg-white/10 text-white/80 border-white/20' : 'bg-white/80 text-slate-600 border-slate-100'}`}>
                    {tag}
                  </UIBadge>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className={`text-xs md:text-sm font-medium ${theme === 'dark' ? 'text-white/80' : 'text-slate-800'}`}>How was this prompt for you?</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                size="sm" 
                variant={feedback === "helped" ? "default" : "ghost"} 
                onClick={() => handleFeedback("helped")}
                className={`text-xs md:text-sm ${feedback === "helped" ? "bg-indigo-500 hover:bg-indigo-600" : theme === 'dark' ? "text-white/70 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"}`}
              >
                👍 This helped me
              </Button>
              <Button 
                size="sm" 
                variant={feedback === "irrelevant" ? "destructive" : "ghost"} 
                onClick={() => handleFeedback("irrelevant")}
                className={`text-xs md:text-sm ${feedback === "irrelevant" ? theme === 'dark' ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-red-500/20 text-red-400 border border-red-400/30" : theme === 'dark' ? "text-white/70 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"}`}
              >
                👎 Not relevant
              </Button>
            </div>
          </div>

          {/* Gentle session close — optional, low-pressure reasons to return */}
          <div className={`pt-3 md:pt-4 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
            {!closeAction ? (
              <div className="space-y-2">
                <p className={`text-xs md:text-sm ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                  Before you go — no pressure, just if it helps:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCloseAction('revisit')}
                    className={`text-xs md:text-sm justify-start gap-2 ${theme === 'dark' ? 'text-white/80 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}
                  >
                    <Leaf size={16} weight="bold" aria-hidden="true" />
                    Revisit this tomorrow
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCloseAction('save')}
                    className={`text-xs md:text-sm justify-start gap-2 ${theme === 'dark' ? 'text-white/80 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}
                  >
                    <BookmarkSimple size={16} weight="bold" aria-hidden="true" />
                    Save for later
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={remindersBusy}
                    onClick={() => handleCloseAction('reminders_on')}
                    className={`text-xs md:text-sm justify-start gap-2 ${theme === 'dark' ? 'text-white/80 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}
                  >
                    <Bell size={16} weight="bold" aria-hidden="true" />
                    Quiet reminder
                  </Button>
                </div>
              </div>
            ) : (
              <p className={`text-xs md:text-sm italic ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'}`}>
                {closeAction === 'revisit' && 'Okay — we\'ll gently bring this back tomorrow.'}
                {closeAction === 'save' && 'Saved. You can return to this whenever you\'re ready.'}
                {closeAction === 'reminders_on' && 'Gentle reminders are on. Adjust anytime in settings.'}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Self-Journal Modal */}
      {showSelfJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSelfJournal(false)} />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className={`relative w-full max-w-2xl overflow-hidden rounded-3xl p-5 md:p-7 backdrop-blur-xl ${theme === 'dark' ? 'bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent border border-white/[0.1] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]' : 'bg-white/95 border border-slate-100 shadow-soft-card'}`}
          >
            <span aria-hidden className={`pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full blur-3xl ${theme === 'dark' ? 'bg-[#6366F1]/10' : 'bg-[#6366F1]/15'}`} />
            <div className="relative flex items-start justify-between mb-5 gap-3">
              <div className="flex items-center gap-3">
                <IconOrb accent="rose" size="md">
                  <Sparkle size={20} weight="bold" className="text-white" />
                </IconOrb>
                <div>
                  <h3 className={`text-lg md:text-xl font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Self-Journal</h3>
                  <p className={`text-xs md:text-sm ${theme === 'dark' ? 'text-white/55' : 'text-slate-500'}`}>No timer, no AI. Saved privately. Doesn't affect stats or rhythm.</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowSelfJournal(false)} className={theme === 'dark' ? 'text-white/70 hover:bg-white/10' : ''}>Close</Button>
            </div>

            <div className="space-y-3">
              <textarea
                className={`w-full min-h-[180px] rounded-2xl border-2 px-3 md:px-4 py-3 focus:outline-none resize-none text-sm md:text-base transition-all duration-200 ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-indigo-400 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]' : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'}`}
                placeholder="Write anything on your mind..."
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                disabled={journalSaving}
              />

              <div>
            <label className={`text-xs md:text-sm font-semibold mb-2 block ${theme === 'dark' ? 'text-white/90' : 'text-slate-800'}`}>How are you feeling?</label>
                <div className="flex gap-1.5 md:gap-2 flex-wrap">
                  {moods.map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => setJournalMood(mood)}
                      className={`text-xl md:text-2xl p-2 md:p-3 rounded-lg transition-colors duration-200 cursor-pointer ${
                        journalMood === mood
                          ? "bg-indigo-100 ring-2 ring-indigo-400"
                          : theme === 'dark' 
                            ? "bg-white/5 hover:bg-white/10"
                            : "bg-slate-50 hover:bg-white"
                      }`}
                      disabled={journalSaving}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`text-xs md:text-sm font-semibold mb-2 block ${theme === 'dark' ? 'text-white/90' : 'text-slate-800'}`}>Add tags (optional)</label>
                <div className="flex gap-1.5 md:gap-2 flex-wrap">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleJournalTag(tag)}
                      className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-semibold border-2 cursor-pointer transition-colors duration-200 ${
                        journalTags.includes(tag)
                          ? theme === 'dark'
                            ? "bg-indigo-500/30 text-white border-indigo-400 hover:bg-indigo-500/40"
                            : "bg-indigo-100 text-slate-900 border-indigo-300 hover:bg-indigo-200"
                          : theme === 'dark'
                            ? "bg-white/5 text-white/80 border-white/20 hover:bg-white/10"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
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
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25"
                >
                  {journalSaving ? "Saving..." : "Save Journal"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </section>
    </>
  );
}
