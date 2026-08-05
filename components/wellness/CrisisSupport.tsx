'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHandHoldingHeart,
  faPhone,
  faArrowRight,
  faWind,
  faShield,
  faQuoteLeft,
  faLifeRing,
  faHeart,
  faEye,
  faHand,
  faWaveSquare,
  faFire,
  faRotateRight,
  faComments,
  faArrowUpRightFromSquare,
  faLock,
  faCheck,
} from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/button'
import {
  groundingExercise,
  copingStatements,
  getHotlinesForCountry,
  logCrisisToolUsage,
  type CrisisHotline,
} from '@/lib/services/crisisToolsService'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'

interface CrisisSupportProps {
  userCountry?: string
  userId?: string
  onClose?: () => void
}

type ActiveTool = 'menu' | 'grounding' | 'breathing' | 'coping' | 'hotlines'

const senseIcons: Record<string, typeof faWind> = {
  SEE: faEye,
  TOUCH: faHand,
  HEAR: faWaveSquare,
  SMELL: faWind,
  TASTE: faFire,
}

export default function CrisisSupport({ userCountry = 'UK', userId, onClose }: CrisisSupportProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const reduceMotion = useReducedMotion()
  const [activeTool, setActiveTool] = useState<ActiveTool>('menu')
  const [groundingStep, setGroundingStep] = useState(0)
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [breathingCount, setBreathingCount] = useState(4)
  const [breathingCycles, setBreathingCycles] = useState(0)
  const [copingIndex, setCopingIndex] = useState(0)
  const [hotlines, setHotlines] = useState<CrisisHotline[]>([])

  const supabase = getSupabaseClient()

  useEffect(() => {
    setHotlines(getHotlinesForCountry(userCountry))
  }, [userCountry])

  const logUsage = useCallback(async (toolType: 'grounding_54321' | 'box_breathing' | 'coping_statements' | 'hotline_access', completed: boolean = false) => {
    await logCrisisToolUsage(supabase, toolType, userId, completed)
  }, [supabase, userId])

  const startGrounding = () => {
    setActiveTool('grounding')
    setGroundingStep(0)
    logUsage('grounding_54321')
  }

  const startBreathing = () => {
    setActiveTool('breathing')
    setBreathingPhase('inhale')
    setBreathingCount(4)
    setBreathingCycles(0)
    logUsage('box_breathing')
  }

  const showCoping = () => {
    setActiveTool('coping')
    setCopingIndex(Math.floor(Math.random() * copingStatements.length))
    logUsage('coping_statements')
  }

  const showHotlines = () => {
    setActiveTool('hotlines')
    logUsage('hotline_access')
  }

  // Breathing timer
  useEffect(() => {
    if (activeTool !== 'breathing') return

    const timer = setInterval(() => {
      setBreathingCount(prev => {
        if (prev <= 1) {
          // Move to next phase
          setBreathingPhase(current => {
            if (current === 'inhale') return 'hold'
            if (current === 'hold') return 'exhale'
            // After exhale, start new cycle
            setBreathingCycles(c => c + 1)
            return 'inhale'
          })
          return 4
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [activeTool])

  // Complete breathing after 4 cycles
  useEffect(() => {
    if (breathingCycles >= 4) {
      logUsage('box_breathing', true)
    }
  }, [breathingCycles, logUsage])

  return (
    <div className="min-h-[400px] flex flex-col">
      <AnimatePresence mode="wait">
        {activeTool === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            {/* Header — mockup 04 */}
            <header className="space-y-4">
              <div className={`w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm ${isDark ? '!bg-rose-500/15 !text-rose-300' : ''}`}>
                <FontAwesomeIcon icon={faHandHoldingHeart} className="text-2xl" />
              </div>
              <div>
                <h2 className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  You&apos;re not alone
                </h2>
                <p className={`mt-1.5 text-sm leading-relaxed ${isDark ? 'text-white/55' : 'text-slate-400'}`}>
                  If you&apos;re feeling overwhelmed, please reach out or try this quick grounding technique.
                </p>
              </div>
            </header>

            {/* Crisis Lifeline card — mockup 04 */}
            <a
              href="tel:988"
              className={`flex items-center justify-between p-5 rounded-3xl bg-rose-50 border-2 border-rose-100/60 group transition-all hover:bg-rose-100 ${isDark ? '!bg-rose-500/10 !border-rose-400/25 hover:!bg-rose-500/20' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-rose-500 shadow-sm ${isDark ? '!bg-white/10 !text-rose-300' : ''}`}>
                  <FontAwesomeIcon icon={faPhone} className="text-lg" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Crisis Lifeline</p>
                  <p className="text-xs text-rose-600 font-bold uppercase tracking-widest dark:text-rose-400">Call 988</p>
                </div>
              </div>
              <FontAwesomeIcon icon={faArrowRight} className="text-rose-300 group-hover:translate-x-1 transition-transform dark:text-rose-400/60" />
            </a>

            {/* Grounding preview card — mockup 04 */}
            <button
              onClick={startGrounding}
              className={`w-full p-5 rounded-3xl bg-slate-50/80 border-2 border-slate-100 text-left transition-all hover:border-slate-200 ${isDark ? '!bg-white/[0.04] !border-white/10' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest dark:text-white/40">Grounding Rule (5-4-3-2-1)</p>
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest group-hover:translate-x-0.5 transition-transform">
                  Start <FontAwesomeIcon icon={faArrowRight} className="ml-1 text-xs" />
                </span>
              </div>
              <div className="space-y-3">
                <p className={`flex items-center gap-3 text-sm font-medium ${isDark ? 'text-white/75' : 'text-slate-600'}`}>
                  <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-bold text-slate-900 shadow-sm shrink-0 dark:bg-white/10 dark:text-white">5</span>
                  Things you can see
                </p>
                <p className={`flex items-center gap-3 text-sm font-medium ${isDark ? 'text-white/75' : 'text-slate-600'}`}>
                  <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-bold text-slate-900 shadow-sm shrink-0 dark:bg-white/10 dark:text-white">4</span>
                  Things you can touch
                </p>
                <p className={`flex items-center gap-3 text-sm font-medium ${isDark ? 'text-white/75' : 'text-slate-600'}`}>
                  <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-bold text-slate-900 shadow-sm shrink-0 dark:bg-white/10 dark:text-white">3</span>
                  Things you can hear
                </p>
              </div>
            </button>

            {/* More tools */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={startBreathing}
                className={`group relative flex flex-col text-left p-4 rounded-3xl border-2 border-slate-100 bg-white/70 hover:border-sky-200 hover:shadow-2xl hover:shadow-sky-100/60 transition-all overflow-hidden ${isDark ? '!bg-white/[0.04] !border-white/10' : ''}`}
              >
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-sky-200">
                  <FontAwesomeIcon icon={faWind} className="text-sm" />
                </div>
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Box Breathing</p>
                <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-white/45' : 'text-slate-400'}`}>Calm your nervous system</p>
              </button>
              <button
                onClick={showCoping}
                className={`group relative flex flex-col text-left p-4 rounded-3xl border-2 border-slate-100 bg-white/70 hover:border-violet-200 hover:shadow-2xl hover:shadow-violet-100/60 transition-all overflow-hidden ${isDark ? '!bg-white/[0.04] !border-white/10' : ''}`}
              >
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-violet-200">
                  <FontAwesomeIcon icon={faShield} className="text-sm" />
                </div>
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Coping Statements</p>
                <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-white/45' : 'text-slate-400'}`}>Gentle reminders for hard moments</p>
              </button>
              <button
                onClick={showHotlines}
                className={`group relative flex flex-col text-left p-4 rounded-3xl border-2 border-slate-100 bg-white/70 hover:border-rose-200 hover:shadow-2xl hover:shadow-rose-100/60 transition-all overflow-hidden ${isDark ? '!bg-white/[0.04] !border-white/10' : ''}`}
              >
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-rose-200">
                  <FontAwesomeIcon icon={faLifeRing} className="text-sm" />
                </div>
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Talk to Someone</p>
                <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-white/45' : 'text-slate-400'}`}>Free, confidential support lines</p>
              </button>
            </div>

            {/* Close — mockup 04 */}
            <Button
              onClick={onClose}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-6 rounded-2xl"
            >
              I&apos;m okay for now
            </Button>
          </motion.div>
        )}

        {activeTool === 'grounding' && (
          <motion.div
            key="grounding"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            <button
              onClick={() => setActiveTool('menu')}
              className={`text-sm font-medium ${isDark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FontAwesomeIcon icon={faArrowRight} className="mr-1.5 text-xs rotate-180" />
              Back
            </button>

            {groundingStep < groundingExercise.steps.length ? (
              <div className="space-y-6">
                {(() => {
                  const step = groundingExercise.steps[groundingStep]
                  const icon = senseIcons[step.sense as keyof typeof senseIcons] ?? faEye
                  return (
                    <motion.div
                      key={groundingStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="text-center space-y-5"
                    >
                      <div className="relative mx-auto w-20 h-20">
                        <span className={`absolute inset-[-10px] rounded-full blur-xl ${isDark ? 'bg-rose-500/40' : 'bg-rose-400/35'}`} />
                        <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 shadow-[0_16px_40px_-12px_rgba(244,63,94,0.45)]">
                          <span aria-hidden className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
                          <FontAwesomeIcon icon={icon} className="text-white text-3xl" />
                        </div>
                      </div>

                      <div className="flex items-baseline justify-center gap-2">
                        <span className={`font-serif text-6xl md:text-7xl leading-none font-light ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {step.number}
                        </span>
                        <span className="text-xs uppercase tracking-[0.22em] text-rose-500/80 dark:text-rose-400/80">
                          {step.sense.toLowerCase()}
                        </span>
                      </div>

                      <div>
                        <p className={`text-base md:text-lg font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {step.instruction}
                        </p>
                        <p className={`mt-2 text-sm ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                          e.g. {step.examples.join(' · ')}
                        </p>
                      </div>
                    </motion.div>
                  )
                })()}

                <div className="flex gap-1.5 justify-center">
                  {groundingExercise.steps.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === groundingStep
                          ? 'w-6 bg-rose-500'
                          : i < groundingStep
                          ? `w-1.5 ${isDark ? 'bg-rose-400/60' : 'bg-rose-400'}`
                          : `w-1.5 ${isDark ? 'bg-white/15' : 'bg-slate-200'}`
                      }`}
                    />
                  ))}
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      setGroundingStep(groundingStep + 1)
                      if (groundingStep === groundingExercise.steps.length - 1) {
                        logUsage('grounding_54321', true)
                      }
                    }}
                    className="gap-2 rounded-2xl px-7 py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/25 border-0 font-semibold"
                  >
                    {groundingStep < groundingExercise.steps.length - 1 ? 'Next sense' : 'Complete'}
                    <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-5">
                <div className="relative mx-auto w-20 h-20">
                  <span className={`absolute inset-[-10px] rounded-full blur-xl ${isDark ? 'bg-rose-500/40' : 'bg-rose-400/35'}`} />
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 shadow-[0_16px_40px_-12px_rgba(244,63,94,0.45)]">
                    <span aria-hidden className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
                    <FontAwesomeIcon icon={faCheck} className="text-white text-3xl" />
                  </div>
                </div>
                <div>
                  <h3 className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Well done</h3>
                  <p className={`mt-2 text-sm max-w-sm mx-auto ${isDark ? 'text-white/55' : 'text-slate-400'}`}>
                    You&apos;ve completed the grounding exercise. Take a moment to notice how you feel.
                  </p>
                </div>
                <Button
                  onClick={() => setActiveTool('menu')}
                  className="gap-2 rounded-2xl px-6 bg-gradient-to-r from-rose-500 to-rose-600 text-white border-0"
                >
                  Back to tools
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {activeTool === 'breathing' && (
          <motion.div
            key="breathing"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            <button
              onClick={() => setActiveTool('menu')}
              className={`text-sm font-medium ${isDark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FontAwesomeIcon icon={faArrowRight} className="mr-1.5 text-xs rotate-180" />
              Back
            </button>

            {breathingCycles < 4 ? (
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <p className="text-xs uppercase tracking-[0.22em] text-sky-600/75 dark:text-sky-300/70">Box breathing</p>
                  <p className={`text-[13px] ${isDark ? 'text-white/55' : 'text-slate-400'}`}>
                    Cycle {breathingCycles + 1} of 4
                  </p>
                </div>

                <div className="relative flex justify-center py-4">
                  <motion.span
                    aria-hidden
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl ${isDark ? 'bg-sky-400/35' : 'bg-sky-400/30'}`}
                    animate={{
                      scale: breathingPhase === 'inhale' ? 1.25 : breathingPhase === 'hold' ? 1.25 : 0.85,
                      opacity: 0.7,
                    }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  />
                  {!reduceMotion && [0, 0.6, 1.2].map((delay) => (
                    <motion.span
                      key={delay}
                      aria-hidden
                      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border ${isDark ? 'border-white/15' : 'border-slate-900/10'}`}
                      animate={{ scale: [1, 1.45, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity, delay }}
                    />
                  ))}
                  <motion.div
                    animate={{
                      scale: breathingPhase === 'inhale' ? 1.2 : breathingPhase === 'hold' ? 1.2 : 0.85,
                    }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="relative"
                  >
                    <div className="relative w-40 h-40 rounded-full flex items-center justify-center bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 shadow-[0_20px_50px_-12px_rgba(14,165,233,0.45)]">
                      <span aria-hidden className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
                      <div className="relative text-center text-white">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={`${breathingPhase}-${breathingCount}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2 }}
                            className="font-serif text-5xl font-light leading-none"
                          >
                            {breathingCount}
                          </motion.div>
                        </AnimatePresence>
                        <div className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-white/90">
                          {breathingPhase === 'inhale' ? 'Breathe in' : breathingPhase === 'hold' ? 'Hold' : 'Breathe out'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={breathingPhase}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                    className={`text-center text-sm ${isDark ? 'text-white/60' : 'text-slate-400'}`}
                  >
                    {breathingPhase === 'inhale' && 'Breathe in slowly through your nose…'}
                    {breathingPhase === 'hold' && 'Hold your breath gently…'}
                    {breathingPhase === 'exhale' && 'Breathe out slowly through your mouth…'}
                  </motion.p>
                </AnimatePresence>

                <div className="mx-auto max-w-xs">
                  <div className={`relative h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-400 to-sky-600"
                      initial={false}
                      animate={{ width: `${(breathingCycles / 4) * 100}%` }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-5">
                <div className="relative mx-auto w-20 h-20">
                  <span className={`absolute inset-[-10px] rounded-full blur-xl ${isDark ? 'bg-sky-500/40' : 'bg-sky-400/35'}`} />
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 shadow-[0_16px_40px_-12px_rgba(14,165,233,0.45)]">
                    <span aria-hidden className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
                    <FontAwesomeIcon icon={faHeart} className="text-white text-3xl" />
                  </div>
                </div>
                <div>
                  <h3 className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Breathing complete</h3>
                  <p className={`mt-2 text-sm max-w-sm mx-auto ${isDark ? 'text-white/55' : 'text-slate-400'}`}>
                    Notice how your body feels. Your nervous system is calmer now.
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={startBreathing} className="gap-2 rounded-2xl px-5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white border-0 shadow-sm shadow-sky-500/20">
                    <FontAwesomeIcon icon={faRotateRight} className="text-sm" />
                    Again
                  </Button>
                  <Button onClick={() => setActiveTool('menu')} variant="outline" className={`rounded-2xl px-5 ${isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-slate-200 text-slate-700 hover:bg-white'}`}>
                    Back to tools
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTool === 'coping' && (
          <motion.div
            key="coping"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            <button
              onClick={() => setActiveTool('menu')}
              className={`text-sm font-medium ${isDark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FontAwesomeIcon icon={faArrowRight} className="mr-1.5 text-xs rotate-180" />
              Back
            </button>

            <div className="space-y-6">
              <div className="relative mx-auto w-16 h-16">
                <span className={`absolute inset-[-8px] rounded-full blur-xl ${isDark ? 'bg-violet-500/45' : 'bg-violet-400/40'}`} />
                <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-400 via-violet-500 to-violet-600 shadow-[0_14px_36px_-12px_rgba(139,92,246,0.45)]">
                  <span aria-hidden className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
                  <FontAwesomeIcon icon={faShield} className="text-white text-2xl" />
                </div>
              </div>

              <figure className={`relative mx-auto max-w-md rounded-3xl p-6 md:p-7 border ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white/85 border-slate-200'} shadow-[0_1px_2px_rgba(15,20,20,0.04)]`}>
                <FontAwesomeIcon icon={faQuoteLeft} className={`absolute -top-3 left-6 ${isDark ? 'text-violet-300' : 'text-violet-400'}`} aria-hidden />
                <AnimatePresence mode="wait">
                  <motion.blockquote
                    key={copingIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className={`font-serif text-lg md:text-[22px] leading-relaxed italic ${isDark ? 'text-white' : 'text-slate-900'}`}
                  >
                    &ldquo;{copingStatements[copingIndex]}&rdquo;
                  </motion.blockquote>
                </AnimatePresence>
                <figcaption className={`mt-4 text-[11px] font-medium uppercase tracking-[0.18em] ${isDark ? 'text-violet-300/70' : 'text-violet-500/80'}`}>
                  A gentle reminder · {copingIndex + 1} / {copingStatements.length}
                </figcaption>
              </figure>

              <div className="flex justify-center">
                <Button
                  onClick={() => setCopingIndex((copingIndex + 1) % copingStatements.length)}
                  variant="outline"
                  className={`gap-2 rounded-2xl px-5 ${isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-slate-200 text-slate-700 hover:bg-white'}`}
                >
                  <FontAwesomeIcon icon={faRotateRight} className="text-sm" />
                  Another reminder
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTool === 'hotlines' && (
          <motion.div
            key="hotlines"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            <button
              onClick={() => setActiveTool('menu')}
              className={`text-sm font-medium ${isDark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FontAwesomeIcon icon={faArrowRight} className="mr-1.5 text-xs rotate-180" />
              Back
            </button>

            <header className="text-center space-y-3">
              <div className="relative mx-auto w-14 h-14">
                <span className={`absolute inset-[-8px] rounded-full blur-xl ${isDark ? 'bg-rose-500/45' : 'bg-rose-400/40'}`} />
                <div className="relative w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 shadow-[0_14px_36px_-12px_rgba(244,63,94,0.45)]">
                  <span aria-hidden className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
                  <FontAwesomeIcon icon={faLifeRing} className="text-white text-xl" />
                </div>
              </div>
              <div>
                <h3 className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Free support lines</h3>
                <p className={`mt-1 text-sm ${isDark ? 'text-white/55' : 'text-slate-400'}`}>Confidential help, available 24/7</p>
              </div>
            </header>

            <motion.ul
              className="space-y-2.5"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            >
              {hotlines.map((hotline, index) => (
                <motion.li
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } },
                  }}
                  className={`rounded-3xl p-5 border transition-colors ${
                    isDark
                      ? 'bg-white/[0.04] border-white/10'
                      : 'bg-white/70 border-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-[15px] font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{hotline.name}</p>
                      <p className={`mt-0.5 text-[12px] ${isDark ? 'text-white/55' : 'text-slate-400'}`}>{hotline.available}</p>
                      {hotline.website && (
                        <a
                          href={hotline.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 mt-2 text-[12px] font-medium ${isDark ? 'text-rose-300/70 hover:text-rose-200' : 'text-rose-500 hover:text-rose-600'}`}
                        >
                          <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs" />
                          {hotline.website.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {hotline.phone && (
                      <motion.a
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                        href={`tel:${hotline.phone.replace(/\s/g, '')}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm shadow-rose-500/25 hover:shadow-md"
                      >
                        <FontAwesomeIcon icon={faPhone} className="text-xs" />
                        {hotline.phone}
                      </motion.a>
                    )}
                    {hotline.text && (
                      <motion.span
                        whileHover={{ y: -1 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold ${isDark ? 'bg-sky-500/15 text-sky-300 border border-sky-400/25' : 'bg-sky-50 text-sky-700 border border-sky-200'}`}
                      >
                        <FontAwesomeIcon icon={faComments} className="text-xs" />
                        {hotline.text}
                      </motion.span>
                    )}
                  </div>
                </motion.li>
              ))}
            </motion.ul>

            <p className={`text-[11px] text-center mt-2 px-4 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
              If you&apos;re in immediate danger, please call emergency services (999 UK / 911 US)
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
