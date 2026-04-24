'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { 
  Phone, 
  MessageCircle, 
  ExternalLink, 
  Heart, 
  Wind, 
  Eye, 
  Hand, 
  Ear, 
  Sparkles,
  ChevronRight,
  X,
  RefreshCw,
  LifeBuoy,
  Shield,
  Quote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type Accent,
  ToolCard,
  IconOrb,
  BackButton,
  CompletionState,
} from '@/components/ui/accent-card'
import { 
  groundingExercise, 
  copingStatements, 
  getHotlinesForCountry,
  quickCalmingTechniques,
  logCrisisToolUsage,
  type CrisisHotline 
} from '@/lib/services/crisisToolsService'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'

interface CrisisSupportProps {
  userCountry?: string
  userId?: string
  onClose?: () => void
}

type ActiveTool = 'menu' | 'grounding' | 'breathing' | 'coping' | 'hotlines'

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

  const logUsage = async (toolType: 'grounding_54321' | 'box_breathing' | 'coping_statements' | 'hotline_access', completed: boolean = false) => {
    await logCrisisToolUsage(supabase, toolType, userId, completed)
  }

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
  }, [breathingCycles])

  const senseIcons = {
    SEE: Eye,
    TOUCH: Hand,
    HEAR: Ear,
    SMELL: Wind,
    TASTE: Sparkles
  }

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
            className="space-y-6"
          >
            {/* Header — softer, more human */}
            <header className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 18 }}
                className="relative mx-auto w-14 h-14"
              >
                <div className={`absolute inset-0 rounded-full blur-xl opacity-60 ${isDark ? 'bg-rose-500/40' : 'bg-rose-300/50'}`} />
                <div className={`relative w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-rose-500/25 to-rose-400/10' : 'bg-gradient-to-br from-rose-100 to-rose-50'} border ${isDark ? 'border-rose-400/20' : 'border-rose-200/60'}`}>
                  <Heart className={`w-6 h-6 ${isDark ? 'text-rose-300' : 'text-rose-500'}`} strokeWidth={1.75} />
                </div>
              </motion.div>
              <div>
                <h2 className={`text-xl md:text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#2F3B34]'}`}>
                  You&apos;re not alone
                </h2>
                <p className={`mt-1.5 text-sm ${isDark ? 'text-white/55' : 'text-[#6B7F6E]'}`}>
                  Choose a gentle tool to help you feel grounded
                </p>
              </div>
            </header>

            {/* Tool cards — premium gradient surfaces, layered icon orbs */}
            <motion.ul
              className="grid gap-2.5"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}
            >
              <ToolCard
                onClick={startGrounding}
                isDark={isDark}
                accent="emerald"
                title="5-4-3-2-1 Grounding"
                subtitle="Use your senses to feel present"
                icon={<GroundingIcon isDark={isDark} />}
              />
              <ToolCard
                onClick={startBreathing}
                isDark={isDark}
                accent="blue"
                title="Box Breathing"
                subtitle="Calm your nervous system"
                icon={<BreathingIcon isDark={isDark} />}
              />
              <ToolCard
                onClick={showCoping}
                isDark={isDark}
                accent="violet"
                title="Coping Statements"
                subtitle="Gentle reminders for hard moments"
                icon={<CopingIcon isDark={isDark} />}
              />
              <ToolCard
                onClick={showHotlines}
                isDark={isDark}
                accent="rose"
                title="Talk to Someone"
                subtitle="Free, confidential support lines"
                icon={<SupportIcon isDark={isDark} />}
              />
            </motion.ul>
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
            <BackButton isDark={isDark} onClick={() => setActiveTool('menu')} />

            {groundingStep < groundingExercise.steps.length ? (
              <div className="space-y-6">
                {(() => {
                  const step = groundingExercise.steps[groundingStep]
                  const Icon = senseIcons[step.sense as keyof typeof senseIcons]
                  return (
                    <motion.div
                      key={groundingStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="text-center space-y-5"
                    >
                      {/* Sense orb with layered glow */}
                      <div className="relative mx-auto w-20 h-20">
                        <span className={`absolute inset-[-10px] rounded-full blur-xl ${isDark ? 'bg-emerald-500/40' : 'bg-emerald-400/35'}`} />
                        <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 shadow-[0_16px_40px_-12px_rgba(16,185,129,0.45)]">
                          <span aria-hidden className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
                          <Icon className="relative w-8 h-8 text-white" strokeWidth={1.9} />
                        </div>
                      </div>

                      {/* Hero numeral */}
                      <div className="flex items-baseline justify-center gap-2">
                        <span className={`font-serif text-6xl md:text-7xl leading-none font-light ${isDark ? 'text-white' : 'text-[#2F3B34]'}`}>
                          {step.number}
                        </span>
                        <span className={`text-xs uppercase tracking-[0.22em] ${isDark ? 'text-emerald-300/70' : 'text-emerald-600/75'}`}>
                          {step.sense.toLowerCase()}
                        </span>
                      </div>

                      <div>
                        <p className={`text-base md:text-lg font-medium ${isDark ? 'text-white' : 'text-[#2F3B34]'}`}>
                          {step.instruction}
                        </p>
                        <p className={`mt-2 text-sm ${isDark ? 'text-white/50' : 'text-[#6B7F6E]'}`}>
                          e.g. {step.examples.join(' · ')}
                        </p>
                      </div>
                    </motion.div>
                  )
                })()}

                {/* Segmented progress rail */}
                <div className="flex gap-1.5 justify-center">
                  {groundingExercise.steps.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === groundingStep
                          ? 'w-6 bg-emerald-500'
                          : i < groundingStep
                          ? `w-1.5 ${isDark ? 'bg-emerald-400/60' : 'bg-emerald-400'}`
                          : `w-1.5 ${isDark ? 'bg-white/15' : 'bg-[#E8E5DE]'}`
                      }`}
                    />
                  ))}
                </div>

                <div className="flex justify-center">
                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }}>
                    <Button
                      onClick={() => {
                        if (groundingStep < groundingExercise.steps.length - 1) {
                          setGroundingStep(groundingStep + 1)
                        } else {
                          setGroundingStep(groundingStep + 1)
                          logUsage('grounding_54321', true)
                        }
                      }}
                      className="gap-2 rounded-full px-6 py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 border-0"
                    >
                      {groundingStep < groundingExercise.steps.length - 1 ? 'Next sense' : 'Complete'}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            ) : (
              <CompletionState
                isDark={isDark}
                accent="emerald"
                title="Well done"
                body="You've completed the grounding exercise. Take a moment to notice how you feel."
                onPrimary={() => setActiveTool('menu')}
                primaryLabel="Back to tools"
              />
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
            <BackButton isDark={isDark} onClick={() => setActiveTool('menu')} />

            {breathingCycles < 4 ? (
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <p className={`text-xs uppercase tracking-[0.22em] ${isDark ? 'text-sky-300/70' : 'text-sky-600/75'}`}>
                    Box breathing
                  </p>
                  <p className={`text-[13px] ${isDark ? 'text-white/55' : 'text-[#6B7F6E]'}`}>
                    Cycle {breathingCycles + 1} of 4
                  </p>
                </div>

                {/* Breathing orb with ambient glow + pulsing rings */}
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
                      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border ${isDark ? 'border-white/15' : 'border-[#2F3B34]/10'}`}
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
                      <span aria-hidden className="absolute top-4 left-5 w-14 h-9 rounded-full bg-white/25 blur-xl" />
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
                    className={`text-center text-sm ${isDark ? 'text-white/60' : 'text-[#6B7F6E]'}`}
                  >
                    {breathingPhase === 'inhale' && 'Breathe in slowly through your nose…'}
                    {breathingPhase === 'hold' && 'Hold your breath gently…'}
                    {breathingPhase === 'exhale' && 'Breathe out slowly through your mouth…'}
                  </motion.p>
                </AnimatePresence>

                {/* Progress rail */}
                <div className="mx-auto max-w-xs">
                  <div className={`relative h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-[#E8E5DE]'}`}>
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
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  className="relative mx-auto w-20 h-20"
                >
                  <span className={`absolute inset-[-10px] rounded-full blur-xl ${isDark ? 'bg-sky-500/40' : 'bg-sky-400/35'}`} />
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 shadow-[0_16px_40px_-12px_rgba(14,165,233,0.45)]">
                    <span aria-hidden className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
                    <Heart className="relative w-9 h-9 text-white" strokeWidth={1.75} />
                  </div>
                </motion.div>
                <div>
                  <h3 className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#2F3B34]'}`}>Breathing complete</h3>
                  <p className={`mt-2 text-sm max-w-sm mx-auto ${isDark ? 'text-white/55' : 'text-[#6B7F6E]'}`}>
                    Notice how your body feels. Your nervous system is calmer now.
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }}>
                    <Button onClick={startBreathing} className="gap-2 rounded-full px-5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white border-0 shadow-sm shadow-sky-500/20">
                      <RefreshCw className="w-4 h-4" />
                      Again
                    </Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }}>
                    <Button onClick={() => setActiveTool('menu')} variant="outline" className={`rounded-full px-5 ${isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-[#E8E5DE] text-[#2F3B34] hover:bg-white'}`}>
                      Back to tools
                    </Button>
                  </motion.div>
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
            <BackButton isDark={isDark} onClick={() => setActiveTool('menu')} />

            <div className="space-y-6">
              {/* Shield orb */}
              <div className="relative mx-auto w-16 h-16">
                <span className={`absolute inset-[-8px] rounded-full blur-xl ${isDark ? 'bg-violet-500/45' : 'bg-violet-400/40'}`} />
                <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-400 via-violet-500 to-violet-600 shadow-[0_14px_36px_-12px_rgba(139,92,246,0.45)]">
                  <span aria-hidden className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
                  <Shield className="relative w-7 h-7 text-white" strokeWidth={1.85} />
                </div>
              </div>

              {/* Quote card — editorial framing */}
              <figure className={`relative mx-auto max-w-md rounded-2xl p-6 md:p-7 border ${isDark ? 'bg-violet-500/8 border-violet-400/15' : 'bg-white/85 border-[#E8E5DE]'} shadow-[0_1px_2px_rgba(15,20,20,0.04)]`}>
                <Quote className={`absolute -top-3 left-6 w-6 h-6 ${isDark ? 'text-violet-300' : 'text-violet-400'}`} strokeWidth={1.5} aria-hidden />
                <AnimatePresence mode="wait">
                  <motion.blockquote
                    key={copingIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className={`font-serif text-lg md:text-[22px] leading-relaxed italic ${isDark ? 'text-white' : 'text-[#2F3B34]'}`}
                  >
                    &ldquo;{copingStatements[copingIndex]}&rdquo;
                  </motion.blockquote>
                </AnimatePresence>
                <figcaption className={`mt-4 text-[11px] font-medium uppercase tracking-[0.18em] ${isDark ? 'text-violet-300/70' : 'text-violet-500/80'}`}>
                  A gentle reminder · {copingIndex + 1} / {copingStatements.length}
                </figcaption>
              </figure>

              <div className="flex justify-center">
                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }}>
                  <Button
                    onClick={() => setCopingIndex((copingIndex + 1) % copingStatements.length)}
                    variant="outline"
                    className={`gap-2 rounded-full px-5 ${isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-[#E8E5DE] text-[#2F3B34] hover:bg-white'}`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Another reminder
                  </Button>
                </motion.div>
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
            <BackButton isDark={isDark} onClick={() => setActiveTool('menu')} />

            <header className="text-center space-y-3">
              <div className="relative mx-auto w-14 h-14">
                <span className={`absolute inset-[-8px] rounded-full blur-xl ${isDark ? 'bg-rose-500/45' : 'bg-rose-400/40'}`} />
                <div className="relative w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 shadow-[0_14px_36px_-12px_rgba(244,63,94,0.45)]">
                  <span aria-hidden className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
                  <LifeBuoy className="relative w-6 h-6 text-white" strokeWidth={1.85} />
                </div>
              </div>
              <div>
                <h3 className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#2F3B34]'}`}>Free support lines</h3>
                <p className={`mt-1 text-sm ${isDark ? 'text-white/55' : 'text-[#6B7F6E]'}`}>Confidential help, available 24/7</p>
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
                  className={`rounded-2xl p-4 border transition-colors ${
                    isDark
                      ? 'bg-gradient-to-br from-rose-500/8 via-white/[0.02] to-transparent border-rose-400/15'
                      : 'bg-gradient-to-br from-rose-50/80 via-white/70 to-white/60 border-rose-200/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-[15px] font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#2F3B34]'}`}>{hotline.name}</p>
                      <p className={`mt-0.5 text-[12px] ${isDark ? 'text-white/55' : 'text-[#6B7F6E]'}`}>{hotline.available}</p>
                      {hotline.website && (
                        <a
                          href={hotline.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 mt-2 text-[12px] font-medium ${isDark ? 'text-white/45 hover:text-white/80' : 'text-[#6FA984] hover:text-[#5A8F6E]'}`}
                        >
                          <ExternalLink className="w-3 h-3" />
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
                        <Phone className="w-3.5 h-3.5" />
                        {hotline.phone}
                      </motion.a>
                    )}
                    {hotline.text && (
                      <motion.span
                        whileHover={{ y: -1 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold ${isDark ? 'bg-sky-500/15 text-sky-300 border border-sky-400/25' : 'bg-sky-50 text-sky-700 border border-sky-200'}`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {hotline.text}
                      </motion.span>
                    )}
                  </div>
                </motion.li>
              ))}
            </motion.ul>

            <p className={`text-[11px] text-center mt-2 px-4 ${isDark ? 'text-white/40' : 'text-[#8A9B8F]'}`}>
              If you&apos;re in immediate danger, please call emergency services (999 UK / 911 US)
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Specialty icon compositions — domain-specific layered iconography built on
// the shared `IconOrb` primitive from `@/components/ui/accent-card`.
// ────────────────────────────────────────────────────────────────────────────

