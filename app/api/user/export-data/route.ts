import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendDataExportEmail } from '@/lib/services/emailService'
import { generateUserDataPDF } from '@/lib/services/pdfService'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all user data in parallel
    const [profileRes, reflectionsRes, preferencesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('reflections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('user_preferences').select('*').eq('user_id', user.id).single()
    ])

    if (profileRes.error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch profile data' },
        { status: 500 }
      )
    }

    // Prepare data package
    const userData = {
      profile: profileRes.data,
      reflections: reflectionsRes.data || [],
      preferences: preferencesRes.data,
      exportDate: new Date().toISOString(),
      email: user.email || '',
      userId: user.id
    }

    // Generate PDF buffer
    const pdfBuffer = await generateUserDataPDF(userData)

    // Send email with PDF attachment
    const emailResult = await sendDataExportEmail(
      user.email || '',
      user.id,
      userData.profile?.full_name || user.email?.split('@')[0] || 'User',
      pdfBuffer
    )

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send export email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Data export initiated. You will receive an email shortly with your data.'
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
