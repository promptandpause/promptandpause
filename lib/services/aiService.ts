import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GeneratePromptContext, AIProvider, MoodType, PromptType } from '@/lib/types/reflection'

/**
 * AI Service for Generating Personalized Mental Health Prompts
 * 
 * Uses OpenAI GPT (primary) with free providers as fallback
 * - OpenAI: Primary with GPT-4o-mini
 * - OpenRouter: Fallback with free tier models
 * - Gemini: Secondary fallback
 * - HuggingFace: Final fallback (100% free)
 */

// Initialize clients
const openrouter = process.env.OPENROUTER_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    })
  : null

const huggingface = process.env.HUGGINGFACE_API_KEY
  ? new OpenAI({
      apiKey: process.env.HUGGINGFACE_API_KEY,
      baseURL: 'https://api-inference.huggingface.co/v1',
    })
  : null

const gemini = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ============================================================================
// MODEL CONFIGURATIONS
// ============================================================================

// OpenRouter free/cheap models - prioritized by cost and quality
// Updated with currently available models as of Jan 2026
export const OPENROUTER_MODELS = [
  // Tier 1: Free models (verified available Jan 2026)
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'deepseek/deepseek-r1-0528:free',
  'qwen/qwen3-coder:free',
  'mistralai/devstral-2512:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'openai/gpt-oss-120b:free',
  
  // Tier 2: Ultra-cheap fallback
  'openai/gpt-4o-mini',
]

// Hugging Face free models - all 100% free, no credit card required
// Updated Jan 2026
export const HUGGINGFACE_MODELS = [
  'meta-llama/Llama-3.3-70B-Instruct',
  'mistralai/Mistral-Small-24B-Instruct-2501',
  'Qwen/Qwen3-32B',
  'google/gemma-3-27b-it',
  'microsoft/Phi-4',
]

const GEMINI_MODEL = 'gemini-2.5-flash' // Stable, fast, high quality
const OPENAI_MODEL = 'gpt-4o-mini'

const PROMPT_TYPES: PromptType[] = [
  'noticing',
  'naming',
  'contrast',
  'perspective',
  'closure',
  'grounding',
]

type MoodTrend = 'low' | 'neutral' | 'high' | 'mixed'

function getMoodTrend(moods: MoodType[]): MoodTrend {
  const recent = (moods || []).slice(0, 7)
  if (recent.length === 0) return 'neutral'

  const positiveMoods: MoodType[] = ['😊', '😄', '😌', '🙏', '💪']
  const difficultMoods: MoodType[] = ['😔', '🤔']
  const neutralMoods: MoodType[] = ['😐']

  const positiveCount = recent.filter(m => positiveMoods.includes(m)).length
  const difficultCount = recent.filter(m => difficultMoods.includes(m)).length
  const neutralCount = recent.filter(m => neutralMoods.includes(m)).length

  const total = recent.length
  if (difficultCount / total >= 0.5 && difficultCount >= positiveCount + 1) return 'low'
  if (positiveCount / total >= 0.5 && positiveCount >= difficultCount + 1) return 'high'
  if (neutralCount / total >= 0.5) return 'neutral'
  return 'mixed'
}

function weightedPick(weights: Record<PromptType, number>): PromptType | null {
  const entries = Object.entries(weights) as Array<[PromptType, number]>
  const total = entries.reduce((sum, [, w]) => sum + Math.max(0, w), 0)
  if (total <= 0) return null

  let r = Math.random() * total
  for (const [type, w] of entries) {
    r -= Math.max(0, w)
    if (r <= 0) return type
  }
  return entries[0]?.[0] ?? null
}

