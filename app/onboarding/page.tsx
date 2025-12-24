"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Mail, Slack } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"
import dynamic from "next/dynamic"

// Dynamic import for Lottie to avoid SSR issues
const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then(m => m.DotLottieReact),
  { ssr: false }
)

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
    minLabel: "Struggling",
    maxLabel: "Thriving",
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
      "Relationships",
      "Career",
      "Self-esteem",
      "Gratitude",
      "Grief"
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
    setAnswers(prev => ({ ...prev, [steps[step].key]: opt }))
  }
  function toggleOption(opt: string) {
    setAnswers(prev => ({
      ...prev,
      [steps[step].key]: prev[steps[step].key].includes(opt)
        ? prev[steps[step].key].filter((v: string) => v !== opt)
        : [...prev[steps[step].key], opt]
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
        title: "Welcome to Prompt & Pause! 🎉",
        description: "Your preferences have been saved. Redirecting to dashboard...",
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

  // Glass effect + animated background
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-tr from-[#fdf6ee] via-[#f3f2ee] to-[#e8e6e1] overflow-hidden py-4 sm:py-8">
      {/* Blurred, moving background object */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full bg-white/20 blur-3xl"
        animate={{ scale: [1, 1.1, 1, 0.95, 1], rotate: [0, 7, 0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
      />

      {/* Liquid glass/auth card */}
      <div className="w-full max-w-md z-10 mx-4 sm:mx-6 px-4 sm:px-6 py-6 sm:py-8 rounded-2xl sm:rounded-3xl shadow-xl bg-white/30 backdrop-blur-xl border border-white/40">
        {step === -1 ? (
          <div className="flex flex-col gap-6 sm:gap-8 items-center justify-center px-2 py-6 sm:py-10 text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-800 mb-2">Welcome to Prompt & Pause</h2>
            <div className="text-xs sm:text-sm text-gray-800/80 leading-relaxed">
              <strong>Disclaimer:</strong> Prompt & Pause is not a doctor, registered therapist, or a provider of professional medical, clinical, or crisis care. This service is for self-reflection and general wellness, not diagnosis, treatment, or urgent care. If you are in a crisis, please seek help from a qualified provider or call emergency services.
            </div>
            <label className="flex items-start gap-2 justify-center mt-2 sm:mt-4">
              <input
                type="checkbox"
                className="accent-[#e4572e] w-5 h-5 flex-shrink-0 border-2 border-gray-400 rounded mt-0.5"
                checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)}
              />
              <span className="text-xs text-gray-700 select-none text-left">I accept the terms and acknowledge Prompt & Pause is not a medical/clinical provider</span>
            </label>
            <Button
              disabled={!acceptedTerms}
              className="bg-black text-white rounded px-8 py-3 sm:py-2 text-base sm:text-lg mt-2 disabled:opacity-30 w-full sm:w-auto touch-manipulation"
              onClick={() => setStep(0)}
            >
              Start
            </Button>
          </div>
        ) : (
        <>
        {/* Progress Bar */}
        <div className="flex items-center mb-7">
          <span className="text-xs text-gray-500 font-semibold mr-3">
            Step {Math.min(step + 1, steps.length)} / {steps.length}
          </span>
          <div className="w-full h-1 bg-gray-300/20 rounded">
            <motion.div
className="h-full bg-[#e4572e] rounded"
              initial={{ width: 0 }}
              animate={{ width: `${((Math.min(step + 1, steps.length)) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Main Content */}
        {step < steps.length ? (
          <>
            <div className="mb-6 sm:mb-10 text-center">
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-800 mb-1 drop-shadow">
                {steps[step].question}
              </h2>
            </div>
            {/* Render different types */}
            {/* Single/select options */}
            {steps[step].type === "single" && (
              <div className="flex flex-col gap-3">
                {steps[step].options.map((opt: string) => (
                  <Button
                    key={opt}
                    className={`w-full min-h-[48px] h-auto py-3 rounded-md text-base sm:text-lg font-semibold bg-gradient-to-tr from-[#222] to-[#acacac] text-white border border-zinc-200 shadow focus:outline-none transition hover:from-[#333] hover:to-[#bcbcbc] active:scale-[.98] touch-manipulation ${answers[steps[step].key] === opt ? "ring-2 ring-[#e4572e] border-[#e4572e] shadow-xl text-white" : ""}`}
                    onClick={() => selectOption(opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            )}
            {/* Slider */}
            {steps[step].type === "slider" && (
              <div className="flex flex-col items-center gap-8">
              <input
                  type="range"
                  min={steps[step].min}
                  max={steps[step].max}
                  value={answers.mood}
                  className="w-full accent-[#e4572e]"
                  style={{ accentColor: "#e4572e" }}
                  onChange={e => setAnswers(a => ({ ...a, mood: +e.target.value }))}
                />
                <div className="text-xs flex w-full justify-between text-neutral-700 font-medium">
                  <span>{steps[step].minLabel}</span>
                  <span style={{ color: '#e4572e' }}>{answers.mood}</span>
                  <span>{steps[step].maxLabel}</span>
                </div>
              </div>
            )}
            {/* Delivery (icon) */}
            {steps[step].type === "icon-single" && (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-5">
                {steps[step].options.map((o: any) => (
                  <Button
                    key={o.label}
                    className={`w-full sm:w-32 min-h-[48px] sm:h-12 rounded-md flex flex-row items-center justify-center gap-2
                      bg-gradient-to-tr from-[#222] to-[#acacac] text-white font-semibold border border-zinc-200 shadow focus:outline-none
                      transition hover:from-[#333] hover:to-[#bababa] active:scale-[.98] cursor-pointer select-none touch-manipulation
                      ${answers[steps[step].key] === o.label ? "ring-2 ring-[#e4572e] border-[#e4572e] shadow-xl text-white" : ""}
                    `}
                    onClick={() => selectOption(o.label)}
                  >
                    <o.icon className="text-xl align-middle" />
                    <span className="align-middle">{o.label}</span>
                  </Button>
                ))}
              </div>
            )}
            {steps[step].type === "multi" && (
              <div className="flex flex-col gap-3">
                {steps[step].options.map((opt: string) => (
                  <Button
                    key={opt}
                    className={`w-full min-h-[48px] h-auto py-3 rounded-md text-base sm:text-lg font-semibold bg-gradient-to-tr from-[#222] to-[#acacac] text-white border border-zinc-200 shadow focus:outline-none hover:from-[#333] hover:to-[#bcbcbc] active:scale-[.98] flex items-center justify-between gap-2 touch-manipulation ${answers.focus.includes(opt) ? "ring-2 ring-[#e4572e] border-[#e4572e] shadow-xl text-white" : ""}`}
                    onClick={() => toggleOption(opt)}
                  >
                    <span>{opt}</span>
                    {answers.focus.includes(opt) && <span className="w-5 h-5 ml-auto rounded-full bg-white/30 border border-indigo-200 flex items-center justify-center"><span className="block w-3 h-3 bg-indigo-500 rounded-full"></span></span>}
                  </Button>
                ))}
              </div>
            )}
            {/* Navigation buttons */}
            <div className="flex justify-between gap-3 mt-8 sm:mt-10">
              <Button variant="ghost" disabled={step === 0} onClick={back} className="touch-manipulation">
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
                className="bg-gradient-to-tr from-[#222] to-[#acacac] text-white px-6 sm:px-8 py-3 sm:py-2 rounded-md text-base sm:text-lg shadow border-none hover:from-[#3a3a3a] hover:to-[#bababa] disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
              >
                {isSubmitting ? "Saving..." : (step === steps.length - 1 ? "Finish" : "Next")}
              </Button>
            </div>
          </>
        ) : step === steps.length ? (
          // Preview Screen - Show first prompt preview
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-6 py-4"
          >
            <div className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                className="text-5xl mb-2"
              >
                ✨
              </motion.div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-800">
                Here's a preview of your first prompt
              </h2>
              <p className="text-sm text-gray-600">
                Your reflection space is ready when you are
              </p>
            </div>
            
            {/* Preview Prompt Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/40 backdrop-blur-sm border-2 border-white/60 rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">💭</span>
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Today's Prompt
                  </h3>
              <blockquote className="italic text-lg text-neutral-800 leading-relaxed">
                    {previewPrompt ? (
                      `"${previewPrompt}"`
                    ) : (
                      <span className="flex items-center gap-2 text-gray-500">
                        <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                        Crafting your personalized prompt...
                      </span>
                    )}
                  </blockquote>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/40">
                <p className="text-xs text-gray-600 text-center">
                  We've personalized this for your focus on: <span className="font-semibold">{answers.focus.join(", ")}</span>
                </p>
              </div>
            </motion.div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-4">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-tr from-[#222] to-[#acacac] text-white px-6 py-4 rounded-lg text-lg font-semibold shadow-lg hover:from-[#333] hover:to-[#bcbcbc] disabled:opacity-30 transition-all"
              >
                {isSubmitting ? "Setting things up..." : "Looks great! Let's begin 🎉"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep(steps.length - 1)}
                disabled={isSubmitting}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Adjust my preferences
              </Button>
            </div>
          </motion.div>
        ) : (
          // Final summary screen
          <div className="flex flex-col items-center text-center py-8 gap-5">
            {/* Lottie Animation - visible by default, hidden with reduced motion */}
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 motion-reduce:hidden" aria-hidden="true">
              <DotLottieReact
                src="https://lottie.host/74035e34-689a-490c-ae79-cbf7d5cfb579/xkxsTNCXfh.lottie"
                loop
                autoplay
                style={{ width: "80px", height: "80px" }}
              />
            </div>
            
            {/* Static checkmark fallback for reduced motion preference */}
            <div className="hidden motion-reduce:flex w-16 h-16 bg-green-500/20 rounded-full items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-extrabold text-blue-900 mb-2">All done! 🎉</h2>
            <div className="space-y-2 text-gray-700">
              <p>
                Your personalized prompts start tomorrow at <span className="font-bold text-indigo-600">{answers.promptTime}</span>!
              </p>
              <p className="text-sm">
                We'll focus on: <span className="font-semibold">{answers.focus.join(", ")}</span>
              </p>
              <p className="text-sm">
                Delivery via: <span className="font-semibold">{answers.delivery}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
              <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
              <span>Redirecting to your dashboard...</span>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  )
}
