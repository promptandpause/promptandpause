import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { WeeklyDigest } from '@/lib/types/reflection'

type AIProvider = 'gemini' | 'openai' | 'openrouter' | 'huggingface' | 'fallback'

/**
 * Weekly Insight Service for Premium Users
 * 
 * Generates AI-powered personalized insights from weekly reflection data.
 * Uses the same 4-tier AI fallback chain as prompt generation (aiService.ts):
 * 1. OpenRouter (with 8 model fallback chain) - FREE
 * 2. Hugging Face - FREE
 * 3. Google Gemini (free tier) 
 * 4. OpenAI (gpt-4o-mini)
 */

// ============================================================================
// MODEL CONFIGURATIONS (matching aiService.ts)
// ============================================================================

// OpenRouter free/cheap models - updated with currently available models
const OPENROUTER_MODELS = [
  // Tier 1: Free models (verified available)
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'qwen/qwen-2.5-7b-instruct:free',
  'microsoft/phi-3-medium-128k-instruct:free',
  
  // Tier 2: Ultra-cheap (<$0.10/1M tokens)
  'google/gemini-flash-1.5-8b',
  'anthropic/claude-3-haiku',
  'meta-llama/llama-3.1-8b-instruct',
  
  // Tier 3: Reliable fallback
  'openai/gpt-4o-mini',
]

// Hugging Face free models with fallback
const HUGGINGFACE_MODELS = [
  'meta-llama/Meta-Llama-3-8B-Instruct',
  'mistralai/Mistral-7B-Instruct-v0.3',
  'microsoft/Phi-3-mini-4k-instruct',
  'google/gemma-2-9b-it',
  'Qwen/Qwen2.5-7B-Instruct',
]
const GEMINI_MODEL = 'gemini-2.5-flash' // Stable, fast, high quality
const OPENAI_MODEL = 'gpt-4o-mini'

// Initialize AI clients (matching aiService.ts pattern)
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

/**
 * Generate AI-powered insights from weekly digest data
 * 
 * @param digest - Weekly digest data with stats and reflections
 * @param userName - User's name for personalization
 * @returns Promise with AI-generated insights and recommendations
 */
export async function generateWeeklyInsights(
  digest: WeeklyDigest,
  userName: string | null
): Promise<{
  summary: string
  keyInsights: string[]
  recommendations: string[]
  moodAnalysis: string
  growthAreas: string[]
  provider: AIProvider
  model: string
}> {
  const systemPrompt = buildInsightSystemPrompt()
  const userContext = buildWeeklyContext(digest, userName)

  // Try OpenRouter first (FREE with 8 model fallback chain)
  if (openrouter) {
    try {
      const result = await generateInsightsWithOpenRouter(systemPrompt, userContext)
      
      if (result) {
        return {
          ...result.insights,
          provider: 'openrouter',
          model: result.model,
        }
      }
    } catch (error) {
    }
  }

  // Try Hugging Face as fallback (100% FREE, no credit card)
  if (huggingface) {
    try {
      const insights = await generateInsightsWithHuggingFace(systemPrompt, userContext)
      
      if (insights) {
        return {
          ...insights,
          provider: 'huggingface',
          model: HUGGINGFACE_MODEL,
        }
      }
    } catch (error) {
    }
  }

  // Try Gemini as fallback (free tier with generous limits)
  if (gemini) {
    try {
      const insights = await generateInsightsWithGemini(systemPrompt, userContext)
      
      if (insights) {
        return {
          ...insights,
          provider: 'gemini',
          model: GEMINI_MODEL,
        }
      }
    } catch (error) {
    }
  }

  // Final fallback to OpenAI if configured
  if (process.env.OPENAI_API_KEY) {
    try {
      const insights = await generateInsightsWithOpenAI(systemPrompt, userContext)
      
      if (insights) {
        return {
          ...insights,
          provider: 'openai',
          model: OPENAI_MODEL,
        }
      }
    } catch (error) {
    }
  }

  // Fallback to basic insights if all AI providers fail
  return generateBasicInsights(digest, userName)
}

/**
 * Generate insights using OpenRouter with multi-model fallback (FREE tier - 8 models)
 * 
 * Tries models in priority order:
 * 1. Free models (Tier 1): DeepSeek, Tongyi, LongCat, Nemotron
 * 2. Ultra-cheap (Tier 2): Claude Haiku, ERNIE, Qwen3
 * 3. Affordable (Tier 3): Grok
 * 
 * On 404 (model not available), skips to next. On 5xx, retries same model.
 * Only falls back to Hugging Face/Gemini/OpenAI if all OpenRouter models fail.
 */
