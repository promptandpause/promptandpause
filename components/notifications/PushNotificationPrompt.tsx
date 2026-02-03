'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePushNotifications } from '@/lib/hooks/usePushNotifications'

const PROMPT_DISMISSED_KEY = 'push_notification_prompt_dismissed'
const PROMPT_COOLDOWN_DAYS = 7 // Don't show again for 7 days after dismissal

export function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const { isSupported, isSubscribed, isLoading, subscribe } = usePushNotifications()

  useEffect(() => {
    // Don't show if still loading, not supported, or already subscribed
    if (isLoading || !isSupported || isSubscribed) {
      setShowPrompt(false)
      return
    }

    // Check if user dismissed the prompt recently
    const dismissedAt = localStorage.getItem(PROMPT_DISMISSED_KEY)
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt)
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < PROMPT_COOLDOWN_DAYS) {
        return
      }
    }

    // Check if Notification permission is already denied
    if ('Notification' in window && Notification.permission === 'denied') {
      return
    }

    // Show prompt after a short delay
    const timer = setTimeout(() => {
      setShowPrompt(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [isLoading, isSupported, isSubscribed])

  const handleEnable = async () => {
    const success = await subscribe()
    if (success) {
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, new Date().toISOString())
    setShowPrompt(false)
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 z-50"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-4 md:p-5">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                  Enable Notifications
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Get your daily reflection prompts delivered directly to your device.
                </p>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleEnable}
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                  >
                    Enable
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    size="sm"
                    variant="ghost"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Not now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
