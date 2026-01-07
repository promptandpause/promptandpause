import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/services/emailService'

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
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!preferences) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single()

        if (profile?.email) {
          sendWelcomeEmail(profile.email, profile.full_name).catch((error) => {
            console.error('Failed to send welcome email:', error)
          })
        }

        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}${safeNext || '/dashboard'}`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
