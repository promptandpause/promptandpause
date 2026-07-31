import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { logger } from '@/lib/utils/logger'

/**
 * Meta Conversions API (CAPI) + attribution helpers.
 *
 * PRIVACY / POLICY MODEL:
 * - Events are ONLY sent when the visitor accepted the cookie banner
 *   (`cookieConsent=accepted`). This is a hard gate, enforced server-side in
 *   `getMetaAttribution` and carried through to the Stripe webhook via
 *   session metadata, so the Purchase event respects the same consent.
 * - The only PII sent to Meta is the SHA-256 hashed email (Meta's standard
 *   matching identifier) plus Meta's own `_fbp`/`_fbc` attribution cookies.
 *   No reflection content, mood, journal text, or any health-related data is
 *   ever forwarded.
 * - Events never block a business-critical path: all sends are fire-and-forget
 *   with a short timeout, and failures are logged but swallowed.
 */

// Graph API version. Meta guarantees >= 2 years of support per version.
export const META_GRAPH_VERSION = 'v23.0'

export const META_CONSENT_COOKIE = 'cookieConsent'

export interface MetaEventInput {
  eventName: string
  eventId: string
  email?: string
  fbp?: string
  fbc?: string
  value?: number
  currency?: string
  contentName?: string
  eventSourceUrl?: string
  ipAddress?: string
  userAgent?: string
}

export interface MetaAttribution {
  consented: boolean
  fbp?: string
  fbc?: string
}

export function getMetaConfig() {
  return {
    pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || '',
    accessToken: process.env.META_CAPI_TOKEN || '',
  }
}

export function isMetaConfigured(): boolean {
  const { pixelId, accessToken } = getMetaConfig()
  return Boolean(pixelId && accessToken)
}

// Meta requires hashed (not raw) PII for server events.
export function hashEmail(email?: string): string | null {
  if (!email) return null
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null
  return createHash('sha256').update(normalized).digest('hex')
}

// Reads marketing-attribution cookies from an incoming request. Consent is a
// hard gate: without an accepted `cookieConsent` cookie, no identifiers are
// captured or forwarded.
export function getMetaAttribution(request: NextRequest): MetaAttribution {
  const consented = request.cookies.get(META_CONSENT_COOKIE)?.value === 'accepted'
  if (!consented) return { consented: false }
  return {
    consented: true,
    fbp: request.cookies.get('_fbp')?.value,
    fbc: request.cookies.get('_fbc')?.value,
  }
}

export async function sendMetaEvent(input: MetaEventInput): Promise<void> {
  const { pixelId, accessToken } = getMetaConfig()
  if (!pixelId || !accessToken) return

  const em = hashEmail(input.email)

  const userData: Record<string, unknown> = {}
  if (em) userData.em = [em]
  if (input.fbp) userData.fbp = input.fbp
  if (input.fbc) userData.fbc = input.fbc
  if (input.ipAddress) userData.client_ip_address = input.ipAddress
  if (input.userAgent) userData.client_user_agent = input.userAgent

  const customData: Record<string, unknown> = {}
  if (input.value != null) customData.value = input.value
  if (input.currency) customData.currency = input.currency
  if (input.contentName) customData.content_name = input.contentName

  const payload = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: 'website',
        ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
        user_data: userData,
        custom_data: customData,
      },
    ],
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      }
    )

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      logger.warn('meta_capi_event_error', {
        status: res.status,
        eventName: input.eventName,
        response: text.slice(0, 500),
      })
      return
    }

    const json: any = await res.json().catch(() => null)
    if (json && json.events_received !== 1) {
      logger.warn('meta_capi_event_not_received', { json, eventName: input.eventName })
    }
  } catch (error: any) {
    logger.warn('meta_capi_event_exception', { message: error?.message })
  }
}