function selectPromptType(context: GeneratePromptContext): PromptType {
  const moodTrend = getMoodTrend(context.recent_moods || [])
  const streak = context.current_streak ?? 0
  const allowDeeper = streak >= 7

  const baseWeights: Record<PromptType, number> = {
    noticing: 3,
    naming: 3,
    contrast: 3,
    perspective: 3,
    closure: 2,
    grounding: 2,
  }

  if (moodTrend === 'low') {
    baseWeights.grounding = 6
    baseWeights.naming = 5
    baseWeights.closure = 4
    baseWeights.noticing = 2
    baseWeights.perspective = 1
    baseWeights.contrast = 1
  } else if (moodTrend === 'high') {
    baseWeights.perspective = 6
    baseWeights.contrast = 6
    baseWeights.noticing = 5
    baseWeights.closure = 3
    baseWeights.naming = 1
    baseWeights.grounding = 1
  }

  if (allowDeeper && moodTrend !== 'low') {
    baseWeights.perspective += 1
    baseWeights.contrast += 1
    baseWeights.noticing += 1
  }

  const recentTypes = (context.recent_prompt_types || []).filter(Boolean)

  const tryAvoid = (avoidCount: number): PromptType | null => {
    const avoid = new Set(recentTypes.slice(0, avoidCount))
    const weights: Record<PromptType, number> = { ...baseWeights }
    for (const t of PROMPT_TYPES) {
      if (avoid.has(t)) weights[t] = 0
    }
    return weightedPick(weights)
  }

  return (
    tryAvoid(4) ||
    tryAvoid(2) ||
    weightedPick(baseWeights) ||
    'noticing'
  )
}

