import { NextResponse } from "next/server"
import { detectUserCountry } from "@/lib/services/ageComplianceService"

/**
 * API endpoint to detect user's country from IP
 * GET /api/auth/detect-country
 */
export async function GET(request: Request) {
  try {
    // Get user's IP from request headers
    const forwarded = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ip = forwarded?.split(",")[0] || realIp || "unknown"

    // Detect country
    const country = await detectUserCountry()

    return NextResponse.json({
      success: true,
      data: {
        country,
        ip: ip !== "unknown" ? ip : undefined, // Don't expose IP if unknown
        detectedAt: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error("Country detection error:", error)
    
    // Return default country on error
    return NextResponse.json({
      success: true,
      data: {
        country: "US",
        detectedAt: new Date().toISOString()
      }
    })
  }
}
