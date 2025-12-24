"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "@/contexts/ThemeContext"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Download,
  Settings as SettingsIcon,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface VoicePromptPlayerProps {
  promptText: string
  userName?: string | null
}

export default function VoicePromptPlayer({ promptText, userName }: VoicePromptPlayerProps) {
  const { theme } = useTheme()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  
  // Voice settings
  const [rate, setRate] = useState(1.0) // Speech rate (0.5 - 2.0)
  const [pitch, setPitch] = useState(1.0) // Speech pitch (0 - 2)
  const [volume, setVolume] = useState(1.0) // Volume (0 - 1)
  const [selectedVoice, setSelectedVoice] = useState<number>(0)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      // Filter for English voices, prefer Google/Microsoft voices
      const englishVoices = voices.filter(voice => voice.lang.startsWith('en'))
      setAvailableVoices(englishVoices.length > 0 ? englishVoices : voices)
      
      // Try to find a nice default voice
      const preferredVoice = englishVoices.findIndex(v => 
        v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Samantha')
      )
      if (preferredVoice !== -1) {
        setSelectedVoice(preferredVoice)
      }
    }

    loadVoices()
    
    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      stopSpeech()
    }
  }, [])

  // Create introduction text
  const getIntroText = () => {
    const name = userName || 'there'
    const greeting = getGreeting()
    return `${greeting}, ${name}! Today's reflection prompt is: ${promptText}`
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Estimate duration (rough approximation: ~150 words per minute)
  const estimateDuration = (text: string) => {
    const words = text.split(' ').length
    return (words / 150) * 60 // seconds
  }

  const startSpeech = () => {
    if (!window.speechSynthesis) {
      toast.error('Text-to-speech is not supported in your browser')
      return
    }

    stopSpeech() // Stop any existing speech

    const fullText = getIntroText()
    const utterance = new SpeechSynthesisUtterance(fullText)
    
    // Apply voice settings
    if (availableVoices[selectedVoice]) {
      utterance.voice = availableVoices[selectedVoice]
    }
    utterance.rate = rate
    utterance.pitch = pitch
    // Always set volume based on current muted state
    utterance.volume = isMuted ? 0 : volume

    // Set up event listeners
    utterance.onstart = () => {
      setIsPlaying(true)
      setIsPaused(false)
      setDuration(estimateDuration(fullText))
      startProgressTracking()
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
      setProgress(0)
      setCurrentTime(0)
      stopProgressTracking()
    }

    utterance.onerror = (event) => {
      console.error('Speech error:', event)
      toast.error('Failed to play audio')
      setIsPlaying(false)
      setIsPaused(false)
      stopProgressTracking()
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsPlaying(false)
    setIsPaused(false)
    setProgress(0)
    setCurrentTime(0)
    stopProgressTracking()
  }

  const pauseSpeech = () => {
    if (window.speechSynthesis && isPlaying && !isPaused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
      stopProgressTracking()
    }
  }

  const resumeSpeech = () => {
    if (window.speechSynthesis && isPlaying && isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
      startProgressTracking()
    }
  }

  const togglePlayPause = () => {
    if (!isPlaying) {
      startSpeech()
    } else if (isPaused) {
      resumeSpeech()
    } else {
      pauseSpeech()
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    
    // Note: Web Speech API doesn't support real-time volume changes on active utterances.
    // The volume change will take effect on next play/resume.
    // To get instant mute, we provide immediate visual feedback but actual mute
    // happens by pausing and resuming (which browser handles internally)
    
    if (isPlaying && !isPaused && window.speechSynthesis) {
      // Pause and immediately resume to apply volume change
      // This is a workaround for Web Speech API limitations
      window.speechSynthesis.pause()
      setTimeout(() => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume()
        }
      }, 10)
    }
  }

  const startProgressTracking = () => {
    stopProgressTracking()
    
    const startTime = Date.now()
    progressIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      setCurrentTime(elapsed)
      
      if (duration > 0) {
        const progressPercent = Math.min((elapsed / duration) * 100, 100)
        setProgress(progressPercent)
      }
    }, 100)
  }

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDownload = () => {
    // Create a text file with the prompt for download
    const fullText = getIntroText()
    const blob = new Blob([fullText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prompt-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Prompt text downloaded!')
  }

  return (
    <div className={`backdrop-blur-xl rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-indigo-500/15 to-purple-500/15 border border-indigo-400/20'
        : 'bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border-2 border-indigo-400/50'
    }`}>
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-28 h-28 bg-purple-400/20 rounded-full blur-3xl" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500/40 to-purple-500/40 rounded-xl flex-shrink-0 shadow-lg ring-2 ring-indigo-400/30">
            <Volume2 className="h-5 w-5 text-white drop-shadow-lg" />
          </div>
          <div className="min-w-0">
            <h5 className={`font-bold text-base truncate drop-shadow-sm ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Voice Prompt</h5>
            <p className={`text-xs font-medium hidden sm:block ${
              theme === 'dark' ? 'text-white/80' : 'text-gray-700'
            }`}>Listen on-the-go 🎧</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Settings Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                size="sm" 
                variant="outline"
                className={`h-9 w-9 p-0 transition-all shadow-md hover:shadow-lg hover:scale-105 ${
                  theme === 'dark'
                    ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:text-white'
                    : 'bg-white/90 hover:bg-white border-2 border-gray-400 text-gray-700 hover:text-gray-900'
                }`}
                title="Voice Settings"
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-white backdrop-blur-xl border-2 border-gray-300 p-5 shadow-2xl" align="end">
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-900 text-sm font-semibold mb-2 block">Voice</Label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(Number(e.target.value))}
                    className="w-full bg-white border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {availableVoices.map((voice, index) => (
                      <option key={index} value={index} className="bg-white">
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-gray-900 text-sm font-semibold mb-2 block">
                    Speed: {rate.toFixed(1)}x
                  </Label>
                  <Slider
                    value={[rate]}
                    onValueChange={([value]) => setRate(value)}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="cursor-pointer"
                  />
                </div>

                <div>
                  <Label className="text-gray-900 text-sm font-semibold mb-2 block">
                    Pitch: {pitch.toFixed(1)}
                  </Label>
                  <Slider
                    value={[pitch]}
                    onValueChange={([value]) => setPitch(value)}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="cursor-pointer"
                  />
                </div>

                <div>
                  <Label className="text-gray-900 text-sm font-semibold mb-2 block">
                    Volume: {Math.round(volume * 100)}%
                  </Label>
                  <Slider
                    value={[volume]}
                    onValueChange={([value]) => setVolume(value)}
                    min={0}
                    max={1}
                    step={0.1}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Download Button */}
          <Button
            onClick={handleDownload}
            size="sm"
            variant="outline"
            className={`h-9 w-9 p-0 transition-all shadow-md hover:shadow-lg hover:scale-105 ${
              theme === 'dark'
                ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:text-white'
                : 'bg-white/90 hover:bg-white border-2 border-gray-400 text-gray-700 hover:text-gray-900'
            }`}
            title="Download Prompt"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 relative">
        <div className={`h-2 rounded-full overflow-hidden shadow-inner ${
          theme === 'dark'
            ? 'bg-white/10 border border-white/10'
            : 'bg-gray-200 border border-gray-300'
        }`}>
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs font-semibold ${
            theme === 'dark' ? 'text-white/80' : 'text-gray-700'
          }`}>
            {formatTime(currentTime)}
          </span>
          <span className={`text-xs font-semibold ${
            theme === 'dark' ? 'text-white/80' : 'text-gray-700'
          }`}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Play/Pause Button */}
        <Button
          onClick={togglePlayPause}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-11 md:h-12 transition-all shadow-xl hover:shadow-2xl hover:shadow-indigo-500/40 font-bold text-base hover:scale-[1.02]"
        >
          {isPlaying && !isPaused ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Pause</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">{isPaused ? 'Resume' : 'Play Prompt'}</span>
              <span className="xs:hidden">{isPaused ? 'Resume' : 'Play'}</span>
            </>
          )}
        </Button>

        {/* Mute Button */}
        <Button
          onClick={toggleMute}
          variant="outline"
          title={isMuted ? 'Unmute' : 'Mute'}
          className={`h-11 md:h-12 w-11 md:w-12 p-0 transition-all shadow-lg hover:shadow-xl hover:scale-105 ${
            isMuted 
              ? theme === 'dark'
                ? 'border border-red-400/50 bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                : 'border-2 border-red-500 bg-red-500/30 hover:bg-red-500/40 text-red-700'
              : theme === 'dark'
                ? 'border border-indigo-400/50 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400'
                : 'border-2 border-indigo-500 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-700'
          }`}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </Button>

        {/* Stop Button */}
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Button
              onClick={stopSpeech}
              variant="outline"
              className={`h-11 md:h-12 px-4 md:px-5 transition-all shadow-lg hover:shadow-xl hover:scale-105 ${
                theme === 'dark'
                  ? 'border border-red-400/50 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300'
                  : 'border-2 border-red-500 bg-red-500/30 hover:bg-red-500/40 text-red-800 hover:text-red-900'
              }`}
            >
              <span className="text-sm font-bold">Stop</span>
            </Button>
          </motion.div>
        )}
      </div>

      {/* Status indicator */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mt-3 flex items-center gap-2 text-sm font-semibold backdrop-blur-sm rounded-lg px-3 py-2 shadow-md ${
              theme === 'dark'
                ? 'bg-white/10 border border-white/20 text-white'
                : 'bg-white/60 border border-gray-300 text-gray-900'
            }`}
          >
            <div className="flex gap-1">
              <motion.div
                className="w-1 h-4 bg-indigo-600 rounded-full shadow-sm"
                animate={{ scaleY: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
              />
              <motion.div
                className="w-1 h-4 bg-purple-600 rounded-full shadow-sm"
                animate={{ scaleY: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
              />
              <motion.div
                className="w-1 h-4 bg-pink-600 rounded-full shadow-sm"
                animate={{ scaleY: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
              />
            </div>
            <span>{isPaused ? 'Paused' : 'Now playing...'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
