import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * IP Logging Service
 * Captures user IP addresses for location tracking and security
 */

export interface IPLogData {
  user_id: string
  ip_address: string
  country?: string
  city?: string
  timezone?: string
  user_agent?: string
  event_type: 'signup' | 'login' | 'age_verification' | 'other'
}

/**
 * Log user IP address and location data
 */
export async function logUserIP(data: IPLogData) {
  try {
    const supabase = createServiceRoleClient()
    
    const { error } = await supabase
      .from('ip_logs')
      .insert({
        user_id: data.user_id,
        ip_address: data.ip_address,
        country: data.country,
        city: data.city,
        timezone: data.timezone,
        user_agent: data.user_agent,
        event_type: data.event_type,
        logged_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Failed to log IP:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('IP logging error:', error)
    return { success: false, error }
  }
}

/**
 * Get IP address from request headers (works with Vercel/Cloudflare)
 */
export function getIPFromRequest(request: Request): string {
  const headers = request.headers
  
  // Try various headers that might contain the real IP
  const ip = 
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') || // Cloudflare
    headers.get('x-vercel-forwarded-for') || // Vercel
    'unknown'
  
  return ip.trim()
}

/**
 * Fetch geo-location data from IP address
 */
export async function getGeoDataFromIP(ip: string) {
  if (ip === 'unknown' || ip.includes('127.0.0.1') || ip.includes('localhost')) {
    return null
  }

  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(3000) // 3 second timeout
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    
    return {
      country: data.country_code || data.country_name,
      city: data.city,
      timezone: data.timezone,
    }
  } catch (error) {
    console.error('Failed to fetch geo data:', error)
    return null
  }
}

/**
 * Update user profile with IP-detected country if not already set
 */
export async function updateUserCountryFromIP(userId: string, ipCountry: string) {
  try {
    const supabase = createServiceRoleClient()
    
    // Check if user already has country set
    const { data: profile } = await supabase
      .from('profiles')
      .select('country_code')
      .eq('id', userId)
      .single()
    
    // Only update if country is not already set
    if (!profile?.country_code) {
      const mappedCountry = ipCountry === 'GB' ? 'UK' : ipCountry
      
      if (mappedCountry === 'US' || mappedCountry === 'UK') {
        await supabase
          .from('profiles')
          .update({ 
            country_code: mappedCountry,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to update country from IP:', error)
    return { success: false, error }
  }
}
