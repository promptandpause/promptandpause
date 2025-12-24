import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/client'

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
    console.error('Error generating preview prompt:', error)
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
  // TODO: Replace with actual AI prompt generation
  // For now, use contextual prompts based on focus areas and mood
  
  const primaryFocus = focusAreas[0]
  const isPositiveMood = mood >= 7
  const isNeutralMood = mood >= 4 && mood < 7
  const isLowMood = mood < 4

  // Contextual prompts based on focus area and mood
  const prompts: Record<string, Record<string, string[]>> = {
    'Relationships': {
      positive: [
        "Think about a meaningful connection you've made recently. What qualities do you appreciate most in that relationship?",
        "Who in your life makes you feel most understood? What do they do that creates that feeling?",
        "Reflect on a moment of genuine connection you experienced today or this week."
      ],
      neutral: [
        "What does a healthy relationship look like to you? How do your current relationships measure up?",
        "Think about someone you'd like to connect with more deeply. What's one small step you could take?",
        "How do you typically show care for the people in your life? What feels most natural to you?"
      ],
      low: [
        "Even in challenging times, small connections matter. What's one kind interaction you've had recently?",
        "Relationships can be complex. What's one thing you're learning about connection right now?",
        "Think about a relationship that feels supportive. What makes it a safe space for you?"
      ]
    },
    'Career': {
      positive: [
        "What aspect of your work are you most proud of right now? What does that reveal about your strengths?",
        "Think about a recent professional accomplishment. What did you learn about yourself in the process?",
        "How has your career path shaped who you are today? What unexpected gifts has it given you?"
      ],
      neutral: [
        "Where do you see yourself growing professionally? What's one skill you'd like to develop?",
        "Reflect on your current work-life balance. What's working well, and what needs attention?",
        "What does professional fulfillment mean to you? Are you moving toward or away from it?"
      ],
      low: [
        "Career challenges are opportunities for growth. What's one thing you're learning from your current situation?",
        "Even small wins count. What's one thing you did well at work recently, no matter how small?",
        "What support or resources would help you feel more capable in your professional life?"
      ]
    },
    'Self-esteem': {
      positive: [
        "What's something you've accomplished recently that makes you proud? Take a moment to really acknowledge it.",
        "Think about a quality you possess that you genuinely appreciate. How does it show up in your daily life?",
        "Describe yourself the way a close friend who loves you would describe you."
      ],
      neutral: [
        "What's one kind thing you could say to yourself today? Why is it true?",
        "Think about a time when you showed resilience. What does that say about your character?",
        "What would treating yourself with more compassion look like in your daily life?"
      ],
      low: [
        "You are doing your best, and that's enough. What's one small thing you accomplished today?",
        "If a friend was feeling the way you are now, what would you say to them? Can you say that to yourself?",
        "What's one quality you have that has helped you get through difficult times before?"
      ]
    },
    'Gratitude': {
      positive: [
        "What brought you unexpected joy today? Take a moment to savor that feeling.",
        "Who is someone you're grateful for? What specific impact have they had on your life?",
        "What's something simple in your life that you might take for granted but truly appreciate?"
      ],
      neutral: [
        "Even on ordinary days, there are small gifts. What's one thing you're grateful for right now?",
        "Think about your five senses. What's one thing you experienced today that you appreciated?",
        "What's a challenge you've faced that, looking back, taught you something valuable?"
      ],
      low: [
        "Gratitude can be difficult when things are hard. What's one tiny thing that's okay right now?",
        "Sometimes gratitude is finding the smallest light. What's one breath, one moment that feels bearable?",
        "What's one thing that's still here for you, even if everything else feels uncertain?"
      ]
    },
    'Grief': {
      positive: [
        "What's a cherished memory that brings you comfort? Allow yourself to sit with that warmth.",
        "How have you honored your feelings today? What would honoring them look like tomorrow?",
        "What's one way you've shown yourself compassion through this difficult time?"
      ],
      neutral: [
        "Grief comes in waves. How are you riding the wave today?",
        "What do you need right now to feel a little more held or supported?",
        "What's one feeling you've been carrying that you'd like to acknowledge?"
      ],
      low: [
        "Your feelings are valid, all of them. What's the primary emotion you're experiencing right now?",
        "Grief is love with nowhere to go. What would you want to say if you could say anything?",
        "What would being gentle with yourself look like in this moment?"
      ]
    }
  }

  // Determine mood category
  let moodCategory = 'neutral'
  if (isPositiveMood) moodCategory = 'positive'
  if (isLowMood) moodCategory = 'low'

  // Get prompts for the primary focus area and mood
  const categoryPrompts = prompts[primaryFocus]?.[moodCategory] || prompts['Gratitude']['neutral']
  
  // Return a random prompt from the appropriate category
  const randomIndex = Math.floor(Math.random() * categoryPrompts.length)
  return categoryPrompts[randomIndex]
}
