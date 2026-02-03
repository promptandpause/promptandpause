'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  groundingExercise, 
  copingStatements, 
  getHotlinesForCountry,
  quickCalmingTechniques,
  logCrisisToolUsage,
  type CrisisHotline 
} from '@/lib/services/crisisToolsService'
import { getSupabaseClient } from '@/lib/supabase/client'

interface CrisisSupportProps {
  userCountry?: string
  userId?: string
  onClose?: () => void
}

type ActiveTool = 'menu' | 'grounding' | 'breathing' | 'coping' | 'hotlines'

export default function CrisisSupport({ userCountry = 'UK', userId, onClose }: CrisisSupportProps) {
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <Heart className="w-12 h-12 mx-auto text-rose-500 mb-3" />
              <h2 className="text-xl font-semibold text-gray-900">You're Not Alone</h2>
              <p className="text-gray-600 mt-1">Choose a tool to help you feel grounded</p>
            </div>

            <div className="grid gap-3">
              <Button
                onClick={startGrounding}
                variant="outline"
                className="h-auto p-4 justify-start text-left hover:bg-emerald-50 hover:border-emerald-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">5-4-3-2-1 Grounding</div>
                    <div className="text-sm text-gray-500">Use your senses to feel present</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Button>

              <Button
                onClick={startBreathing}
                variant="outline"
                className="h-auto p-4 justify-start text-left hover:bg-blue-50 hover:border-blue-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Wind className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Box Breathing</div>
                    <div className="text-sm text-gray-500">Calm your nervous system</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Button>

              <Button
                onClick={showCoping}
                variant="outline"
                className="h-auto p-4 justify-start text-left hover:bg-purple-50 hover:border-purple-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Coping Statements</div>
                    <div className="text-sm text-gray-500">Gentle reminders for hard moments</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Button>

              <Button
                onClick={showHotlines}
                variant="outline"
                className="h-auto p-4 justify-start text-left hover:bg-rose-50 hover:border-rose-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Talk to Someone</div>
                    <div className="text-sm text-gray-500">Free, confidential support lines</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Button>
            </div>
          </motion.div>
        )}

        {activeTool === 'grounding' && (
          <motion.div
            key="grounding"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTool('menu')}
              className="mb-2"
            >
              ← Back
            </Button>

            {groundingStep < groundingExercise.steps.length ? (
              <div className="text-center">
                <div className="mb-6">
                  {(() => {
                    const step = groundingExercise.steps[groundingStep]
                    const Icon = senseIcons[step.sense as keyof typeof senseIcons]
                    return (
                      <>
                        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                          <Icon className="w-10 h-10 text-emerald-600" />
                        </div>
                        <div className="text-4xl font-bold text-emerald-600 mb-2">{step.number}</div>
                        <div className="text-lg font-medium text-gray-900 mb-2">
                          Things you can {step.sense}
                        </div>
                        <p className="text-gray-600 mb-4">{step.instruction}</p>
                        <div className="text-sm text-gray-500">
                          Examples: {step.examples.join(', ')}
                        </div>
                      </>
                    )
                  })()}
                </div>

                <div className="flex gap-2 justify-center mb-4">
                  {groundingExercise.steps.map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i === groundingStep ? 'bg-emerald-500' : 
                        i < groundingStep ? 'bg-emerald-300' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={() => {
                    if (groundingStep < groundingExercise.steps.length - 1) {
                      setGroundingStep(groundingStep + 1)
                    } else {
                      setGroundingStep(groundingStep + 1)
                      logUsage('grounding_54321', true)
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {groundingStep < groundingExercise.steps.length - 1 ? 'Next' : 'Complete'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <Heart className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Well done</h3>
                <p className="text-gray-600 mb-6">
                  You've completed the grounding exercise. Take a moment to notice how you feel.
                </p>
                <Button onClick={() => setActiveTool('menu')} variant="outline">
                  Back to Tools
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {activeTool === 'breathing' && (
          <motion.div
            key="breathing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTool('menu')}
              className="mb-2"
            >
              ← Back
            </Button>

            {breathingCycles < 4 ? (
              <div className="text-center py-8">
                <motion.div
                  animate={{
                    scale: breathingPhase === 'inhale' ? 1.2 : breathingPhase === 'hold' ? 1.2 : 1,
                  }}
                  transition={{ duration: 0.5 }}
                  className="w-32 h-32 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-6"
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{breathingCount}</div>
                    <div className="text-sm text-blue-500 capitalize">{breathingPhase}</div>
                  </div>
                </motion.div>

                <p className="text-gray-600 mb-4">
                  {breathingPhase === 'inhale' && 'Breathe in slowly through your nose...'}
                  {breathingPhase === 'hold' && 'Hold your breath gently...'}
                  {breathingPhase === 'exhale' && 'Breathe out slowly through your mouth...'}
                </p>

                <div className="text-sm text-gray-500">
                  Cycle {breathingCycles + 1} of 4
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Heart className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Breathing Complete</h3>
                <p className="text-gray-600 mb-6">
                  Notice how your body feels. Your nervous system is calmer now.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={startBreathing} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Again
                  </Button>
                  <Button onClick={() => setActiveTool('menu')} variant="outline">
                    Back to Tools
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTool === 'coping' && (
          <motion.div
            key="coping"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTool('menu')}
              className="mb-2"
            >
              ← Back
            </Button>

            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8 text-purple-600" />
              </div>

              <motion.p
                key={copingIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-medium text-gray-900 mb-8 px-4"
              >
                "{copingStatements[copingIndex]}"
              </motion.p>

              <Button
                onClick={() => {
                  setCopingIndex((copingIndex + 1) % copingStatements.length)
                }}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Another Statement
              </Button>
            </div>
          </motion.div>
        )}

        {activeTool === 'hotlines' && (
          <motion.div
            key="hotlines"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTool('menu')}
              className="mb-2"
            >
              ← Back
            </Button>

            <div className="text-center mb-4">
              <Phone className="w-10 h-10 mx-auto text-rose-500 mb-2" />
              <h3 className="text-lg font-semibold text-gray-900">Free Support Lines</h3>
              <p className="text-sm text-gray-600">Confidential help is available 24/7</p>
            </div>

            <div className="space-y-3">
              {hotlines.map((hotline, index) => (
                <Card key={index} className="border-rose-100">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{hotline.name}</h4>
                        <p className="text-sm text-gray-500">{hotline.available}</p>
                      </div>
                      <div className="flex gap-2">
                        {hotline.phone && (
                          <a
                            href={`tel:${hotline.phone.replace(/\s/g, '')}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-sm font-medium hover:bg-rose-200"
                          >
                            <Phone className="w-3 h-3" />
                            {hotline.phone}
                          </a>
                        )}
                        {hotline.text && (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            <MessageCircle className="w-3 h-3" />
                            {hotline.text}
                          </span>
                        )}
                      </div>
                    </div>
                    {hotline.website && (
                      <a
                        href={hotline.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {hotline.website.replace('https://', '')}
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-xs text-center text-gray-500 mt-4">
              If you're in immediate danger, please call emergency services (999 UK / 911 US)
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
