import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptIfEncrypted, encryptIfPossible } from '@/lib/utils/crypto'

/**
 * GET /api/reflections/[id]
 * Get a single reflection by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Fetch reflection by ID (SSR + decrypt)
    const { data, error } = await supabase
      .from('reflections')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return NextResponse.json({ error: 'Reflection not found' }, { status: 404 })
      }
      throw error
    }

    const reflection = data ? { ...data, reflection_text: decryptIfEncrypted(data.reflection_text) || data.reflection_text } : null

    if (!reflection) {
      return NextResponse.json(
        { error: 'Reflection not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: reflection
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reflection' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/reflections/[id]
 * Update a reflection
 * Body: { reflection_text?, mood?, tags? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Get existing reflection to ensure it belongs to the user
    const { data: existing } = await supabase
      .from('reflections')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Reflection not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (body.reflection_text !== undefined) {
      const plain = body.reflection_text
      updateData.reflection_text = encryptIfPossible(plain)
      // Recalculate word count if text changed
      updateData.word_count = plain.trim().split(/\s+/).length
    }
    
    if (body.mood !== undefined) {
      updateData.mood = body.mood
    }
    
    if (body.tags !== undefined) {
      updateData.tags = body.tags
    }

    if (body.feedback !== undefined) {
      updateData.feedback = body.feedback
    }

    // Update via Supabase
    const { data, error } = await supabase
      .from('reflections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Return decrypted plaintext to client
    const returned = {
      ...data,
      reflection_text: decryptIfEncrypted(data.reflection_text) || data.reflection_text,
    }

    return NextResponse.json({
      success: true,
      message: 'Reflection updated successfully',
      data: returned,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update reflection' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reflections/[id]
 * Delete a reflection
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if reflection exists
    const { data: existing } = await supabase
      .from('reflections')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Reflection not found' },
        { status: 404 }
      )
    }

    // Delete reflection
    const { error: delError } = await supabase
      .from('reflections')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (delError) throw delError

    return NextResponse.json({
      success: true,
      message: 'Reflection deleted successfully'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete reflection' },
      { status: 500 }
    )
  }
}
