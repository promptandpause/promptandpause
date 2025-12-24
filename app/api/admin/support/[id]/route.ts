import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  checkAdminAuth, 
  getSupportTicketById, 
  updateSupportTicket,
  addSupportResponse 
} from '@/lib/services/adminService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auth = await checkAdminAuth(user.email)
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 403 })
    }

    const result = await getSupportTicketById(id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      ticket: result.ticket,
      responses: result.responses,
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/support/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auth = await checkAdminAuth(user.email)
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 403 })
    }

    const body = await request.json()
    const result = await updateSupportTicket(id, body, user.email)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ ticket: result.ticket })
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/support/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auth = await checkAdminAuth(user.email)
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 403 })
    }

    const { message, isInternal } = await request.json()
    const result = await addSupportResponse(id, message, user.email, isInternal)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ response: result.response })
  } catch (error: any) {
    console.error('Error in POST /api/admin/support/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