function sanitizeGeneratedPrompt(text: string): string | null {
  if (!text) return null
  const firstNonEmptyLine = text
    .split('\n')
    .map(l => l.trim())
    .find(l => l.length > 0)

  let cleaned = (firstNonEmptyLine || '').trim()
  cleaned = cleaned.replace(/^prompt\s*:\s*/i, '')
  cleaned = cleaned.replace(/^[-*]\s+/, '')
  cleaned = cleaned.replace(/^["'“”]+/, '').replace(/["'“”]+$/, '')
  cleaned = cleaned.trim()

  const firstQuestionMark = cleaned.indexOf('?')
  if (firstQuestionMark >= 0) {
    cleaned = cleaned.slice(0, firstQuestionMark + 1).trim()
  } else if (cleaned.length > 0) {
    cleaned = cleaned.replace(/[.!]+$/, '') + '?' 
    cleaned = cleaned.trim()
  }

  return cleaned || null
}

/**
 * Generate a personalized mental health reflection prompt
 * 
 * @param context User context for personalization
 * @returns Promise<{ prompt: string, provider: AIProvider, model: string }>
 */

export async function generatePrompt(context: GeneratePromptContext): Promise<{
  prompt: string
  provider: AIProvider
  model: string
  prompt_type?: PromptType
}> {
  const promptType = selectPromptType(context)
  const allowDeeper = (context.current_streak ?? 0) >= 7

  const systemPrompt = buildSystemPrompt(promptType, allowDeeper)
  const userContext = buildUserContext(context)

  // Try OpenAI GPT first (primary provider)
  if (process.env.OPENAI_API_KEY) {
    try {
      const rawPrompt = await generateWithOpenAI(systemPrompt, userContext)
      const prompt = rawPrompt ? sanitizeGeneratedPrompt(rawPrompt) : null
      
      if (prompt) {
        return {
          prompt,
          provider: 'openai',
          model: OPENAI_MODEL,
          prompt_type: promptType,
        }
      }
    } catch (error) {
    }
  }

  // Try OpenRouter as fallback (FREE with multi-model fallback chain)
  if (openrouter) {
    try {
      const result = await generateWithOpenRouter(systemPrompt, userContext)
      
      if (result) {
        const prompt = sanitizeGeneratedPrompt(result.text)
        if (!prompt) {
          throw new Error('OpenRouter returned empty prompt')
        }
        return {
          prompt,
          provider: 'openai', // OpenRouter uses OpenAI-compatible API
          model: result.model,
          prompt_type: promptType,
        }
      }
    } catch (error) {
    }
  }

  // Try Gemini as fallback
  if (gemini) {
    try {
      const rawPrompt = await generateWithGemini(systemPrompt, userContext)
      const prompt = rawPrompt ? sanitizeGeneratedPrompt(rawPrompt) : null
      
      if (prompt) {
        return {
          prompt,
          provider: 'gemini',
          model: GEMINI_MODEL,
          prompt_type: promptType,
        }
      }
    } catch (error) {
    }
  }

  // Final fallback to Hugging Face (100% FREE, no credit card)
  if (huggingface) {
    try {
      const rawPrompt = await generateWithHuggingFace(systemPrompt, userContext)
      const prompt = rawPrompt ? sanitizeGeneratedPrompt(rawPrompt) : null
      
      if (prompt) {
        return {
          prompt,
          provider: 'openai',
          model: 'huggingface',
          prompt_type: promptType,
        }
      }
    } catch (error) {
    }
  }

  throw new Error('Failed to generate prompt with available AI providers')
}

/**
 * Generate prompt using OpenRouter with multi-model fallback (FREE tier - 8 models)
 * 
 * Tries models in priority order:
 * 1. Free models (Tier 1): DeepSeek, Tongyi, LongCat, Nemotron
 * 2. Ultra-cheap (Tier 2): Claude Haiku, ERNIE, Qwen3
 * 3. Affordable (Tier 3): Grok
 * 
 * On 404 (model not available), skips to next. On 5xx, retries same model.
 * Only falls back to Gemini/OpenAI if all OpenRouter models fail.
 */
 
async function generateWithOpenRouter(
  systemPrompt: string,
  userContext: string
): Promise<{ text: string; model: string } | null> {
  if (!openrouter) {
    return null
  }
 
  // Allow override via env variable for testing
  const envModels = (process.env.OPENROUTER_MODEL_PREFS || '')
    .split(',')
    .map(m => m.trim())
    .filter(Boolean)
  const modelPrefs = envModels.length > 0 ? envModels : OPENROUTER_MODELS

  for (const model of modelPrefs) {
    try {
      const completion = await openrouter.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContext },
        ],
        temperature: 0.9,
        max_tokens: 800,  // Increased to handle longer multi-paragraph prompts
        top_p: 0.95,
      })
 
      const text = completion.choices[0]?.message?.content?.trim()
      if (text) {
        return { text, model }
      }
    } catch (error: any) {
      const status = error?.status
      const message = error?.message || String(error)
      
      // 404 = Model not available, skip to next
      if (status === 404) {
        continue
      }
      
      // 5xx = Server error, skip to next  
      if (status && status >= 500) {
        continue
      }
      
      // 4xx but not 404 = Auth, rate limit, etc - may want to stop
      if (status && status >= 400 && status < 500) {
        // Continue trying other models unless it's auth
        if (status === 401 || status === 403) {
          return null
        }
        continue
      }
      
      // Generic error, log and continue
    }
  }
  return null
}
 
/**
 * Generate prompt using Hugging Face with multi-model fallback (100% FREE, no credit card)
 */
async function generateWithHuggingFace(
  systemPrompt: string,
  userContext: string
): Promise<string | null> {
  if (!huggingface) {
    return null
  }
 
  for (const model of HUGGINGFACE_MODELS) {
    try {
      const completion = await huggingface.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContext },
        ],
        temperature: 0.9,
        max_tokens: 800,  // Increased to handle longer multi-paragraph prompts
        top_p: 0.95,
      })
 
      const prompt = completion.choices[0]?.message?.content?.trim()
      if (prompt) {
        return prompt
      }
    } catch (error: any) {
      const status = error?.status
      const message = error?.message || String(error)
      
      // 404 = Model not available, skip to next
      if (status === 404) {
        continue
      }
      
      // 503 = Model loading, skip to next
      if (status === 503) {
        continue
      }
      
      // Other server errors
      if (status && status >= 500) {
        continue
      }
      
      // Auth or rate limit issues
      if (status === 401 || status === 403) {
        return null
      }
      
      // Generic error, log and continue
    }
  }
  return null
}
 
