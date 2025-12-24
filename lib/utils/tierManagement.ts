/**
 * Tier Management System for Prompt & Pause
 * 
 * Handles feature access control based on subscription tier.
 * Automatically syncs with Stripe subscription status.
 */

export type SubscriptionTier = 'free' | 'premium'
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete'

// =============================================================================
// TIER CONFIGURATION
// =============================================================================

/**
 * Free Tier: "Start Your Practice"
 * £0/month - Forever Free
 */
export const FREE_TIER_FEATURES = {
  // Prompts
  promptsPerWeek: 3,
  promptDays: ['monday', 'wednesday', 'friday'],
  dailyPrompts: false,
  customPromptTime: true, // Can choose time
  
  // Delivery
  emailDelivery: true,
  slackDelivery: false,
  voiceNotePrompts: false,
  
  // Tracking & Archive
  basicMoodTracking: true,
  advancedAnalytics: false,
  unlimitedArchive: false,
  archiveLimit: 50, // Last 50 reflections only
  searchReflections: false,
  exportReflections: false,
  
  // Insights
  weeklyDigest: false,
  moodTrends: false,
  aiInsights: false,
  
  // Focus Areas
  customFocusAreas: false,
  focusAreaLimit: 3, // Max 3 predefined areas
  
  // Support
  crisisResources: true,
  emailSupport: false, // Community support only
  prioritySupport: false,
} as const

/**
 * Premium Tier: "Deepen Your Reflection"
 * £12/month or £99/year
 */
export const PREMIUM_TIER_FEATURES = {
  // Prompts
  promptsPerWeek: 7,
  promptDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  dailyPrompts: true,
  customPromptTime: true,
  
  // Delivery
  emailDelivery: true,
  slackDelivery: true,
  voiceNotePrompts: true,
  flexibleDeliveryTime: true, // 7am - 9pm range
  
  // Tracking & Archive
  basicMoodTracking: true,
  advancedAnalytics: true,
  unlimitedArchive: true,
  archiveLimit: null, // Unlimited
  searchReflections: true,
  exportReflections: true, // PDF & TXT
  
  // Insights
  weeklyDigest: true,
  moodTrends: true,
  aiInsights: true,
  emotionalPatterns: true,
  
  // Focus Areas
  customFocusAreas: true,
  focusAreaLimit: null, // Unlimited
  targetedPrompts: true,
  
  // Support
  crisisResources: true,
  emailSupport: true,
  prioritySupport: true, // 24hr response time
  prioritySupportResponseTime: '24 hours',
} as const

// =============================================================================
// TIER DETECTION
// =============================================================================

/**
 * Determine user's current tier based on subscription status
 * Updated to work with subscription_status field directly and handle trial expiration
 */
export function getUserTier(
  subscriptionStatus?: string | null,
  subscriptionTier?: string | null,
  subscriptionEndDate?: string | Date | null
): SubscriptionTier {
  // Check if trial/subscription has expired
  if (subscriptionEndDate) {
    const endDate = typeof subscriptionEndDate === 'string' ? new Date(subscriptionEndDate) : subscriptionEndDate
    const now = new Date()
    
    // If subscription has expired and user doesn't have active Stripe subscription
    if (endDate < now && subscriptionStatus === 'premium' && !subscriptionTier) {
      // Trial has expired, should be downgraded to free
      return 'free'
    }
  }
  
  // Check subscription_status directly (premium/freemium/cancelled)
  if (subscriptionStatus === 'premium') {
    return 'premium'
  }
  
  // Legacy support: check old subscription_tier field if it exists
  if (
    subscriptionTier === 'premium' &&
    (subscriptionStatus === 'active' || subscriptionStatus === 'trialing')
  ) {
    return 'premium'
  }
  
  // Default to free for any other case
  return 'free'
}

/**
 * Check if user has active premium subscription
 */
export function isPremiumUser(
  subscriptionStatus?: string | null,
  subscriptionTier?: string | null,
  subscriptionEndDate?: string | Date | null
): boolean {
  return getUserTier(subscriptionStatus, subscriptionTier, subscriptionEndDate) === 'premium'
}

/**
 * Get features available for a specific tier
 */
