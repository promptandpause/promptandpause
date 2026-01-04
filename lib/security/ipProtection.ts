/**
 * IP Protection Service
 * 
 * Provides IP-based security including VPN/proxy detection,
 * IP reputation checking, and geographic restrictions.
 */

import { SecurityLogger } from './securityLogger'

export interface IPInfo {
  ip: string
  country?: string
  countryCode?: string
  region?: string
  city?: string
  org?: string
  asn?: string
  isVPN?: boolean
  isProxy?: boolean
  isTor?: boolean
  isDatacenter?: boolean
  threatLevel?: 'low' | 'medium' | 'high'
}

export interface IPCheckResult {
  allowed: boolean
  reason?: string
  ipInfo?: IPInfo
  requiresVerification?: boolean
}

// In-memory cache for IP lookups
const ipCache = new Map<string, { info: IPInfo; timestamp: number }>()
const IP_CACHE_TTL = 60 * 60 * 1000 // 1 hour

// Blocked IPs and ranges
const blockedIPs = new Set<string>()
const blockedRanges: Array<{ start: number; end: number }> = []

// Allowed countries (empty = all allowed)
const allowedCountries = new Set<string>()

// Suspicious patterns tracking
const suspiciousActivity = new Map<string, { count: number; lastSeen: number }>()

/**
 * IP Protection Class
 */
export class IPProtection {
  /**
   * Check if an IP is allowed to access the service
   */
  static async checkIP(
    ip: string,
    userAgent: string,
    userId?: string
  ): Promise<IPCheckResult> {
    // Skip checks for localhost/development
    if (this.isLocalhost(ip)) {
      return { allowed: true }
    }

    // Check if IP is blocked
    if (this.isBlocked(ip)) {
      await SecurityLogger.log({
        type: 'ip_blocked',
        ip,
        userAgent,
        userId,
        details: { reason: 'blocked_list' },
      })
      return { allowed: false, reason: 'IP address is blocked' }
    }

    // Get IP information
    const ipInfo = await this.getIPInfo(ip)

    // Check country restrictions
    if (allowedCountries.size > 0 && ipInfo.countryCode) {
      if (!allowedCountries.has(ipInfo.countryCode)) {
        await SecurityLogger.log({
          type: 'ip_blocked',
          ip,
          userAgent,
          userId,
          details: { reason: 'country_restricted', country: ipInfo.countryCode },
        })
        return { 
          allowed: false, 
          reason: 'Service not available in your region',
          ipInfo 
        }
      }
    }

    // Check for VPN/Proxy (log but allow)
    if (ipInfo.isVPN || ipInfo.isProxy || ipInfo.isTor) {
      await SecurityLogger.logVPNDetected(ip, userAgent, userId, {
        isVPN: ipInfo.isVPN,
        isProxy: ipInfo.isProxy,
        isTor: ipInfo.isTor,
        org: ipInfo.org,
      })

      // For sensitive operations, require additional verification
      return {
        allowed: true,
        ipInfo,
        requiresVerification: true,
      }
    }

    // Check datacenter IPs (potential bot traffic)
    if (ipInfo.isDatacenter) {
      await SecurityLogger.log({
        type: 'suspicious_activity',
        severity: 'low',
        ip,
        userAgent,
        userId,
        details: { reason: 'datacenter_ip', org: ipInfo.org },
      })
    }

    // Check for suspicious activity patterns
    const suspiciousCheck = this.checkSuspiciousActivity(ip)
    if (suspiciousCheck.suspicious) {
      await SecurityLogger.logSuspiciousActivity(ip, userAgent, userId, {
        reason: 'high_request_frequency',
        requestCount: suspiciousCheck.count,
      })

      if (suspiciousCheck.count > 100) {
        return {
          allowed: false,
          reason: 'Suspicious activity detected',
          ipInfo,
        }
      }
    }

    return { allowed: true, ipInfo }
  }

  /**
   * Get detailed information about an IP address
   */
  static async getIPInfo(ip: string): Promise<IPInfo> {
    // Check cache first
    const cached = ipCache.get(ip)
    if (cached && Date.now() - cached.timestamp < IP_CACHE_TTL) {
      return cached.info
    }

    let ipInfo: IPInfo = { ip }

    try {
      // Use ipapi.co for IP geolocation (free tier: 1000 requests/day)
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        headers: {
          'User-Agent': 'PromptAndPause/1.0',
        },
      })

