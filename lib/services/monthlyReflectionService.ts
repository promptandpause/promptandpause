import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { decryptIfEncrypted } from '@/lib/utils/crypto'
import { MoodType } from '@/lib/types/reflection'

type AIProvider = 'gemini' | 'openai' | 'openrouter' | 'huggingface' | 'fallback'

const OPENROUTER_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'qwen/qwen-2.5-7b-instruct:free',
  'microsoft/phi-3-medium-128k-instruct:free',
  'google/gemini-flash-1.5-8b',
  'anthropic/claude-3-haiku',
  'meta-llama/llama-3.1-8b-instruct',
  'openai/gpt-4o-mini',
]

const HUGGINGFACE_MODELS = [
  'meta-llama/Meta-Llama-3-8B-Instruct',
  'mistralai/Mistral-7B-Instruct-v0.3',
  'microsoft/Phi-3-mini-4k-instruct',
  'google/gemma-2-9b-it',
  'Qwen/Qwen2.5-7B-Instruct',
]

const GEMINI_MODEL = 'gemini-2.5-flash'
const OPENAI_MODEL = 'gpt-4o-mini'

const openrouter = process.env.OPENROUTER_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: 'https://openrouter.ai/api/v1' })
  : null

const huggingface = process.env.HUGGINGFACE_API_KEY
  ? new OpenAI({ apiKey: process.env.HUGGINGFACE_API_KEY, baseURL: 'https://api-inference.huggingface.co/v1' })
  : null

const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface MonthlyReflectionSummaryResult {
  monthStart: string
  monthEnd: string
  overviewText: string
  observations: string[]
  themeReflection: string
  closingQuestion: string
  provider: AIProvider
  model: string
}

export function getMonthRange(date: Date): { monthStart: Date; monthEnd: Date } {
  const monthStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0))
  const monthEnd = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999))
  return { monthStart, monthEnd }
}

export function getPreviousMonthRange(now: Date = new Date()): { monthStart: Date; monthEnd: Date } {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12, 0, 0, 0))
  d.setUTCMonth(d.getUTCMonth() - 1)
  return getMonthRange(d)
}

export async function generateMonthlyReflectionSummaryServer(
  userId: string,
  userName: string | null,
  monthStart: Date,
  monthEnd: Date
): Promise<MonthlyReflectionSummaryResult> {
  const supabase = createServiceRoleClient()

  const { data: reflections } = await supabase
    .from('reflections')
    .select('date, created_at, mood, word_count, reflection_text, prompt_text, prompt_type, personalization_context')
    .eq('user_id', userId)
    .gte('date', monthStart.toISOString().slice(0, 10))
    .lte('date', monthEnd.toISOString().slice(0, 10))
    .order('date', { ascending: true })

  const rows = (reflections || []).map((r: any) => {
    const raw = r.reflection_text || ''
    const plain = decryptIfEncrypted(raw) || raw
    return {
      date: (r.date || r.created_at || '').toString().slice(0, 10),
      mood: r.mood as MoodType | null,
      word_count: Number(r.word_count || 0),
      reflection_text: plain,
      prompt_text: r.prompt_text || '',
      prompt_type: r.prompt_type || r.personalization_context?.prompt_type || null,
    }
  })

  const systemPrompt = buildMonthlySystemPrompt()
  const userContext = buildMonthlyContext(rows, userName, monthStart, monthEnd)

  if (openrouter) {
    const result = await generateWithOpenRouter(systemPrompt, userContext)
    if (result) {
      return {
        monthStart: monthStart.toISOString().slice(0, 10),
        monthEnd: monthEnd.toISOString().slice(0, 10),
        ...result.insights,
        provider: 'openrouter',
        model: result.model,
      }
    }
  }

  if (huggingface) {
    const result = await generateWithHuggingFace(systemPrompt, userContext)
    if (result) {
      return {
        monthStart: monthStart.toISOString().slice(0, 10),
        monthEnd: monthEnd.toISOString().slice(0, 10),
        ...result.insights,
        provider: 'huggingface',
        model: result.model,
      }
    }
  }

  if (gemini) {
    const insights = await generateWithGemini(systemPrompt, userContext)
    if (insights) {
      return {
        monthStart: monthStart.toISOString().slice(0, 10),
        monthEnd: monthEnd.toISOString().slice(0, 10),
        ...insights,
        provider: 'gemini',
        model: GEMINI_MODEL,
      }
    }
  }

  if (process.env.OPENAI_API_KEY) {
    const insights = await generateWithOpenAI(systemPrompt, userContext)
    if (insights) {
      return {
        monthStart: monthStart.toISOString().slice(0, 10),
        monthEnd: monthEnd.toISOString().slice(0, 10),
        ...insights,
        provider: 'openai',
        model: OPENAI_MODEL,
      }
    }
  }

  return generateMonthlyFallback(rows, monthStart, monthEnd)
}

