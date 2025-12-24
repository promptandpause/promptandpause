/**
 * Achievement & Badge System Types
 * Gamification for Prompt & Pause wellness app
 */

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary'

export type BadgeCategory = 
  | 'streak'        // Consistency-based badges
  | 'reflection'    // Reflection count badges
  | 'topic'         // First time using specific tags
  | 'milestone'     // Special milestones
  | 'exploration'   // Trying different features

export interface Badge {
  id: string
  name: string
  description: string
  category: BadgeCategory
  rarity: BadgeRarity
  icon: string // Emoji or icon name
  lottieUrl?: string // Optional Lottie animation URL
  requirement: number // What number triggers this badge
  requirement_type: 'streak' | 'reflection_count' | 'tag_usage' | 'special'
  tag?: string // For topic-based badges
  unlockMessage: string // Message shown when unlocked
}

export interface UserAchievement {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  viewed: boolean
  created_at: string
}

export interface AchievementProgress {
  badge: Badge
  current: number
  required: number
  percentage: number
  unlocked: boolean
  earnedAt?: string
}

// All available badges in the system
export const BADGES: Badge[] = [
  // ============================================
  // STREAK BADGES (Consistency)
  // ============================================
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Complete 3 days in a row',
    category: 'streak',
    rarity: 'common',
    icon: '🌱',
    lottieUrl: 'https://lottie.host/f4c6e0e7-1a89-4c4a-8c4e-2e8a2b1f6d5a/seedling.json',
    requirement: 3,
    requirement_type: 'streak',
    unlockMessage: "You're building a habit! Three days strong! 🌱"
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Complete 7 days in a row',
    category: 'streak',
    rarity: 'common',
    icon: '🔥',
    lottieUrl: 'https://lottie.host/fdd87f0c-d722-4ee7-807d-3cacc38b3eaa/pVAFsFi3si.lottie',
    requirement: 7,
    requirement_type: 'streak',
    unlockMessage: "One week of consistency! You're on fire! 🔥"
  },
  {
    id: 'streak_14',
    name: 'Two Week Champion',
    description: 'Complete 14 days in a row',
    category: 'streak',
    rarity: 'rare',
    icon: '✨',
    lottieUrl: 'https://lottie.host/embed/b4e6d9c8-4f2e-4a1a-9c3d-8e7f6a5b4c3d/star.json',
    requirement: 14,
    requirement_type: 'streak',
    unlockMessage: "Two weeks strong! This is becoming a habit! ✨"
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Complete 30 days in a row',
    category: 'streak',
    rarity: 'epic',
    icon: '🏆',
    lottieUrl: 'https://lottie.host/fdd87f0c-d722-4ee7-807d-3cacc38b3eaa/pVAFsFi3si.lottie',
    requirement: 30,
    requirement_type: 'streak',
    unlockMessage: "30 days! You've built an incredible habit! 🏆"
  },
  {
    id: 'streak_100',
    name: 'Century Club',
    description: 'Complete 100 days in a row',
    category: 'streak',
    rarity: 'legendary',
    icon: '👑',
    lottieUrl: 'https://lottie.host/embed/c5d7e8f9-6a0b-5c2d-9d4e-0f1a2b3c4d5e/crown.json',
    requirement: 100,
    requirement_type: 'streak',
    unlockMessage: "100 days! You're a reflection legend! 👑"
  },
  {
    id: 'streak_365',
    name: 'Year of Reflection',
    description: 'Complete 365 days in a row',
    category: 'streak',
    rarity: 'legendary',
    icon: '🌟',
    lottieUrl: 'https://lottie.host/embed/d6e8f0a1-7b1c-6d3e-0e5f-1a2b3c4d5e6f/star-shine.json',
    requirement: 365,
    requirement_type: 'streak',
    unlockMessage: "A full year of reflection! Absolutely incredible! 🌟"
  },

  // ============================================
  // REFLECTION COUNT BADGES
  // ============================================
  {
    id: 'reflection_1',
    name: 'First Steps',
    description: 'Complete your first reflection',
    category: 'reflection',
    rarity: 'common',
    icon: '🌸',
    lottieUrl: 'https://lottie.host/embed/e7f9a1b2-8c2d-7e4f-1f6a-2b3c4d5e6f7g/flower-bloom.json',
    requirement: 1,
    requirement_type: 'reflection_count',
    unlockMessage: "Your journey begins! First reflection complete! 🌸"
  },
  {
    id: 'reflection_10',
    name: 'Getting the Hang',
    description: 'Complete 10 reflections',
    category: 'reflection',
    rarity: 'common',
    icon: '🌿',
    requirement: 10,
    requirement_type: 'reflection_count',
    unlockMessage: "10 reflections! You're getting the hang of this! 🌿"
  },
  {
    id: 'reflection_50',
    name: 'Thoughtful Mind',
    description: 'Complete 50 reflections',
    category: 'reflection',
    rarity: 'rare',
    icon: '💚',
    requirement: 50,
    requirement_type: 'reflection_count',
    unlockMessage: "50 moments of reflection! Your mind is flourishing! 💚"
  },
  {
    id: 'reflection_100',
    name: 'Reflection Master',
    description: 'Complete 100 reflections',
    category: 'reflection',
    rarity: 'epic',
    icon: '✨',
    lottieUrl: 'https://lottie.host/fdd87f0c-d722-4ee7-807d-3cacc38b3eaa/pVAFsFi3si.lottie',
    requirement: 100,
    requirement_type: 'reflection_count',
    unlockMessage: "100 reflections! You've mastered the art! ✨"
  },
  {
    id: 'reflection_365',
    name: 'Daily Devotee',
    description: 'Complete 365 reflections',
    category: 'reflection',
    rarity: 'legendary',
    icon: '💎',
    requirement: 365,
    requirement_type: 'reflection_count',
    unlockMessage: "365 reflections! Your dedication is inspiring! 💎"
  },
  {
    id: 'reflection_500',
    name: 'Reflection Legend',
    description: 'Complete 500 reflections',
    category: 'reflection',
    rarity: 'legendary',
    icon: '🦋',
    requirement: 500,
    requirement_type: 'reflection_count',
    unlockMessage: "500 reflections! You are a true legend! 🦋"
  },

  // ============================================
  // TOPIC BADGES (First time using tags)
  // ============================================
  {
    id: 'topic_gratitude',
    name: 'Grateful Heart',
    description: 'Reflect on Gratitude for the first time',
    category: 'topic',
    rarity: 'common',
    icon: '🙏',
    requirement: 1,
    requirement_type: 'tag_usage',
    tag: 'Gratitude',
    unlockMessage: "You explored Gratitude! Beautiful! 🙏"
  },
  {
    id: 'topic_relationships',
    name: 'Connection Seeker',
    description: 'Reflect on Relationships for the first time',
    category: 'topic',
    rarity: 'common',
    icon: '💝',
    requirement: 1,
    requirement_type: 'tag_usage',
    tag: 'Relationships',
    unlockMessage: "You explored Relationships! Connecting deeply! 💝"
  },
  {
    id: 'topic_career',
    name: 'Professional Growth',
    description: 'Reflect on Career for the first time',
    category: 'topic',
    rarity: 'common',
    icon: '💼',
    requirement: 1,
    requirement_type: 'tag_usage',
    tag: 'Career',
    unlockMessage: "You explored Career! Growing professionally! 💼"
  },
  {
    id: 'topic_self_care',
    name: 'Self Love',
    description: 'Reflect on Self-care for the first time',
    category: 'topic',
    rarity: 'common',
    icon: '🧘',
    requirement: 1,
    requirement_type: 'tag_usage',
    tag: 'Self-care',
    unlockMessage: "You explored Self-care! Loving yourself! 🧘"
  },
  {
    id: 'topic_health',
    name: 'Wellness Warrior',
    description: 'Reflect on Health for the first time',
    category: 'topic',
    rarity: 'common',
    icon: '💪',
    requirement: 1,
    requirement_type: 'tag_usage',
    tag: 'Health',
    unlockMessage: "You explored Health! Prioritizing wellness! 💪"
  },

  // ============================================
  // MILESTONE BADGES (Special achievements)
  // ============================================
  {
    id: 'milestone_first_save',
    name: 'Journey Begins',
    description: 'Save your very first reflection',
    category: 'milestone',
    rarity: 'common',
    icon: '🎉',
    lottieUrl: 'https://lottie.host/74035e34-689a-490c-ae79-cbf7d5cfb579/xkxsTNCXfh.lottie',
    requirement: 1,
    requirement_type: 'special',
    unlockMessage: "Welcome to your reflection journey! 🎉"
  },
  {
    id: 'milestone_weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Reflect on both Saturday and Sunday',
    category: 'milestone',
    rarity: 'rare',
    icon: '🌅',
    requirement: 1,
    requirement_type: 'special',
    unlockMessage: "Weekends are for reflection too! 🌅"
  },
  {
    id: 'milestone_early_bird',
    name: 'Early Bird',
    description: 'Reflect before 8am',
    category: 'milestone',
    rarity: 'rare',
    icon: '🌄',
    requirement: 1,
    requirement_type: 'special',
    unlockMessage: "Morning reflections are powerful! 🌄"
  },
  {
    id: 'milestone_night_owl',
    name: 'Night Owl',
    description: 'Reflect after 10pm',
    category: 'milestone',
    rarity: 'rare',
    icon: '🌙',
    requirement: 1,
    requirement_type: 'special',
    unlockMessage: "Night time reflections bring clarity! 🌙"
  },
  {
    id: 'milestone_explorer',
    name: 'Topic Explorer',
    description: 'Use all available tags at least once',
    category: 'exploration',
    rarity: 'epic',
    icon: '🗺️',
    requirement: 10,
    requirement_type: 'special',
    unlockMessage: "You've explored all topics! Curious mind! 🗺️"
  },
]

