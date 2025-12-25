"use client"

import { useState } from 'react'
import { X, Sparkles, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TrialExpiryBannerProps {
  daysRemaining: number
  isExpired: boolean
  userName: string | null
}

export function TrialExpiryBanner({ daysRemaining, isExpired, userName }: TrialExpiryBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const router = useRouter()

  if (isDismissed) return null

  // Don't show banner if trial hasn't started or more than 7 days remaining
  if (daysRemaining > 7) return null

  const handleUpgrade = () => {
    router.push('/pricing')
  }

  // Trial expired banner (red/urgent)
  if (isExpired) {
    return (
      <div className="relative bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Content */}
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-red-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-red-900">
                  Your Premium Trial Has Ended
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  {userName ? `Hi ${userName}, y` : 'Y'}our 7-day premium trial has expired. You've been moved to the free tier. Upgrade now to continue enjoying daily prompts, unlimited archive, and advanced insights.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleUpgrade}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Upgrade to Premium
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="text-red-400 hover:text-red-600 transition-colors duration-200 focus:outline-none"
                aria-label="Dismiss banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Trial ending soon banner (yellow/warning)
  if (daysRemaining <= 3) {
    return (
      <div className="relative bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Content */}
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-amber-900">
                  {daysRemaining === 1 ? 'Last Day' : `${daysRemaining} Days Left`} of Your Premium Trial
                </h3>
                <p className="mt-1 text-sm text-amber-700">
                  Your trial ends {daysRemaining === 1 ? 'tomorrow' : `in ${daysRemaining} days`}. Upgrade now to keep enjoying daily prompts, unlimited archive access, weekly insights, and more!
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleUpgrade}
                className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Upgrade Now
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="text-amber-400 hover:text-amber-600 transition-colors duration-200 focus:outline-none"
                aria-label="Dismiss banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Trial active banner (blue/info) - days 4-7
  return (
    <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Content */}
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-blue-900">
                Enjoying Your Premium Trial? 🌟
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                You have {daysRemaining} days left in your trial. Continue your journey with premium features—upgrade anytime to keep the momentum going!
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleUpgrade}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View Plans
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-blue-400 hover:text-blue-600 transition-colors duration-200 focus:outline-none"
              aria-label="Dismiss banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