function buildMonthlySystemPrompt(): string {
  return `You are generating a monthly reflection summary.

Rules:
- Do not diagnose.
- Do not give advice.
- Do not tell the user what to do.
- Do not exaggerate emotional conclusions.
- Be specific, but cautious.
- Sound like a thoughtful observer, not a coach.
- Do not compare using "better/worse", "improved/declined".

Structure (fixed, always):
1. Month-at-a-glance (calm, high-level).
2. Emotional tone shift (if any).
3. Recurring themes.
4. One long-view question.

Tone:
- Calm
- Respectful
- Grounded
- Adult

Output Format (use this exact structure):

OVERVIEW:
[1 short paragraph]

OBSERVATIONS:
- [observation 1]
- [observation 2]
- [observation 3 if needed]

THEME_REFLECTION:
[short paragraph]

CLOSING_QUESTION:
[one question]`
}

function buildMonthlyContext(
  rows: Array<{ date: string; mood: MoodType | null; word_count: number; reflection_text: string; prompt_text: string; prompt_type: string | null }>,
  userName: string | null,
  monthStart: Date,
  monthEnd: Date
): string {
  const name = userName || 'there'

  const totalEntries = rows.length
  const avgWords = totalEntries === 0 ? 0 : Math.round(rows.reduce((s, r) => s + r.word_count, 0) / totalEntries)

  const moodCounts: Record<string, number> = {}
  for (const r of rows) {
    if (!r.mood) continue
    moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1
  }

  const moodDistribution = Object.entries(moodCounts)
    .map(([mood, count]) => ({ mood: mood as MoodType, count }))
    .sort((a, b) => b.count - a.count)

  const stop = new Set([
    'the','and','for','that','with','this','from','have','had','was','were','are','but','not','you','your','i','me','my','we','our','they','them','a','an','to','of','in','on','at','it','as','is','be','been','so','if','or','by','do','did','just','really','very','can','could','would','should'
  ])

  const wordCounts: Record<string, number> = {}
  for (const r of rows) {
    const tokens = (r.reflection_text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s']/g, ' ')
      .split(/\s+/)
      .map((t: string) => t.trim())
      .filter(Boolean)
      .filter((t: string) => t.length >= 4)
      .filter((t: string) => !stop.has(t))

    for (const t of tokens) wordCounts[t] = (wordCounts[t] || 0) + 1
  }

  const repeatedWords = Object.entries(wordCounts)
    .map(([word, count]) => ({ word, count }))
    .filter(x => x.count >= 6)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const promptTypeMap = new Map<string, { totalWords: number; count: number }>()
  for (const r of rows) {
    const pt = (r.prompt_type || '').toString().trim()
    if (!pt) continue
    const entry = promptTypeMap.get(pt) || { totalWords: 0, count: 0 }
    entry.totalWords += r.word_count
    entry.count += 1
    promptTypeMap.set(pt, entry)
  }

  const promptTypeDepth = Array.from(promptTypeMap.entries())
    .map(([promptType, v]) => ({ promptType, count: v.count, averageWordCount: v.count > 0 ? Math.round(v.totalWords / v.count) : 0 }))
    .sort((a, b) => b.averageWordCount - a.averageWordCount)
    .slice(0, 4)

  const moodScores: Record<MoodType, number> = { '😔': 1, '😐': 2, '🤔': 2, '😊': 3, '😌': 3, '🙏': 3, '💪': 3, '😄': 4 }
  const moodVariance = (() => {
    const moods = rows.map(r => r.mood).filter(Boolean) as MoodType[]
    if (moods.length < 2) return null
    const scores = moods.map(m => moodScores[m] ?? 2)
    const mean = scores.reduce((s, v) => s + v, 0) / scores.length
    const variance = scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / scores.length
    return Number(variance.toFixed(2))
  })()

  let context = `Generate a monthly reflection summary for ${name}.\n\n`
  context += `Month range: ${monthStart.toISOString().slice(0, 10)} to ${monthEnd.toISOString().slice(0, 10)}\n`
  context += `Total entries: ${totalEntries}\n`
  context += `Average word count: ${avgWords}\n`
  context += `Mood variance (rough): ${moodVariance ?? 'N/A'}\n\n`

  if (moodDistribution.length > 0) {
    context += `Mood distribution:\n`
    for (const m of moodDistribution.slice(0, 6)) context += `- ${m.mood}: ${m.count}\n`
    context += `\n`
  }

  if (promptTypeDepth.length > 0) {
    context += `Prompt types written most deeply (proxy):\n`
    for (const p of promptTypeDepth) context += `- ${p.promptType}: avg ${p.averageWordCount} words (${p.count})\n`
    context += `\n`
  }

  if (repeatedWords.length > 0) {
    context += `Repeated words (simple frequency):\n`
    for (const w of repeatedWords.slice(0, 8)) context += `- ${w.word}: ${w.count}\n`
    context += `\n`
  }

  if (rows.length > 0) {
    context += `A few excerpts (verbatim snippets, not interpretive):\n`
    for (const r of rows.slice(-3)) {
      const snippet = (r.reflection_text || '').slice(0, 140).replace(/\s+/g, ' ').trim()
      context += `- ${r.date}: ${snippet}${snippet.length >= 140 ? '…' : ''}\n`
    }
  }

  return context
}

function parseMonthlyResponse(text: string): {
  overviewText: string
  observations: string[]
  themeReflection: string
  closingQuestion: string
} {
  const overviewMatch = text.match(/OVERVIEW:\s*\n([\s\S]*?)(?=\n\nOBSERVATIONS:|\nOBSERVATIONS:|$)/i)
  const observationsMatch = text.match(/OBSERVATIONS:\s*\n([\s\S]*?)(?=\n\nTHEME_REFLECTION:|\nTHEME_REFLECTION:|$)/i)
  const reflectionMatch = text.match(/THEME_REFLECTION:\s*\n([\s\S]*?)(?=\n\nCLOSING_QUESTION:|\nCLOSING_QUESTION:|$)/i)
  const questionMatch = text.match(/CLOSING_QUESTION:\s*\n([\s\S]*?)$/i)

  const observations = observationsMatch
    ? observationsMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.replace(/^[-*]\s*/, ''))
        .filter(Boolean)
        .slice(0, 3)
    : []

  return {
    overviewText: (overviewMatch?.[1] || '').trim(),
    observations,
    themeReflection: (reflectionMatch?.[1] || '').trim(),
    closingQuestion: (questionMatch?.[1] || '').trim(),
  }
}