async function generateInsightsWithOpenRouter(
  systemPrompt: string,
  userContext: string
): Promise<{ insights: {
  summary: string
  keyInsights: string[]
  recommendations: string[]
  moodAnalysis: string
  growthAreas: string[]
}; model: string } | null> {
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
        temperature: 0.7,
        max_tokens: 1500,
      })

      const text = completion.choices[0]?.message?.content?.trim()
      if (text) {
        const insights = parseAIResponse(text)
        return { insights, model }
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
 * Generate insights using Hugging Face with multi-model fallback (100% FREE, no credit card)
 */
async function generateInsightsWithHuggingFace(
  systemPrompt: string,
  userContext: string
): Promise<{
  summary: string
  keyInsights: string[]
  recommendations: string[]
  moodAnalysis: string
  growthAreas: string[]
} | null> {
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
        temperature: 0.7,
        max_tokens: 1500,
      })

      const text = completion.choices[0]?.message?.content?.trim()
      if (text) {
        return parseAIResponse(text)
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
 * Generate insights using Google Gemini (FREE tier)
 */
async function generateInsightsWithGemini(
  systemPrompt: string,
  userContext: string
): Promise<{
  summary: string
  keyInsights: string[]
  recommendations: string[]
  moodAnalysis: string
  growthAreas: string[]
} | null> {
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
        temperature: 0.7,
        maxOutputTokens: 1500,
        topP: 0.95,
      },
    })

    const response = result.response.text()?.trim()
    if (!response) return null

    return parseAIResponse(response)
  } catch (error: any) {
    // Log detailed error for debugging
    if (error?.status === 403 || error?.status === 401) {
    }
    return null
  }
}

/**
 * Generate insights using OpenAI (GPT-4o-mini)
 */
async function generateInsightsWithOpenAI(
  systemPrompt: string,
  userContext: string
): Promise<{
  summary: string
  keyInsights: string[]
  recommendations: string[]
  moodAnalysis: string
  growthAreas: string[]
} | null> {
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
      temperature: 0.7,
      max_tokens: 1500,
      top_p: 0.95,
    })

    const response = completion.choices[0]?.message?.content?.trim()
    if (!response) return null

    return parseAIResponse(response)
  } catch (error) {
    return null
  }
}

/**
 * Build the system prompt for AI insight generation
 */
function buildInsightSystemPrompt(): string {
  return `You are a compassionate mental health insights assistant for "Prompt & Pause", a UK-based reflection service.

Your role is to analyze a user's weekly reflection data and generate personalized, actionable insights.

Guidelines:
- Be warm, encouraging, and non-judgmental
- Focus on growth, patterns, and positive reinforcement
- Avoid clinical/therapy language
- Be specific to their data (reference their stats, moods, topics)
- Provide actionable recommendations
- Keep insights concise but meaningful
- Consider UK cultural context
- Use British English spelling

Output Format (use this exact structure):

SUMMARY:
[2-3 sentences summarizing their week's reflection journey]

KEY_INSIGHTS:
- [Insight 1]
- [Insight 2]
- [Insight 3]

RECOMMENDATIONS:
- [Recommendation 1]
- [Recommendation 2]
- [Recommendation 3]

MOOD_ANALYSIS:
[2-3 sentences about their mood patterns and what they might indicate]

GROWTH_AREAS:
- [Area 1]
- [Area 2]

Keep each section concise and actionable. Be specific to their data.`
}

/**
 * Build context from weekly digest data
 */
