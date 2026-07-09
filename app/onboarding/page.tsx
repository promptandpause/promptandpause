"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mail, Slack, ChevronLeft, ChevronRight, Sparkles, Heart, Brain, Target,
  Clock, Check, Crown, Sun, Compass, Moon, Star, Shield, Feather, Zap,
  ArrowRight, Palette, Smile, BookOpen, Coffee
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"
import { detectUserTimezone } from "@/lib/utils/timezoneDetection"
import AgeVerification from "@/components/auth/AgeVerification"
import { trackEvent } from "@/lib/services/eventsService"

const stepMeta = [
  { icon: Compass },
  { icon: Heart },
  { icon: Clock },
  { icon: Mail },
  { icon: Target },
]

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export default function Onboarding() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  const STORAGE_KEY = "pp_onboarding_progress_v1"
  const [hydrated, setHydrated] = useState(false)
  const [step, setStep] = useState(-2)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewPrompt, setPreviewPrompt] = useState("")
  const [ageVerified, setAgeVerified] = useState(false)
  const [ageData, setAgeData] = useState<{ dateOfBirth: string; country: string; isCompliant: boolean } | null>(null)
  const [answers, setAnswers] = useState({
    reason: "",
    mood: 5,
    promptTime: "",
    delivery: "",
    focus: [] as string[]
  })

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved && typeof saved === "object") {
          if (saved.answers && typeof saved.answers === "object") {
            setAnswers((prev) => ({ ...prev, ...saved.answers, focus: Array.isArray(saved.answers.focus) ? saved.answers.focus : prev.focus }))
          }
          if (typeof saved.acceptedTerms === "boolean") setAcceptedTerms(saved.acceptedTerms)
          if (saved.ageData && typeof saved.ageData === "object") {
            setAgeData(saved.ageData)
            setAgeVerified(true)
          }
          if (typeof saved.step === "number") {
            const maxResumable = steps.length
            const resumed = Math.min(Math.max(saved.step, -2), maxResumable)
            setStep(resumed)
          }
        }
      }
    } catch { }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      if (step > steps.length) return
      const payload = { step, answers, acceptedTerms, ageData }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch { }
  }, [hydrated, step, answers, acceptedTerms, ageData])

  const didRegeneratePreviewOnHydrate = useRef(false)
  useEffect(() => {
    if (!hydrated) return
    if (step === steps.length && !previewPrompt && !didRegeneratePreviewOnHydrate.current) {
      didRegeneratePreviewOnHydrate.current = true
      generatePreviewPrompt()
    }
  }, [hydrated, step, previewPrompt])

  function handleAgeVerified(data: { dateOfBirth: string; country: string; isCompliant: boolean }) {
    setAgeData(data)
    setAgeVerified(true)
    setStep(-1)
  }

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
    if (step === steps.length - 1) {
      setStep(s => s + 1)
      await generatePreviewPrompt()
    } else {
      setStep(s => Math.min(steps.length, s + 1))
    }
  }

  function back() {
    setStep(s => Math.max(0, s - 1))
  }

  async function generatePreviewPrompt() {
    try {
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
        setPreviewPrompt("What's on your mind today? Take a moment to reflect on how you're feeling.")
      }
    } catch (error) {
      setPreviewPrompt("What's on your mind today? Take a moment to reflect on how you're feeling.")
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const userTimezone = detectUserTimezone()
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
          weeklyDigest: false,
          timezone: userTimezone
        })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save onboarding data')
      }
      try { window.localStorage.removeItem(STORAGE_KEY) } catch { }
      trackEvent('onboarding_completed', {
        reason: answers.reason,
        prompt_time: answers.promptTime,
        delivery: answers.delivery,
        focus_count: Array.isArray(answers.focus) ? answers.focus.length : 0,
      })
      setStep(steps.length + 1)
      toast({
        title: "Saved",
        description: "Your preferences have been saved. Redirecting to the dashboard...",
      })
      setTimeout(() => { router.push('/dashboard') }, 2000)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences. Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-4 sm:py-8 bg-white">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_20%_20%,rgba(29,155,240,0.06),transparent_45%),radial-gradient(700px_circle_at_80%_30%,rgba(29,155,240,0.04),transparent_50%),radial-gradient(800px_circle_at_30%_80%,rgba(29,155,240,0.05),transparent_55%)] animate-[subtle-shift_28s_ease-in-out_infinite_alternate]" />
      </div>

      <style jsx global>{`
        @keyframes subtle-shift {
          0% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(-1%, 1%, 0) scale(1.03); opacity: 0.9; }
          100% { transform: translate3d(1%, -1%, 0) scale(1.06); opacity: 0.85; }
        }
        @media (prefers-reduced-motion: reduce) {
          .calm-ambient-blobs { animation: none; }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #1D9BF0;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(29,155,240,0.3);
          border: 2px solid white;
        }
        input[type="range"]::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #1D9BF0;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(29,155,240,0.3);
          border: 2px solid white;
        }
      `}</style>

      <motion.div
        className="w-full max-w-lg z-10 mx-4 sm:mx-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white border border-[#EFF3F4] rounded-2xl shadow-[0_2px_12px_rgba(15,20,25,0.08)] px-6 sm:px-8 py-8 sm:py-10">
          {step === -2 ? (
            <AgeVerification onVerified={handleAgeVerified} />
          ) : step === -1 ? (
            <div className="flex flex-col gap-6 items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-[#0F1419] flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>

              <div className="space-y-1">
                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-2xl sm:text-3xl font-bold text-[#0F1419]"
                >
                  Welcome to Prompt & Pause
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-[#536471] text-sm"
                >
                  Your personal space for daily reflection
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full bg-[#F7F9FA] border border-[#EFF3F4] rounded-xl p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#1D9BF0] flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-base font-semibold text-[#0F1419]">
                    Start with a 7-day free trial
                  </p>
                </div>
                <p className="text-sm text-[#536471] ml-11">
                  No credit card required &bull; Full access to all features
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-[#F7F9FA] rounded-xl p-4 text-xs text-[#536471] leading-relaxed border border-[#EFF3F4]"
              >
                <strong className="text-[#0F1419]">Disclaimer:</strong> Prompt & Pause is not a doctor, registered therapist, or a provider of professional medical, clinical, or crisis care. This service is for self-reflection and general wellness, not diagnosis, treatment, or urgent care. If you are in a crisis, please seek help from a qualified provider or call emergency services.
              </motion.div>

              <motion.label
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="flex items-start gap-3 w-full cursor-pointer group"
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 ${acceptedTerms ? 'bg-[#1D9BF0] border-[#1D9BF0]' : 'border-[#CFD9DE] group-hover:border-[#1D9BF0]/50'}`}>
                  {acceptedTerms && <Check className="w-4 h-4 text-white" />}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                />
                <span className="text-sm text-[#536471] text-left">I accept the terms and acknowledge Prompt & Pause is not a medical/clinical provider</span>
              </motion.label>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full"
              >
                <Button
                  disabled={!acceptedTerms}
                  className="w-full bg-[#0F1419] hover:bg-black text-white rounded-full px-8 py-4 text-lg font-semibold disabled:opacity-30 transition-all duration-300 touch-manipulation"
                  onClick={() => setStep(0)}
                >
                  <span className="flex items-center justify-center gap-2">
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </Button>
              </motion.div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[#536471]">
                    Step {Math.min(step + 1, steps.length)} of {steps.length}
                  </span>
                  <span className="text-sm text-[#536471]">
                    {Math.round(((Math.min(step + 1, steps.length)) / steps.length) * 100)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#EFF3F4] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#1D9BF0] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((Math.min(step + 1, steps.length)) / steps.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {step < steps.length ? (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="mb-8 text-center">
                      {stepMeta[step] && (() => {
                        const Icon = stepMeta[step].icon
                        return (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="mb-5"
                          >
                            <div className="w-14 h-14 mx-auto rounded-full bg-[#1D9BF0]/10 flex items-center justify-center">
                              <Icon className="w-7 h-7 text-[#1D9BF0]" strokeWidth={1.5} />
                            </div>
                          </motion.div>
                        )
                      })()}
                      <h2 className="text-xl sm:text-2xl font-bold text-[#0F1419] mb-2 tracking-tight">
                        {steps[step].question}
                      </h2>
                      <p className="text-sm text-[#536471]">
                        {step === 0 && "Understanding your journey helps us personalize your experience"}
                        {step === 1 && "This helps us tailor prompts to where you are right now"}
                        {step === 2 && "We'll send your daily reflection prompt at this time"}
                        {step === 3 && "Choose how you'd like to receive your prompts"}
                        {step === 4 && "Select all that apply to you"}
                      </p>
                    </div>

                    {steps[step].type === "single" && (
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col gap-2.5"
                      >
                        {(steps[step].options as string[]).map((opt: string) => (
                          <motion.button
                            key={opt}
                            variants={itemVariants}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={`w-full p-4 rounded-xl text-left font-medium transition-all duration-200 ${
                              answers[steps[step].key as keyof typeof answers] === opt
                                ? "bg-[#1D9BF0] text-white shadow-[0_2px_8px_rgba(29,155,240,0.25)]"
                                : "bg-[#F7F9FA] text-[#0F1419] border border-[#EFF3F4] hover:border-[#1D9BF0]/30"
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
                      </motion.div>
                    )}

                    {steps[step].type === "slider" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-8 py-4"
                      >
                        <div className="relative pt-2">
                          <input
                            type="range"
                            min={steps[step].min}
                            max={steps[step].max}
                            value={answers.mood}
                            className="w-full h-1.5 bg-[#EFF3F4] rounded-full appearance-none cursor-pointer accent-[#1D9BF0]"
                            style={{
                              background: `linear-gradient(to right, #1D9BF0 0%, #1D9BF0 ${(answers.mood - 1) * 11.1}%, #EFF3F4 ${(answers.mood - 1) * 11.1}%, #EFF3F4 100%)`
                            }}
                            onChange={e => setAnswers(a => ({ ...a, mood: +e.target.value }))}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-center">
                            <span className="text-2xl block mb-1">&#x1F614;</span>
                            <p className="text-xs text-[#536471]">{steps[step].minLabel}</p>
                          </div>
                          <motion.div
                            key={answers.mood}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            className="text-center"
                          >
                            <span className="text-4xl font-bold text-[#1D9BF0]">{answers.mood}</span>
                            <p className="text-xs text-[#536471] mt-1">out of 10</p>
                          </motion.div>
                          <div className="text-center">
                            <span className="text-2xl block mb-1">&#x1F60A;</span>
                            <p className="text-xs text-[#536471]">{steps[step].maxLabel}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {steps[step].type === "icon-single" && (
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        {(steps[step].options as { label: string; icon: any }[]).map((o) => {
                          const isLocked = o.label === "Slack"
                          return (
                            <motion.button
                              key={o.label}
                              whileHover={isLocked ? {} : { scale: 1.02 }}
                              whileTap={isLocked ? {} : { scale: 0.98 }}
                              className={`p-6 rounded-xl flex flex-col items-center gap-3 transition-all duration-200 relative ${
                                isLocked
                                  ? "bg-[#F7F9FA] text-[#536471] border border-[#EFF3F4] cursor-not-allowed opacity-60"
                                  : answers.delivery === o.label
                                    ? "bg-[#1D9BF0] text-white shadow-[0_2px_8px_rgba(29,155,240,0.25)]"
                                    : "bg-[#F7F9FA] text-[#0F1419] border border-[#EFF3F4] hover:border-[#1D9BF0]/30"
                              }`}
                              onClick={() => !isLocked && selectOption(o.label)}
                              disabled={isLocked}
                            >
                              <o.icon className="w-8 h-8" />
                              <span className="font-medium">{o.label}</span>
                              {isLocked && (
                                <span className="text-xs text-[#536471] font-medium flex items-center gap-1">
                                  <Crown className="w-3 h-3" /> Premium
                                </span>
                              )}
                              {!isLocked && answers.delivery === o.label && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-2 right-2"
                                >
                                  <Check className="w-5 h-5" />
                                </motion.div>
                              )}
                            </motion.button>
                          )
                        })}
                      </div>
                    )}

                    {steps[step].type === "multi" && (
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col gap-2.5"
                      >
                        {(steps[step].options as string[]).map((opt: string) => (
                          <motion.button
                            key={opt}
                            variants={itemVariants}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={`w-full p-4 rounded-xl text-left font-medium transition-all duration-200 ${
                              answers.focus.includes(opt)
                                ? "bg-[#1D9BF0] text-white shadow-[0_2px_8px_rgba(29,155,240,0.25)]"
                                : "bg-[#F7F9FA] text-[#0F1419] border border-[#EFF3F4] hover:border-[#1D9BF0]/30"
                            }`}
                            onClick={() => toggleOption(opt)}
                          >
                            <div className="flex items-center justify-between">
                              <span>{opt}</span>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                answers.focus.includes(opt)
                                  ? "bg-white border-white"
                                  : "border-[#CFD9DE]"
                              }`}>
                                {answers.focus.includes(opt) && (
                                  <Check className="w-4 h-4 text-[#1D9BF0]" />
                                )}
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}

                    <div className="flex justify-between gap-4 mt-10">
                      <Button
                        variant="ghost"
                        disabled={step === 0}
                        onClick={back}
                        className="flex items-center gap-2 text-[#536471] hover:text-[#0F1419] rounded-full"
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
                        className="bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white px-8 py-3 rounded-full font-semibold shadow-[0_2px_8px_rgba(29,155,240,0.25)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                      >
                        {step === steps.length - 1 ? "See Preview" : "Continue"}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ) : step === steps.length ? (
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
                        className="w-16 h-16 mx-auto rounded-full bg-[#0F1419] flex items-center justify-center shadow-lg"
                      >
                        <Star className="w-8 h-8 text-white" />
                      </motion.div>
                      <motion.h2
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-2xl font-bold text-[#0F1419]"
                      >
                        Here&apos;s a preview of your first prompt
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-[#536471]"
                      >
                        Your reflection space is ready when you are
                      </motion.p>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-[#F7F9FA] border border-[#EFF3F4] rounded-xl p-6"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#1D9BF0]/10 flex items-center justify-center flex-shrink-0">
                          <Feather className="w-5 h-5 text-[#1D9BF0]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xs font-bold text-[#536471] uppercase tracking-wider mb-3">
                            Today&apos;s Prompt
                          </h3>
                          <blockquote className="text-lg text-[#0F1419] leading-relaxed italic">
                            {previewPrompt ? (
                              `"${previewPrompt}"`
                            ) : (
                              <span className="flex items-center gap-2 text-[#536471] not-italic">
                                <div className="animate-spin h-4 w-4 border-2 border-[#1D9BF0] border-t-transparent rounded-full"></div>
                                Crafting your personalized prompt...
                              </span>
                            )}
                          </blockquote>
                        </div>
                      </div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-6 pt-4 border-t border-[#EFF3F4]"
                      >
                        <p className="text-sm text-[#536471] text-center">
                          Personalized for: <span className="font-semibold text-[#1D9BF0]">{answers.focus.join(", ")}</span>
                        </p>
                      </motion.div>
                    </motion.div>

                    <div className="space-y-3 pt-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Button
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="w-full bg-[#0F1419] hover:bg-black text-white py-4 rounded-full text-lg font-semibold shadow-lg disabled:opacity-30 transition-all duration-300"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                              Setting things up...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              Looks great! Let&apos;s begin
                              <Sparkles className="w-5 h-5" />
                            </span>
                          )}
                        </Button>
                      </motion.div>
                      <Button
                        variant="ghost"
                        onClick={() => setStep(steps.length - 1)}
                        disabled={isSubmitting}
                        className="w-full text-[#536471] hover:text-[#0F1419] rounded-full"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Adjust my preferences
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8 space-y-6"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                    >
                      <div className="w-[100px] h-[100px] mx-auto rounded-full bg-[#1D9BF0]/10 border border-[#1D9BF0]/20 flex items-center justify-center">
                        <Check className="w-10 h-10 text-[#1D9BF0]" />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <h2 className="text-2xl font-bold text-[#0F1419]">All done!</h2>
                      <p className="text-[#536471]">Welcome to your reflection journey</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-[#F7F9FA] rounded-xl p-5 space-y-3 text-left border border-[#EFF3F4]"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-[#1D9BF0]" />
                        <span className="text-[#536471]">
                          Daily prompts at <span className="font-semibold text-[#0F1419]">{answers.promptTime}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-[#1D9BF0]" />
                        <span className="text-[#536471]">
                          Focus: <span className="font-semibold text-[#0F1419]">{answers.focus.join(", ")}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-[#1D9BF0]" />
                        <span className="text-[#536471]">
                          Delivery via <span className="font-semibold text-[#0F1419]">{answers.delivery}</span>
                        </span>
                      </div>
                    </motion.div>

                    <div className="flex items-center justify-center gap-2 text-[#536471] pt-4">
                      <div className="animate-spin h-5 w-5 border-2 border-[#1D9BF0] border-t-transparent rounded-full"></div>
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