async function generateWithOpenRouter(
  systemPrompt: string,
  userContext: string
): Promise<{ insights: { overviewText: string; observations: string[]; themeReflection: string; closingQuestion: string }; model: string } | null> {
  if (!openrouter) return null

  const modelPrefs = (process.env.OPENROUTER_MODEL_PREFS || '')
    .split(',')
    .map(m => m.trim())
    .filter(Boolean)

  const models = modelPrefs.length > 0 ? modelPrefs : OPENROUTER_MODELS

  for (const model of models) {
    try {
      const completion = await openrouter.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContext },
        ],
        temperature: 0.6,
        max_tokens: 1400,
      })

      const text = completion.choices[0]?.message?.content?.trim()
      if (!text) continue

      const parsed = parseMonthlyResponse(text)
      if (!parsed.overviewText || parsed.observations.length === 0 || !parsed.themeReflection || !parsed.closingQuestion) {
        continue
      }

      return { insights: parsed, model }
    } catch (error: any) {
      const status = error?.status
      if (status === 404) continue
      if (status === 401 || status === 403) return null
      continue
    }
  }

  return null
}

async function generateWithHuggingFace(
  systemPrompt: string,
  userContext: string
): Promise<{ insights: { overviewText: string; observations: string[]; themeReflection: string; closingQuestion: string }; model: string } | null> {
  if (!huggingface) return null

  for (const model of HUGGINGFACE_MODELS) {
    try {
      const completion = await huggingface.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContext },
        ],
        temperature: 0.6,
        max_tokens: 1400,
      })

      const text = completion.choices[0]?.message?.content?.trim()
      if (!text) continue

      const parsed = parseMonthlyResponse(text)
      if (!parsed.overviewText || parsed.observations.length === 0 || !parsed.themeReflection || !parsed.closingQuestion) {
        continue
      }

      return { insights: parsed, model }
    } catch (error: any) {
      const status = error?.status
      if (status === 404 || status === 503) continue
      if (status === 401 || status === 403) return null
      continue
    }
  }

  return null
}