// Helper function to get badge by ID
export function getBadgeById(badgeId: string): Badge | undefined {
  return BADGES.find(badge => badge.id === badgeId)
}

// Helper function to get badges by category
export function getBadgesByCategory(category: BadgeCategory): Badge[] {
  return BADGES.filter(badge => badge.category === category)
}

// Helper function to get badges by rarity
export function getBadgesByRarity(rarity: BadgeRarity): Badge[] {
  return BADGES.filter(badge => badge.rarity === rarity)
}

// Helper function to check if user qualifies for streak badge
export function checkStreakBadges(currentStreak: number): Badge[] {
  return BADGES.filter(
    badge => 
      badge.requirement_type === 'streak' && 
      badge.requirement === currentStreak
  )
}

// Helper function to check if user qualifies for reflection count badge
export function checkReflectionCountBadges(totalReflections: number): Badge[] {
  return BADGES.filter(
    badge => 
      badge.requirement_type === 'reflection_count' && 
      badge.requirement === totalReflections
  )
}

// Helper function to check if user qualifies for tag badge
export function checkTagBadges(tag: string, isFirstTime: boolean): Badge[] {
  if (!isFirstTime) return []
  
  return BADGES.filter(
    badge => 
      badge.requirement_type === 'tag_usage' && 
      badge.tag === tag
  )
}

