"use client"

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface TrialCountdownProps {
  trialEndDate: Date
  className?: string
  showIcon?: boolean
  compact?: boolean
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

export function TrialCountdown({ 
  trialEndDate, 
  className = '', 
  showIcon = true,
  compact = false 
}: TrialCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  })

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime()
      const end = new Date(trialEndDate).getTime()
      const total = end - now

      if (total <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0
        })
        return
      }

      const days = Math.floor(total / (1000 * 60 * 60 * 24))
      const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((total % (1000 * 60)) / 1000)

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        total
      })
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [trialEndDate])

  if (timeRemaining.total <= 0) {
    return (
      <span className={className}>
        Trial expired
      </span>
    )
  }

  if (compact) {
    return (
      <span className={className}>
        {showIcon && <Clock className="inline h-3 w-3 mr-1" />}
        {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
      </span>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && <Clock className="h-4 w-4" />}
      <div className="flex items-center gap-1">
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg tabular-nums">
            {String(timeRemaining.days).padStart(2, '0')}
          </span>
          <span className="text-xs opacity-70">days</span>
        </div>
        <span className="font-bold text-lg opacity-50">:</span>
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg tabular-nums">
            {String(timeRemaining.hours).padStart(2, '0')}
          </span>
          <span className="text-xs opacity-70">hrs</span>
        </div>
        <span className="font-bold text-lg opacity-50">:</span>
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg tabular-nums">
            {String(timeRemaining.minutes).padStart(2, '0')}
          </span>
          <span className="text-xs opacity-70">min</span>
        </div>
        <span className="font-bold text-lg opacity-50">:</span>
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg tabular-nums">
            {String(timeRemaining.seconds).padStart(2, '0')}
          </span>
          <span className="text-xs opacity-70">sec</span>
        </div>
      </div>
    </div>
  )
}