async function generateWithGemini(
  systemPrompt: string,
  userContext: string
): Promise<{ overviewText: string; observations: string[]; themeReflection: string; closingQuestion: string } | null> {
  if (!gemini) return null

  try {
    const model = gemini.getGenerativeModel({ model: GEMINI_MODEL })
    const fullPrompt = `${systemPrompt}\n\n${userContext}`

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 1400, topP: 0.95 },
    })

    const text = result.response.text()?.trim()
    if (!text) return null

    const parsed = parseMonthlyResponse(text)
    if (!parsed.overviewText || parsed.observations.length === 0 || !parsed.themeReflection || !parsed.closingQuestion) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

async function generateWithOpenAI(
  systemPrompt: string,
  userContext: string
): Promise<{ overviewText: string; observations: string[]; themeReflection: string; closingQuestion: string } | null> {
  if (!process.env.OPENAI_API_KEY) return null

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContext },
      ],
      temperature: 0.6,
      max_tokens: 1400,
      top_p: 0.95,
    })

    const text = completion.choices[0]?.message?.content?.trim()
    if (!text) return null

    const parsed = parseMonthlyResponse(text)
    if (!parsed.overviewText || parsed.observations.length === 0 || !parsed.themeReflection || !parsed.closingQuestion) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function generateMonthlyFallback(
  rows: Array<{ date: string; mood: MoodType | null; word_count: number; reflection_text: string; prompt_text: string; prompt_type: string | null }>,
  monthStart: Date,
  monthEnd: Date
): MonthlyReflectionSummaryResult {
  const totalEntries = rows.length
  const avgWords = totalEntries === 0 ? 0 : Math.round(rows.reduce((s, r) => s + r.word_count, 0) / totalEntries)

  const observations: string[] = []
  observations.push(`You wrote ${totalEntries} time${totalEntries === 1 ? '' : 's'} this month.`)
  if (totalEntries > 0) observations.push(`Your entries averaged about ${avgWords} words.`)
  if (observations.length < 2) observations.push('The month was quieter on the page.')

  return {
    monthStart: monthStart.toISOString().slice(0, 10),
    monthEnd: monthEnd.toISOString().slice(0, 10),
    overviewText: totalEntries === 0
      ? 'This month was quieter on the page, with few or no entries to summarise.'
      : 'This month left a few steady signals across your entries, without needing a single story to explain it.',
    observations: observations.slice(0, 3),
    themeReflection: 'Over a month, repetition can matter more than intensity — small themes returning is often the clearest signal.',
    closingQuestion: 'Looking back over the month, what feels most worth remembering — and what can be left where it is?',
    provider: 'fallback',
    model: 'none',
  }
}
