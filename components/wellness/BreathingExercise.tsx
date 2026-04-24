'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Wind, Play, Pause, RotateCcw, Lock, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  breathingTechniques, 
  getAvailableTechniques,
  getTechnique,
  logBreathingSession,
  type BreathingTechnique 
} from '@/lib/services/breathingService'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useTier } from '@/hooks/useTier'
import { useTheme } from '@/contexts/ThemeContext'

interface BreathingExerciseProps {
  userId?: string
  onComplete?: () => void
}

type Phase = 'ready' | 'inhale' | 'hold1' | 'exhale' | 'hold2' | 'complete'

export default function BreathingExercise({ userId, onComplete }: BreathingExerciseProps) {
  const { tier } = useTier()
  const isPremium = tier === 'premium'
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const reduceMotion = useReducedMotion()
  
  const [selectedTechnique, setSelectedTechnique] = useState<BreathingTechnique | null>(null)
  const [phase, setPhase] = useState<Phase>('ready')
  const [countdown, setCountdown] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [moodBefore, setMoodBefore] = useState<number | null>(null)
  const [moodAfter, setMoodAfter] = useState<number | null>(null)
  const [startTime, setStartTime] = useState<number>(0)

  const supabase = getSupabaseClient()
  const availableTechniques = getAvailableTechniques(isPremium)

  // Soft, editorial phase palette (pastel gradients instead of flat primaries)
  const getPhaseGradient = () => {
    switch (phase) {
      case 'inhale': return 'from-sky-400 via-sky-500 to-sky-600'
      case 'hold1':  return 'from-violet-400 via-violet-500 to-violet-600'
      case 'exhale': return 'from-emerald-400 via-emerald-500 to-emerald-600'
      case 'hold2':  return 'from-amber-400 via-amber-500 to-amber-600'
      default:       return 'from-[#9AB6A1] via-[#8AAE95] to-[#6FA984]'
    }
  }

  const getPhaseGlow = () => {
    switch (phase) {
      case 'inhale': return 'bg-sky-400/50'
      case 'hold1':  return 'bg-violet-400/50'
      case 'exhale': return 'bg-emerald-400/50'
      case 'hold2':  return 'bg-amber-400/50'
      default:       return 'bg-[#6FA984]/40'
    }
  }

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'Breathe in'
      case 'hold1':  return 'Hold'
      case 'exhale': return 'Breathe out'
      case 'hold2':  return 'Hold'
      case 'complete': return 'Complete'
      default: return 'Ready'
    }
  }

  // Orb scale per phase (matched to natural breathing rhythm)
  const getPhaseScale = () => {
    switch (phase) {
      case 'inhale': return 1.22
      case 'hold1':  return 1.22
      case 'exhale': return 0.82
      case 'hold2':  return 0.82
      default:       return 1
    }
  }

  const startExercise = useCallback(() => {
    if (!selectedTechnique) return
    setPhase('inhale')
    setCountdown(Math.ceil(selectedTechnique.inhale))
    setCycle(1)
    setIsRunning(true)
    setStartTime(Date.now())
  }, [selectedTechnique])

  const pauseExercise = () => {
    setIsRunning(false)
  }

  const resumeExercise = () => {
    setIsRunning(true)
  }

  const resetExercise = () => {
    setPhase('ready')
    setCountdown(0)
    setCycle(0)
    setIsRunning(false)
    setMoodAfter(null)
  }

  const completeExercise = useCallback(async () => {
    setPhase('complete')
    setIsRunning(false)
    
    if (userId && selectedTechnique) {
      const duration = Math.round((Date.now() - startTime) / 1000)
      await logBreathingSession(
        supabase,
        userId,
        selectedTechnique.id,
        duration,
        true,
        moodBefore || undefined,
        moodAfter || undefined
      )
    }
    
    onComplete?.()
  }, [userId, selectedTechnique, startTime, moodBefore, moodAfter, supabase, onComplete])

  // Timer logic
  useEffect(() => {
    if (!isRunning || !selectedTechnique || phase === 'ready' || phase === 'complete') return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Move to next phase
          if (phase === 'inhale') {
            if (selectedTechnique.hold1 > 0) {
              setPhase('hold1')
              return Math.ceil(selectedTechnique.hold1)
            } else {
              setPhase('exhale')
              return Math.ceil(selectedTechnique.exhale)
            }
          } else if (phase === 'hold1') {
            setPhase('exhale')
            return Math.ceil(selectedTechnique.exhale)
          } else if (phase === 'exhale') {
            if (selectedTechnique.hold2 > 0) {
              setPhase('hold2')
              return Math.ceil(selectedTechnique.hold2)
            } else {
              // End of cycle
              if (cycle >= selectedTechnique.cycles) {
                completeExercise()
                return 0
              }
              setCycle(c => c + 1)
              setPhase('inhale')
              return Math.ceil(selectedTechnique.inhale)
            }
          } else if (phase === 'hold2') {
            // End of cycle
            if (cycle >= selectedTechnique.cycles) {
              completeExercise()
              return 0
            }
            setCycle(c => c + 1)
            setPhase('inhale')
            return Math.ceil(selectedTechnique.inhale)
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, phase, cycle, selectedTechnique, completeExercise])

  // Technique selection view
  if (!selectedTechnique) {
    // Map each technique category to an accent in the shared design system
    const categoryAccent = (cat: string): 'emerald' | 'blue' | 'violet' | 'rose' | 'amber' => {
      switch (cat) {
        case 'calm': return 'emerald'
        case 'energize': return 'amber'
        case 'focus': return 'blue'
        default: return 'violet'
      }
    }
    const accentSurface = {
      emerald: isDark ? 'from-emerald-500/10 via-white/[0.02] to-transparent border-emerald-400/15 hover:border-emerald-400/30' : 'from-emerald-50/90 via-white/70 to-white/60 border-emerald-200/60 hover:border-emerald-300/80',
      blue:    isDark ? 'from-sky-500/10 via-white/[0.02] to-transparent border-sky-400/15 hover:border-sky-400/30'         : 'from-sky-50/90 via-white/70 to-white/60 border-sky-200/60 hover:border-sky-300/80',
      violet:  isDark ? 'from-violet-500/10 via-white/[0.02] to-transparent border-violet-400/15 hover:border-violet-400/30' : 'from-violet-50/90 via-white/70 to-white/60 border-violet-200/60 hover:border-violet-300/80',
      amber:   isDark ? 'from-amber-500/10 via-white/[0.02] to-transparent border-amber-400/15 hover:border-amber-400/30'   : 'from-amber-50/90 via-white/70 to-white/60 border-amber-200/60 hover:border-amber-300/80',
      rose:    isDark ? 'from-rose-500/10 via-white/[0.02] to-transparent border-rose-400/15 hover:border-rose-400/30'     : 'from-rose-50/90 via-white/70 to-white/60 border-rose-200/60 hover:border-rose-300/80',
    }
    const accentOrb = {
      emerald: 'from-emerald-400 via-emerald-500 to-emerald-600',
      blue:    'from-sky-400 via-sky-500 to-sky-600',
      violet:  'from-violet-400 via-violet-500 to-violet-600',
      amber:   'from-amber-400 via-amber-500 to-amber-600',
      rose:    'from-rose-400 via-rose-500 to-rose-600',
    }
    const accentGlow = {
      emerald: 'bg-emerald-400/25',
      blue:    'bg-sky-400/25',
      violet:  'bg-violet-400/25',
      amber:   'bg-amber-400/25',
      rose:    'bg-rose-400/25',
    }
    const accentBadge = {
      emerald: isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      blue:    isDark ? 'bg-sky-500/15 text-sky-300 border-sky-400/25'             : 'bg-sky-50 text-sky-700 border-sky-200',
      violet:  isDark ? 'bg-violet-500/15 text-violet-300 border-violet-400/25'    : 'bg-violet-50 text-violet-700 border-violet-200',
      amber:   isDark ? 'bg-amber-500/15 text-amber-300 border-amber-400/25'       : 'bg-amber-50 text-amber-700 border-amber-200',
      rose:    isDark ? 'bg-rose-500/15 text-rose-300 border-rose-400/25'          : 'bg-rose-50 text-rose-700 border-rose-200',
    }

    return (
      <div className="space-y-5">
        {/* Header with hero orb */}
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-16 h-16">
            <span className={`absolute inset-[-8px] rounded-full blur-xl ${isDark ? 'bg-sky-500/40' : 'bg-sky-400/35'}`} />
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 shadow-[0_14px_36px_-12px_rgba(14,165,233,0.45)]">
              <span aria-hidden className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
              <Wind className="relative w-7 h-7 text-white" strokeWidth={1.85} />
            </div>
          </div>
          <div>
            <h2 className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#2F3B34]'}`}>Breathing exercises</h2>
            <p className={`mt-1 text-sm ${isDark ? 'text-white/55' : 'text-[#6B7F6E]'}`}>Choose a technique to calm your mind</p>
          </div>
        </div>

        {/* Techniques list */}
        <motion.ul
          className="space-y-2.5"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {breathingTechniques.map((technique) => {
            const isLocked = technique.isPremium && !isPremium
            const accent = categoryAccent(technique.category)
            return (
              <motion.li
                key={technique.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } },
                }}
              >
                <motion.button
                  type="button"
                  disabled={isLocked}
                  whileHover={isLocked ? undefined : { y: -2 }}
                  whileTap={isLocked ? undefined : { scale: 0.985 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                  onClick={() => !isLocked && setSelectedTechnique(technique)}
                  className={[
                    'group relative w-full text-left overflow-hidden',
                    'rounded-2xl p-4 border bg-gradient-to-br transition-colors duration-200',
                    accentSurface[accent],
                    isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                    'shadow-[0_1px_2px_rgba(15,20,20,0.04)] hover:shadow-[0_12px_28px_-12px_rgba(15,20,20,0.18)]',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-400/40',
                  ].join(' ')}
                >
                  {!isLocked && (
                    <span
                      aria-hidden
                      className={`pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-500 ${accentGlow[accent]}`}
                    />
                  )}
                  <div className="relative flex items-center gap-3.5">
                    {/* Orb */}
                    <span className="relative inline-flex items-center justify-center shrink-0">
                      <span className={`absolute inset-[-6px] rounded-2xl bg-gradient-to-br ${accentOrb[accent]} opacity-25 blur-[6px]`} />
                      <span className={`relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accentOrb[accent]} shadow-sm`}>
                        <span aria-hidden className="absolute inset-1 rounded-xl bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
                        <Wind className="relative w-5 h-5 text-white" strokeWidth={1.9} />
                      </span>
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-[15px] font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#2F3B34]'}`}>
                          {technique.name}
                        </h3>
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full border ${accentBadge[accent]}`}>
                          {technique.category}
                        </span>
                        {isLocked && (
                          <Lock className={`w-3.5 h-3.5 ${isDark ? 'text-white/40' : 'text-[#A0A090]'}`} />
                        )}
                      </div>
                      <p className={`mt-0.5 text-[13px] leading-snug ${isDark ? 'text-white/55' : 'text-[#6B7F6E]'}`}>
                        {technique.description}
                      </p>
                      <p className={`mt-1.5 text-[11px] uppercase tracking-[0.12em] font-medium ${isDark ? 'text-white/35' : 'text-[#8A9B8F]'}`}>
                        {technique.cycles} cycles · ~{Math.round(technique.duration / 60)} min
                      </p>
                    </div>

                    {!isLocked && (
                      <span
                        className={`shrink-0 text-[13px] font-medium transition-transform duration-200 group-hover:translate-x-0.5 ${isDark ? 'text-white/35' : 'text-[#8A9B8F]'}`}
                        aria-hidden
                      >
                        →
                      </span>
                    )}
                  </div>
                </motion.button>
              </motion.li>
            )
          })}
        </motion.ul>

        {!isPremium && (
          <p className={`text-center text-[12px] pt-1 ${isDark ? 'text-white/40' : 'text-[#8A9B8F]'}`}>
            <Lock className="inline w-3 h-3 mr-1 -mt-0.5" />
            Upgrade to Premium for more breathing techniques
          </p>
        )}
      </div>
    )
  }

  // Exercise view
  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setSelectedTechnique(null)
          resetExercise()
        }}
        className={`mb-2 ${isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : ''}`}
      >
        ← Back to Techniques
      </Button>

      <header className="text-center space-y-1">
        <h2 className={`text-lg md:text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#2F3B34]'}`}>
          {selectedTechnique.name}
        </h2>
        <p className={`text-xs uppercase tracking-[0.18em] ${isDark ? 'text-white/45' : 'text-[#8A9B8F]'}`}>
          Cycle {Math.max(cycle, 1)} of {selectedTechnique.cycles}
        </p>
      </header>

      {/* Breathing orb — layered ambient glow + pulsing rings + gradient dial */}
      <div className="relative flex justify-center py-6 md:py-10">
        {/* Outermost ambient glow, tinted to phase */}
        <motion.span
          aria-hidden
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[340px] md:h-[340px] rounded-full blur-3xl ${getPhaseGlow()}`}
          animate={{ opacity: phase === 'ready' ? 0.35 : 0.6, scale: getPhaseScale() }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Concentric breathing rings (only active while running, skipped for reduced motion) */}
        {phase !== 'ready' && phase !== 'complete' && !reduceMotion && (
          <>
            {[0, 0.5, 1].map((delay) => (
              <motion.span
                key={delay}
                aria-hidden
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 md:w-52 md:h-52 rounded-full border ${isDark ? 'border-white/15' : 'border-[#2F3B34]/10'}`}
                animate={{ scale: [1, 1.5, 1], opacity: [0.55, 0, 0.55] }}
                transition={{ duration: 3.5, ease: 'easeInOut', repeat: Infinity, delay }}
              />
            ))}
          </>
        )}

        {/* The orb itself */}
        <motion.div
          animate={{ scale: getPhaseScale() }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex items-center justify-center"
        >
          <div
            className={`relative w-44 h-44 md:w-52 md:h-52 rounded-full flex items-center justify-center bg-gradient-to-br ${getPhaseGradient()} shadow-[0_20px_50px_-12px_rgba(15,20,20,0.35)] transition-[background] duration-700`}
          >
            {/* Inner highlight for depth */}
            <span
              aria-hidden
              className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 via-white/5 to-transparent"
            />
            {/* Specular top-left */}
            <span
              aria-hidden
              className="absolute top-4 left-5 w-16 h-10 rounded-full bg-white/25 blur-xl"
            />
            <div className="relative text-center text-white">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${phase}-${countdown}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="text-5xl md:text-6xl font-serif font-light leading-none"
                >
                  {countdown || '—'}
                </motion.div>
              </AnimatePresence>
              <div className="mt-2 text-[11px] md:text-xs font-medium uppercase tracking-[0.22em] text-white/90">
                {getPhaseText()}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Progress track — thin rail with filled segments */}
      <div className="mx-auto max-w-xs">
        <div className={`relative h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-[#E8E5DE]'}`}>
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${getPhaseGradient()}`}
            initial={false}
            animate={{
              width: `${(Math.min(cycle, selectedTechnique.cycles) / selectedTechnique.cycles) * 100}%`,
            }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-2.5">
        {phase === 'ready' && (
          <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }}>
            <Button
              onClick={startExercise}
              className="gap-2 rounded-full px-6 py-5 bg-gradient-to-r from-[#6FA984] to-[#5A8F6E] hover:from-[#5E9876] hover:to-[#4F7C5F] text-white shadow-lg shadow-[#6FA984]/20 border-0"
            >
              <Play className="w-4 h-4" />
              Begin
            </Button>
          </motion.div>
        )}

        {phase !== 'ready' && phase !== 'complete' && (
          <>
            {isRunning ? (
              <motion.div whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }}>
                <Button
                  onClick={pauseExercise}
                  variant="outline"
                  className={`gap-2 rounded-full px-5 ${isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-[#E8E5DE] text-[#3D3D3D] hover:bg-white'}`}
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
              </motion.div>
            ) : (
              <motion.div whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }}>
                <Button
                  onClick={resumeExercise}
                  className="gap-2 rounded-full px-5 bg-gradient-to-r from-[#6FA984] to-[#5A8F6E] hover:from-[#5E9876] hover:to-[#4F7C5F] text-white border-0"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </Button>
              </motion.div>
            )}
            <motion.div whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }}>
              <Button
                onClick={resetExercise}
                variant="ghost"
                className={`gap-2 rounded-full px-5 ${isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-[#6B7F6E] hover:text-[#2F3B34] hover:bg-white'}`}
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </motion.div>
          </>
        )}

        {phase === 'complete' && (
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border ${isDark ? 'bg-emerald-500/10 border-emerald-400/25 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}
            >
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Well done</span>
            </motion.div>
            <div className="flex gap-2 justify-center">
              <Button onClick={resetExercise} variant="outline" className={`gap-2 rounded-full ${isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-[#E8E5DE] text-[#3D3D3D] hover:bg-white'}`}>
                <RotateCcw className="w-4 h-4" />
                Again
              </Button>
              <Button
                onClick={() => {
                  setSelectedTechnique(null)
                  resetExercise()
                }}
                variant="ghost"
                className={`rounded-full ${isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-[#6B7F6E] hover:text-[#2F3B34] hover:bg-white'}`}
              >
                Try another
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {phase !== 'complete' && (
        <p className={`text-center text-sm px-4 ${isDark ? 'text-white/45' : 'text-[#6B7F6E]'}`}>
          {selectedTechnique.description}
        </p>
      )}
    </div>
  )
}
