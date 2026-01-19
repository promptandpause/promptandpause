import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { withRateLimit } from '@/lib/security/rateLimit'

const SearchSchema = z.object({
  q: z.string().min(2).max(100),
})

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 20 searches per minute
    const rateLimitResult = await withRateLimit(request, 'api')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    const parsed = SearchSchema.safeParse({ q: query })
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid search query' },
        { status: 400 }
      )
    }

    const { q } = parsed.data
    const supabase = createServiceRoleClient()

    // Search users by email or name
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        created_at,
        subscriptions!inner(
          status,
          current_period_end
        )
      `)
      .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('User search error:', error)
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }

    // Format results with subscription status
    const formattedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      created_at: user.created_at,
      subscription_status: user.subscriptions?.[0]?.status || 'free',
    })) || []

    return NextResponse.json({
      users: formattedUsers,
      count: formattedUsers.length,
    })

  } catch (error: any) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
