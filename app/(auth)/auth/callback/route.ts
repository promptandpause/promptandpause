import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getIPFromRequest, getGeoDataFromIP, logUserIP } from '@/lib/services/ipLoggingService'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const nextParam = requestUrl.searchParams.get('next')
  const safeNext = nextParam && nextParam.startsWith('/') ? nextParam : null
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Log IP address and location on auth callback
      try {
        const ip = getIPFromRequest(request)
        const geoData = await getGeoDataFromIP(ip)
        const userAgent = request.headers.get('user-agent') || undefined
        
        await logUserIP({
          user_id: user.id,
          ip_address: ip,
          country: geoData?.country,
          city: geoData?.city,
          timezone: geoData?.timezone,
          user_agent: userAgent,
          event_type: 'login', // Could be signup or login
        })
      } catch (ipError) {
        console.error('IP logging failed:', ipError)
        // Don't block auth flow if IP logging fails
      }

      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!preferences) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}${safeNext || '/dashboard'}`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