function GroundingIcon({ isDark: _ }: { isDark: boolean }) {
  return (
    <IconOrb accent="emerald">
      {/* Layered senses: eye with subtle ear + hand hint */}
      <span className="relative">
        <Eye className="w-5 h-5" strokeWidth={1.9} />
        <Hand className="absolute -bottom-1 -right-1.5 w-3 h-3 opacity-80" strokeWidth={2} />
      </span>
    </IconOrb>
  )
}

function BreathingIcon({ isDark: _ }: { isDark: boolean }) {
  const reduceMotion = useReducedMotion()
  return (
    <IconOrb accent="blue">
      <span className="relative inline-flex items-center justify-center">
        {!reduceMotion && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border border-white/70"
            animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
          />
        )}
        <Wind className="w-5 h-5" strokeWidth={1.9} />
      </span>
    </IconOrb>
  )
}

function CopingIcon({ isDark: _ }: { isDark: boolean }) {
  return (
    <IconOrb accent="violet">
      <span className="relative">
        <Shield className="w-5 h-5" strokeWidth={1.9} />
        <Quote className="absolute -bottom-1 -right-1 w-2.5 h-2.5 opacity-80" strokeWidth={2.4} />
      </span>
    </IconOrb>
  )
}

function SupportIcon({ isDark: _ }: { isDark: boolean }) {
  return (
    <IconOrb accent="rose">
      <span className="relative">
        <LifeBuoy className="w-5 h-5" strokeWidth={1.9} />
        <Phone className="absolute -bottom-1 -right-1 w-2.5 h-2.5 opacity-85" strokeWidth={2.2} />
      </span>
    </IconOrb>
  )
}
