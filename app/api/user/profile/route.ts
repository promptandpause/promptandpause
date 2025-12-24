import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile, updateUserProfile } from '@/lib/services/userService'

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
    console.error('Error fetching profile:', error)
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

    const result = await updateUserProfile(user.id, body)

    if (result.error) {
      throw new Error(result.error)
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.user
    })
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}
