"use client"

import { ReactNode } from 'react'
import { useTier } from '@/hooks/useTier'
import { useTheme } from '@/contexts/ThemeContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, Crown, Sparkles, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { getUpgradeBenefits, getUpgradeMessage } from '@/lib/utils/tierManagement'

/**
 * TierGate Component
 * 
 * Conditionally renders content based on user's tier.
 * Shows upgrade prompt for free users trying to access premium features.
 * 
 * Usage:
 * ```tsx
 * <TierGate requiresPremium>
 *   <PremiumFeature />
 * </TierGate>
 * ```
 */

interface TierGateProps {
  children: ReactNode
  requiresPremium?: boolean
  feature?: string
  fallback?: ReactNode
  showUpgradePrompt?: boolean
}

export function TierGate({
  children,
  requiresPremium = true,
  feature,
  fallback,
  showUpgradePrompt = true,
}: TierGateProps) {
  const { tier, features, isLoading } = useTier()

  // Show loading skeleton while checking tier
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-white/10 rounded-xl" />
      </div>
    )
  }

  // If premium required but user is free
  if (requiresPremium && tier === 'free') {
    // Show custom fallback if provided
    if (fallback) {
      return <>{fallback}</>
    }

    // Show upgrade prompt if enabled
    if (showUpgradePrompt) {
      return <UpgradePrompt feature={feature} />
    }

    // Otherwise show nothing
    return null
  }

  // User has access, show content
  return <>{children}</>
}

/**
 * UpgradePrompt Component
 * 
 * Shows an attractive upgrade prompt for locked features
 */

interface UpgradePromptProps {
  feature?: string
  size?: 'sm' | 'md' | 'lg'
}

export function UpgradePrompt({ feature, size = 'md' }: UpgradePromptProps) {
  const message = feature ? getUpgradeMessage(feature) : undefined
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const sizeClasses = {
    sm: 'p-5',
    md: 'p-6 lg:p-8',
    lg: 'p-8 lg:p-10',
  }

  const iconClasses = {
    sm: 'h-10 w-10 rounded-xl',
    md: 'h-12 w-12 rounded-2xl',
    lg: 'h-14 w-14 rounded-2xl',
  }

  const titleClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const buttonClasses = {
    sm: 'py-2.5 text-xs',
    md: 'py-3 text-sm',
    lg: 'py-3.5 text-base',
  }

  return (
    <Card className={`relative overflow-hidden rounded-3xl border shadow-none ${sizeClasses[size]} ${
      isDark
        ? 'bg-gradient-to-br from-[#1B2436] to-[#0A0E18] border-white/10'
        : 'bg-slate-900 border-slate-900 shadow-soft-card'
    }`}>
      {/* Glow accent */}
      <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-500/20'}`} />

      <div className="relative z-10 flex flex-col gap-4">
        <div className={`${iconClasses[size]} bg-indigo-500/20 flex items-center justify-center`}>
          <Crown className={`${size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'} text-indigo-300`} />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`${titleClasses[size]} font-extrabold text-white`}>Premium Feature</h3>
            <Badge className="rounded-full bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
              Upgrade Required
            </Badge>
          </div>
          <p className={`${textClasses[size]} text-white/60 leading-relaxed`}>
            {message || 'This feature is available with Premium. Upgrade to unlock daily prompts, unlimited archive, AI insights, and more.'}
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          <Link href="/dashboard/settings">
            <Button className={`w-full ${buttonClasses[size]} bg-indigo-500 hover:bg-indigo-400 text-white font-bold`}>
              <Sparkles className="h-4 w-4" />
              Upgrade to Premium
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="ghost" className={`w-full ${buttonClasses[size]} text-white/70 hover:text-white hover:bg-white/10 font-semibold`}>
              See Plans
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}

/**
 * PremiumStatusCard Component
 * 
 * Shows the user's active Premium membership status and benefits.
 */

interface PremiumStatusCardProps {
  size?: 'sm' | 'md' | 'lg'
}