// Get rarity color for styling
export function getRarityColor(rarity: BadgeRarity): {
  bg: string
  border: string
  text: string
  glow: string
} {
  switch (rarity) {
    case 'common':
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        border: 'border-gray-300 dark:border-gray-600',
        text: 'text-gray-700 dark:text-gray-300',
        glow: 'shadow-gray-400/50'
      }
    case 'rare':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        border: 'border-blue-400 dark:border-blue-500',
        text: 'text-blue-700 dark:text-blue-300',
        glow: 'shadow-blue-400/50'
      }
    case 'epic':
      return {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        border: 'border-purple-400 dark:border-purple-500',
        text: 'text-purple-700 dark:text-purple-300',
        glow: 'shadow-purple-400/50'
      }
    case 'legendary':
      return {
        bg: 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30',
        border: 'border-yellow-500 dark:border-yellow-400',
        text: 'text-yellow-800 dark:text-yellow-300',
        glow: 'shadow-yellow-400/70'
      }
  }
}

// Get category display name
export function getCategoryDisplayName(category: BadgeCategory): string {
  switch (category) {
    case 'streak':
      return 'Consistency'
    case 'reflection':
      return 'Milestones'
    case 'topic':
      return 'Explorer'
    case 'milestone':
      return 'Special'
    case 'exploration':
      return 'Curious'
  }
}
