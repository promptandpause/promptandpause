import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth, getUserById, updateUserProfile, deleteUser } from '@/lib/services/adminService'

/**
 * GET /api/admin/users/[id]
 * Get single user details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminAuth = await checkAdminAuth(user.email || '')
    if (!adminAuth.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const result = await getUserById(id)

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch user')
    }

    return NextResponse.json({
      success: true,
      data: result.user
    })
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user profile
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminAuth = await checkAdminAuth(user.email || '')
    if (!adminAuth.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { full_name, email, timezone, language } = body

    const result = await updateUserProfile(
      id,
      { full_name, email, timezone, language },
      user.email || ''
    )

    if (!result.success) {
      throw new Error(result.error || 'Failed to update user')
    }

    return NextResponse.json({
      success: true,
      data: result.user,
      message: 'User updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user account
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminAuth = await checkAdminAuth(user.email || '')
    if (!adminAuth.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const result = await deleteUser(id, user.email || '')

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete user')
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    )
  }
}
