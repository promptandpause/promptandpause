import webpush from 'web-push'

// Configure VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@promptandpause.com'

// Initialize web-push with VAPID details
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
}

export interface PushSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

/**
 * Send a push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return false
  }

  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    }

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/apple-icon.png',
        badge: payload.badge || '/icon.png',
        url: payload.url || '/dashboard',
        tag: payload.tag || 'prompt-notification',
      })
    )

    return true
  } catch (error: unknown) {
    const webPushError = error as { statusCode?: number }
    // If subscription is expired or invalid, return false so caller can clean up
    if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
      return false
    }
    return false
  }
}

/**
 * Send push notifications to multiple subscriptions
 * Returns array of endpoints that failed (for cleanup)
 */
export async function sendPushNotifications(
  subscriptions: PushSubscription[],
  payload: PushPayload
): Promise<string[]> {
  const failedEndpoints: string[] = []

  await Promise.all(
    subscriptions.map(async (sub) => {
      const success = await sendPushNotification(sub, payload)
      if (!success) {
        failedEndpoints.push(sub.endpoint)
      }
    })
  )

  return failedEndpoints
}

/**
 * Check if push notifications are configured
 */
export function isPushConfigured(): boolean {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)
}
