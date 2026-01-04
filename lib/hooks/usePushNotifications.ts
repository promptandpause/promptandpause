'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PushSubscriptionState {
  isSupported: boolean
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
}

// VAPID public key - set this in your environment
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer as ArrayBuffer
}

export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    error: null,
  })

  const supabase = createClient()

  // Check if push is supported and if user is already subscribed
  useEffect(() => {
    const checkSupport = async () => {
      // Check browser support
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setState((prev) => ({
          ...prev,
          isSupported: false,
          isLoading: false,
          error: 'Push notifications not supported in this browser',
        }))
        return
      }

      // Check if VAPID key is configured
      if (!VAPID_PUBLIC_KEY) {
        setState((prev) => ({
          ...prev,
          isSupported: false,
          isLoading: false,
          error: 'Push notifications not configured',
        }))
        return
      }

      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        setState({
          isSupported: true,
          isSubscribed: !!subscription,
          isLoading: false,
          error: null,
        })
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isSupported: true,
          isLoading: false,
          error: 'Failed to check subscription status',
        }))
      }
    }

    checkSupport()
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Check permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Notification permission denied',
        }))
        return false
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // Get subscription keys
      const subscriptionJson = subscription.toJSON()
      const endpoint = subscriptionJson.endpoint
      const p256dh = subscriptionJson.keys?.p256dh
      const auth = subscriptionJson.keys?.auth

      if (!endpoint || !p256dh || !auth) {
        throw new Error('Invalid subscription data')
      }

      // Save to database
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint,
          p256dh,
          auth,
        }, {
          onConflict: 'user_id,endpoint',
        })

      if (dbError) {
        throw dbError
      }

      setState({
        isSupported: true,
        isSubscribed: true,
        isLoading: false,
        error: null,
      })

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe'
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }))
      return false
    }
  }, [supabase])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe()

        // Remove from database
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint)
        }
      }

      setState({
        isSupported: true,
        isSubscribed: false,
        isLoading: false,
        error: null,
      })

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unsubscribe'
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }))
      return false
    }
  }, [supabase])

  return {
    ...state,
    subscribe,
    unsubscribe,
  }
}
