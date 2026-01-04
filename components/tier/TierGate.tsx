"use client"

import { ReactNode } from 'react'
import { useTier } from '@/hooks/useTier'
import { useTheme } from '@/contexts/ThemeContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, Crown, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { getUpgradeMessage } from '@/lib/utils/tierManagement'

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

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <Card className={`backdrop-blur-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-400/30 ${sizeClasses[size]}`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <Crown className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-lg">
              Premium Feature
            </h3>
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30">
              Upgrade Required
            </Badge>
          </div>

          <p className="text-white/70 text-sm leading-relaxed">
            {message || 'This feature is available with Premium. Upgrade to unlock daily prompts, unlimited archive, AI insights, and more.'}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <Link href="/dashboard/settings">
              <Button
                size="sm"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade to Premium
              </Button>
            </Link>
            
            <Link href="/pricing">
              <Button
                size="sm"
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                See Plans
              </Button>
            </Link>
          </div>
        </div>
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
  if (premium) {
    return (
      <Badge className={`bg-yellow-500/20 text-yellow-400 border-yellow-400/30 ${className}`}>
        <Crown className="mr-1 h-3 w-3" />
        Premium
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={`text-white/60 border-white/20 ${className}`}>
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUsage() {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get start of week
      const today = new Date()
      const dayOfWeek = today.getDay()
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(today)
      monday.setDate(today.getDate() + diff)
      monday.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('reflections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monday.toISOString())

      if (count !== null) setUsed(count)
      setIsLoading(false)
    }

    if (!features.isPremium) {
      fetchUsage()
    }
  }, [features.isPremium])

  // Don't show for premium users
  if (features.isPremium || isLoading) {
    return null
  }

  const allowance = features.promptsPerWeek
  const remaining = allowance - used

  // Only show when getting close to limit
  if (remaining > 1) {
    return null
  }

  return (
    <Card className="backdrop-blur-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-400/30 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {remaining === 0 ? 'Weekly Limit Reached' : `${remaining} Prompt${remaining === 1 ? '' : 's'} Remaining`}
            </h4>
            <p className={`text-sm ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>
              {remaining === 0 
                ? 'Upgrade to Premium for daily prompts (7 days/week)'
                : 'Get unlimited prompts with Premium'
              }
            </p>
          </div>
        </div>

        <Link href="/dashboard/settings">
          <Button
            size="sm"
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
          >
            Upgrade
          </Button>
        </Link>
      </div>
    </Card>
  )
}

// Add missing imports at the top
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
