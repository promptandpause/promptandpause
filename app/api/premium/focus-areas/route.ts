import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/utils/tierManagement'
import { z } from 'zod'

// Zod schemas for focus area operations
const CreateFocusAreaSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  description: z.string().max(500, 'Description too long').optional(),
  icon: z.string().max(10, 'Icon too long').optional().default('🎯'),
  color: z.string().max(100, 'Color too long').optional().default('from-purple-500/20 to-pink-500/20 border-purple-400/30')
})

const UpdateFocusAreaSchema = z.object({
  id: z.string().uuid('Invalid focus area ID'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim().optional(),
  description: z.string().max(500, 'Description too long').optional(),
  icon: z.string().max(10, 'Icon too long').optional(),
  color: z.string().max(100, 'Color too long').optional()
})

const DeleteFocusAreaSchema = z.object({
  id: z.string().uuid('Invalid focus area ID')
})

/**
 * GET /api/premium/focus-areas
 * 
 * Get user's custom focus areas
 * Premium feature only
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is premium
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const tier = getUserTier(profile.subscription_status, profile.subscription_tier)
    
    if (tier !== 'premium') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Custom focus areas is a premium feature',
          requiresPremium: true 
        },
        { status: 403 }
      )
    }

    // Fetch user's focus areas (only active ones)
    const { data: focusAreas, error } = await supabase
      .from('focus_areas')
      .select('id, name, description, icon, color, created_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch focus areas' },
        { status: 500 }
      )
    }

    // Get reflection counts from prompt_focus_area_usage
    const { data: usageCounts } = await supabase
      .from('prompt_focus_area_usage')
      .select('focus_area_name')
      .eq('user_id', user.id)

    // Count reflections per focus area
    const countMap = new Map<string, number>()
    usageCounts?.forEach(usage => {
      const name = usage.focus_area_name
      countMap.set(name, (countMap.get(name) || 0) + 1)
    })

    // Transform data to include reflection count
    const transformedAreas = (focusAreas || []).map((area: any) => ({
      id: area.id,
      name: area.name,
      description: area.description,
      icon: area.icon,
      color: area.color,
      reflectionCount: countMap.get(area.name) || 0,
      createdAt: area.created_at,
    }))

    return NextResponse.json({
      success: true,
      data: transformedAreas,
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch focus areas' 
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/premium/focus-areas
 * 
 * Create a new custom focus area
 * Premium feature only
 * 
 * Body:
 * - name: string (required)
 * - description: string
 * - icon: string
 * - color: string
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is premium
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const tier = getUserTier(profile.subscription_status, profile.subscription_tier)
    
    if (tier !== 'premium') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Custom focus areas is a premium feature',
          requiresPremium: true 
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const parsed = CreateFocusAreaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description, icon, color } = parsed.data

    // Check if user already has a focus area with this name
    const { data: existing } = await supabase
      .from('focus_areas')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'You already have a focus area with this name' },
        { status: 400 }
      )
    }

    // Create focus area
    const { data: newArea, error } = await supabase
      .from('focus_areas')
      .insert({
        user_id: user.id,
        name,
        description: description || '',
        icon,
        color,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to create focus area' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newArea.id,
        name: newArea.name,
        description: newArea.description,
        icon: newArea.icon,
        color: newArea.color,
        reflectionCount: 0,
        createdAt: newArea.created_at,
      },
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create focus area' 
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/premium/focus-areas
 * 
 * Update an existing focus area
 * Premium feature only
 * 
 * Body:
 * - id: string (required)
 * - name: string
 * - description: string
 * - icon: string
 * - color: string
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is premium
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const tier = getUserTier(profile.subscription_status, profile.subscription_tier)
    
    if (tier !== 'premium') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Custom focus areas is a premium feature',
          requiresPremium: true 
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const parsed = UpdateFocusAreaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { id, name, description, icon, color } = parsed.data

    // Update focus area (only if owned by user)
    const { data: updatedArea, error } = await supabase
      .from('focus_areas')
      .update({
        name: name?.trim(),
        description: description?.trim(),
        icon,
        color,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns this focus area
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update focus area' },
        { status: 500 }
      )
    }

    if (!updatedArea) {
      return NextResponse.json(
        { success: false, error: 'Focus area not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedArea.id,
        name: updatedArea.name,
        description: updatedArea.description,
        icon: updatedArea.icon,
        color: updatedArea.color,
        reflectionCount: 0, // Will be updated on next GET
        createdAt: updatedArea.created_at,
      },
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update focus area' 
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/premium/focus-areas
 * 
 * Delete a focus area
 * Premium feature only
 * 
 * Body:
 * - id: string (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is premium
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const tier = getUserTier(profile.subscription_status, profile.subscription_tier)
    
    if (tier !== 'premium') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Custom focus areas is a premium feature',
          requiresPremium: true 
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const parsed = DeleteFocusAreaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { id } = parsed.data

    // Delete focus area (only if owned by user)
    const { error } = await supabase
      .from('focus_areas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns this focus area

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete focus area' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Focus area deleted successfully',
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete focus area' 
      },
      { status: 500 }
    )
  }
}
