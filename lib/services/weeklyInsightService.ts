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
  headline: string
  observations: string[]
  reflection: string
  question: string
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
      const result = await generateInsightsWithHuggingFace(systemPrompt, userContext)
      
      if (result) {
        return {
          ...result.insights,
          provider: 'huggingface',
          model: result.model,
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
  headline: string
  observations: string[]
  reflection: string
  question: string
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
  insights: {
    headline: string
    observations: string[]
    reflection: string
    question: string
  }
  model: string
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
        return { insights: parseAIResponse(text), model }
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
  headline: string
  observations: string[]
  reflection: string
  question: string
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
  headline: string
  observations: string[]
  reflection: string
  question: string
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
  return `You are generating a weekly reflection summary.

Rules:
- Do not diagnose.
- Do not give advice.
- Do not tell the user what to do.
- Do not exaggerate emotional conclusions.
- Be specific, but cautious.
- Sound like a thoughtful observer, not a coach.

Structure (always exactly this):
1. One-sentence overview of the week.
2. 2–3 neutral observations.
3. One short thematic reflection.
4. One gentle reflective question.

Tone:
- Calm
- Respectful
- Grounded
- Adult

Output Format (use this exact structure):

HEADLINE:
[one sentence]

OBSERVATIONS:
- [observation 1]
- [observation 2]
- [observation 3 if needed]

THEME_REFLECTION:
[short paragraph]

GENTLE_QUESTION:
[one question]`
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

  if (digest.signals) {
    context += `\n**Engagement Signals:**\n`
    context += `- Days with entries: ${digest.signals.daysWithEntries}\n`
    context += `- Days skipped: ${digest.signals.daysSkipped}\n`
    context += `\n**Mood Signals:**\n`
    context += `- Most common mood: ${digest.signals.moodMostCommon || 'N/A'}\n`
    context += `- Mood variance (rough): ${digest.signals.moodVariance ?? 'N/A'}\n`
    context += `\n**Reflection Length:**\n`
    context += `- Average words: ${digest.signals.reflectionLength.average}\n`
    context += `- Median words: ${digest.signals.reflectionLength.median}\n`
    context += `- Short entries count: ${digest.signals.reflectionLength.shortCount}\n`
    context += `- Long entries count: ${digest.signals.reflectionLength.longCount}\n`
    context += `- First half average: ${digest.signals.reflectionLength.firstHalfAverage}\n`
    context += `- Second half average: ${digest.signals.reflectionLength.secondHalfAverage}\n`

    if (digest.signals.repeatedWords.length > 0) {
      context += `\n**Repeated Words:**\n`
      digest.signals.repeatedWords.slice(0, 6).forEach(({ word, count }) => {
        context += `- ${word}: ${count}\n`
      })
    }

    if (digest.signals.promptTypeDepth.length > 0) {
      context += `\n**Prompt Types Written Most Deeply:**\n`
      digest.signals.promptTypeDepth.slice(0, 4).forEach(({ promptType, averageWordCount, count }) => {
        context += `- ${promptType}: avg ${averageWordCount} words (${count} entries)\n`
      })
    }

    if (digest.signals.selectedFocusAreas.length > 0) {
      context += `\n**User Focus Areas (contextual lens only):**\n`
      context += `- ${digest.signals.selectedFocusAreas.slice(0, 3).join(', ')}\n`
      context += `Note: Do not mention focus areas explicitly. They should only subtly influence tone and angle.\n`
    }
  }
  
  return context
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(response: string): {
  headline: string
  observations: string[]
  reflection: string
  question: string
} {
  const sections = {
    headline: '',
    observations: [] as string[],
    reflection: '',
    question: '',
  }

  const headlineMatch = response.match(/HEADLINE:\s*\n([\s\S]*?)(?=\n\nOBSERVATIONS:|\nOBSERVATIONS:|$)/i)
  const observationsMatch = response.match(/OBSERVATIONS:\s*\n([\s\S]*?)(?=\n\nTHEME_REFLECTION:|\nTHEME_REFLECTION:|$)/i)
  const reflectionMatch = response.match(/THEME_REFLECTION:\s*\n([\s\S]*?)(?=\n\nGENTLE_QUESTION:|\nGENTLE_QUESTION:|$)/i)
  const questionMatch = response.match(/GENTLE_QUESTION:\s*\n([\s\S]*?)$/i)

  if (headlineMatch) sections.headline = headlineMatch[1].trim()

  if (observationsMatch) {
    sections.observations = observationsMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-'))
      .map(line => line.replace(/^[-*]\s*/, ''))
      .filter(Boolean)
      .slice(0, 3)
  }

  if (reflectionMatch) sections.reflection = reflectionMatch[1].trim()
  if (questionMatch) sections.question = questionMatch[1].trim()

  // Guardrails if model returns partial output
  if (!sections.headline) sections.headline = 'This week left a few clear patterns.'
  if (sections.observations.length === 0) sections.observations = ['Your entries captured the week as it was, without forcing it to be neat.']
  if (!sections.reflection) sections.reflection = 'A few themes showed up more than once, which can be its own kind of signal.'
  if (!sections.question) sections.question = 'What felt most worth naming this week?'

  return sections
}

/**
 * Generate basic insights if AI fails (fallback)
 */
function generateBasicInsights(
  digest: WeeklyDigest,
  userName: string | null
): {
  headline: string
  observations: string[]
  reflection: string
  question: string
  provider: AIProvider
  model: string
} {
  const name = userName || 'there'

  const observations: string[] = []
  if (digest.signals) {
    observations.push(`You wrote on ${digest.signals.daysWithEntries} day${digest.signals.daysWithEntries === 1 ? '' : 's'} this week.`)
    if (digest.signals.daysSkipped > 0) {
      observations.push(`${digest.signals.daysSkipped} day${digest.signals.daysSkipped === 1 ? '' : 's'} passed without an entry.`)
    }
    if (digest.signals.reflectionLength.longCount > digest.signals.reflectionLength.shortCount) {
      observations.push('Your entries tended to run longer, especially when you stayed with a thought.')
    } else if (digest.signals.reflectionLength.shortCount > 0) {
      observations.push('Your entries were mostly shorter—more like quick check-ins than deep dives.')
    }
  } else {
    observations.push(`You wrote ${digest.totalReflections} reflection${digest.totalReflections === 1 ? '' : 's'} this week.`)
  }

  return {
    headline: digest.totalReflections === 0
      ? `This week was quieter on the page.`
      : `This week held a steady thread, even when the days varied.`,
    observations: observations.slice(0, 3),
    reflection: digest.topTags.length > 0
      ? `A few of your entries kept circling back to ${digest.topTags[0].tag}. Not necessarily as a problem—just as something that stayed present.`
      : `Even without obvious themes, the way you showed up matters.`,
    question: `What would feel most worth carrying forward into next week, and what can stay here?`,
    provider: 'fallback',
    model: 'none',
  }
}
