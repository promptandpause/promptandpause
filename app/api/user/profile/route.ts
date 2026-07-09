import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { getUserProfile, updateUserProfile } from '@/lib/services/userService'
import { z } from 'zod'

// Extended Zod schema for user profile update (including social fields)
const UpdateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Full name too long').optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  display_name: z.string().max(100).optional(),
  username: z.string().max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens and underscores').optional(),
  bio: z.string().max(500).optional(),
  mood_song_url: z.string().max(500).optional(),
  mood_song_title: z.string().max(200).optional(),
  cover_image_url: z.string().max(500).optional(),
  profile_theme: z.record(z.any()).optional(),
  share_default: z.enum(['private', 'friends_only', 'public']).optional(),
  is_public_profile: z.boolean().optional(),
  show_in_discover: z.boolean().optional(),
})

/**
 * GET /api/user/profile
 * Get user profile information
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const result = await getUserProfile(user.id)

    if (result.error) {
      throw new Error(result.error)
    }

    return NextResponse.json({
      success: true,
      data: result.user
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/profile
 * Update user profile (including social fields)
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const parsed = UpdateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Directly update the profiles table for social fields,
    // fall back to the existing userService for legacy fields
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}