export function getTierFeatures(tier: SubscriptionTier) {
  return tier === 'premium' ? PREMIUM_TIER_FEATURES : FREE_TIER_FEATURES
}

/**
 * Get features for current user
 */
export function getUserFeatures(
  subscriptionStatus?: string | null,
  subscriptionTier?: string | null,
  subscriptionEndDate?: string | Date | null
) {
  const tier = getUserTier(subscriptionStatus, subscriptionTier, subscriptionEndDate)
  return getTierFeatures(tier)
}

// =============================================================================
// FEATURE ACCESS CHECKS
// =============================================================================

/**
 * Check if user can access a specific feature
 */
export function canAccessFeature(
  feature: keyof typeof FREE_TIER_FEATURES,
  subscriptionStatus?: string | null,
  subscriptionTier?: string | null,
  subscriptionEndDate?: string | Date | null
): boolean {
  const features = getUserFeatures(subscriptionStatus, subscriptionTier, subscriptionEndDate)
  const value = features[feature]
  
  // If it's a boolean, return it directly
  if (typeof value === 'boolean') {
    return value
  }
  
  // If it's a number, check if it's greater than 0
  if (typeof value === 'number') {
    return value > 0
  }
  
  // If it's an array, check if it has items
  if (Array.isArray(value)) {
    return value.length > 0
  }
  
  // Default to true for other types (like null for unlimited)
  return true
}

/**
 * Get weekly prompt allowance for user
 */
export function getWeeklyPromptAllowance(
  subscriptionStatus?: string | null,
  subscriptionTier?: string | null,
  subscriptionEndDate?: string | Date | null
): number {
  const features = getUserFeatures(subscriptionStatus, subscriptionTier, subscriptionEndDate)
  return features.promptsPerWeek
}

/**
 * Check if user can create more reflections this week
 */
export function canCreateReflection(
  currentWeekReflections: number,
  subscriptionStatus?: string | null,
  subscriptionTier?: string | null,
  subscriptionEndDate?: string | Date | null
): boolean {
  const allowance = getWeeklyPromptAllowance(subscriptionStatus, subscriptionTier, subscriptionEndDate)
  return currentWeekReflections < allowance
}

/**
 * Get archive limit for user
 */
export function getArchiveLimit(
  subscriptionStatus?: string | null,
  subscriptionTier?: string | null,
  subscriptionEndDate?: string | Date | null
): number | null {
  const features = getUserFeatures(subscriptionStatus, subscriptionTier, subscriptionEndDate)
  return features.archiveLimit
}

/**
 * Check if user can access specific reflection
 * (Free users can only access last N reflections)
 */
export function canAccessReflection(
  reflectionIndex: number, // 0 = most recent
  totalReflections: number,
  subscriptionStatus?: string | null,
  subscriptionTier?: string | null,
  subscriptionEndDate?: string | Date | null
): boolean {
  const limit = getArchiveLimit(subscriptionStatus, subscriptionTier, subscriptionEndDate)
  
  // Premium users (unlimited) can access all
  if (limit === null) {
    return true
  }
  
  // Free users can only access last N reflections
  return reflectionIndex < limit
}

// =============================================================================
// PROMPT SCHEDULING
// =============================================================================

/**
 * Get allowed prompt days for user
 */
export function getAllowedPromptDays(
  subscriptionStatus?: string | null,
  subscriptionTier?: string | null,
  subscriptionEndDate?: string | Date | null
): string[] {
  const features = getUserFeatures(subscriptionStatus, subscriptionTier, subscriptionEndDate)
  return features.promptDays
}

/**
 * Check if today is a prompt day for user
 */
export function isTodayPromptDay(
  subscriptionStatus?: string | null,
  subscriptionTier?: string | null,
  subscriptionEndDate?: string | Date | null
): boolean {
  const allowedDays = getAllowedPromptDays(subscriptionStatus, subscriptionTier, subscriptionEndDate)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  return allowedDays.includes(today)
}

/**
 * Get next prompt day for user
 */
