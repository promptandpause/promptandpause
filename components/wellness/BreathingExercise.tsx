'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

interface BreathingExerciseProps {
  userId?: string
  onComplete?: () => void
}

type Phase = 'ready' | 'inhale' | 'hold1' | 'exhale' | 'hold2' | 'complete'

export default function BreathingExercise({ userId, onComplete }: BreathingExerciseProps) {
  const { tier } = useTier()
  const isPremium = tier === 'premium'
  
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

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale': return 'bg-blue-500'
      case 'hold1': return 'bg-purple-500'
      case 'exhale': return 'bg-emerald-500'
      case 'hold2': return 'bg-amber-500'
      default: return 'bg-gray-300'
    }
  }

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'Breathe In'
      case 'hold1': return 'Hold'
      case 'exhale': return 'Breathe Out'
      case 'hold2': return 'Hold'
      case 'complete': return 'Complete'
      default: return 'Ready'
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
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <Wind className="w-12 h-12 mx-auto text-blue-500 mb-3" />
          <h2 className="text-xl font-semibold text-gray-900">Breathing Exercises</h2>
          <p className="text-gray-600 mt-1">Choose a technique to calm your mind</p>
        </div>

        <div className="grid gap-3">
          {breathingTechniques.map((technique) => {
            const isLocked = technique.isPremium && !isPremium
            
            return (
              <Card
                key={technique.id}
                className={`cursor-pointer transition-all ${
                  isLocked 
                    ? 'opacity-60 border-gray-200' 
                    : 'hover:border-blue-300 hover:shadow-md'
                }`}
                onClick={() => !isLocked && setSelectedTechnique(technique)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{technique.name}</h3>
                        {isLocked && (
                          <Lock className="w-4 h-4 text-gray-400" />
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          technique.category === 'calm' ? 'bg-emerald-100 text-emerald-700' :
                          technique.category === 'energize' ? 'bg-orange-100 text-orange-700' :
                          technique.category === 'focus' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {technique.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{technique.description}</p>
                      <div className="text-xs text-gray-400 mt-2">
                        {technique.cycles} cycles • ~{Math.round(technique.duration / 60)} min
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {!isPremium && (
          <p className="text-center text-sm text-gray-500 mt-4">
            🔒 Upgrade to Premium for more breathing techniques
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
        className="mb-2"
      >
        ← Back to Techniques
      </Button>

      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">{selectedTechnique.name}</h2>
        <p className="text-sm text-gray-500">
          Cycle {cycle} of {selectedTechnique.cycles}
        </p>
      </div>

      {/* Breathing circle */}
      <div className="flex justify-center py-8">
        <motion.div
          animate={{
            scale: phase === 'inhale' ? 1.3 : phase === 'exhale' ? 0.8 : 1,
          }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className={`w-40 h-40 rounded-full ${getPhaseColor()} flex items-center justify-center shadow-lg`}
        >
          <div className="text-center text-white">
            <div className="text-4xl font-bold">{countdown || '—'}</div>
            <div className="text-sm opacity-90">{getPhaseText()}</div>
          </div>
        </motion.div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: selectedTechnique.cycles }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < cycle ? 'bg-blue-500' : 
              i === cycle - 1 && phase !== 'ready' ? 'bg-blue-300' : 
              'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {phase === 'ready' && (
          <Button onClick={startExercise} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Play className="w-4 h-4" />
            Start
          </Button>
        )}

        {phase !== 'ready' && phase !== 'complete' && (
          <>
            {isRunning ? (
              <Button onClick={pauseExercise} variant="outline" className="gap-2">
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            ) : (
              <Button onClick={resumeExercise} className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Play className="w-4 h-4" />
                Resume
              </Button>
            )}
            <Button onClick={resetExercise} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </>
        )}

        {phase === 'complete' && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <Check className="w-6 h-6" />
              <span className="font-medium">Exercise Complete!</span>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={resetExercise} variant="outline" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Do Again
              </Button>
              <Button 
                onClick={() => {
                  setSelectedTechnique(null)
                  resetExercise()
                }}
                variant="outline"
              >
                Try Another
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {phase !== 'complete' && (
        <div className="text-center text-sm text-gray-500 mt-4">
          <p>{selectedTechnique.description}</p>
        </div>
      )}
    </div>
  )
}
