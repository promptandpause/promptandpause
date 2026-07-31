// Client-side Meta Pixel event helpers. The pixel only initializes after the
// visitor accepts the cookie banner (see components/MetaPixel.tsx), so these
// helpers no-op until fbq exists.

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
  }
}

export function isMetaPixelLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq === 'function'
}

export function trackMetaEvent(
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string
): void {
  if (!isMetaPixelLoaded()) return
  window.fbq!('track', eventName, params || {}, eventId ? { eventID: eventId } : undefined)
}

// Same event_id is used for the browser (pixel) copy and the server (CAPI)
// copy of an event so Meta can deduplicate them.
export function metaEventId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
