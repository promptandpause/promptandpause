'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faWind,
  faPlay,
  faPause,
  faRotateRight,
  faLock,
  faCheck,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/button'
import {
  breathingTechniques,
  getAvailableTechniques,
  logBreathingSession,
  type BreathingTechnique,
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

  // Mockup palette: sky orb, indigo CTA, slate stat boxes
  const getPhaseGradient = () => {
    switch (phase) {
      case 'inhale': return 'from-sky-400 via-sky-500 to-sky-600'
      case 'hold1':  return 'from-indigo-400 via-indigo-500 to-indigo-600'
      case 'exhale': return 'from-sky-400 via-sky-500 to-sky-600'
      case 'hold2':  return 'from-indigo-400 via-indigo-500 to-indigo-600'
      default:       return 'from-sky-500 via-sky-600 to-indigo-600'
    }
  }

  const getPhaseGlow = () => {
    switch (phase) {
      case 'inhale': return 'bg-sky-400/50'
      case 'hold1':  return 'bg-indigo-400/50'
      case 'exhale': return 'bg-sky-400/50'
      case 'hold2':  return 'bg-indigo-400/50'
      default:       return 'bg-sky-400/40'
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

  // Mockup stat row: In / Hold / Out boxes
  const renderStatRow = (showCycle: boolean) => (
    <div className={`flex justify-between items-center rounded-3xl p-5 mb-7 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50/80'}`}>
      <div className="text-center flex-1 border-r border-slate-200 dark:border-white/10">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">In</p>
        <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedTechnique?.inhale}s</p>
      </div>
      <div className="text-center flex-1 border-r border-slate-200 dark:border-white/10">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hold</p>
        <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedTechnique?.hold1 ?? selectedTechnique?.hold2}s</p>
      </div>
      <div className="text-center flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Out</p>
        <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedTechnique?.exhale}s</p>
      </div>
      {showCycle && (
        <div className="text-center flex-1 border-l border-slate-200 dark:border-white/10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cycles</p>
          <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{Math.min(cycle, selectedTechnique?.cycles || 1)}/{selectedTechnique?.cycles}</p>
        </div>
      )}
    </div>
  )

  // Technique selection view
  if (!selectedTechnique) {
    return (
      <div className="space-y-5">
        {/* Header with hero breathe ring (mockup 04) */}
        <div className="text-center space-y-3">
          <div className="w-52 h-52 mx-auto mb-8 relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-sky-100 breathe-ring" />
            <div className="absolute inset-10 rounded-full bg-sky-200 breathe-ring" style={{ animationDelay: '-2s' }} />
            <div className={`w-20 h-20 bg-gradient-to-br from-sky-500 to-sky-600 rounded-full flex items-center justify-center text-white relative z-10 shadow-2xl shadow-sky-200`}>
              <FontAwesomeIcon icon={faWind} className="text-2xl" />
            </div>
          </div>
          <div>
            <h2 className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Breathing exercises</h2>
            <p className={`mt-1 text-sm ${isDark ? 'text-white/55' : 'text-slate-400'}`}>Sync your breath to reset your nervous system</p>
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
                    'rounded-2xl p-4 border bg-white/70 border-slate-100 transition-colors duration-200',
                    'hover:border-sky-200 hover:shadow-2xl hover:shadow-sky-100/60',
                    isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                    isDark ? '!bg-white/[0.04] !border-white/10 hover:!border-sky-400/40' : '',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-400/40',
                  ].join(' ')}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-sky-100 blur-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"
                  />
                  <div className="relative flex items-center gap-3.5">
                    <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-200 shrink-0">
                      <span aria-hidden className="absolute inset-1 rounded-xl bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
                      <FontAwesomeIcon icon={faWind} className="text-lg" />
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-[15px] font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {technique.name}
                        </h3>
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full border ${
                          isDark ? 'bg-sky-500/15 text-sky-300 border-sky-400/25' : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}>
                          {technique.category}
                        </span>
                        {isLocked && (
                          <FontAwesomeIcon icon={faLock} className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
                        )}
                      </div>
                      <p className={`mt-0.5 text-[13px] leading-snug ${isDark ? 'text-white/55' : 'text-slate-400'}`}>
                        {technique.description}
                      </p>
                      <p className={`mt-1.5 text-[11px] uppercase tracking-[0.12em] font-medium ${isDark ? 'text-white/35' : 'text-slate-400'}`}>
                        {technique.cycles} cycles · ~{Math.round(technique.duration / 60)} min
                      </p>
                    </div>

                    {!isLocked && (
                      <span
                        className={`shrink-0 text-[13px] font-medium transition-transform duration-200 group-hover:translate-x-1 ${isDark ? 'text-white/35' : 'text-slate-400'}`}
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
          <p className={`text-center text-[12px] pt-1 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
            <FontAwesomeIcon icon={faLock} className="inline mr-1 text-xs" />
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
        className={`mb-2 ${isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-700 hover:bg-white'}`}
      >
        <FontAwesomeIcon icon={faArrowRight} className="mr-1.5 text-sm rotate-180" />
        Back to Techniques
      </Button>

      <header className="text-center space-y-1">
        <h2 className={`text-lg md:text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {selectedTechnique.name}
        </h2>
        <p className={`text-xs uppercase tracking-[0.18em] ${isDark ? 'text-white/45' : 'text-slate-400'}`}>
          Cycle {Math.max(cycle, 1)} of {selectedTechnique.cycles}
        </p>
      </header>

      {/* Breathing orb — mockup breathe-ring + center orb */}
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
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 md:w-52 md:h-52 rounded-full border ${isDark ? 'border-white/15' : 'border-slate-900/10'}`}
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

      {/* Mockup stat row */}
      {renderStatRow(true)}

      {/* Controls */}
      <div className="flex justify-center gap-2.5">
        {phase === 'ready' && (
          <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }}>
            <Button
              onClick={startExercise}
              className="gap-2 rounded-2xl px-7 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25 border-0 font-semibold"
            >
              <FontAwesomeIcon icon={faPlay} className="text-sm" />
              Start Session
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
                  className={`gap-2 rounded-2xl px-5 ${isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-slate-200 text-slate-700 hover:bg-white'}`}
                >
                  <FontAwesomeIcon icon={faPause} className="text-sm" />
                  Pause
                </Button>
              </motion.div>
            ) : (
              <motion.div whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }}>
                <Button
                  onClick={resumeExercise}
                  className="gap-2 rounded-2xl px-5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-0 font-semibold"
                >
                  <FontAwesomeIcon icon={faPlay} className="text-sm" />
                  Resume
                </Button>
              </motion.div>
            )}
            <motion.div whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }}>
              <Button
                onClick={resetExercise}
                variant="ghost"
                className={`gap-2 rounded-2xl px-5 ${isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-700 hover:bg-white'}`}
              >
                <FontAwesomeIcon icon={faRotateRight} className="text-sm" />
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
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border ${
                isDark ? 'bg-sky-500/10 border-sky-400/25 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-700'
              }`}
            >
              <FontAwesomeIcon icon={faCheck} className="text-sm" />
              <span className="text-sm font-medium">Well done</span>
            </motion.div>
            <div className="flex gap-2 justify-center">
              <Button onClick={resetExercise} variant="outline" className={`gap-2 rounded-2xl ${isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-slate-200 text-slate-700 hover:bg-white'}`}>
                <FontAwesomeIcon icon={faRotateRight} className="text-sm" />
                Again
              </Button>
              <Button
                onClick={() => {
                  setSelectedTechnique(null)
                  resetExercise()
                }}
                variant="ghost"
                className={`rounded-2xl ${isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-700 hover:bg-white'}`}
              >
                Try another
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {phase !== 'complete' && (
        <p className={`text-center text-sm px-4 ${isDark ? 'text-white/45' : 'text-slate-400'}`}>
          {selectedTechnique.description}
        </p>
      )}
    </div>
  )
}
