import { NextResponse } from 'next/server'

/**
 * POST /api/prompts/generate-preview
 * Generates a personalized preview prompt during onboarding
 * Based on user's selected reason, mood, and focus areas
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { reason, mood, focusAreas } = body

    // Validate input
    if (!focusAreas || focusAreas.length === 0) {
      return NextResponse.json(
        { error: 'Focus areas are required' },
        { status: 400 }
      )
    }

    // For now, we'll use a simple prompt generation
    // In production, this would call your AI service (OpenAI, etc.)
    const prompt = await generatePersonalizedPrompt(reason, mood, focusAreas)

    return NextResponse.json({
      success: true,
      prompt
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate preview prompt' },
      { status: 500 }
    )
  }
}

/**
 * Generate a personalized prompt based on user's onboarding selections
 */
async function generatePersonalizedPrompt(
  reason: string,
  mood: number,
  focusAreas: string[]
): Promise<string> {
  const primaryFocus = (focusAreas[0] || '').trim()
  const moodCategory = mood >= 7 ? 'high' : mood < 4 ? 'low' : 'neutral'

  const prompts: Record<string, Record<string, string[]>> = {
    'Clarity': {
      low: [
        'What feels most unclear right now — and what feels certain enough to stand on?'
      ],
      neutral: [
        'What’s one decision or question you’ve been circling — and what detail keeps repeating?'
      ],
      high: [
        'What’s one thing you understand more clearly this week than you did last week?'
      ],
    },
    'Emotional Balance': {
      low: [
        'What feeling is most present right now, without trying to explain it away?'
      ],
      neutral: [
        'When did your mood shift even slightly this week, and what was happening around it?'
      ],
      high: [
        'What helped you stay steady this week, even in small ways?'
      ],
    },
    'Work & Responsibility': {
      low: [
        'What part of your responsibilities feels heaviest right now, and what part feels manageable?'
      ],
      neutral: [
        'Where did you spend more energy than you expected this week?'
      ],
      high: [
        'What work or responsibility felt most worth doing this week, and why?'
      ],
    },
    'Relationships': {
      low: [
        'Where did you feel least understood recently, and what do you wish had been noticed?'
      ],
      neutral: [
        'Which relationship has been taking up the most space in your mind lately?'
      ],
      high: [
        'Who did you feel most at ease with this week, and what made it easier?'
      ],
    },
    'Change & Uncertainty': {
      low: [
        'What feels unsettled right now — and what would count as “enough clarity for today”?'
      ],
      neutral: [
        'What change have you been adjusting to lately, even if you haven’t named it directly?'
      ],
      high: [
        'What’s one uncertainty you’re learning to make room for, rather than solve?'
      ],
    },
    'Grounding': {
      low: [
        'Right now, what’s one small thing you can notice that tells you you’re here?'
      ],
      neutral: [
        'When did you feel most present this week, even briefly?'
      ],
      high: [
        'What ordinary moment this week felt quietly good?'
      ],
    },
  }

  const bucket = prompts[primaryFocus]?.[moodCategory] || prompts['Grounding']['neutral']
  return bucket[Math.floor(Math.random() * bucket.length)]
}
