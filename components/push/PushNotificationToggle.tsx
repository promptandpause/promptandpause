'use client'

import { useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { usePushNotifications } from '@/lib/hooks/usePushNotifications'

export function PushNotificationToggle() {
  const { isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe } = usePushNotifications()
  const [showError, setShowError] = useState(false)

  if (!isSupported) {
    return null
  }

  const handleToggle = async () => {
    setShowError(false)
    if (isSubscribed) {
      const success = await unsubscribe()
      if (!success) setShowError(true)
    } else {
      const success = await subscribe()
      if (!success) setShowError(true)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
          ${isSubscribed 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
            : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/15'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
        <span className="font-medium">
          {isLoading 
            ? 'Processing...' 
            : isSubscribed 
              ? 'Notifications On' 
              : 'Enable Notifications'
          }
        </span>
      </button>
      
      {showError && error && (
        <p className="text-red-400 text-sm px-1">{error}</p>
      )}
    </div>
  )
}

export function PushNotificationCard() {
  const { isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe } = usePushNotifications()
  const [showError, setShowError] = useState(false)

  if (!isSupported) {
    return null
  }

  const handleToggle = async () => {
    setShowError(false)
    if (isSubscribed) {
      const success = await unsubscribe()
      if (!success) setShowError(true)
    } else {
      const success = await subscribe()
      if (!success) setShowError(true)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-start gap-4">
        <div className={`
          p-3 rounded-xl
          ${isSubscribed 
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
          }
        `}>
          {isSubscribed ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
            Push Notifications
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {isSubscribed 
              ? "You'll receive notifications when new prompts are ready."
              : "Get notified when your daily reflection prompt is ready."
            }
          </p>
          
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
              ${isSubscribed 
                ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </span>
            ) : isSubscribed ? (
              'Turn Off'
            ) : (
              'Enable Notifications'
            )}
          </button>
          
          {showError && error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
