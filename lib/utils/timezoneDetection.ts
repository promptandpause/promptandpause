/**
 * Timezone Detection Utility
 * 
 * Automatically detects the user's IANA timezone identifier from their browser.
 * This handles DST (Daylight Saving Time) automatically since IANA timezones
 * are aware of DST rules for each region.
 */

/**
 * Get the user's IANA timezone identifier from the browser
 * Examples: 'Europe/London', 'America/New_York', 'Asia/Tokyo'
 * 
 * This automatically handles DST - when the user is in DST,
 * the browser reports the correct IANA timezone which includes
 * DST rules built-in.
 */
export function detectUserTimezone(): string {
  try {
    // Use Intl.DateTimeFormat to get IANA timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    if (!timezone) {
      return 'Europe/London'
    }
    return timezone
  } catch (error) {
    return 'Europe/London' // Fallback
  }
}

/**
 * Get current UTC offset in hours (for display purposes only)
 * Example: -5 for EST, 0 for GMT, +1 for CET
 * 
 * Note: This offset changes with DST, so it's only for display.
 * Always use IANA timezone for actual time calculations.
 */
export function getCurrentUTCOffset(): number {
  const now = new Date()
  const offsetMinutes = now.getTimezoneOffset()
  return -offsetMinutes / 60 // Negative because getTimezoneOffset is inverted
}

/**
 * Format timezone for display
 * Examples:
 * - "Europe/London (UTC+0)" in winter
 * - "Europe/London (UTC+1)" in summer (BST)
 * - "America/New_York (UTC-5)" in winter
 * - "America/New_York (UTC-4)" in summer (EDT)
 */
export function formatTimezoneDisplay(ianaTimezone: string): string {
  const offset = getCurrentUTCOffset()
  const sign = offset >= 0 ? '+' : ''
  return `${ianaTimezone} (UTC${sign}${offset})`
}

/**
 * Check if user is currently in Daylight Saving Time
 */
export function isInDST(): boolean {
  const now = new Date()
  const january = new Date(now.getFullYear(), 0, 1)
  const july = new Date(now.getFullYear(), 6, 1)
  
  const janOffset = january.getTimezoneOffset()
  const julyOffset = july.getTimezoneOffset()
  
  // If current offset is different from standard time (January in Northern Hemisphere),
  // then we're in DST
  return Math.max(janOffset, julyOffset) !== now.getTimezoneOffset()
}

/**
 * Get timezone abbreviation (e.g., GMT, BST, EST, EDT)
 */
export function getTimezoneAbbreviation(): string {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short'
    })
    
    const parts = formatter.formatToParts(now)
    const tzPart = parts.find(part => part.type === 'timeZoneName')
    
    return tzPart?.value || 'UTC'
  } catch (error) {
    return 'UTC'
  }
}

/**
 * List of common IANA timezones with friendly names
 * This is for the dropdown selector
 */
export const commonTimezones = [
  // Americas
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)', region: 'Americas' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)', region: 'Americas' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)', region: 'Americas' },
  { value: 'America/Phoenix', label: 'Arizona (no DST)', region: 'Americas' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)', region: 'Americas' },
  { value: 'America/Anchorage', label: 'Alaska', region: 'Americas' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (no DST)', region: 'Americas' },
  { value: 'America/Toronto', label: 'Toronto', region: 'Americas' },
  { value: 'America/Vancouver', label: 'Vancouver', region: 'Americas' },
  { value: 'America/Mexico_City', label: 'Mexico City', region: 'Americas' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', region: 'Americas' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires', region: 'Americas' },
  
  // Europe
  { value: 'Europe/London', label: 'London, Dublin (GMT/BST)', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris, Berlin, Rome', region: 'Europe' },
  { value: 'Europe/Athens', label: 'Athens, Helsinki, Istanbul', region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow, St. Petersburg', region: 'Europe' },
  { value: 'Europe/Madrid', label: 'Madrid', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam', region: 'Europe' },
  { value: 'Europe/Zurich', label: 'Zurich', region: 'Europe' },
  
  // Asia
  { value: 'Asia/Dubai', label: 'Dubai, Abu Dhabi', region: 'Asia' },
  { value: 'Asia/Kolkata', label: 'Mumbai, New Delhi', region: 'Asia' },
  { value: 'Asia/Bangkok', label: 'Bangkok, Jakarta', region: 'Asia' },
  { value: 'Asia/Shanghai', label: 'Beijing, Shanghai', region: 'Asia' },
  { value: 'Asia/Singapore', label: 'Singapore', region: 'Asia' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', region: 'Asia' },
  { value: 'Asia/Tokyo', label: 'Tokyo, Osaka', region: 'Asia' },
  { value: 'Asia/Seoul', label: 'Seoul', region: 'Asia' },
  { value: 'Asia/Taipei', label: 'Taipei', region: 'Asia' },
  { value: 'Asia/Karachi', label: 'Karachi', region: 'Asia' },
  { value: 'Asia/Tehran', label: 'Tehran', region: 'Asia' },
  
  // Pacific
  { value: 'Australia/Sydney', label: 'Sydney, Melbourne', region: 'Pacific' },
  { value: 'Australia/Perth', label: 'Perth', region: 'Pacific' },
  { value: 'Australia/Adelaide', label: 'Adelaide', region: 'Pacific' },
  { value: 'Australia/Brisbane', label: 'Brisbane (no DST)', region: 'Pacific' },
  { value: 'Pacific/Auckland', label: 'Auckland, Wellington', region: 'Pacific' },
  { value: 'Pacific/Fiji', label: 'Fiji', region: 'Pacific' },
  
  // Africa
  { value: 'Africa/Cairo', label: 'Cairo', region: 'Africa' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg, Cape Town', region: 'Africa' },
  { value: 'Africa/Lagos', label: 'Lagos', region: 'Africa' },
  { value: 'Africa/Nairobi', label: 'Nairobi', region: 'Africa' },
  
  // Atlantic
  { value: 'Atlantic/Reykjavik', label: 'Reykjavik (no DST)', region: 'Atlantic' },
  { value: 'Atlantic/Azores', label: 'Azores', region: 'Atlantic' },
]

/**
 * Validate if a timezone string is a valid IANA timezone
 */
export function isValidIANATimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch (error) {
    return false
  }
}

/**
 * Get timezone info for display
 */
export function getTimezoneInfo(ianaTimezone?: string) {
  const timezone = ianaTimezone || detectUserTimezone()
  const offset = getCurrentUTCOffset()
  const abbreviation = getTimezoneAbbreviation()
  const inDST = isInDST()
  
  return {
    timezone,
    offset,
    abbreviation,
    inDST,
    display: formatTimezoneDisplay(timezone),
    dstNote: inDST ? '(Currently in Daylight Saving Time)' : '(Currently in Standard Time)'
  }
}
