"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Badge } from "@/lib/types/achievements"

// Dynamically import Lottie to reduce bundle size
const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

interface BadgeIconProps {
  badge: Badge
  isUnlocked: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function BadgeIcon({ badge, isUnlocked, size = "md", className = "" }: BadgeIconProps) {
  const [lottieError, setLottieError] = useState(false)
  const [animationData, setAnimationData] = useState<any>(null)

  // Size configurations
  const sizeClasses = {
    sm: "w-12 h-12 text-2xl",
    md: "w-full aspect-square text-4xl md:text-5xl",
    lg: "w-32 h-32 text-6xl"
  }

  // Load Lottie animation if available and unlocked
  const loadLottieAnimation = async () => {
    if (!badge.lottieUrl || !isUnlocked || lottieError) return

    try {
      const response = await fetch(badge.lottieUrl)
      if (response.ok) {
        const data = await response.json()
        setAnimationData(data)
      } else {
        setLottieError(true)
      }
    } catch (error) {
      setLottieError(true)
    }
  }

  // Load animation on hover for unlocked badges with Lottie support
  const handleMouseEnter = () => {
    if (badge.lottieUrl && isUnlocked && !animationData && !lottieError) {
      loadLottieAnimation()
    }
  }

  // Show Lottie animation if available
  if (animationData && isUnlocked) {
    return (
      <div 
        className={`${sizeClasses[size]} flex items-center justify-center ${className}`}
        onMouseEnter={handleMouseEnter}
      >
        <Lottie
          animationData={animationData}
          loop={badge.rarity === 'legendary'}
          autoplay={true}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    )
  }

  // Fallback to emoji
  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center ${className}`}
      onMouseEnter={handleMouseEnter}
    >
      <span className="select-none">{badge.icon}</span>
    </div>
  )
}