export function getNextPromptDay(
  subscriptionStatus?: string | null,
  subscriptionTier?: string | null,
  subscriptionEndDate?: string | Date | null
): string {
  const allowedDays = getAllowedPromptDays(subscriptionStatus, subscriptionTier, subscriptionEndDate)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const currentDayIndex = daysOfWeek.indexOf(today)
  
  // Find next allowed day
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7
    const nextDay = daysOfWeek[nextDayIndex]
    if (allowedDays.includes(nextDay)) {
      return nextDay.charAt(0).toUpperCase() + nextDay.slice(1)
    }
  }
  
  return 'Monday' // Fallback
}

// =============================================================================
// UPGRADE PROMPTS & MESSAGING
// =============================================================================

/**
 * Get upgrade prompt message for a locked feature
 */
export function getUpgradeMessage(feature: string): string {
  const messages: Record<string, string> = {
    dailyPrompts: 'Upgrade to Premium for daily prompts (7 days/week) instead of 3x per week.',
    weeklyDigest: 'Upgrade to Premium to receive weekly AI-generated insights about your emotional patterns.',
    advancedAnalytics: 'Upgrade to Premium to see mood trends and visual charts over time.',
    unlimitedArchive: 'Free tier limited to 20 recent reflections. Upgrade to Premium for unlimited archive access.',
    searchReflections: 'Upgrade to Premium to search through all your past reflections.',
    exportReflections: 'Upgrade to Premium to export your reflections as PDF or text files.',
    slackDelivery: 'Upgrade to Premium to receive prompts via Slack.',
    voiceNotePrompts: 'Upgrade to Premium to listen to prompts as voice notes.',
    customFocusAreas: 'Upgrade to Premium for unlimited custom focus areas and targeted prompts.',
    prioritySupport: 'Upgrade to Premium for priority email support with 24-hour response time.',
  }
  
  return messages[feature] || 'Upgrade to Premium to unlock this feature.'
}

/**
 * Get benefits of upgrading
 */
export function getUpgradeBenefits(): string[] {
  return [
    'Daily personalized prompts (7 days/week)',
    'Unlimited reflection archive',
    'Weekly insight digest with AI analysis',
    'Advanced mood analytics & trends',
    'Slack & voice note delivery options',
    'Export reflections as PDF/TXT',
    'Custom focus areas & targeted prompts',
    'Priority email support (24hr response)',
  ]
}

/**
 * Calculate savings for annual plan
 */
export function getAnnualSavings(): { monthly: number; annual: number; savings: number } {
  const monthlyPrice = 12 // £12/month
  const annualPrice = 99 // £99/year
  const monthlyAnnual = monthlyPrice * 12 // £144/year
  const savings = monthlyAnnual - annualPrice // £45 savings
  
  return {
    monthly: monthlyPrice,
    annual: annualPrice,
    savings,
  }
}

// =============================================================================
// TIER COMPARISON
// =============================================================================

/**
 * Get tier comparison data for pricing page
 */
export function getTierComparison() {
  return {
    free: {
      name: 'Start Your Practice',
      price: {
        monthly: 0,
        annual: 0,
      },
      description: 'Perfect for exploring reflection for the first time',
      features: [
        { name: '3 personalized prompts per week', included: true },
        { name: 'Basic mood tracking (1-10 scale)', included: true },
        { name: 'UK mental health crisis resources', included: true },
        { name: 'Email delivery at chosen time', included: true },
        { name: 'Access to last 20 reflections', included: true },
        { name: 'Daily prompts (7 days/week)', included: false },
        { name: 'Unlimited reflection archive', included: false },
        { name: 'Weekly AI insight digest', included: false },
        { name: 'Advanced mood analytics', included: false },
        { name: 'Slack & voice note delivery', included: false },
        { name: 'Export reflections', included: false },
        { name: 'Custom focus areas', included: false },
        { name: 'Priority support', included: false },
      ],
    },
    premium: {
      name: 'Deepen Your Reflection',
      price: {
        monthly: 12,
        annual: 99,
        savings: 45,
      },
      description: 'For professionals building a sustainable mental health practice',
      features: [
        { name: 'Daily personalized prompts (7 days/week)', included: true, highlight: true },
        { name: 'Unlimited reflection archive', included: true, highlight: true },
        { name: 'Weekly AI insight digest', included: true, highlight: true },
        { name: 'Advanced mood analytics & charts', included: true, highlight: true },
        { name: 'Flexible delivery (Email OR Slack)', included: true },
        { name: 'Voice note prompts option', included: true },
        { name: 'Custom focus areas (unlimited)', included: true },
        { name: 'Export reflections (PDF/TXT)', included: true },
        { name: 'Priority email support (24hr)', included: true },
        { name: 'UK mental health crisis resources', included: true },
        { name: 'All Free tier features', included: true },
      ],
    },
  }
}

