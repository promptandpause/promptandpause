import { SupabaseClient } from '@supabase/supabase-js'

export type CrisisToolType = 'grounding_54321' | 'box_breathing' | 'panic_button' | 'coping_statements' | 'hotline_access'

export interface CrisisHotline {
  country: string
  name: string
  phone: string
  text?: string
  website?: string
  available: string
}

// Crisis hotlines by country
export const crisisHotlines: CrisisHotline[] = [
  {
    country: 'UK',
    name: 'Samaritans',
    phone: '116 123',
    website: 'https://www.samaritans.org',
    available: '24/7, free to call'
  },
  {
    country: 'UK',
    name: 'Crisis Text Line',
    phone: '',
    text: 'SHOUT to 85258',
    website: 'https://giveusashout.org',
    available: '24/7, free text service'
  },
  {
    country: 'UK',
    name: 'Mind Infoline',
    phone: '0300 123 3393',
    website: 'https://www.mind.org.uk',
    available: 'Mon-Fri, 9am-6pm'
  },
  {
    country: 'US',
    name: 'National Suicide Prevention Lifeline',
    phone: '988',
    website: 'https://988lifeline.org',
    available: '24/7, free to call'
  },
  {
    country: 'US',
    name: 'Crisis Text Line',
    phone: '',
    text: 'HOME to 741741',
    website: 'https://www.crisistextline.org',
    available: '24/7, free text service'
  },
  {
    country: 'US',
    name: 'SAMHSA National Helpline',
    phone: '1-800-662-4357',
    website: 'https://www.samhsa.gov/find-help/national-helpline',
    available: '24/7, free, confidential'
  }
]

// Coping statements for crisis moments
export const copingStatements = [
  "This feeling is temporary. It will pass.",
  "I've gotten through difficult moments before.",
  "I am safe right now in this moment.",
  "My feelings are valid, but they don't define me.",
  "I can take this one breath at a time.",
  "I don't have to have all the answers right now.",
  "It's okay to ask for help.",
  "I am stronger than I think.",
  "This moment is not my whole life.",
  "I can handle this, even if it doesn't feel like it.",
  "My thoughts are not facts.",
  "I am doing the best I can with what I have.",
  "Tomorrow is a new day.",
  "I deserve compassion, especially from myself.",
  "I am not alone in feeling this way."
]

// 5-4-3-2-1 Grounding Exercise
export const groundingExercise = {
  name: '5-4-3-2-1 Grounding',
  description: 'A sensory awareness exercise to bring you back to the present moment.',
  steps: [
    {
      number: 5,
      sense: 'SEE',
      instruction: 'Name 5 things you can see around you.',
      examples: ['A window', 'A plant', 'Your hands', 'A light', 'A door']
    },
    {
      number: 4,
      sense: 'TOUCH',
      instruction: 'Name 4 things you can physically feel.',
      examples: ['Your feet on the floor', 'The chair beneath you', 'Your clothes', 'The air on your skin']
    },
    {
      number: 3,
      sense: 'HEAR',
      instruction: 'Name 3 things you can hear.',
      examples: ['Traffic outside', 'Your breathing', 'A clock ticking']
    },
    {
      number: 2,
      sense: 'SMELL',
      instruction: 'Name 2 things you can smell.',
      examples: ['Fresh air', 'Coffee', 'Your soap']
    },
    {
      number: 1,
      sense: 'TASTE',
      instruction: 'Name 1 thing you can taste.',
      examples: ['Your last drink', 'Toothpaste', 'Fresh air']
    }
  ]
}

// Quick calming techniques
export const quickCalmingTechniques = [
  {
    name: 'Cold Water',
    description: 'Splash cold water on your face or hold ice cubes. This activates your dive reflex and slows your heart rate.',
    duration: '30 seconds'
  },
  {
    name: 'Square Breathing',
    description: 'Breathe in for 4 counts, hold for 4, out for 4, hold for 4. Repeat 4 times.',
    duration: '1-2 minutes'
  },
  {
    name: 'Progressive Muscle Relaxation',
    description: 'Tense each muscle group for 5 seconds, then release. Start with your toes and work up.',
    duration: '5 minutes'
  },
  {
    name: 'Name Your Emotions',
    description: 'Simply naming what you feel ("I notice I\'m feeling anxious") can reduce its intensity.',
    duration: '30 seconds'
  },
  {
    name: 'Change Your Environment',
    description: 'Step outside, open a window, or move to a different room. A change of scenery can shift your state.',
    duration: '1 minute'
  }
]

/**
 * Get crisis hotlines for a specific country
 */
export function getHotlinesForCountry(countryCode: string): CrisisHotline[] {
  const country = countryCode === 'GB' ? 'UK' : countryCode
  return crisisHotlines.filter(h => h.country === country)
}

/**
 * Get a random coping statement
 */
export function getRandomCopingStatement(): string {
  return copingStatements[Math.floor(Math.random() * copingStatements.length)]
}

/**
 * Get multiple coping statements
 */
export function getCopingStatements(count: number = 3): string[] {
  const shuffled = [...copingStatements].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Log crisis tool usage (for analytics)
 */
export async function logCrisisToolUsage(
  supabase: SupabaseClient,
  toolType: CrisisToolType,
  userId?: string,
  completed: boolean = false
): Promise<void> {
  try {
    await supabase
      .from('crisis_tool_usage')
      .insert({
        user_id: userId || null,
        tool_type: toolType,
        completed
      })
  } catch (error) {
    // Don't throw - crisis tools should never fail due to logging
    console.error('Error logging crisis tool usage:', error)
  }
}

/**
 * Get crisis tool usage stats (for admin)
 */
export async function getCrisisToolStats(
  supabase: SupabaseClient,
  days: number = 30
): Promise<{
  totalUsage: number
  byTool: Record<CrisisToolType, number>
  completionRate: number
}> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('crisis_tool_usage')
    .select('*')
    .gte('created_at', startDate.toISOString())

  if (error || !data) {
    return {
      totalUsage: 0,
      byTool: {} as Record<CrisisToolType, number>,
      completionRate: 0
    }
  }

  const byTool: Record<string, number> = {}
  let completed = 0

  for (const usage of data) {
    byTool[usage.tool_type] = (byTool[usage.tool_type] || 0) + 1
    if (usage.completed) completed++
  }

  return {
    totalUsage: data.length,
    byTool: byTool as Record<CrisisToolType, number>,
    completionRate: data.length > 0 ? Math.round((completed / data.length) * 100) : 0
  }
}
