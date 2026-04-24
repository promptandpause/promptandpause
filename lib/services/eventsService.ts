/**
 * Lightweight client-side event tracking.
 *
 * All calls are fire-and-forget. They must never throw, block, or delay
 * the user experience. If the request fails, we silently drop it — this
 * is for product analytics only, not business logic.
 */

export type TrackableEvent =
  | 'signup_completed'
  | 'onboarding_completed'
  | 'session_start'
  | 'reflection_started'
  | 'reflection_saved'
  | 'reflection_first_saved'
  | 'reminder_opt_in'
  | 'reminder_opt_out'
  | 'session_close_action'

export function trackEvent(
  event: TrackableEvent,
  properties?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return
  try {
    // Best-effort: use sendBeacon if available (survives page unload),
    // otherwise fall back to fetch with keepalive.
    const body = JSON.stringify({ event, properties: properties ?? {} })
    const url = '/api/events'

    if (
      'sendBeacon' in navigator &&
      typeof navigator.sendBeacon === 'function'
    ) {
      const blob = new Blob([body], { type: 'application/json' })
      const ok = navigator.sendBeacon(url, blob)
      if (ok) return
    }

    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'same-origin',
    }).catch(() => {})
  } catch {
    // Never throw from analytics.
  }
}

/**
 * Throttle repeated events within a short window per browser session.
 * Useful for `session_start` so it isn't logged on every render/navigation.
 */
export function trackEventOncePerSession(
  key: string,
  event: TrackableEvent,
  properties?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return
  try {
    const storageKey = `pp_evt_${key}`
    if (sessionStorage.getItem(storageKey)) return
    sessionStorage.setItem(storageKey, '1')
    trackEvent(event, properties)
  } catch {
    trackEvent(event, properties)
  }
}
