"use client"

import { useEffect } from 'react'

const CONSENT_COOKIE = 'cookieConsent'
const CONSENT_GRANTED_EVENT = 'analytics-consent-granted'

function hasConsent(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split('; ').some((c) => c === `${CONSENT_COOKIE}=accepted`)
}

/**
 * Loads the Meta Pixel only after the visitor accepts the cookie banner.
 * Inert (renders nothing) unless NEXT_PUBLIC_META_PIXEL_ID is configured, so
 * it's safe to include unconditionally in the root layout.
 */
export default function MetaPixel() {
  useEffect(() => {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
    if (!pixelId || typeof window === 'undefined') return

    let initialized = false

    function init() {
      if (initialized) return
      initialized = true

      const w = window as any
      if (!w.fbq) {
        // Standard Meta pre-load stub so calls are queued until the script loads.
        w.fbq = function (...args: any[]) {
          ;(w.fbq.queue = w.fbq.queue || []).push(args)
        }
      }
      if (!w._fbq) {
        w._fbq = w.fbq
        const script = document.createElement('script')
        script.async = true
        script.src = 'https://connect.facebook.net/en_US/fbevents.js'
        const nonce = getNonce()
        if (nonce) script.nonce = nonce
        document.head.appendChild(script)
      }
      w.fbq('init', pixelId)
      w.fbq('track', 'PageView')
    }

    if (hasConsent()) {
      init()
      return
    }

    window.addEventListener(CONSENT_GRANTED_EVENT, init)
    return () => window.removeEventListener(CONSENT_GRANTED_EVENT, init)
  }, [])

  return null
}

function getNonce(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const el = document.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')
  return el?.content || undefined
}
