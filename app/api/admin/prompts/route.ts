import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth, getPromptLibrary, createPrompt } from '@/lib/services/adminService'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auth = await checkAdminAuth(user.email)
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const params = {
      limit,
      offset,
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      is_active: searchParams.get('is_active') === 'true' ? true : searchParams.get('is_active') === 'false' ? false : undefined,
    }

    const result = await getPromptLibrary(params)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      prompts: result.prompts,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/prompts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const result = await createPrompt(body, user.email)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ prompt: result.prompt })
  } catch (error: any) {
    console.error('Error in POST /api/admin/prompts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
