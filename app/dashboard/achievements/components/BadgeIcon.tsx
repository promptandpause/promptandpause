"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faBriefcase,
  faCakeCandles,
  faChampagneGlasses,
  faCrown,
  faDove,
  faDumbbell,
  faFire,
  faGem,
  faHandsPraying,
  faHeart,
  faLeaf,
  faMap,
  faMedal,
  faMoon,
  faSeedling,
  faSpa,
  faSprout,
  faStar,
  faSun,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons"
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import { Badge } from "@/lib/types/achievements"

// Dynamically import Lottie to reduce bundle size
const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

interface BadgeIconProps {
  badge: Badge
  isUnlocked: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const BADGE_ICONS: Record<string, IconDefinition> = {
  streak_3: faSeedling,
  streak_7: faFire,
  streak_14: faStar,
  streak_30: faCrown,
  streak_100: faCrown,
  streak_365: faStar,
  reflection_1: faSprout,
  reflection_10: faLeaf,
  reflection_50: faHeart,
  reflection_100: faWandMagicSparkles,
  reflection_365: faGem,
  reflection_500: faDove,
  topic_gratitude: faHandsPraying,
  topic_relationships: faHeart,
  topic_career: faBriefcase,
  topic_self_care: faSpa,
  topic_health: faDumbbell,
  milestone_first_save: faCakeCandles,
  milestone_weekend_warrior: faChampagneGlasses,
  milestone_early_bird: faSun,
  milestone_night_owl: faMoon,
  milestone_explorer: faMap,
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

  // Fallback to Font Awesome icon
  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center ${className}`}
      onMouseEnter={handleMouseEnter}
    >
      <FontAwesomeIcon
        icon={BADGE_ICONS[badge.id] ?? faMedal}
        className="select-none"
      />
    </div>
  )
}
