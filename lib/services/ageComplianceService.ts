"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

/**
 * Middleware to check age compliance before allowing access
 * This should be called in API routes and server components
 */
export async function checkAgeCompliance(userId: string): Promise<{
  compliant: boolean
  needsVerification: boolean
  country: string
  minimumAge: number
  userAge?: number
}> {
  const supabase = await createClient()
  const serviceClient = createServiceRoleClient()

  try {
    // Get user profile
    const { data: profile, error } = await serviceClient
      .from("profiles")
      .select("date_of_birth, country_code, age_verified, region_compliance")
      .eq("id", userId)
      .single()

    if (error || !profile) {
      return {
        compliant: false,
        needsVerification: true,
        country: "US",
        minimumAge: 13
      }
    }

    // If already verified and compliant, return success
    if (profile.age_verified && profile.region_compliance) {
      return {
        compliant: true,
        needsVerification: false,
        country: profile.country_code || "US",
        minimumAge: profile.country_code === "UK" ? 16 : 13
      }
    }

    // Calculate age if date of birth exists
    let userAge: number | undefined
    if (profile.date_of_birth) {
      const birthDate = new Date(profile.date_of_birth)
      const today = new Date()
      userAge = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        userAge--
      }
    }

    const country = profile.country_code || "US"
    const minimumAge = country === "UK" ? 16 : 13

    return {
      compliant: false,
      needsVerification: true,
      country,
      minimumAge,
      userAge
    }

  } catch (error) {
    console.error("Age compliance check failed:", error)
    return {
      compliant: false,
      needsVerification: true,
      country: "US",
      minimumAge: 13
    }
  }
}

/**
 * Auto-detect country from user's IP address
 * This should be called during user registration
 */
export async function detectUserCountry(): Promise<string> {
  try {
    // In production, use a proper GeoIP service
    // For now, we'll use a simple IP geolocation API
    const response = await fetch("https://ipapi.co/json/", {
      headers: {
        "User-Agent": "PromptAndPause/1.0"
      }
    })
    
    if (!response.ok) {
      throw new Error("Failed to detect country")
    }
    
    const data = await response.json()
    
    // Map country codes to our supported regions
    if (data.country_code === "GB") return "UK"
    if (data.country_code === "US") return "US"
    
    // Default to US for unsupported countries
    return "US"
  } catch (error) {
    console.error("Country detection failed:", error)
    return "US" // Default fallback
  }
}

/**
 * Update user's age verification status
 */
export async function updateAgeVerification(
  userId: string,
  dateOfBirth: string,
  country: string
): Promise<{ success: boolean; error?: string }> {
  const serviceClient = createServiceRoleClient()

  try {
    // Calculate age
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    // Determine minimum age
    const minimumAge = country === "UK" ? 16 : 13
    const isCompliant = age >= minimumAge

    if (!isCompliant) {
      return {
        success: false,
        error: `User does not meet minimum age requirement of ${minimumAge} for ${country}`
      }
    }

    // Update profile
    const { error: profileError } = await serviceClient
      .from("profiles")
      .update({
        date_of_birth: dateOfBirth,
        country_code: country,
        age_verified: true,
        region_compliance: true,
        age_consent_accepted: true,
        age_consent_accepted_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (profileError) throw profileError

    // Update user preferences
    const { error: prefError } = await serviceClient
      .from("user_preferences")
      .upsert({
        user_id: userId,
        age_consent_version: "2026.01",
        age_consent_accepted: true,
        age_consent_accepted_at: new Date().toISOString(),
      })

    if (prefError) throw prefError

    return { success: true }

  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update age verification"
    }
  }
}
