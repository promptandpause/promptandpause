import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile, updateUserProfile } from '@/lib/services/userService'
import { z } from 'zod'

// Zod schema for user profile update
const UpdateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Full name too long').optional(),
  timezone: z.string().optional(),
  language: z.string().optional()
})

/**
 * GET /api/user/profile
 * Get user profile information
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
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
 * Update user profile
 * Body: { full_name?, timezone?, language? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input with Zod
    const parsed = UpdateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const result = await updateUserProfile(user.id, parsed.data)

    if (result.error) {
      throw new Error(result.error)
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.user
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}
