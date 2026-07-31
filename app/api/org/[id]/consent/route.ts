import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orgId } = await params
    const body = await request.json()
    const { consented } = body

    if (typeof consented !== 'boolean' || !consented) {
      return NextResponse.json({ error: 'Consent must be true' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('organization_consent')
      .upsert(
        {
          organization_id: orgId,
          user_id: user.id,
          consent_version: 'v1',
        },
        { onConflict: 'organization_id,user_id' }
      )

    if (error) {
      logger.error('org_consent_upsert_error', { error })
      return NextResponse.json({ error: 'Failed to save consent' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    )
  }
}


export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: orgId } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('organization_consent')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ consented: !!data })
}
