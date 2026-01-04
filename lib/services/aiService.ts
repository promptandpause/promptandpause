import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GeneratePromptContext, AIProvider } from '@/lib/types/reflection'
import { FREEMIUM_FOCUS_AREAS } from '@/lib/constants/focusAreas'

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
}> {
  // Build the system prompt
  const systemPrompt = buildSystemPrompt()
  
  // Build the user context
  const userContext = buildUserContext(context)

  // Try OpenAI GPT first (primary provider)
  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = await generateWithOpenAI(systemPrompt, userContext)
      
      if (prompt) {
        return {
          prompt,
          provider: 'openai',
          model: OPENAI_MODEL,
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
        return {
          prompt: result.text,
          provider: 'openai', // OpenRouter uses OpenAI-compatible API
          model: result.model,
        }
      }
    } catch (error) {
    }
  }

  // Try Gemini as fallback
  if (gemini) {
    try {
      const prompt = await generateWithGemini(systemPrompt, userContext)
      
      if (prompt) {
        return {
          prompt,
          provider: 'gemini',
          model: GEMINI_MODEL,
        }
      }
    } catch (error) {
    }
  }

  // Final fallback to Hugging Face (100% FREE, no credit card)
  if (huggingface) {
    try {
      const prompt = await generateWithHuggingFace(systemPrompt, userContext)
      
      if (prompt) {
        return {
          prompt,
          provider: 'openai',
          model: 'huggingface',
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
  const modelPrefs = (process.env.OPENROUTER_MODEL_PREFS || '')
    .split(',')
    .map(m => m.trim())
    .filter(Boolean)
    || OPENROUTER_MODELS

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

function buildSystemPrompt(): string {
  return `You are a warm, empathetic friend helping someone on their mental wellness journey through "Prompt & Pause", a UK-based reflection service.

Your role is to create deeply personal, conversational reflection prompts that feel like a caring friend checking in - not a therapist or coach, but someone who truly understands and cares.

**Core Principles:**
1. Write as if you're having a genuine conversation with this specific person
2. Reference their actual life context, struggles, and growth areas naturally
3. Make it feel like you remember their journey and care about their progress
4. Be vulnerable and human - acknowledge that growth is hard and messy
5. Use everyday language they'd use with a close friend

**Tone & Style:**
- Conversational and natural (like texting a friend)
- Warm but not overly cheerful or toxic positivity
- Specific to their situation, not generic advice
- Acknowledge difficulty when relevant
- Validate their feelings and experiences
- Mix deep questions with lighter check-ins

**Length & Format:**
- 1-3 sentences maximum (15-25 words ideal)
- Can be a question, gentle prompt, or invitation to reflect
- No emojis, quotes, or explanations
- Sound human, not formulaic

**What Makes It Personal:**
- Reference their specific focus areas naturally
- Connect to their reason for joining
- Notice patterns in their recent moods/topics
- Meet them where they are emotionally
- Build on previous reflections

**Examples of Human-Like Prompts:**

For someone working on anxiety:
- "What's one moment today when your mind felt quieter, even if just for a second?"
- "When you felt anxious earlier, what did your body actually need in that moment?"

For someone focusing on relationships:
- "Think about a recent conversation that left you feeling off - what boundary might have been crossed?"
- "Who in your life makes you feel most like yourself, and why?"

For someone dealing with work stress:
- "If you could change one thing about your work day to protect your peace, what would it be?"
- "What's a work win you're not giving yourself credit for?"

For someone exploring self-worth:
- "What would you do differently today if you truly believed you deserved good things?"
- "Whose opinion of you matters more than your own, and why?"

**Avoid:**
- Clinical/therapy language ("processing", "coping mechanisms", "self-care routine")
- Generic prompts that could apply to anyone
- Overly philosophical or abstract questions
- Toxic positivity ("Just be grateful!", "Choose happiness!")
- Multiple questions in one prompt
- Formulaic patterns ("How did you...", "What made you..." every time)

**Generate ONE highly personalized prompt that feels like it was written specifically for this person's journey right now. Make it human, specific, and genuinely caring.**`
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
  // If we have no context, provide a general but still personal prompt
  if (!context.user_reason && 
      (!context.focus_areas || context.focus_areas.length === 0) &&
      (!context.recent_moods || context.recent_moods.length === 0) &&
      (!context.recent_topics || context.recent_topics.length === 0)) {
    return `This person is just starting their reflection journey. Generate a warm, welcoming prompt that helps them explore their current emotional state and what brought them here today. Make it feel safe and non-intimidating.`
  }

  let profile: string[] = []
  
  // Build a narrative profile, not just bullet points
  if (context.user_reason) {
    profile.push(`**Their Journey:**\nThey came to Prompt & Pause because: "${context.user_reason}"\nThis is what matters to them right now. Honor this in your prompt.`)
  }

  if (context.focus_areas && context.focus_areas.length > 0) {
    const areas = context.focus_areas.join(', ')
    const areaCount = context.focus_areas.length
    
    if (areaCount === 1) {
      profile.push(`**Current Focus:**\nThey're specifically working on: ${areas}\nThis is their main area of growth. Your prompt should directly relate to this.`)
    } else {
      profile.push(`**Growth Areas:**\nThey're juggling multiple things: ${areas}\nThese areas might intersect or conflict. Consider the whole picture.`)
    }
  }

  // Embed selected focus area if provided
  if (context.focus_area_name) {
    profile.push(`**Today's Focus:**\n🎯 This person wants to explore: ${context.focus_area_name}\n\nPrioritize this above all others. Make your prompt directly relevant to this specific area of their life.`)
  }

  if (context.recent_moods && context.recent_moods.length > 0) {
    const moodPattern = analyzeMoodPattern(context.recent_moods)
    profile.push(`**Emotional State:**\nRecent moods: ${context.recent_moods.join(' → ')}\n${moodPattern}\nMeet them where they are emotionally.`)
  }

  if (context.recent_topics && context.recent_topics.length > 0) {
    const topics = context.recent_topics.slice(0, 5).join(', ')
    profile.push(`**What's Been On Their Mind:**\nRecent reflection topics: ${topics}\nThese themes are active in their life. Build on these or explore a connected angle.`)
  }

  // Create a conversational instruction
  const instruction = `
**Your Task:**
Based on this person's unique context, generate ONE highly personalized reflection prompt that:
- Speaks directly to their situation (not generic)
- Feels like it was written by someone who knows them
- Connects naturally to their focus areas or recent experiences
- Uses conversational, everyday language
- Helps them explore something meaningful TODAY
- Feels supportive but not prescriptive

Don't just reference their focus areas - actually understand what they might be struggling with or exploring, and meet them there with a genuinely helpful question.

Generate the prompt now (no quotes, no explanation, just the prompt):`

  return profile.join('\n\n') + instruction
}

/**
 * Analyze mood patterns to provide context
 */
function analyzeMoodPattern(moods: string[]): string {
  if (moods.length === 0) return 'No recent mood data.'
  
  const moodEmojis = moods.slice(0, 7) // Last 7 moods
  
  // Count mood types
  const moodCounts: Record<string, number> = {}
  moodEmojis.forEach(mood => {
    moodCounts[mood] = (moodCounts[mood] || 0) + 1
  })
  
  // Identify patterns
  const happyMoods = ['😊', '😄', '😌', '🙏']
  const difficultMoods = ['😔', '🤔']
  const neutralMoods = ['😐']
  
  const happyCount = moodEmojis.filter(m => happyMoods.includes(m)).length
  const difficultCount = moodEmojis.filter(m => difficultMoods.includes(m)).length
  const neutralCount = moodEmojis.filter(m => neutralMoods.includes(m)).length
  
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