// =============================================================================
// SUBSCRIPTION STATUS HELPERS
// =============================================================================

/**
 * Check if subscription is in good standing
 */
export function isSubscriptionActive(status?: string | null): boolean {
  return status === 'active' || status === 'trialing'
}

/**
 * Check if subscription needs attention
 */
export function needsSubscriptionAttention(status?: string | null): boolean {
  return status === 'past_due' || status === 'incomplete'
}

/**
 * Check if subscription is cancelled but still active
 */
export function isCancelledButActive(
  status?: string | null,
  endDate?: Date | string | null
): boolean {
  if (status !== 'cancelled') return false
  if (!endDate) return false
  
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  return end > new Date() // Still has access until end date
}

/**
 * Get user-friendly subscription status message
 */
export function getSubscriptionStatusMessage(
  status?: string | null,
  endDate?: Date | string | null
): string {
  if (!status || status === 'active') {
    return 'Your Premium subscription is active'
  }
  
  if (status === 'trialing') {
    return 'You are on a Premium trial'
  }
  
  if (status === 'cancelled' && endDate) {
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate
    if (end > new Date()) {
      const daysLeft = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return `Premium access until ${end.toLocaleDateString()} (${daysLeft} days)`
    }
    return 'Your Premium subscription has ended'
  }
  
  if (status === 'past_due') {
    return 'Payment failed - Please update your payment method'
  }
  
  if (status === 'incomplete') {
    return 'Payment incomplete - Please complete your subscription'
  }
  
  return 'Free tier'
}

// =============================================================================
// FEATURE FLAGS FOR UI
// =============================================================================

/**
 * Generate feature flags object for UI components
 */
export function getFeatureFlags(
  subscriptionStatus?: string | null,
  subscriptionTier?: string | null,
  subscriptionEndDate?: string | Date | null
) {
  const features = getUserFeatures(subscriptionStatus, subscriptionTier, subscriptionEndDate)
  const isPremium = isPremiumUser(subscriptionStatus, subscriptionTier, subscriptionEndDate)
  
  return {
    // Tier
    tier: getUserTier(subscriptionStatus, subscriptionTier, subscriptionEndDate),
    isPremium,
    isFree: !isPremium,
    
    // Prompts
    canAccessDailyPrompts: features.dailyPrompts,
    promptsPerWeek: features.promptsPerWeek,
    allowedPromptDays: features.promptDays,
    
    // Archive
    hasUnlimitedArchive: features.unlimitedArchive,
    archiveLimit: features.archiveLimit,
    canSearchReflections: features.searchReflections,
    canExportReflections: features.exportReflections,
    
    // Analytics
    hasAdvancedAnalytics: features.advancedAnalytics,
    hasWeeklyDigest: features.weeklyDigest,
    hasMoodTrends: features.moodTrends,
    
    // Delivery
    canUseSlack: features.slackDelivery,
    canUseVoiceNotes: features.voiceNotePrompts,
    
    // Focus Areas
    hasCustomFocusAreas: features.customFocusAreas,
    focusAreaLimit: features.focusAreaLimit,
    
    // Support
    hasPrioritySupport: features.prioritySupport,
    
    // UI
    shouldShowUpgrade: !isPremium,
    shouldShowManageSubscription: isPremium,
  }
}

export default {
  getUserTier,
  isPremiumUser,
  getTierFeatures,
  getUserFeatures,
  canAccessFeature,
  getWeeklyPromptAllowance,
  canCreateReflection,
  getArchiveLimit,
  canAccessReflection,
  getAllowedPromptDays,
  isTodayPromptDay,
  getNextPromptDay,
  getUpgradeMessage,
  getUpgradeBenefits,
  getAnnualSavings,
  getTierComparison,
  isSubscriptionActive,
  needsSubscriptionAttention,
  isCancelledButActive,
  getSubscriptionStatusMessage,
  getFeatureFlags,
}
