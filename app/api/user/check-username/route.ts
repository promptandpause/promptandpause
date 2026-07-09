import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')

  if (!username || username.length < 2) {
    return NextResponse.json({ available: false, error: 'Username must be at least 2 characters' })
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return NextResponse.json({ available: false, error: 'Invalid characters in username' })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ available: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ available: !data })
}