export function PremiumStatusCard({ size = 'md' }: PremiumStatusCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { statusMessage, isTrial } = useTier()

  const sizeClasses = {
    sm: 'p-5',
    md: 'p-6 lg:p-8',
    lg: 'p-8 lg:p-10',
  }

  const benefits = getUpgradeBenefits()

  return (
    <Card className={`relative overflow-hidden rounded-3xl border shadow-none ${sizeClasses[size]} ${
      isDark
        ? 'bg-gradient-to-br from-[#1B2436] to-[#0A0E18] border-white/10'
        : 'bg-slate-900 border-slate-900 shadow-soft-card'
    }`}>
      {/* Glow accent */}
      <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-500/20'}`} />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
            <Crown className="h-6 w-6 text-indigo-300" />
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-tighter">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {isTrial ? 'Trial' : 'Active'}
          </span>
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-white">{isTrial ? 'Premium Trial' : 'Premium Active'}</h3>
          <p className="text-sm text-white/60 mt-1 leading-relaxed">
            {statusMessage || 'Thanks for being a Premium member.'}
          </p>
        </div>

        <div className="space-y-2.5">
          {benefits.slice(0, 4).map((benefit) => (
            <div key={benefit} className="flex items-start gap-2.5 text-sm text-white/70">
              <CheckCircle className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        <Link href="/dashboard/settings">
          <Button className="w-full py-3 text-sm bg-indigo-500 hover:bg-indigo-400 text-white font-bold">
            Manage Plan
          </Button>
        </Link>
      </div>
    </Card>
  )
}

/**
 * FeatureBadge Component
 * 
 * Shows a "Premium" or "Free" badge next to features
 */

interface FeatureBadgeProps {
  premium?: boolean
  className?: string
}

export function FeatureBadge({ premium = false, className = '' }: FeatureBadgeProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (premium) {
    return (
      <Badge className={`${isDark ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' : 'bg-yellow-100 text-yellow-700 border-yellow-300'} ${className}`}>
        <Crown className="mr-1 h-3 w-3" />
        Premium
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={`${isDark ? 'text-white/60 border-white/20' : 'text-gray-500 border-gray-300'} ${className}`}>
      Free
    </Badge>
  )
}

/**
 * LockedFeatureOverlay Component
 * 
 * Overlay that covers a feature with a lock icon
 * Shows on hover for locked features
 */

interface LockedFeatureOverlayProps {
  children: ReactNode
  feature?: string
  locked?: boolean
}

export function LockedFeatureOverlay({
  children,
  feature,
  locked = true,
}: LockedFeatureOverlayProps) {
  const { features } = useTier()

  if (!locked || features.isPremium) {
    return <>{children}</>
  }

  return (
    <div className="relative group">
      {/* Content (blurred when locked) */}
      <div className="filter blur-sm group-hover:blur-md transition-all pointer-events-none">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl group-hover:bg-black/60 transition-all">
        <div className="text-center space-y-3 p-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500">
            <Lock className="h-8 w-8 text-white" />
          </div>
          
          <div className="space-y-1">
            <h4 className="font-semibold text-white">Premium Feature</h4>
            <p className="text-white/70 text-sm max-w-xs">
              {feature ? getUpgradeMessage(feature) : 'Upgrade to unlock'}
            </p>
          </div>

          <Link href="/dashboard/settings">
            <Button
              size="sm"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 mt-2"
            >
              <Crown className="mr-2 h-4 w-4" />
              Upgrade Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * PromptLimitBanner Component
 * 
 * Shows a banner when free user is approaching their weekly limit
 */

export function PromptLimitBanner() {
  const { features } = useTier()
  const { theme } = useTheme()
  const [used, setUsed] = useState(0)
  const [limit, setLimit] = useState(3)
  const [resetLabel, setResetLabel] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/prompts/usage', { cache: 'no-store' })
      if (!res.ok) return
      const { data } = await res.json()
      if (data.isPremium) return
      setUsed(data.used)
      setLimit(data.limit)
      setResetLabel(data.resetLabel || '')
    } catch {} finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!features.isPremium) {
      fetchUsage()
    }
  }, [features.isPremium, fetchUsage])

  // Listen for prompt-generated events to refresh usage dynamically
  useEffect(() => {
    const handler = () => fetchUsage()
    window.addEventListener('prompt-generated', handler)
    return () => window.removeEventListener('prompt-generated', handler)
  }, [fetchUsage])

  // Don't show for premium users
  if (features.isPremium || isLoading) {
    return null
  }

  const remaining = Math.max(0, limit - used)
  const limitReached = remaining === 0

  return (
    <Card className={`p-4 mb-4 md:mb-6 border ${
      limitReached
        ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-400/30'
        : theme === 'dark'
          ? 'bg-white/[0.04] border-white/[0.06]'
          : 'bg-white/70 border-slate-100 shadow-soft-card'
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            limitReached ? 'bg-orange-500/20' : theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'
          }`}>
            <Sparkles className={`h-5 w-5 ${limitReached ? 'text-orange-400' : 'text-purple-500'}`} />
          </div>
          <div className="min-w-0">
            <h4 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {limitReached
                ? 'Weekly Limit Reached'
                : `${used}/${limit} Prompts Used This Week`
              }
            </h4>
            <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
              {limitReached
                ? `Resets on ${resetLabel}. You cannot generate more prompts until then. Upgrade for unlimited prompts.`
                : remaining === 1
                  ? `1 prompt left — resets on ${resetLabel}`
                  : `${remaining} remaining — resets ${resetLabel || 'Monday'}`
              }
            </p>
          </div>
        </div>

        {limitReached && (
          <Link href="/dashboard/settings" className="flex-shrink-0">
            <Button
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
            >
              Upgrade
            </Button>
          </Link>
        )}
      </div>
    </Card>
  )
}

// Add missing imports at the top
import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
