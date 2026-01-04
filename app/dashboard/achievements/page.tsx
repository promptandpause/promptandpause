"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useTheme } from "@/contexts/ThemeContext"
import {
  BADGES,
  Badge,
  getBadgesByCategory,
  getCategoryDisplayName,
  getRarityColor
} from "@/lib/types/achievements"
import { achievementService } from "@/lib/services/achievementService"
import { Trophy, Lock, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { BadgeIcon } from "./components/BadgeIcon"
import { BubbleBackground } from "@/components/ui/bubble-background"

export default function AchievementsPage() {
  return (
    <AuthGuard redirectPath="/dashboard/achievements">
      <AchievementsPageContent />
    </AuthGuard>
  )
}

function AchievementsPageContent() {
  const supabase = getSupabaseClient()
  const { theme } = useTheme()
  const [achievements, setAchievements] = useState<Map<string, { unlocked: boolean, earnedAt?: string }>>(new Map())
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      loadAchievements(user.id)
    }
  }

  async function loadAchievements(uid: string) {
    setLoading(true)
    const progress = await achievementService.getAchievementProgress(uid)
    setAchievements(progress)
    setLoading(false)
  }

  const categories = [
    { key: 'streak', name: getCategoryDisplayName('streak'), icon: '🔥' },
    { key: 'reflection', name: getCategoryDisplayName('reflection'), icon: '📝' },
    { key: 'topic', name: getCategoryDisplayName('topic'), icon: '🏷️' },
    { key: 'milestone', name: getCategoryDisplayName('milestone'), icon: '⭐' },
    { key: 'exploration', name: getCategoryDisplayName('exploration'), icon: '🌟' }
  ]

  const displayedBadges = selectedCategory
    ? getBadgesByCategory(selectedCategory as any)
    : BADGES

  const unlockedCount = Array.from(achievements.values()).filter(a => a.unlocked).length
  const totalCount = BADGES.length

  return (
    <div 
      className="min-h-screen relative" 
      style={theme === 'light' 
        ? { background: 'linear-gradient(135deg, #f4f0eb 0%, #a1a79e 45%, #384c37 100%)' } 
        : { background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)' }}
    >
      {/* Animated Bubble Background */}
      <BubbleBackground 
        interactive
        className="fixed inset-0 -z-10"
      />
      {/* Theme overlay for cohesive background */}
      <div className={`fixed inset-0 -z-10 ${theme === 'light' ? 'bg-white/35' : 'bg-black/25'}`} />
      
      <div className="relative z-10 px-3 md:px-6 py-4 md:py-8 pb-24 md:pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto mb-6 md:mb-8"
      >
        <Link
          href="/dashboard"
          className={`inline-flex items-center gap-2 mb-3 md:mb-4 text-sm hover:opacity-70 transition-opacity ${
            theme === 'dark' ? 'text-white/70' : 'text-gray-600'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className={`text-2xl md:text-4xl font-bold mb-1 md:mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Achievements
            </h1>
            <p className={`text-sm md:text-lg ${
              theme === 'dark' ? 'text-white/70' : 'text-gray-600'
            }`}>
              Your journey of growth and consistency
            </p>
          </div>

          {/* Progress Circle */}
          <div className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 flex-shrink-0 ${
            theme === 'dark' ? 'border-white/10' : 'border-gray-200'
          } flex items-center justify-center`}>
            <div className="text-center">
              <div className={`text-xl md:text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {unlockedCount}
              </div>
              <div className={`text-xs ${
                theme === 'dark' ? 'text-white/50' : 'text-gray-500'
              }`}>
                of {totalCount}
              </div>
            </div>
            <Trophy className={`absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 ${
              theme === 'dark' ? 'text-orange-400' : 'text-orange-500'
            }`} />
          </div>
        </div>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="max-w-6xl mx-auto mb-6 md:mb-8"
      >
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-medium transition-all ${
              selectedCategory === null
                ? theme === 'dark'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-orange-400 text-white shadow-lg shadow-orange-400/30'
                : theme === 'dark'
                  ? 'bg-white/5 text-white/70 hover:bg-white/10'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((category) => {
            const categoryBadges = getBadgesByCategory(category.key as any)
            const unlockedInCategory = categoryBadges.filter(b => achievements.get(b.id)?.unlocked).length

            return (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-medium transition-all flex items-center gap-1.5 md:gap-2 ${
                  selectedCategory === category.key
                    ? theme === 'dark'
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-orange-400 text-white shadow-lg shadow-orange-400/30'
                    : theme === 'dark'
                      ? 'bg-white/5 text-white/70 hover:bg-white/10'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-base md:text-lg">{category.icon}</span>
                <span className="hidden sm:inline">{category.name}</span>
                <span className={`text-xs px-1.5 md:px-2 py-0.5 rounded-full ${
                  selectedCategory === category.key
                    ? 'bg-white/20'
                    : theme === 'dark'
                      ? 'bg-white/10'
                      : 'bg-gray-200'
                }`}>
                  {unlockedInCategory}/{categoryBadges.length}
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Badges Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="max-w-6xl mx-auto"
      >
        {loading ? (
          <div className="text-center py-12">
            <div className={`text-lg ${
              theme === 'dark' ? 'text-white/50' : 'text-gray-500'
            }`}>
              Loading achievements...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {displayedBadges.map((badge, index) => {
              const isUnlocked = achievements.get(badge.id)?.unlocked || false
              const earnedAt = achievements.get(badge.id)?.earnedAt
              const rarityColors = getRarityColor(badge.rarity)

              return (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  isUnlocked={isUnlocked}
                  earnedAt={earnedAt}
                  theme={theme}
                  index={index}
                />
              )
            })}
          </div>
        )}
      </motion.div>
      </div>
    </div>
  )
}

interface BadgeCardProps {
  badge: Badge
  isUnlocked: boolean
  earnedAt?: string
  theme: 'dark' | 'light'
  index: number
}

function BadgeCard({ badge, isUnlocked, earnedAt, theme, index }: BadgeCardProps) {
  const rarityColors = getRarityColor(badge.rarity)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.03,
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      whileHover={isUnlocked ? { scale: 1.05, y: -5 } : undefined}
      className={`relative p-3 md:p-4 rounded-xl md:rounded-2xl transition-all backdrop-blur-sm ${
        theme === 'dark'
          ? 'bg-white/5 border border-white/10'
          : 'bg-white border border-gray-200'
      } ${
        isUnlocked
          ? 'shadow-lg hover:shadow-xl cursor-pointer'
          : 'opacity-50'
      }`}
    >
      {/* Locked Overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center z-10 rounded-xl md:rounded-2xl">
          <div className={`p-2 md:p-3 rounded-full ${
            theme === 'dark' ? 'bg-black/50' : 'bg-white/80'
          } backdrop-blur-sm`}>
            <Lock className={`w-5 h-5 md:w-6 md:h-6 ${
              theme === 'dark' ? 'text-white/50' : 'text-gray-400'
            }`} />
          </div>
        </div>
      )}

      {/* Badge Content */}
      <div className={`relative ${!isUnlocked ? 'blur-sm' : ''}`}>
        {/* Badge Icon with Lottie Animation */}
        <div className={`w-full aspect-square mb-2 md:mb-3 rounded-lg md:rounded-xl overflow-hidden ${
          isUnlocked ? rarityColors.bg : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
        } ${
          isUnlocked && badge.rarity === 'legendary' ? 'shadow-lg ' + rarityColors.glow : ''
        }`}>
          <BadgeIcon badge={badge} isUnlocked={isUnlocked} size="md" />
        </div>

        {/* Rarity Badge */}
        <div className={`inline-block px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium mb-1.5 md:mb-2 capitalize ${
          isUnlocked ? `${rarityColors.bg} ${rarityColors.text}` : theme === 'dark' ? 'bg-white/5 text-white/50' : 'bg-gray-100 text-gray-500'
        }`}>
          {badge.rarity}
        </div>

        {/* Badge Name */}
        <h3 className={`font-bold text-xs md:text-sm mb-0.5 md:mb-1 line-clamp-2 leading-tight ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          {badge.name}
        </h3>

        {/* Description */}
        <p className={`text-[10px] md:text-xs line-clamp-2 leading-snug ${
          theme === 'dark' ? 'text-white/60' : 'text-gray-600'
        }`}>
          {badge.description}
        </p>

        {/* Earned Date */}
        {isUnlocked && earnedAt && (
          <div className={`mt-1.5 md:mt-2 pt-1.5 md:pt-2 border-t text-[10px] md:text-xs ${
            theme === 'dark' ? 'border-white/10 text-white/50' : 'border-gray-200 text-gray-500'
          }`}>
            {new Date(earnedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
