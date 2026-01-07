import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/services/emailService'

/**
 * Auth Callback Route
 * 
 * This route handles the OAuth callback after a user authenticates with Google.
 * It exchanges the auth code for a session and redirects to the appropriate page.
 * 
 * Flow:
 * 1. User clicks "Sign in with Google"
 * 2. Redirected to Google OAuth
 * 3. User approves
 * 4. Google redirects back to this route with code
 * 5. This route exchanges code for session
 * 6. Send welcome email to new users
 * 7. Redirect to onboarding or dashboard
 */

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    
    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      // Redirect to signin with error
      return NextResponse.redirect(`${origin}/auth/signin?error=auth_callback_error`)
    }

    // Get user to check if they've completed onboarding
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Check if user has completed onboarding
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!preferences) {
        // New user - send welcome email
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single()
        
        if (profile?.email) {
          // Send welcome email asynchronously (don't wait for it)
          sendWelcomeEmail(profile.email, profile.full_name).catch(error => {
            console.error('Failed to send welcome email:', error)
            // Don't block user flow if email fails
          })
        }
        
        // Redirect to onboarding
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      
      // Existing user - redirect to dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // If no code or user, redirect to signin
  return NextResponse.redirect(`${origin}/auth/signin`)
}