      if (response.ok) {
        const data = await response.json()
        
        ipInfo = {
          ip,
          country: data.country_name,
          countryCode: data.country_code,
          region: data.region,
          city: data.city,
          org: data.org,
          asn: data.asn,
          isVPN: false,
          isProxy: false,
          isTor: false,
          isDatacenter: this.isDatacenterOrg(data.org),
          threatLevel: 'low',
        }

        // Check for known VPN/proxy patterns in org name
        if (data.org) {
          const orgLower = data.org.toLowerCase()
          ipInfo.isVPN = this.isKnownVPNProvider(orgLower)
          ipInfo.isProxy = this.isKnownProxyProvider(orgLower)
        }

        // Update threat level based on findings
        if (ipInfo.isVPN || ipInfo.isProxy || ipInfo.isTor) {
          ipInfo.threatLevel = 'medium'
        }
      }
    } catch (error) {
      console.error('[SECURITY] IP lookup failed:', error)
    }

    // Cache the result
    ipCache.set(ip, { info: ipInfo, timestamp: Date.now() })

    return ipInfo
  }

  /**
   * Block an IP address
   */
  static blockIP(ip: string, reason?: string): void {
    blockedIPs.add(ip)
    console.log(`[SECURITY] IP blocked: ${ip} - ${reason || 'No reason provided'}`)
  }

  /**
   * Unblock an IP address
   */
  static unblockIP(ip: string): void {
    blockedIPs.delete(ip)
    console.log(`[SECURITY] IP unblocked: ${ip}`)
  }

  /**
   * Add a country to allowed list
   */
  static allowCountry(countryCode: string): void {
    allowedCountries.add(countryCode.toUpperCase())
  }

  /**
   * Remove country restriction
   */
  static removeCountryRestriction(countryCode: string): void {
    allowedCountries.delete(countryCode.toUpperCase())
  }

  /**
   * Clear all country restrictions
   */
  static clearCountryRestrictions(): void {
    allowedCountries.clear()
  }

  /**
   * Get list of blocked IPs
   */
  static getBlockedIPs(): string[] {
    return Array.from(blockedIPs)
  }

  /**
   * Record activity for suspicious pattern detection
   */
  static recordActivity(ip: string): void {
    const now = Date.now()
    const existing = suspiciousActivity.get(ip)

    if (!existing || now - existing.lastSeen > 60000) {
      // Reset if more than 1 minute since last activity
      suspiciousActivity.set(ip, { count: 1, lastSeen: now })
    } else {
      existing.count++
      existing.lastSeen = now
      suspiciousActivity.set(ip, existing)
    }
  }

  /**
   * Check if an IP is showing suspicious activity
   */
  private static checkSuspiciousActivity(ip: string): { suspicious: boolean; count: number } {
    const activity = suspiciousActivity.get(ip)
    
    if (!activity) {
      return { suspicious: false, count: 0 }
    }

    // More than 50 requests per minute is suspicious
    return {
      suspicious: activity.count > 50,
      count: activity.count,
    }
  }

  /**
   * Check if IP is localhost
   */
  private static isLocalhost(ip: string): boolean {
    return (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === 'localhost' ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.16.') ||
      ip.startsWith('172.17.') ||
      ip.startsWith('172.18.') ||
      ip.startsWith('172.19.') ||
      ip.startsWith('172.2') ||
      ip.startsWith('172.30.') ||
      ip.startsWith('172.31.')
    )
  }

  /**
   * Check if IP is in blocked list
   */
  private static isBlocked(ip: string): boolean {
    if (blockedIPs.has(ip)) {
      return true
    }

    // Check IP ranges
    const ipNum = this.ipToNumber(ip)
    if (ipNum !== null) {
      for (const range of blockedRanges) {
        if (ipNum >= range.start && ipNum <= range.end) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Convert IP string to number for range checking
   */
  private static ipToNumber(ip: string): number | null {
    const parts = ip.split('.')
    if (parts.length !== 4) return null

    let num = 0
    for (let i = 0; i < 4; i++) {
      const part = parseInt(parts[i], 10)
      if (isNaN(part) || part < 0 || part > 255) return null
      num = (num << 8) + part
    }
    return num >>> 0 // Convert to unsigned
  }

  /**
   * Check if organization is a known VPN provider
   */
  private static isKnownVPNProvider(org: string): boolean {
    const vpnProviders = [
      'nordvpn',
      'expressvpn',
      'surfshark',
      'cyberghost',
      'privateinternetaccess',
      'protonvpn',
      'mullvad',
      'ipvanish',
      'hotspotshield',
      'tunnelbear',
      'windscribe',
      'hide.me',
      'purevpn',
      'vyprvpn',
      'torguard',
    ]

    return vpnProviders.some(provider => org.includes(provider))
  }

  /**
   * Check if organization is a known proxy provider
   */
  private static isKnownProxyProvider(org: string): boolean {
    const proxyProviders = [
      'brightdata',
      'luminati',
      'oxylabs',
      'smartproxy',
      'geosurf',
      'netnut',
      'webshare',
    ]

    return proxyProviders.some(provider => org.includes(provider))
  }

  /**
   * Check if organization is a datacenter
   */
  private static isDatacenterOrg(org: string | undefined): boolean {
    if (!org) return false

    const datacenterIndicators = [
      'amazon',
      'aws',
      'google cloud',
      'microsoft azure',
      'digitalocean',
      'linode',
      'vultr',
      'ovh',
      'hetzner',
      'scaleway',
      'hostinger',
      'contabo',
      'choopa',
      'datacamp',
    ]

    const orgLower = org.toLowerCase()
    return datacenterIndicators.some(indicator => orgLower.includes(indicator))
  }

  /**
   * Clean up old cache entries
   */
  static cleanup(): void {
    const now = Date.now()

    // Clean IP cache
    for (const [ip, data] of ipCache.entries()) {
      if (now - data.timestamp > IP_CACHE_TTL) {
        ipCache.delete(ip)
      }
    }

    // Clean suspicious activity tracking
    for (const [ip, data] of suspiciousActivity.entries()) {
      if (now - data.lastSeen > 300000) { // 5 minutes
        suspiciousActivity.delete(ip)
      }
    }
  }
}

// Periodic cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(() => IPProtection.cleanup(), 5 * 60 * 1000) // Every 5 minutes
}

export default IPProtection
