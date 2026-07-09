"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { useCallback, useEffect, useState } from "react"
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

  const loadUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      loadAchievements(user.id)
    }
  }, [supabase])

  useEffect(() => {
    loadUser()
  }, [loadUser])

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
      data-dashboard
      className={`min-h-screen ${theme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}
    >
      
      <div className="relative z-10 px-3 md:px-6 py-4 md:py-8 pb-32 md:pb-8">
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
            theme === 'dark' ? 'text-white/50' : 'text-[#8A8A7A]'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className={`text-2xl md:text-4xl font-semibold tracking-tight mb-1 md:mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-[#3D3D3D]'
            }`}>
              Achievements
            </h1>
            <p className={`text-sm md:text-lg ${
              theme === 'dark' ? 'text-white/50' : 'text-[#8A8A7A]'
            }`}>
              Your journey of growth and consistency
            </p>
          </div>

          {/* Progress Circle */}
          <div className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 flex-shrink-0 ${
            theme === 'dark' ? 'border-white/8' : 'border-[#E8E5DE]'
          } flex items-center justify-center`}>
            <div className="text-center">
              <div className={`text-xl md:text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-[#3D3D3D]'
              }`}>
                {unlockedCount}
              </div>
              <div className={`text-xs ${
                theme === 'dark' ? 'text-white/40' : 'text-[#8A8A7A]'
              }`}>
                of {totalCount}
              </div>
            </div>
            <Trophy className={`absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 ${
              theme === 'dark' ? 'text-[#C4B5E0]' : 'text-[#7E6BA5]'
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
                  ? 'bg-[#C4B5E0] text-[#1A1A2E] shadow-sm'
                  : 'bg-[#7E6BA5] text-white shadow-sm'
                : theme === 'dark'
                  ? 'bg-white/5 text-white/50 hover:bg-white/8'
                  : 'bg-[#F0EDE6] text-[#5A5A4E] hover:bg-[#E8E5DE]'
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
                      ? 'bg-[#C4B5E0] text-[#1A1A2E] shadow-sm'
                      : 'bg-[#7E6BA5] text-white shadow-sm'
                    : theme === 'dark'
                      ? 'bg-white/5 text-white/50 hover:bg-white/8'
                      : 'bg-[#F0EDE6] text-[#5A5A4E] hover:bg-[#E8E5DE]'
                }`}
              >
                <span className="text-base md:text-lg">{category.icon}</span>
                <span className="hidden sm:inline">{category.name}</span>
                <span className={`text-xs px-1.5 md:px-2 py-0.5 rounded-full ${
                  selectedCategory === category.key
                    ? 'bg-white/20'
                    : theme === 'dark'
                      ? 'bg-white/8'
                      : 'bg-[#E8E5DE]'
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
              theme === 'dark' ? 'text-white/40' : 'text-[#8A8A7A]'
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
          ? 'bg-white/5 border border-white/8'
          : 'bg-[#FFFFFF] border border-[#EFF3F4]'
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
            theme === 'dark' ? 'bg-black/50' : 'bg-[#FFFFFF]/80'
          } backdrop-blur-sm`}>
            <Lock className={`w-5 h-5 md:w-6 md:h-6 ${
              theme === 'dark' ? 'text-white/40' : 'text-[#A0A090]'
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
          theme === 'dark' ? 'text-white' : 'text-[#3D3D3D]'
        }`}>
          {badge.name}
        </h3>

        {/* Description */}
        <p className={`text-[10px] md:text-xs line-clamp-2 leading-snug ${
          theme === 'dark' ? 'text-white/50' : 'text-[#8A8A7A]'
        }`}>
          {badge.description}
        </p>

        {/* Earned Date */}
        {isUnlocked && earnedAt && (
          <div className={`mt-1.5 md:mt-2 pt-1.5 md:pt-2 border-t text-[10px] md:text-xs ${
            theme === 'dark' ? 'border-white/8 text-white/40' : 'border-[#E8E5DE] text-[#8A8A7A]'
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
