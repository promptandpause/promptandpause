import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkAgeCompliance, updateAgeVerification } from "@/lib/services/ageComplianceService"

/**
 * API endpoint to verify age compliance
 * POST /api/auth/verify-age
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { dateOfBirth, country } = body

    if (!dateOfBirth || !country) {
      return NextResponse.json(
        { success: false, error: "Date of birth and country are required" },
        { status: 400 }
      )
    }

    // Update age verification
    const result = await updateAgeVerification(user.id, dateOfBirth, country)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Age verification completed successfully"
    })

  } catch (error: any) {
    console.error("Age verification error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check current age compliance status
 * GET /api/auth/verify-age
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check age compliance
    const compliance = await checkAgeCompliance(user.id)

    return NextResponse.json({
      success: true,
      data: compliance
    })

  } catch (error: any) {
    console.error("Age compliance check error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
