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
import CelebrationModal from "./celebration-modal";
import BadgeUnlockModal from "./badge-unlock-modal";
import { achievementService } from "@/lib/services/achievementService";
import { Badge as AchievementBadge } from "@/lib/types/achievements";
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
  const [timer, setTimer] = useState(300); // 5 min in seconds
  const [timerStarted, setTimerStarted] = useState(false); // Track if timer has started
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<"helped" | "irrelevant" | null>(null);
  const [selectedMood, setSelectedMood] = useState<MoodType>("😊")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [savedReflectionId, setSavedReflectionId] = useState<string | null>(null)
  const [todaysPrompt, setTodaysPrompt] = useState("")
  const [focusAreaUsed, setFocusAreaUsed] = useState<string | null>(null)
  const [promptProvider, setPromptProvider] = useState<string | null>(null)
  const [promptModel, setPromptModel] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationData, setCelebrationData] = useState<{
    streak: number
    wordCount: number
    isMilestone: boolean
  } | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [newBadges, setNewBadges] = useState<AchievementBadge[]>([])
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0)
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  
  // Update word count when reflection changes
  useEffect(() => {
    const words = reflection.trim().split(/\s+/).filter(Boolean).length
    setWordCount(words)
  }, [reflection])
  
  // Limit to 150 words maximum
  const MAX_WORDS = 150
  const isMaxWordsReached = wordCount >= MAX_WORDS
  
  // Get encouraging message based on word count (max 150 words)
  function getEncouragingMessage(words: number): string | null {
    if (words === 0) return null
    if (words >= 150) return "Perfect length! 🌟"
    if (words >= 120) return "Almost there! ✨"
    if (words >= 100) return "Excellent depth! 🌱"
    if (words >= 75) return "Great momentum! 💚"
    if (words >= 50) return "Keep it flowing! 🌿"
    if (words >= 25) return "Good start! 💫"
    return "Just begin... 🌺"
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
  }, [])
  
  // Timer logic
  // Decrement every second if timer > 0, timer has started, and prompt not submitted
  useEffect(() => {
    if (timer > 0 && timerStarted && !submitted) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer, timerStarted, submitted]);
  const min = Math.floor(timer / 60);
  const sec = String(timer % 60).padStart(2, '0');

  // Save logic
  async function handleSave() {
    if (reflection.trim().length === 0 || !todaysPrompt) return;

    try {
      const saved = await supabaseReflectionService.saveReflection({
        prompt_text: todaysPrompt,
        reflection_text: reflection.trim(),
        mood: selectedMood,
        tags: selectedTags,
      })

      if (!saved) throw new Error('Failed to save reflection')

      setSavedReflectionId(saved.id)
      setSubmitted(true)

      // Get current user and streak for celebration and achievements
      const { data: { user } } = await supabase.auth.getUser()
      const currentStreak = await supabaseAnalyticsService.getCurrentStreak()
      
      // Check if this is a milestone (7, 30, 100, etc.)
      const isMilestone = currentStreak > 0 && (currentStreak % 7 === 0 || currentStreak === 30 || currentStreak === 100 || currentStreak === 365)
      
      // Show celebration modal
      setCelebrationData({
        streak: currentStreak,
        wordCount: saved.word_count,
        isMilestone
      })
      setShowCelebration(true)

      // Check for new badge achievements
      if (user) {
        const totalReflections = await achievementService.getTotalReflectionCount(user.id)
        const badges = await achievementService.checkReflectionBadges(
          user.id,
          totalReflections,
          currentStreak,
          selectedTags
        )
        
        if (badges.length > 0) {
          setNewBadges(badges)
          setCurrentBadgeIndex(0)
          // Show badge modal after celebration (3-4s delay)
          setTimeout(() => {
            setShowBadgeModal(true)
          }, isMilestone ? 4000 : 3000)
        }
      }

      // Also show toast for backup
      toast({
        title: "Reflection Saved! 🎉",
        description: `Your reflection has been saved to the archive. Word count: ${saved.word_count}`,
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

  return (
    <>
      {/* Prompt limit banner for free users */}
      {tier === 'freemium' && <PromptLimitBanner />}
      
      <section className={`rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col gap-4 md:gap-6 relative transition-all duration-200 ${theme === 'dark' ? 'glass-light shadow-soft-lg' : 'glass-medium shadow-soft-md'}`} style={{ pointerEvents: 'auto' }}>
        <div className="flex items-center justify-between gap-3 mb-1">
          <h3 className={`text-lg md:text-xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Today's Prompt</h3>
          <span className={`text-xs px-2.5 md:px-3 py-1 rounded-lg font-semibold whitespace-nowrap ${theme === 'dark' ? 'bg-orange-500/30 text-orange-300 border border-orange-500/40' : 'bg-orange-500/20 text-gray-900 border border-orange-400/30'}`}>5 min</span>
        </div>
      {todaysPrompt && (
        <>
          {/* Focus Area Badge */}
          {focusAreaUsed && (
            <div className="flex items-center gap-2 mb-3">
              <UIBadge className={`text-xs ${theme === 'dark' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-blue-500/20 text-blue-700 border border-blue-400'}`}>
                🎯 {focusAreaUsed}
              </UIBadge>
            </div>
          )}
          
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
          <Button 
            type="button"
            onClick={async () => {
              try {
                const result = await generatePromptAsync()
                if (result) {
                  setTodaysPrompt(result.prompt_text)
                  setFocusAreaUsed(result.focus_area_used || null)
                  setPromptProvider(result.ai_provider)
                  setPromptModel(result.ai_model)
                  toast({ title: 'Prompt Generated! 🎉', description: `Using ${result.focus_area_used ? result.focus_area_used + ' focus area' : 'general reflection'}` })
                } else {
                  toast({ title: 'Error', description: 'Failed to generate prompt', variant: 'destructive' })
                }
              } catch (e) {
                toast({ title: 'Error', description: 'Failed to generate prompt', variant: 'destructive' })
              }
            }}
            disabled={isGenerating}
            className={`w-full md:w-auto text-sm ${theme === 'dark' ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/40' : 'bg-green-100 hover:bg-green-200 text-gray-900 border border-green-300'}`}
          >
            {isGenerating ? 'Generating...' : "Generate today's prompt"}
          </Button>
        </div>
      )}
      {!submitted ? (
        <>
          {/* Enhanced Textarea with Focus Animations */}
          <div className="mb-3">
            <textarea
              className={`w-full min-h-[140px] md:min-h-[120px] max-h-52 rounded-xl border-2 px-3 md:px-4 py-2.5 md:py-3 focus:outline-none resize-none text-sm md:text-base transition-all duration-200 ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-orange-400 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(251,146,60,0.3)]' : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:bg-orange-50/30 focus:shadow-[0_0_0_3px_rgba(251,146,60,0.2)]'}`}
              placeholder={`Write your reflection (timer: ${min}:${sec})...`}
              maxLength={1200}
              value={reflection}
              onChange={(e) => {
                const newText = e.target.value
                const newWordCount = newText.trim().split(/\s+/).filter(Boolean).length
                
                // Start timer on first keystroke
                if (!timerStarted && newText.length > 0) {
                  setTimerStarted(true)
                }
                
                // Only allow update if under word limit
                if (newWordCount <= MAX_WORDS) {
                  setReflection(newText)
                } else {
                  // If over limit, try to trim to exactly MAX_WORDS
                  const words = newText.trim().split(/\s+/).filter(Boolean)
                  const trimmedText = words.slice(0, MAX_WORDS).join(' ')
                  setReflection(trimmedText)
                }
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={submitted || timer === 0}
            />
            {/* Word count indicator */}
            <div className={`flex items-center justify-between mt-1.5 text-xs ${
              isMaxWordsReached 
                ? theme === 'dark' ? 'text-orange-300' : 'text-orange-600'
                : theme === 'dark' ? 'text-white/50' : 'text-gray-500'
            }`}>
              <span>
                {wordCount}/{MAX_WORDS} words
                {isMaxWordsReached && ' (limit reached)'}
              </span>
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
            <p className={`text-xs mt-1.5 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>Selected: {selectedMood}</p>
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
                disabled={reflection.trim().length === 0 || timer === 0}
                className="w-full md:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-5 md:px-7 py-2.5 md:py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base shadow-lg hover:shadow-xl"
              >
                Save Reflection
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
                  {wordCount}/{MAX_WORDS}
                </motion.span>
                <span className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>words</span>
                {getEncouragingMessage(wordCount) && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-xs italic ml-1 ${
                      isMaxWordsReached
                        ? theme === 'dark' ? 'text-orange-300' : 'text-orange-600'
                        : theme === 'dark' ? 'text-green-300' : 'text-green-600'
                    }`}
                  >
                    {getEncouragingMessage(wordCount)}
                  </motion.span>
                )}
              </div>
              
              {/* Timer with Pulse Animation */}
              <motion.span
                animate={{
                  opacity: timer <= 60 && timer > 0 ? [1, 0.5, 1] : 1,
                  scale: timer <= 60 && timer > 0 ? [1, 1.05, 1] : 1
                }}
                transition={{
                  duration: 1.5,
                  repeat: timer <= 60 && timer > 0 ? Infinity : 0,
                  ease: "easeInOut"
                }}
                className={`text-xs md:text-sm font-mono ${
                  timer <= 60 && timer > 0
                    ? theme === 'dark' ? 'text-orange-300 font-semibold' : 'text-orange-600 font-semibold'
                    : theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                } motion-reduce:!opacity-100 motion-reduce:!transform-none`}
              >
                {timer > 0 ? `${min}:${sec}` : "Time's up!"}
              </motion.span>
            </div>
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 md:space-y-4 mt-1 md:mt-2">
          <div className={`p-3 md:p-4 rounded-xl ${theme === 'dark' ? 'bg-green-500/20 border border-green-500/30' : 'bg-green-500/20 border border-green-400/30'}`}>
            <div className={`font-semibold text-base md:text-lg mb-2 ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>✓ Reflection saved!</div>
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
      
      {/* Celebration Modal */}
      {celebrationData && (
        <CelebrationModal
          isOpen={showCelebration}
          onClose={() => setShowCelebration(false)}
          title={celebrationData.isMilestone ? `${celebrationData.streak} Day Milestone! 🎉` : "Reflection Saved! 🌟"}
          message={celebrationData.isMilestone ? "You're on an amazing journey!" : "Your reflection has been saved to the archive."}
          streakCount={celebrationData.streak}
          wordCount={celebrationData.wordCount}
          isMilestone={celebrationData.isMilestone}
          duration={celebrationData.isMilestone ? 4000 : 3000}
        />
      )}
      
      {/* Badge Unlock Modal - Shows one badge at a time */}
      {newBadges.length > 0 && currentBadgeIndex < newBadges.length && (
        <BadgeUnlockModal
          isOpen={showBadgeModal}
          badge={newBadges[currentBadgeIndex]}
          onClose={() => {
            if (currentBadgeIndex < newBadges.length - 1) {
              // Show next badge
              setCurrentBadgeIndex(prev => prev + 1)
            } else {
              // All badges shown, close modal
              setShowBadgeModal(false)
              setTimeout(() => {
                setNewBadges([])
                setCurrentBadgeIndex(0)
              }, 300) // Give animation time to complete
            }
          }}
          onShare={() => {
            // TODO: Implement share functionality
          }}
        />
      )}
      </section>
    </>
  );
}