/**
 * Generate prompt using Google Gemini (FREE tier)
 */
async function generateWithGemini(
  systemPrompt: string,
  userContext: string
): Promise<string | null> {
  if (!gemini) {
    return null
  }
 
  try {
    const model = gemini.getGenerativeModel({ model: GEMINI_MODEL })
     
    // Combine system prompt and user context for Gemini
    const fullPrompt = `${systemPrompt}\n\n${userContext}`
     
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.9, // Higher for more natural, human-like variation
        maxOutputTokens: 800, // Increased to handle longer multi-paragraph prompts
        topP: 0.95,
      },
    })
 
    const response = result.response
    const prompt = response.text()?.trim()
    return prompt || null
  } catch (error: any) {
    // Log detailed error for debugging
    if (error?.status === 403 || error?.status === 401) {
    }
    return null
  }
}
 
/**
 * Generate prompt using OpenAI (GPT-4o-mini)
 */
async function generateWithOpenAI(
  systemPrompt: string,
  userContext: string
): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }
 
  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContext },
      ],
      temperature: 0.9, // Higher for more natural, human-like variation
      max_tokens: 800,   // Increased to handle longer multi-paragraph prompts
      top_p: 0.95,       // Add nucleus sampling for better quality
    })
 
    const prompt = completion.choices[0]?.message?.content?.trim()
    return prompt || null
  } catch (error) {
    return null
  }
}

/**
 * Build the system prompt for the AI with enhanced personalization
 */

function buildSystemPrompt(promptType: PromptType, allowDeeper: boolean): string {
  const depthGuidance = allowDeeper
    ? 'Depth: You may gently connect to a broader pattern (last week, repeated theme) while staying concrete and answerable in 3–5 minutes.'
    : 'Depth: Keep it immediate and simple (today / this moment).'

  return `You write a single daily reflection question for "Prompt & Pause".

Output rules:
- Return ONLY the question text.
- Exactly ONE question (a single "?").
- No preamble, no labels, no quotes, no markdown, no emojis.
- Do NOT use the word "why".
- No therapy/clinical language. Avoid terms like: processing, trauma, healing, coping mechanisms, inner child, self-care routine.
- No advice or instructions. Do not use "should". Do not promise outcomes.
- Avoid clichés and motivational slogans.
- Make it feel answerable in 3–5 minutes.

Verb constraint:
- Start the question with exactly ONE of these words: Notice, Name, Recall, Consider, Describe, Acknowledge.

Prompt type:
- Today's prompt type is "${promptType}".

Type definitions:
- grounding: anchor in the present moment and the body/senses; practical and gentle.
- naming: identify and label an emotion or need; simple and specific.
- noticing: observe a small moment, signal, or shift from today.
- contrast: compare two moments (e.g., draining vs steadying) without judgment.
- perspective: widen the lens (future self, friend viewpoint) without advice.
- closure: allow a small "good enough" wrap-up; release perfection.

${depthGuidance}

Use the provided user context (focus areas, recent moods, recent topics) to make the question specific.

Return the question now.`
}

/**
 * Select a focus area for this prompt session
 * 
 * For freemium: Random selection from available areas
 * For premium: Weighted random by priority if custom areas exist
 */
export function selectFocusArea(
  availableAreas: Array<{ name: string; priority?: number; isPremium: boolean }>,
  isPremium: boolean
): string | null {
  if (!availableAreas || availableAreas.length === 0) return null

  // Premium: weighted selection by priority
  if (isPremium && availableAreas.some(a => a.isPremium)) {
    const premiumAreas = availableAreas.filter(a => a.isPremium)
    const totalWeight = premiumAreas.reduce(
      (sum, a) => sum + (a.priority || 0),
      0
    )
    
    if (totalWeight > 0) {
      let random = Math.random() * totalWeight
      for (const area of premiumAreas) {
        random -= area.priority || 0
        if (random <= 0) return area.name
      }
      return premiumAreas[premiumAreas.length - 1]?.name || null
    }
  }

  // Freemium or fallback: simple random selection
  const randomIndex = Math.floor(Math.random() * availableAreas.length)
  return availableAreas[randomIndex]?.name || null
}

