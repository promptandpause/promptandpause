// =============================================================================
// DATABASE TYPES - Match Supabase schema
// =============================================================================

export type MoodType = "😔" | "😐" | "😊" | "😄" | "🤔" | "😌" | "🙏" | "💪"

export type SubscriptionTier = "freemium" | "premium"
export type SubscriptionStatus = "active" | "cancelled" | "expired"
export type DeliveryMethod = "email" | "slack" | "both"
export type PromptFrequency = "daily" | "weekdays" | "every-other-day" | "twice-weekly" | "weekly" | "custom"
export type AIProvider = "gemini" | "openai" | "groq"

export type PromptType = "noticing" | "naming" | "contrast" | "perspective" | "closure" | "grounding"

// Focus area data types
export interface FocusArea {
  id: string
  user_id: string
  name: string
  description?: string
  icon?: string
  color?: string
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PromptFocusAreaUsage {
  id: string
  prompt_id: string
  focus_area_id?: string
  focus_area_name: string
  user_id: string
  created_at: string
}

// =============================================================================
// USER TYPES
// =============================================================================

export interface User {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  timezone: string
  language_code: string
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  reason: string | null
  current_mood: number | null
  prompt_time: string
  prompt_frequency: PromptFrequency
  custom_days: string[] | null
  delivery_method: DeliveryMethod
  slack_webhook_url: string | null
  focus_areas: string[]
  push_notifications: boolean
  daily_reminders: boolean
  weekly_digest: boolean
  created_at: string
  updated_at: string
}

// =============================================================================
// REFLECTION TYPES
// =============================================================================

export interface Reflection {
  id: string
  user_id: string
  prompt_id: string | null
  prompt_text: string
  reflection_text: string
  mood: MoodType
  tags: string[]
  word_count: number
  feedback: "helped" | "irrelevant" | null
  date: string
  created_at: string
  updated_at: string
}

// For creating a new reflection (client-side)
export interface CreateReflectionInput {
  prompt_text: string
  reflection_text: string
  mood: MoodType
  tags: string[]
  prompt_id?: string
}

export interface MoodEntry {
  id: string
  user_id: string
  reflection_id: string | null
  mood: MoodType
  date: string
  created_at: string
}

// =============================================================================
// PROMPT TYPES
// =============================================================================

export interface PromptHistory {
  id: string
  user_id: string
  prompt_text: string
  ai_provider: AIProvider
  ai_model: string
  provider?: string // New field: tracks which provider generated it
  model?: string // New field: specific model used (e.g., deepseek/deepseek-chat-v3.1:free)
  focus_area_used?: string // New field: focus area prioritized for this prompt
  prompt_type?: PromptType
  personalization_context: Record<string, any> | null
  date_generated: string
  used: boolean
  created_at: string
}

export interface GeneratePromptContext {
  focus_areas: string[]
  focus_area_weights?: Record<string, number> // For premium weighted random selection
  focus_area_name?: string // Selected focus area for this generation
  recent_moods: MoodType[]
  recent_topics: string[]
  user_reason?: string
  current_streak?: number
  recent_prompt_types?: PromptType[]
}

export interface GeneratePromptResult {
  prompt: string
  provider: string // e.g., "openai", "gemini", "openrouter"
  model: string // specific model used
  focus_area_used?: string // focus area that was prioritized
  prompt_type?: PromptType
}

// =============================================================================
// SUBSCRIPTION TYPES
// =============================================================================

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  stripe_price_id: string
  status: string
  plan_type: "monthly" | "annual"
  amount: number
  currency: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  canceled_at: string | null
  created_at: string
  updated_at: string
}

// =============================================================================
// EMAIL TYPES
// =============================================================================

export interface EmailDeliveryLog {
  id: string
  user_id: string
  email_type: "daily_prompt" | "weekly_digest" | "welcome" | "subscription_confirm" | "subscription_cancelled"
  resend_email_id: string | null
  recipient_email: string
  status: "sent" | "delivered" | "opened" | "clicked" | "bounced" | "failed"
  error_message: string | null
  sent_at: string
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
}

// =============================================================================
// ANALYTICS TYPES
// =============================================================================

export interface WeeklyDigest {
  weekStart: string
  weekEnd: string
  totalReflections: number
  topTags: { tag: string; count: number }[]
  moodDistribution: { mood: MoodType; count: number }[]
  averageWordCount: number
  currentStreak: number
  reflectionSummaries: {
    date: string
    prompt: string
    snippet: string
  }[]
  signals?: {
    daysWithEntries: number
    daysSkipped: number
    moodVariance: number | null
    moodMostCommon: MoodType | null
    reflectionLength: {
      shortCount: number
      longCount: number
      average: number
      median: number
      firstHalfAverage: number
      secondHalfAverage: number
    }
    repeatedWords: { word: string; count: number }[]
    promptTypeDepth: { promptType: string; averageWordCount: number; count: number }[]
    selectedFocusAreas: string[]
  }
}

export interface DailyActivity {
  date: string
  count: number
  moods: MoodType[]
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

// =============================================================================
// LEGACY TYPES (for backward compatibility during migration)
// =============================================================================

// Old interface names - will be deprecated
export interface ReflectionLegacy {
  id: string
  date: string
  prompt: string
  reflection: string
  mood: MoodType
  tags: string[]
  wordCount: number
  createdAt: number
  feedback?: "helped" | "irrelevant" | null
}
