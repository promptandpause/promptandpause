import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"

const FALLBACK_AFFIRMATIONS = [
  "You're doing great—one step at a time.",
  "Be gentle with yourself today.",
  "Every small step counts.",
  "You are enough, just as you are.",
  "Progress, not perfection.",
  "You’ve already handled hard things before.",
]

const DEFAULT_TONE = "gentle / motivating / grounded / short-mantra"

function getDailyFallback(): string {
  const today = new Date()
  const seed = Number(
    `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
      today.getDate()
    ).padStart(2, "0")}`
  )
  return FALLBACK_AFFIRMATIONS[seed % FALLBACK_AFFIRMATIONS.length]
}

function summarizeTags(tags: string[][]): string[] {
  const counts = new Map<string, number>()
  tags.flat().forEach((tag) => {
    if (!tag) return
    counts.set(tag, (counts.get(tag) ?? 0) + 1)
  })
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag)
}

export async function GET() {
  const today = new Date().toISOString().split("T")[0]
  const fallback = getDailyFallback()

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        text: fallback,
        source: "fallback",
        date: today,
        tone: DEFAULT_TONE,
        reason: "Not authenticated",
      })
    }

    const { data: cachedAffirmation } = await supabase
      .from("daily_affirmations")
      .select("text,source,tone,usage,ai_provider,ai_model")
      .eq("user_id", user.id)
      .eq("affirmation_date", today)
      .maybeSingle()

    if (cachedAffirmation?.text) {
      return NextResponse.json({
        text: cachedAffirmation.text,
        source: cachedAffirmation.source || "cache",
        date: today,
        tone: cachedAffirmation.tone || DEFAULT_TONE,
        usage: cachedAffirmation.usage ?? undefined,
        provider: cachedAffirmation.ai_provider ?? undefined,
        model: cachedAffirmation.ai_model ?? undefined,
        cached: true,
      })
    }

    const { data: reflections } = await supabase
      .from("reflections")
      .select("mood,tags,word_count,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    const recent = reflections ?? []
    const recentMoods = recent.map((item) => item.mood).filter(Boolean)
    const recentTags = summarizeTags(recent.map((item) => item.tags || []))
    const lastReflectionDate = recent[0]?.created_at?.split("T")[0] ?? null

    const context = {
      date: today,
      recent_moods: recentMoods,
      recent_tags: recentTags,
      reflections_count: recent.length,
      last_reflection_date: lastReflectionDate,
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY
    if (!openrouterKey) {
      await supabase.from("daily_affirmations").insert({
        user_id: user.id,
        affirmation_date: today,
        text: fallback,
        tone: DEFAULT_TONE,
        source: "fallback",
        context,
      })

      return NextResponse.json({
        text: fallback,
        source: "fallback",
        date: today,
        tone: DEFAULT_TONE,
        reason: "OPENROUTER_API_KEY not configured",
      })
    }

    const openrouter = new OpenAI({
      apiKey: openrouterKey,
      baseURL: "https://openrouter.ai/api/v1",
    })

    const model =
      process.env.OPENROUTER_MODEL_PREFS?.split(",")[0]?.trim() ||
      "meta-llama/llama-3.3-70b-instruct:free"

    const stream = await openrouter.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a calm, supportive wellness coach. Write one short affirmation (8-12 words). Tone: gentle, motivating, grounded, short-mantra. No emojis. No quotes. Return only the sentence.",
        },
        {
          role: "user",
          content: `Context: ${JSON.stringify(context)}`,
        },
      ],
      stream: true,
      stream_options: { include_usage: true },
      temperature: 0.75,
      max_tokens: 80,
      top_p: 0.9,
    })

    let response = ""
    let usage: unknown = null

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) response += content
      if (chunk.usage) usage = chunk.usage
    }

    const text = response.trim() || fallback
    const source = response.trim() ? "openrouter" : "fallback"

    await supabase.from("daily_affirmations").insert({
      user_id: user.id,
      affirmation_date: today,
      text,
      tone: DEFAULT_TONE,
      source,
      ai_provider: source === "openrouter" ? "openrouter" : null,
      ai_model: source === "openrouter" ? model : null,
      usage: source === "openrouter" ? usage : null,
      context,
    })

    return NextResponse.json({
      text,
      source,
      date: today,
      tone: DEFAULT_TONE,
      usage: source === "openrouter" ? usage : undefined,
      provider: source === "openrouter" ? "openrouter" : undefined,
      model: source === "openrouter" ? model : undefined,
    })
  } catch (error) {
    return NextResponse.json({
      text: fallback,
      source: "fallback",
      date: today,
      tone: DEFAULT_TONE,
      reason: error instanceof Error ? error.message : "OpenRouter error",
    })
  }
}