/**
 * Build rich, contextual user profile for deeply personalized prompts
 */

function buildUserContext(context: GeneratePromptContext): string {
  const hasAnyContext =
    !!context.user_reason ||
    (context.focus_areas && context.focus_areas.length > 0) ||
    !!context.focus_area_name ||
    (context.recent_moods && context.recent_moods.length > 0) ||
    (context.recent_topics && context.recent_topics.length > 0)

  if (!hasAnyContext) {
    return 'No user details available. Use a simple, grounded check-in that works for most people.'
  }

  const lines: string[] = []

  if (context.user_reason) {
    lines.push(`Reason for joining: ${context.user_reason}`)
  }

  if (typeof context.current_streak === 'number') {
    lines.push(`Current reflection streak: ${context.current_streak} day(s)`)
  }

  if (context.focus_area_name) {
    lines.push(`Today's focus area: ${context.focus_area_name}`)
  } else if (context.focus_areas && context.focus_areas.length > 0) {
    lines.push(`Focus areas: ${context.focus_areas.join(', ')}`)
  }

  if (context.recent_moods && context.recent_moods.length > 0) {
    const moodPattern = analyzeMoodPattern(context.recent_moods)
    lines.push(`Recent moods: ${context.recent_moods.join(' → ')}`)
    lines.push(`Mood note: ${moodPattern}`)
  }

  if (context.recent_topics && context.recent_topics.length > 0) {
    lines.push(`Recent topics: ${context.recent_topics.slice(0, 5).join(', ')}`)
  }

  return lines.join('\n')
}

/**
 * Analyze mood patterns to provide context
 */
function analyzeMoodPattern(moods: string[]): string {
  const recent = (moods || []).slice(0, 7)
  if (recent.length === 0) return 'No recent mood data.'

  const moodEmojis = recent.slice(0, 7) // Last 7 moods
  
  // Count mood types
  const moodCounts: Record<string, number> = {}
  moodEmojis.forEach(mood => {
    moodCounts[mood] = (moodCounts[mood] || 0) + 1
  })
  
  // Identify patterns
  const happyMoods = ['😊', '😄', '😌', '🙏', '💪']
  const difficultMoods = ['😔', '🤔']
  const neutralMoods = ['😐']
  
  const happyCount = happyMoods.reduce((sum, mood) => sum + (moodCounts[mood] || 0), 0)
  const difficultCount = difficultMoods.reduce((sum, mood) => sum + (moodCounts[mood] || 0), 0)
  const neutralCount = neutralMoods.reduce((sum, mood) => sum + (moodCounts[mood] || 0), 0)
  
  // Provide nuanced interpretation
  if (difficultCount > happyCount * 2) {
    return "They're going through a tough period. Be extra gentle and validating."
  } else if (happyCount > difficultCount * 2) {
    return "They're in a good place right now. Help them explore or savor this."
  } else if (neutralCount > moodEmojis.length / 2) {
    return "They've been feeling flat or neutral. Help them connect with what's beneath the surface."
  } else if (moodEmojis.length > 1) {
    // Check for recent shift
    const recentMood = moodEmojis[0]
    const previousMood = moodEmojis[1]
    if (happyMoods.includes(recentMood) && difficultMoods.includes(previousMood)) {
      return "They're coming out of a difficult period. Acknowledge the shift."
    } else if (difficultMoods.includes(recentMood) && happyMoods.includes(previousMood)) {
      return "Things have gotten harder recently. Be compassionate about the dip."
    }
  }
  
  return "Their moods have been mixed. Help them explore what's driving the variation."
}

/**
 * Validate that at least one AI provider is configured
 */

export function validateAIConfig(): { openrouter: boolean; gemini: boolean; openai: boolean } {
  return {
    openrouter: !!process.env.OPENROUTER_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
  }
}
