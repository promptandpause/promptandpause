"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Slack, ChevronLeft, ChevronRight, Sparkles, Heart, Brain, Target, Clock, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"

const steps = [
  {
    question: "What brings you here today?",
    type: "single",
    options: [
      "Work stress",
      "Career transition",
      "Anxiety",
      "Burnout",
      "Just curious",
    ],
    key: "reason"
  },
  {
    question: "How would you describe your current mood?",
    type: "slider",
    min: 1,
    max: 10,
    minLabel: "Low",
    maxLabel: "High",
    key: "mood"
  },
  {
    question: "What time works best for daily prompts?",
    type: "single",
    options: ["7am", "9am", "12pm", "6pm", "9pm"],
    key: "promptTime"
  },
  {
    question: "Preferred delivery method?",
    type: "icon-single",
    options: [
      { label: "Email", icon: Mail },
      { label: "Slack", icon: Slack },
    ],
    key: "delivery"
  },
  {
    question: "Any specific focus areas?",
    type: "multi",
    options: [
      "Clarity",
      "Emotional Balance",
      "Work & Responsibility",
      "Relationships",
      "Change & Uncertainty",
      "Grounding"
    ],
    key: "focus"
  },
]

export default function Onboarding() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseClient()
  
  const [step, setStep] = useState(-1)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewPrompt, setPreviewPrompt] = useState("")
  const [answers, setAnswers] = useState({
    reason: "",
    mood: 5,
    promptTime: "",
    delivery: "",
    focus: [] as string[]
  })

  // --- UI Handlers ---
  function selectOption(opt: string) {
    const key = steps[step].key as keyof typeof answers
    setAnswers(prev => ({ ...prev, [key]: opt }))
  }
  function toggleOption(opt: string) {
    setAnswers(prev => ({
      ...prev,
      focus: prev.focus.includes(opt)
        ? prev.focus.filter((v: string) => v !== opt)
        : [...prev.focus, opt]
    }))
  }
  async function next() {
    // If we're on the last step, generate preview
    if (step === steps.length - 1) {
      setStep(s => s + 1) // Move to preview screen first
      await generatePreviewPrompt() // Then generate AI prompt
    } else {
      setStep(s => Math.min(steps.length, s + 1))
    }
  }
  
  function back() {
    setStep(s => Math.max(0, s - 1))
  }
  
  async function generatePreviewPrompt() {
    // Generate AI-personalized prompt based on user's onboarding selections
    try {
      // Call the AI prompt generation API with user's context
      const response = await fetch('/api/prompts/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: answers.reason,
          mood: answers.mood,
          focusAreas: answers.focus
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setPreviewPrompt(data.prompt || "What's on your mind today? Take a moment to reflect on how you're feeling.")
      } else {
        // Fallback prompt if API fails
        setPreviewPrompt("What's on your mind today? Take a moment to reflect on how you're feeling.")
      }
    } catch (error) {
      // Fallback prompt
      setPreviewPrompt("What's on your mind today? Take a moment to reflect on how you're feeling.")
    }
  }
  
  async function handleSubmit() {
    setIsSubmitting(true)
    
    try {
      // Call the API endpoint to save onboarding data
      // This ensures both user_preferences AND profiles tables are populated
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: answers.reason,
          mood: answers.mood,
          promptTime: answers.promptTime,
          delivery: answers.delivery,
          focus: answers.focus,
          promptFrequency: "daily",
          pushNotifications: true,
          dailyReminders: true,
          weeklyDigest: false
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save onboarding data')
      }
      
      // Move to completion screen
      setStep(steps.length + 1)
      
      toast({
        title: "Saved",
        description: "Your preferences have been saved. Redirecting to the dashboard...",
      })
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences. Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  // Dashboard-style glass morphism with calming gradients
  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden py-4 sm:py-8"
      style={{ background: 'linear-gradient(135deg, #f4f0eb 0%, #a1a79e 45%, #384c37 100%)' }}
    >
      {/* Subtle overlay for readability */}
      <div className="fixed inset-0 -z-10 bg-white/35" />

      {/* Calming ambient animation (matching dashboard) */}
      <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 calm-ambient-blobs" />
      </div>

      <style jsx global>{`
        .calm-ambient-blobs {
          background: radial-gradient(600px circle at 20% 20%, rgba(161, 167, 158, 0.25), transparent 45%),
                      radial-gradient(700px circle at 80% 30%, rgba(136, 165, 188, 0.25), transparent 50%),
                      radial-gradient(800px circle at 30% 80%, rgba(56, 76, 55, 0.25), transparent 55%);
          animation: calm-shift 28s ease-in-out infinite alternate;
          filter: blur(12px);
        }
        @keyframes calm-shift {
          0% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(-1%, 1%, 0) scale(1.03); opacity: 0.9; }
          100% { transform: translate3d(1%, -1%, 0) scale(1.06); opacity: 0.85; }
        }
        @media (prefers-reduced-motion: reduce) {
          .calm-ambient-blobs { animation: none; }
        }
      `}</style>

      {/* Main onboarding card with glass morphism */}
      <motion.div 
        className="w-full max-w-lg z-10 mx-4 sm:mx-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="backdrop-blur-xl bg-white/70 border border-white/40 rounded-3xl shadow-2xl shadow-black/10 px-6 sm:px-8 py-8 sm:py-10">
          {step === -1 ? (
            <div className="flex flex-col gap-6 items-center justify-center text-center">
              {/* Welcome Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-[#384c37] to-[#a1a79e] flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome to Prompt & Pause</h1>
                <p className="text-gray-600 text-sm">Your personal space for daily reflection</p>
              </div>
              
              {/* Trial Information Card */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full bg-gradient-to-r from-[#384c37]/10 to-[#a1a79e]/10 border border-[#384c37]/20 rounded-2xl p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#384c37] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-base font-semibold text-gray-900">
                    Start with a 7-day free trial
                  </p>
                </div>
                <p className="text-sm text-gray-600 ml-11">
                  No credit card required • Full access to all features
                </p>
              </motion.div>
              
              {/* Disclaimer */}
              <div className="bg-white/50 rounded-xl p-4 text-xs text-gray-600 leading-relaxed border border-gray-200/50">
                <strong className="text-gray-700">Disclaimer:</strong> Prompt & Pause is not a doctor, registered therapist, or a provider of professional medical, clinical, or crisis care. This service is for self-reflection and general wellness, not diagnosis, treatment, or urgent care. If you are in a crisis, please seek help from a qualified provider or call emergency services.
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 w-full cursor-pointer group">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${acceptedTerms ? 'bg-[#384c37] border-[#384c37]' : 'border-gray-300 group-hover:border-[#384c37]/50'}`}>
                  {acceptedTerms && <Check className="w-4 h-4 text-white" />}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                />
                <span className="text-sm text-gray-700 text-left">I accept the terms and acknowledge Prompt & Pause is not a medical/clinical provider</span>
              </label>

              {/* Start Button */}
              <Button
                disabled={!acceptedTerms}
                className="w-full bg-gradient-to-r from-[#384c37] to-[#4a6349] hover:from-[#2d3d2c] hover:to-[#3d5340] text-white rounded-2xl px-8 py-4 text-lg font-semibold disabled:opacity-30 shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation"
                onClick={() => setStep(0)}
              >
                <span className="flex items-center justify-center gap-2">
                  Get Started
                  <ChevronRight className="w-5 h-5" />
                </span>
              </Button>
            </div>
          ) : (
            <>
              {/* Progress Bar - Enhanced */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Step {Math.min(step + 1, steps.length)} of {steps.length}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(((Math.min(step + 1, steps.length)) / steps.length) * 100)}% complete
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#384c37] to-[#a1a79e] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((Math.min(step + 1, steps.length)) / steps.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Main Content */}
              <AnimatePresence mode="wait">
                {step < steps.length ? (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Question Header */}
                    <div className="mb-8 text-center">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                        {steps[step].question}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {step === 0 && "Understanding your journey helps us personalize your experience"}
                        {step === 1 && "This helps us tailor prompts to where you are right now"}
                        {step === 2 && "We'll send your daily reflection prompt at this time"}
                        {step === 3 && "Choose how you'd like to receive your prompts"}
                        {step === 4 && "Select all that apply to you"}
                      </p>
                    </div>

                    {/* Single Select Options */}
                    {steps[step].type === "single" && (
                      <div className="flex flex-col gap-3">
                        {(steps[step].options as string[]).map((opt: string) => (
                          <motion.button
                            key={opt}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={`w-full p-4 rounded-2xl text-left font-medium transition-all duration-200 ${
                              answers[steps[step].key as keyof typeof answers] === opt 
                                ? "bg-gradient-to-r from-[#384c37] to-[#4a6349] text-white shadow-lg" 
                                : "bg-white/60 text-gray-700 border border-gray-200/50 hover:bg-white/80 hover:border-[#384c37]/30"
                            }`}
                            onClick={() => selectOption(opt)}
                          >
                            <div className="flex items-center justify-between">
                              <span>{opt}</span>
                              {answers[steps[step].key as keyof typeof answers] === opt && (
                                <Check className="w-5 h-5" />
                              )}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {/* Mood Slider */}
                    {steps[step].type === "slider" && (
                      <div className="space-y-8 py-4">
                        <div className="relative">
                          <input
                            type="range"
                            min={steps[step].min}
                            max={steps[step].max}
                            value={answers.mood}
                            className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#384c37]"
                            style={{ 
                              background: `linear-gradient(to right, #384c37 0%, #384c37 ${(answers.mood - 1) * 11.1}%, #e5e7eb ${(answers.mood - 1) * 11.1}%, #e5e7eb 100%)` 
                            }}
                            onChange={e => setAnswers(a => ({ ...a, mood: +e.target.value }))}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-center">
                            <span className="text-2xl">😔</span>
                            <p className="text-xs text-gray-500 mt-1">{steps[step].minLabel}</p>
                          </div>
                          <div className="text-center">
                            <span className="text-4xl font-bold text-[#384c37]">{answers.mood}</span>
                            <p className="text-xs text-gray-500 mt-1">out of 10</p>
                          </div>
                          <div className="text-center">
                            <span className="text-2xl">😊</span>
                            <p className="text-xs text-gray-500 mt-1">{steps[step].maxLabel}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delivery Method Icons */}
                    {steps[step].type === "icon-single" && (
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        {(steps[step].options as { label: string; icon: any }[]).map((o) => (
                          <motion.button
                            key={o.label}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all duration-200 ${
                              answers.delivery === o.label 
                                ? "bg-gradient-to-br from-[#384c37] to-[#4a6349] text-white shadow-lg" 
                                : "bg-white/60 text-gray-700 border border-gray-200/50 hover:bg-white/80"
                            }`}
                            onClick={() => selectOption(o.label)}
                          >
                            <o.icon className="w-8 h-8" />
                            <span className="font-medium">{o.label}</span>
                            {answers.delivery === o.label && (
                              <div className="absolute top-2 right-2">
                                <Check className="w-5 h-5" />
                              </div>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {/* Multi Select Focus Areas */}
                    {steps[step].type === "multi" && (
                      <div className="flex flex-col gap-3">
                        {(steps[step].options as string[]).map((opt: string) => (
                          <motion.button
                            key={opt}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={`w-full p-4 rounded-2xl text-left font-medium transition-all duration-200 ${
                              answers.focus.includes(opt) 
                                ? "bg-gradient-to-r from-[#384c37] to-[#4a6349] text-white shadow-lg" 
                                : "bg-white/60 text-gray-700 border border-gray-200/50 hover:bg-white/80 hover:border-[#384c37]/30"
                            }`}
                            onClick={() => toggleOption(opt)}
                          >
                            <div className="flex items-center justify-between">
                              <span>{opt}</span>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                answers.focus.includes(opt) 
                                  ? "bg-white border-white" 
                                  : "border-gray-300"
                              }`}>
                                {answers.focus.includes(opt) && (
                                  <Check className="w-4 h-4 text-[#384c37]" />
                                )}
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between gap-4 mt-10">
                      <Button 
                        variant="ghost" 
                        disabled={step === 0} 
                        onClick={back} 
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </Button>
                      <Button
                        onClick={next}
                        disabled={
                          isSubmitting ||
                          (step === 0 && !answers.reason) ||
                          (step === 1 && typeof answers.mood !== 'number') ||
                          (step === 2 && !answers.promptTime) ||
                          (step === 3 && !answers.delivery) ||
                          (step === 4 && (!answers.focus || answers.focus.length === 0))
                        }
                        className="bg-gradient-to-r from-[#384c37] to-[#4a6349] hover:from-[#2d3d2c] hover:to-[#3d5340] text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                      >
                        {step === steps.length - 1 ? "See Preview" : "Continue"}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ) : step === steps.length ? (
                  // Preview Screen
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                        className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#384c37] to-[#a1a79e] flex items-center justify-center shadow-lg"
                      >
                        <Sparkles className="w-8 h-8 text-white" />
                      </motion.div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Here's a preview of your first prompt
                      </h2>
                      <p className="text-gray-500">
                        Your reflection space is ready when you are
                      </p>
                    </div>
                    
                    {/* Preview Prompt Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl p-6 shadow-lg"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#384c37]/10 flex items-center justify-center flex-shrink-0">
                          <Brain className="w-5 h-5 text-[#384c37]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                            Today's Prompt
                          </h3>
                          <blockquote className="text-lg text-gray-800 leading-relaxed italic">
                            {previewPrompt ? (
                              `"${previewPrompt}"`
                            ) : (
                              <span className="flex items-center gap-2 text-gray-500 not-italic">
                                <div className="animate-spin h-4 w-4 border-2 border-[#384c37] border-t-transparent rounded-full"></div>
                                Crafting your personalized prompt...
                              </span>
                            )}
                          </blockquote>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-gray-200/50">
                        <p className="text-sm text-gray-600 text-center">
                          Personalized for: <span className="font-semibold text-[#384c37]">{answers.focus.join(", ")}</span>
                        </p>
                      </div>
                    </motion.div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-3 pt-4">
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-[#384c37] to-[#4a6349] hover:from-[#2d3d2c] hover:to-[#3d5340] text-white py-4 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl disabled:opacity-30 transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            Setting things up...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            Looks great! Let's begin
                            <Sparkles className="w-5 h-5" />
                          </span>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setStep(steps.length - 1)}
                        disabled={isSubmitting}
                        className="w-full text-gray-600 hover:text-gray-900"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Adjust my preferences
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  // Final Success Screen
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8 space-y-6"
                  >
                    {/* Success Animation */}
                    <div className="motion-reduce:hidden">
                      <div className="w-[100px] h-[100px] mx-auto rounded-full bg-[#384c37]/20 border border-[#384c37]/30 flex items-center justify-center">
                        <Check className="w-10 h-10 text-[#384c37]" />
                      </div>
                    </div>
                    
                    {/* Static fallback */}
                    <div className="hidden motion-reduce:flex w-20 h-20 mx-auto bg-[#384c37]/20 rounded-full items-center justify-center">
                      <Check className="w-10 h-10 text-[#384c37]" />
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-gray-900">All done! 🎉</h2>
                      <p className="text-gray-600">Welcome to your reflection journey</p>
                    </div>
                    
                    <div className="bg-white/50 rounded-2xl p-5 space-y-3 text-left">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-[#384c37]" />
                        <span className="text-gray-700">
                          Daily prompts at <span className="font-semibold text-[#384c37]">{answers.promptTime}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-[#384c37]" />
                        <span className="text-gray-700">
                          Focus: <span className="font-semibold text-[#384c37]">{answers.focus.join(", ")}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-[#384c37]" />
                        <span className="text-gray-700">
                          Delivery via <span className="font-semibold text-[#384c37]">{answers.delivery}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-gray-500 pt-4">
                      <div className="animate-spin h-5 w-5 border-2 border-[#384c37] border-t-transparent rounded-full"></div>
                      <span>Redirecting to your dashboard...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