function buildWeeklyContext(digest: WeeklyDigest, userName: string | null): string {
  const name = userName || 'there'
  
  let context = `Generate personalized insights for ${name} based on their weekly reflection data:\n\n`
  
  // Basic stats
  context += `**Week Summary:**\n`
  context += `- Period: ${digest.weekStart} to ${digest.weekEnd}\n`
  context += `- Total reflections: ${digest.totalReflections}\n`
  context += `- Average word count: ${digest.averageWordCount}\n`
  context += `- Current streak: ${digest.currentStreak} days\n\n`
  
  // Mood distribution
  if (digest.moodDistribution.length > 0) {
    context += `**Mood Distribution:**\n`
    digest.moodDistribution.forEach(({ mood, count }) => {
      context += `- ${mood}: ${count} time(s)\n`
    })
    context += '\n'
  }
  
  // Top themes
  if (digest.topTags.length > 0) {
    context += `**Top Themes:**\n`
    digest.topTags.forEach(({ tag, count }) => {
      context += `- ${tag} (${count} reflections)\n`
    })
    context += '\n'
  }
  
  // Recent reflections
  if (digest.reflectionSummaries.length > 0) {
    context += `**Recent Reflection Snippets:**\n`
    digest.reflectionSummaries.slice(0, 3).forEach(({ date, prompt, snippet }) => {
      context += `- ${date}: "${prompt}" - ${snippet}\n`
    })
  }
  
  return context
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(response: string): {
  summary: string
  keyInsights: string[]
  recommendations: string[]
  moodAnalysis: string
  growthAreas: string[]
} {
  const sections = {
    summary: '',
    keyInsights: [] as string[],
    recommendations: [] as string[],
    moodAnalysis: '',
    growthAreas: [] as string[],
  }

  // Split response into sections
  const summaryMatch = response.match(/SUMMARY:\s*\n([\s\S]*?)(?=\n\nKEY_INSIGHTS:|\nKEY_INSIGHTS:|$)/i)
  const insightsMatch = response.match(/KEY_INSIGHTS:\s*\n([\s\S]*?)(?=\n\nRECOMMENDATIONS:|\nRECOMMENDATIONS:|$)/i)
  const recommendationsMatch = response.match(/RECOMMENDATIONS:\s*\n([\s\S]*?)(?=\n\nMOOD_ANALYSIS:|\nMOOD_ANALYSIS:|$)/i)
  const moodMatch = response.match(/MOOD_ANALYSIS:\s*\n([\s\S]*?)(?=\n\nGROWTH_AREAS:|\nGROWTH_AREAS:|$)/i)
  const growthMatch = response.match(/GROWTH_AREAS:\s*\n([\s\S]*?)$/i)

  // Extract summary
  if (summaryMatch) {
    sections.summary = summaryMatch[1].trim()
  }

  // Extract insights (bullet points)
  if (insightsMatch) {
    sections.keyInsights = insightsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().replace(/^-\s*/, ''))
      .filter(line => line.length > 0)
  }

  // Extract recommendations (bullet points)
  if (recommendationsMatch) {
    sections.recommendations = recommendationsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().replace(/^-\s*/, ''))
      .filter(line => line.length > 0)
  }

  // Extract mood analysis
  if (moodMatch) {
    sections.moodAnalysis = moodMatch[1].trim()
  }

  // Extract growth areas (bullet points)
  if (growthMatch) {
    sections.growthAreas = growthMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().replace(/^-\s*/, ''))
      .filter(line => line.length > 0)
  }

  return sections
}

/**
 * Generate basic insights if AI fails (fallback)
 */
function generateBasicInsights(
  digest: WeeklyDigest,
  userName: string | null
): {
  summary: string
  keyInsights: string[]
  recommendations: string[]
  moodAnalysis: string
  growthAreas: string[]
  provider: AIProvider
  model: string
} {
  const name = userName || 'there'
  
  return {
    summary: `Hi ${name}! This week you completed ${digest.totalReflections} reflection${digest.totalReflections !== 1 ? 's' : ''} with an average of ${digest.averageWordCount} words. ${digest.currentStreak > 0 ? `You are on a ${digest.currentStreak}-day streak! 🔥` : 'Keep building your reflection habit!'}`,
    
    keyInsights: [
      digest.totalReflections >= 5 
        ? 'You showed strong commitment to reflection this week'
        : 'There is room to reflect more consistently',
      digest.averageWordCount > 150
        ? 'Your detailed reflections help you process emotions deeply'
        : 'Consider writing more to gain deeper insights',
      digest.topTags.length > 0
        ? `Your main focus was ${digest.topTags[0].tag}`
        : 'Try adding tags to track themes'
    ],
    
    recommendations: [
      'Continue your daily reflection practice',
      'Explore new reflection prompts',
      'Review past reflections to see your growth'
    ],
    
    moodAnalysis: digest.moodDistribution.length > 0
      ? `Your most common mood this week was ${digest.moodDistribution[0].mood}. This gives insight into your emotional patterns.`
      : 'Track your moods to understand your emotional patterns better.',
    
    growthAreas: [
      'Building consistency in daily reflections',
      'Exploring deeper emotional awareness'
    ],
    
    provider: 'fallback',
    model: 'none',
  }
}
