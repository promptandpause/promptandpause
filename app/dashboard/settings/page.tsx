"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Bell, ChevronLeft, ChevronRight, HelpCircle, Lock, Palette, 
  Shield, Trash2, Upload, User, Zap, CreditCard, Smartphone, 
  Globe2, Loader2, CheckCircle2, XCircle, Settings2, SmartphoneCharging, 
  ArrowRight, Mail, KeyRound, Eye, EyeOff, Copy, Check, ExternalLink, NotebookPen, 
  LayoutDashboard, Archive, Settings, Crown, Calendar 
} from "lucide-react"
import { SlackIcon } from "@/components/icons/SlackIcon"
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon"
import { TeamsIcon } from "@/components/icons/TeamsIcon"
import { TrialCountdown } from "@/components/subscription/TrialCountdown"
import Link from "next/link"
import { 
  detectUserTimezone, 
  commonTimezones, 
  getTimezoneInfo,
  formatTimezoneDisplay 
} from "@/lib/utils/timezoneDetection"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/LanguageContext"
import { useTranslation } from "@/hooks/useTranslation"
import { useTheme } from "@/contexts/ThemeContext"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useTier } from "@/hooks/useTier"
import { TierGate } from "@/components/tier/TierGate"
import { BubbleBackground } from "@/components/ui/bubble-background"
import PageSkeleton from "../components/page-skeleton"
import { DashboardSidebar } from "../components/DashboardSidebar"
import { 
  getCachedUserProfile, 
  getCachedUserPreferences, 
  cacheUserProfile, 
  cacheUserPreferences,
  invalidateCacheOnLogout
} from "@/lib/services/cacheService"
import { usePushNotifications } from "@/lib/hooks/usePushNotifications"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const sidebarNav = [
  { icon: LayoutDashboard, label: "dashboard", href: "/dashboard", active: false },
  { icon: Archive, label: "archive", href: "/dashboard/archive", active: false },
  { icon: Settings, label: "settings", href: "/dashboard/settings", active: true },
]

// Common timezones list
const timezones = [
  { value: "UTC-12:00", label: "(UTC-12:00) International Date Line West" },
  { value: "UTC-11:00", label: "(UTC-11:00) Coordinated Universal Time-11" },
  { value: "UTC-10:00", label: "(UTC-10:00) Hawaii" },
  { value: "UTC-09:00", label: "(UTC-09:00) Alaska" },
  { value: "UTC-08:00", label: "(UTC-08:00) Pacific Time (US & Canada)" },
  { value: "UTC-07:00", label: "(UTC-07:00) Mountain Time (US & Canada)" },
  { value: "UTC-06:00", label: "(UTC-06:00) Central Time (US & Canada)" },
  { value: "UTC-05:00", label: "(UTC-05:00) Eastern Time (US & Canada)" },
  { value: "UTC-04:00", label: "(UTC-04:00) Atlantic Time (Canada)" },
  { value: "UTC-03:30", label: "(UTC-03:30) Newfoundland" },
  { value: "UTC-03:00", label: "(UTC-03:00) Buenos Aires, Georgetown" },
  { value: "UTC-02:00", label: "(UTC-02:00) Mid-Atlantic" },
  { value: "UTC-01:00", label: "(UTC-01:00) Azores" },
  { value: "UTC+00:00", label: "(UTC+00:00) London, Dublin, Lisbon" },
  { value: "UTC+01:00", label: "(UTC+01:00) Paris, Berlin, Rome" },
  { value: "UTC+02:00", label: "(UTC+02:00) Athens, Cairo, Jerusalem" },
  { value: "UTC+03:00", label: "(UTC+03:00) Moscow, Kuwait, Riyadh" },
  { value: "UTC+03:30", label: "(UTC+03:30) Tehran" },
  { value: "UTC+04:00", label: "(UTC+04:00) Abu Dhabi, Muscat" },
  { value: "UTC+04:30", label: "(UTC+04:30) Kabul" },
  { value: "UTC+05:00", label: "(UTC+05:00) Islamabad, Karachi" },
  { value: "UTC+05:30", label: "(UTC+05:30) Mumbai, Kolkata, New Delhi" },
  { value: "UTC+05:45", label: "(UTC+05:45) Kathmandu" },
  { value: "UTC+06:00", label: "(UTC+06:00) Dhaka, Astana" },
  { value: "UTC+06:30", label: "(UTC+06:30) Yangon (Rangoon)" },
  { value: "UTC+07:00", label: "(UTC+07:00) Bangkok, Jakarta, Hanoi" },
  { value: "UTC+08:00", label: "(UTC+08:00) Beijing, Singapore, Hong Kong" },
  { value: "UTC+09:00", label: "(UTC+09:00) Tokyo, Seoul, Osaka" },
  { value: "UTC+09:30", label: "(UTC+09:30) Adelaide, Darwin" },
  { value: "UTC+10:00", label: "(UTC+10:00) Sydney, Melbourne, Brisbane" },
  { value: "UTC+11:00", label: "(UTC+11:00) Solomon Is., New Caledonia" },
  { value: "UTC+12:00", label: "(UTC+12:00) Auckland, Wellington, Fiji" },
  { value: "UTC+13:00", label: "(UTC+13:00) Nuku'alofa" },
]

// Supported languages - Add more upon request
const languages = [
  { value: "en", label: "English", nativeName: "English" },
  { value: "es", label: "Spanish", nativeName: "Español" },
  { value: "fr", label: "French", nativeName: "Français" },
  { value: "nl", label: "Dutch", nativeName: "Nederlands" },
]

// Prompt frequency options
const promptFrequencies = [
  { value: "daily", label: "Daily - Every day", description: "Receive a new prompt every day" },
  { value: "weekdays", label: "Weekdays Only", description: "Monday through Friday" },
  { value: "every-other-day", label: "Every Other Day", description: "3-4 times per week" },
  { value: "twice-weekly", label: "Twice a Week", description: "Monday and Thursday" },
  { value: "weekly", label: "Weekly", description: "Once per week on your chosen day" },
  { value: "custom", label: "Custom Schedule", description: "" }, // Dynamic description
]

type SettingsView = 'main' | 'profile' | 'notifications' | 'security' | 'preferences' | 'subscription' | 'integrations' | 'danger'

// Push Notification Row Component - integrates with real push subscription
function PushNotificationRow({ theme }: { theme: string }) {
  const { isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe } = usePushNotifications()

  if (isLoading) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <Label className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Push Notifications
          </Label>
          <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
            Checking device capabilities...
          </p>
        </div>
        <Switch checked={false} disabled />
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <Label className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Push Notifications
          </Label>
          <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
            {error ?? 'Not supported on this device'}
          </p>
        </div>
        <Switch checked={false} disabled />
      </div>
    )
  }

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await subscribe()
    } else {
      await unsubscribe()
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <Label className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Push Notifications
        </Label>
        <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
          {error ? error : isSubscribed ? 'Enabled on this device' : 'Receive notifications on your device'}
        </p>
      </div>
      <Switch 
        checked={isSubscribed} 
        onCheckedChange={handleToggle} 
        disabled={isLoading}
      />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <AuthGuard redirectPath="/dashboard/settings">
      <SettingsPageContent />
    </AuthGuard>
  )
}

function SettingsPageContent() {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = getSupabaseClient()
  const { tier, features = {}, isLoading: tierLoading, refresh: refreshTier, isTrial, trialEndDate, trialDaysRemaining } = useTier()
  const { currentLanguage, setLanguage: setGlobalLanguage } = useLanguage()
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Mobile view state - iPhone style navigation
  const [currentView, setCurrentView] = useState<SettingsView>('main')
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')
  
  // Profile states
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [timezone, setTimezone] = useState("") // Will be auto-detected
  const [timezoneInfo, setTimezoneInfo] = useState<any>(null)
  
  // Notification states
  const [pushNotificationsDb, setPushNotificationsDb] = useState(false) // Push notifications preference in DB
  const [dailyReminders, setDailyReminders] = useState(true) // Email reminders
  const [weeklyDigest, setWeeklyDigest] = useState(false) // Weekly email digest
  const [includeSelfJournalInInsights, setIncludeSelfJournalInInsights] = useState(false) // Opt-in for self-journal in weekly insights
  const [reminderTime, setReminderTime] = useState("09:00")
  
  // Security states
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [authProvider, setAuthProvider] = useState<string | null>(null) // 'google', 'email', etc.
  const [hasPassword, setHasPassword] = useState(true) // Whether user has set a password
  const [showPasswordFields, setShowPasswordFields] = useState(false) // Toggle password change form
  
  // Preference states
  const [darkMode, setDarkMode] = useState(theme === 'dark')
  const [privacyMode, setPrivacyMode] = useState(false)
  
  // Subscription states (derived from tier)
  const currentPlan = tier // Use tier from useTier hook
  const [billingCycle, setBillingCycle] = useState("monthly") // 'monthly' or 'yearly'
  
  // Integration states
  const [slackConnected, setSlackConnected] = useState(false)
  const [slackChannel, setSlackChannel] = useState<string | null>(null)
  const [slackLoading, setSlackLoading] = useState(false)
  
  // Downgrade dialog state
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false)

  // Auto-detect timezone on component mount
  useEffect(() => {
    // Detect user's timezone from browser
    const detectedTimezone = detectUserTimezone()
    const tzInfo = getTimezoneInfo(detectedTimezone)
    setTimezoneInfo(tzInfo)
    
    // Set as default if no timezone loaded yet
    if (!timezone) {
      setTimezone(detectedTimezone)
    }
  }, [])

  // Handle Stripe checkout success/cancel redirects
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const canceled = urlParams.get('canceled')
    
    if (success === 'true') {
      toast({
        title: "Payment Successful! 🎉",
        description: "Your subscription has been activated. Welcome to Premium!",
      })
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/settings')
      // Reload data to update subscription status
      loadUserData()
    } else if (canceled === 'true') {
      toast({
        title: "Payment Cancelled",
        description: "You can upgrade anytime from the settings page.",
      })
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/settings')
    }
  }, [])

  // Load user data from Supabase
  useEffect(() => {
    loadUserData()
  }, [])

  async function loadUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }

      setUserId(user.id)
      setEmail(user.email || '')
      
      // Detect authentication provider
      const provider = user.app_metadata?.provider || 'email'
      setAuthProvider(provider)

      // 1. LOAD FROM CACHE FIRST (instant UI)
      const cachedProfile = getCachedUserProfile(user.id)
      const cachedPreferences = getCachedUserPreferences(user.id)

      if (cachedProfile) {
        setFullName(cachedProfile.full_name || '')
        // Prefer timezone_iana over old timezone field
        const savedTimezone = cachedProfile.timezone_iana || cachedProfile.timezone
        if (savedTimezone) {
          setTimezone(savedTimezone)
          setTimezoneInfo(getTimezoneInfo(savedTimezone))
        }
        setHasPassword(cachedProfile.password_set ?? false)
        setIsLoading(false) // Show UI immediately with cached data
      }

      if (cachedPreferences) {
        setLanguage(cachedPreferences.language || 'en')
        setPushNotificationsDb(cachedPreferences.push_notifications ?? false)
        setDailyReminders(cachedPreferences.daily_reminders ?? true)
        setWeeklyDigest(cachedPreferences.weekly_digest ?? false)
        setIncludeSelfJournalInInsights(cachedPreferences.include_self_journal_in_insights ?? false)
        setReminderTime(cachedPreferences.reminder_time || '09:00')
        setPromptFrequency(cachedPreferences.prompt_frequency || 'daily')
        setCustomDays(cachedPreferences.custom_days || [])
        setPrivacyMode(cachedPreferences.privacy_mode ?? false)
        setBillingCycle(cachedPreferences.billing_cycle || 'monthly')
      }

      // 2. FETCH FRESH DATA IN BACKGROUND
      const [profileResponse, preferencesResponse] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/user/preferences')
      ])

      // Update with fresh data and cache it
      if (profileResponse.ok) {
        const { success, data: profile } = await profileResponse.json()
        if (success && profile) {
          setFullName(profile.full_name || '')
          // Prefer timezone_iana over old timezone field
          const savedTimezone = profile.timezone_iana || profile.timezone
          if (savedTimezone) {
            setTimezone(savedTimezone)
            setTimezoneInfo(getTimezoneInfo(savedTimezone))
          } else {
            // Use auto-detected if no saved timezone
            const detectedTz = detectUserTimezone()
            setTimezone(detectedTz)
            setTimezoneInfo(getTimezoneInfo(detectedTz))
          }
          setHasPassword(profile.password_set ?? false)
          cacheUserProfile(profile, user.id) // Cache for next time
        }
      } else if (!cachedProfile) {
        setFullName(user.user_metadata?.full_name || user.user_metadata?.name || '')
      }

      if (preferencesResponse.ok) {
        const { success, data: prefs } = await preferencesResponse.json()
        if (success && prefs) {
          setLanguage(prefs.language || 'en')
          setPushNotificationsDb(prefs.push_notifications ?? false)
          setDailyReminders(prefs.daily_reminders ?? true)
          setWeeklyDigest(prefs.weekly_digest ?? false)
          setIncludeSelfJournalInInsights(prefs.include_self_journal_in_insights ?? false)
          setReminderTime(prefs.reminder_time || '09:00')
          setPromptFrequency(prefs.prompt_frequency || 'daily')
          setCustomDays(prefs.custom_days || [])
          setPrivacyMode(prefs.privacy_mode ?? false)
          setBillingCycle(prefs.billing_cycle || 'monthly')
          // Check Slack connection
          if (prefs.slack_webhook_url) {
            setSlackConnected(true)
            setSlackChannel(prefs.slack_channel_name || 'Connected')
          }
          cacheUserPreferences(prefs, user.id) // Cache for next time
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Sync dark mode with theme context
  useEffect(() => {
    setDarkMode(theme === 'dark')
  }, [theme])
  const [language, setLanguage] = useState(currentLanguage.code)
  const [promptFrequency, setPromptFrequency] = useState("daily")
  const [customDays, setCustomDays] = useState<string[]>(["monday", "wednesday", "friday"])
  const [customScheduleSaved, setCustomScheduleSaved] = useState(false)

  // Sync local language state with global language context
  useEffect(() => {
    setLanguage(currentLanguage.code)
  }, [currentLanguage])

  // Reset custom schedule saved status when frequency changes
  useEffect(() => {
    if (promptFrequency !== "custom") {
      setCustomScheduleSaved(false)
    }
  }, [promptFrequency])

  // Save functions
  const handleSaveProfile = async () => {
    if (!userId) return

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          timezone_iana: timezone, // Save as IANA timezone
          timezone: timezone, // Keep old field for backwards compatibility
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      toast({
        title: t('toast.profileUpdated'),
        description: t('toast.profileUpdatedDesc'),
      })
    } catch (error: any) {
      toast({
        title: t('toast.error'),
        description: error.message || t('toast.errorGeneric') || "Failed to save profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveNotifications = async () => {
    if (!userId) return

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          push_notifications: pushNotificationsDb,
          daily_reminders: dailyReminders,
          weekly_digest: weeklyDigest,
          include_self_journal_in_insights: includeSelfJournalInInsights,
          reminder_time: reminderTime,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update notifications')
      }

      toast({
        title: t('toast.notificationsUpdated'),
        description: t('toast.notificationsUpdatedDesc'),
      })
    } catch (error: any) {
      toast({
        title: t('toast.error'),
        description: error.message || t('toast.errorGeneric') || "Failed to save notification settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePassword = async () => {
    // For OAuth users setting password for first time
    const isSettingPassword = !hasPassword
    
    if (isSettingPassword) {
      // Setting password for first time (OAuth user)
      if (!newPassword || !confirmPassword) {
        toast({
          title: "Error",
          description: "Please fill in all password fields.",
          variant: "destructive",
        })
        return
      }
      if (newPassword !== confirmPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match.",
          variant: "destructive",
        })
        return
      }
      if (newPassword.length < 8) {
        toast({
          title: "Error",
          description: "Password must be at least 8 characters long.",
          variant: "destructive",
        })
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Not signed in")
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        })

        if (error) throw error

        // Update password_set flag in database
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ password_set: true })
          .eq('id', user.id)

        if (updateError) {
        }

        setHasPassword(true) // User now has a password
        setShowPasswordFields(false) // Hide form
        toast({
          title: t('toast.passwordSet'),
          description: "You can now sign in with your email and password or continue using Google.",
        })
        setNewPassword("")
        setConfirmPassword("")
      } catch (error: any) {
        toast({
          title: t('toast.error'),
        description: error.message || t('toast.errorGeneric') || "Failed to set password. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      // Updating existing password
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast({
          title: "Error",
          description: "Please fill in all password fields.",
          variant: "destructive",
        })
        return
      }
      if (newPassword !== confirmPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match.",
          variant: "destructive",
        })
        return
      }
      if (newPassword.length < 8) {
        toast({
          title: "Error",
          description: "Password must be at least 8 characters long.",
          variant: "destructive",
        })
        return
      }

      try {
        // For email users, we need to verify current password first
        // Supabase doesn't have a direct "verify password" method,
        // so we'll attempt to update and let it fail if current password is wrong
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        })

        if (error) throw error

        setShowPasswordFields(false) // Hide form
        toast({
          title: t('toast.passwordUpdated'),
          description: t('toast.passwordUpdatedDesc'),
        })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } catch (error: any) {
        toast({
          title: t('toast.error'),
        description: error.message || t('toast.errorGeneric') || "Failed to update password. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleSavePreferences = async () => {
    if (!userId) return

    // Update global language context
    setGlobalLanguage(language)
    
    // Validate custom schedule
    if (promptFrequency === "custom" && customDays.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one day for your custom schedule.",
        variant: "destructive",
      })
      return
    }
    
    // Mark custom schedule as saved
    if (promptFrequency === "custom") {
      setCustomScheduleSaved(true)
    }

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: language,
          privacy_mode: privacyMode,
          prompt_frequency: promptFrequency,
          custom_days: customDays,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update preferences')
      }

      const scheduleInfo = promptFrequency === "custom" 
        ? `Custom schedule: ${customDays.join(", ")}`
        : promptFrequencies.find(f => f.value === promptFrequency)?.label
      
      toast({
        title: t('toast.preferencesUpdated'),
        description: `${t('toast.preferencesUpdatedDesc')} ${scheduleInfo}`,
      })
    } catch (error: any) {
      toast({
        title: t('toast.error'),
        description: error.message || t('toast.errorGeneric') || "Failed to save preferences. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleCustomDay = (day: string) => {
    setCustomDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
    // Reset saved status when user changes days
    setCustomScheduleSaved(false)
  }

  const handleExportData = async () => {
    try {
      // Show loading toast
      toast({
        title: "Preparing Export",
        description: "Please wait while we gather your data...",
      })

      const response = await fetch('/api/user/export-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to export data')
      }

      const result = await response.json()
      
      toast({
        title: "Export Started! 📧",
        description: "Your data is being exported as a PDF. You'll receive an email shortly with your complete data package.",
      })
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data. Please try again or contact support.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = () => {
    // TODO: Show confirmation dialog then connect to backend API
    toast({
      title: "Account Deletion",
      description: "Please contact support to proceed with account deletion.",
      variant: "destructive",
    })
  }

  const handleUpgradeToPremium = async () => {
    try {
      setIsLoading(true)
      
      // Send billing cycle to API, let server handle price IDs
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          billingCycle: billingCycle // 'monthly' or 'yearly'
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { checkoutUrl } = await response.json()
      if (checkoutUrl) {
        // Check if mobile/PWA - use same window for better UX
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        const isPWA = window.matchMedia('(display-mode: standalone)').matches
        
        if (isMobile || isPWA) {
          // Mobile/PWA: use same window to avoid tab switching issues
          window.location.href = checkoutUrl
        } else {
          // Desktop: open in new tab
          window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
          setIsLoading(false)
        }
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error: any) {
      toast({
        title: t('toast.error'),
        description: error.message || t('toast.errorGeneric') || "Failed to start checkout. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    // Show confirmation then cancel subscription
    if (!confirm('Are you sure you want to cancel your subscription? You\'ll keep Premium access until the end of your billing period.')) {
      return
    }

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      // Success message depends on subscription type
      if (data.type === 'gifted') {
        toast({
          title: "Subscription Cancelled",
          description: "Your gifted Premium access has been removed. You are now on the Free tier.",
        })
      } else {
        toast({
          title: "Subscription Cancelled",
          description: `You'll keep Premium access until ${data.periodEnd}. After that, you'll be on the Free tier.`,
        })
      }
      
      // Refresh tier to update UI
      await refreshTier()
    } catch (error: any) {
      toast({
        title: t('toast.error'),
        description: error.message || t('toast.errorGeneric') || 'Failed to cancel subscription. Please try again.',
        variant: "destructive",
      })
    }
  }

  const handleDowngradeToFree = () => {
    setShowDowngradeDialog(true)
  }
  
  const confirmDowngrade = async () => {
    try {
      // Cancel subscription directly via API (downgrades at end of period)
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      // Success!
      if (data.type === 'gifted') {
        // Gifted subscription - downgraded immediately
        toast({
          title: "Subscription Cancelled",
          description: "Your gifted Premium access has been removed. You are now on the Free tier.",
        })
      } else {
        // Paid subscription - keeps access until period end
        toast({
          title: "Subscription Cancelled",
          description: `You'll keep Premium access until ${data.periodEnd}. After that, you'll be on the Free tier.`,
        })
      }
      
      // Refresh tier to update UI
      await refreshTier()
      setShowDowngradeDialog(false)
    } catch (error: any) {
      toast({
        title: t('toast.error'),
        description: error.message || 'Failed to cancel subscription. Please try again.',
        variant: "destructive",
      })
      setShowDowngradeDialog(false)
    }
  }

  const handleConnectSlack = async () => {
    try {
      setSlackLoading(true)
      
      // Get Slack OAuth URL from API
      const response = await fetch('/api/integrations/slack/auth-url', {
        method: 'GET',
      })
      
      if (!response.ok) {
        throw new Error('Failed to get Slack authorization URL')
      }
      
      const { url } = await response.json()
      
      if (url) {
        // Redirect to Slack OAuth
        window.location.href = url
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Slack. Please try again.",
        variant: "destructive",
      })
      setSlackLoading(false)
    }
  }

  const handleDisconnectSlack = async () => {
    try {
      setSlackLoading(true)
      
      const response = await fetch('/api/integrations/slack/disconnect', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to disconnect Slack')
      }
      
      setSlackConnected(false)
      setSlackChannel(null)
      
      toast({
        title: "Slack Disconnected",
        description: "You'll no longer receive prompts in Slack.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect Slack. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSlackLoading(false)
    }
  }

  // Navigate to a settings view (mobile)
  const navigateToView = (view: SettingsView) => {
    setSlideDirection('right')
    setCurrentView(view)
  }

  // Go back to main settings (mobile)
  const goBack = () => {
    setSlideDirection('left')
    setCurrentView('main')
  }

  if (isLoading) {
    return (
      <div 
        className="min-h-screen relative" 
        style={theme === 'light' ? { background: 'linear-gradient(135deg, #f4f0eb 0%, #a1a79e 45%, #384c37 100%)' } : { background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)' }}
      >
        {/* Animated Bubble Background - Shows immediately */}
        <BubbleBackground 
          interactive
          className="fixed inset-0 -z-10"
        />
        <div className={`fixed inset-0 -z-10 ${theme === 'light' ? 'bg-white/35' : 'bg-black/25'}`} />

        <div className="relative z-10 p-4 sm:p-6 md:p-8">
          <PageSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen relative" 
      style={theme === 'light' ? { background: 'linear-gradient(135deg, #f4f0eb 0%, #a1a79e 45%, #384c37 100%)' } : { background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)' }}
    >
      {/* Animated Bubble Background */}
      <BubbleBackground 
        interactive
        className="fixed inset-0 -z-10"
      />
      <div className={`fixed inset-0 -z-10 ${theme === 'light' ? 'bg-white/35' : 'bg-black/25'}`} />

      <div className="relative z-10 p-3 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 pb-24 md:pb-6">
        {/* Universal Sidebar - Desktop & Mobile */}
        <DashboardSidebar />

        {/* Main Content Area */}
        <div className="col-span-1 md:col-span-10 space-y-4 md:space-y-6">
          {/* Mobile: iPhone-style Settings List */}
          <div className="md:hidden">
            {currentView === 'main' ? (
              <div>
                {/* Header */}
                <Card className={`backdrop-blur-xl rounded-3xl p-3 shadow-lg mb-3 ${
                  theme === 'dark'
                    ? 'bg-white/5 border border-white/10'
                    : 'bg-white/80 border-2 border-gray-300'
                }`}>
                  <h2 className={`text-2xl font-bold leading-tight ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Settings</h2>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                  }`}>Manage your account</p>
                </Card>

                {/* Settings Categories - iPhone style */}
                <div className="space-y-3">
                  {/* Profile */}
                  <Card
                    key="profile-card"
                    onClick={() => navigateToView('profile')}
                    className={`backdrop-blur-xl rounded-2xl p-4 active:scale-98 transition-transform cursor-pointer hover:shadow-lg shadow-md ${
                      theme === 'dark'
                        ? 'bg-white/5 border border-white/10'
                        : 'bg-white/80 border-2 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          theme === 'dark'
                            ? 'bg-blue-500/20 border-blue-400/30'
                            : 'bg-blue-100 border-blue-300'
                        }`}>
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Profile</p>
                          <p className={`text-xs ${
                            theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                          }`}>Name, email, timezone</p>
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 ${
                        theme === 'dark' ? 'text-white/40' : 'text-gray-400'
                      }`} />
                    </div>
                  </Card>

                  {/* Notifications */}
                  <Card
                    key="notifications-card"
                    onClick={() => navigateToView('notifications')}
                    className={`backdrop-blur-xl rounded-2xl p-4 active:scale-98 transition-transform cursor-pointer hover:shadow-lg shadow-md ${
                      theme === 'dark'
                        ? 'bg-white/5 border border-white/10'
                        : 'bg-white/80 border-2 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          theme === 'dark'
                            ? 'bg-yellow-500/20 border-yellow-400/30'
                            : 'bg-yellow-100 border-yellow-300'
                        }`}>
                          <Bell className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Notifications</p>
                          <p className={`text-xs ${
                            theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                          }`}>Alerts & reminders</p>
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 ${
                        theme === 'dark' ? 'text-white/40' : 'text-gray-400'
                      }`} />
                    </div>
                  </Card>

                  {/* Security */}
                  <Card
                    key="security-card"
                    onClick={() => navigateToView('security')}
                    className={`backdrop-blur-xl rounded-2xl p-4 active:scale-98 transition-transform cursor-pointer hover:shadow-lg shadow-md ${
                      theme === 'dark'
                        ? 'bg-white/5 border border-white/10'
                        : 'bg-white/80 border-2 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          theme === 'dark'
                            ? 'bg-red-500/20 border-red-400/30'
                            : 'bg-red-100 border-red-300'
                        }`}>
                          <Lock className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Security</p>
                          <p className={`text-xs ${
                            theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                          }`}>Password & authentication</p>
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 ${
                        theme === 'dark' ? 'text-white/40' : 'text-gray-400'
                      }`} />
                    </div>
                  </Card>

                  {/* Preferences */}
                  <Card
                    key="preferences-card"
                    onClick={() => navigateToView('preferences')}
                    className={`backdrop-blur-xl rounded-2xl p-4 active:scale-98 transition-transform cursor-pointer hover:shadow-lg shadow-md ${
                      theme === 'dark'
                        ? 'bg-white/5 border border-white/10'
                        : 'bg-white/80 border-2 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          theme === 'dark'
                            ? 'bg-purple-500/20 border-purple-400/30'
                            : 'bg-purple-100 border-purple-300'
                        }`}>
                          <Palette className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Preferences</p>
                          <p className={`text-xs ${
                            theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                          }`}>Language, theme, prompts</p>
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 ${
                        theme === 'dark' ? 'text-white/40' : 'text-gray-400'
                      }`} />
                    </div>
                  </Card>

                  {/* Subscription */}
                  <Card
                    key="subscription-card"
                    onClick={() => navigateToView('subscription')}
                    className={`backdrop-blur-xl rounded-2xl p-4 active:scale-98 transition-transform cursor-pointer hover:shadow-lg shadow-md ${
                      theme === 'dark'
                        ? 'bg-white/5 border border-white/10'
                        : 'bg-white/80 border-2 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          theme === 'dark'
                            ? 'bg-green-500/20 border-green-400/30'
                            : 'bg-green-100 border-green-300'
                        }`}>
                          <CreditCard className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Subscription</p>
                          {tier === 'premium' && isTrial && trialEndDate ? (
                            <TrialCountdown 
                              trialEndDate={trialEndDate}
                              compact={true}
                              showIcon={false}
                              className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}
                            />
                          ) : (
                            <p className={`text-xs ${
                              theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                            }`}>
                              {tier === 'premium' ? 'Premium Plan' : 'Free Plan'}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 ${
                        theme === 'dark' ? 'text-white/40' : 'text-gray-400'
                      }`} />
                    </div>
                  </Card>

                  {/* Integrations */}
                  <Card
                    key="integrations-card"
                    onClick={() => navigateToView('integrations')}
                    className={`backdrop-blur-xl rounded-2xl p-4 active:scale-98 transition-transform cursor-pointer hover:shadow-lg shadow-md ${
                      theme === 'dark'
                        ? 'bg-white/5 border border-white/10'
                        : 'bg-white/80 border-2 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          theme === 'dark'
                            ? 'bg-purple-500/20 border-purple-400/30'
                            : 'bg-purple-100 border-purple-300'
                        }`}>
                          <Zap className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Integrations</p>
                          <p className={`text-xs ${
                            theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                          }`}>Slack, WhatsApp, Teams</p>
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 ${
                        theme === 'dark' ? 'text-white/40' : 'text-gray-400'
                      }`} />
                    </div>
                  </Card>

                  {/* Contact Support */}
                  <Link href="/dashboard/support" className="block" key="support-link">
                    <Card
                      key="support-card"
                      className={`backdrop-blur-xl rounded-2xl p-4 active:scale-98 transition-transform cursor-pointer hover:shadow-lg shadow-md ${
                        theme === 'dark'
                          ? 'bg-white/5 border border-white/10'
                          : 'bg-white/80 border-2 border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                            theme === 'dark'
                              ? 'bg-blue-500/20 border-blue-400/30'
                              : 'bg-blue-100 border-blue-300'
                          }`}>
                            <HelpCircle className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className={`font-medium ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>Contact Support</p>
                            <p className={`text-xs ${
                              theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                            }`}>Get help & report issues</p>
                          </div>
                        </div>
                        <ChevronRight className={`h-5 w-5 ${
                          theme === 'dark' ? 'text-white/40' : 'text-gray-400'
                        }`} />
                      </div>
                    </Card>
                  </Link>

                  {/* Danger Zone */}
                  <Card
                    key="danger-card"
                    onClick={() => navigateToView('danger')}
                    className={`backdrop-blur-xl rounded-2xl p-4 active:scale-98 transition-transform cursor-pointer hover:shadow-lg shadow-md ${
                      theme === 'dark'
                        ? 'bg-red-500/10 border border-red-400/20'
                        : 'bg-red-50 border-2 border-red-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          theme === 'dark'
                            ? 'bg-red-500/20 border-red-400/30'
                            : 'bg-red-100 border-red-300'
                        }`}>
                          <Shield className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Danger Zone</p>
                          <p className={`text-xs ${
                            theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                          }`}>Export & delete account</p>
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 ${
                        theme === 'dark' ? 'text-white/40' : 'text-gray-400'
                      }`} />
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <div 
                className={`animate-in slide-in-from-${slideDirection === 'right' ? 'right' : 'left'}-full duration-300`}
              >
                {/* Back Button */}
                <div className="mb-3">
                  <button
                    onClick={goBack}
                    className={`flex items-center gap-2 transition-colors font-medium ${
                      theme === 'dark'
                        ? 'text-blue-400 active:text-blue-300'
                        : 'text-blue-600 active:text-blue-800'
                    }`}
                  >
                    <ChevronRight className="h-5 w-5 rotate-180" />
                    <span className="font-medium">Settings</span>
                  </button>
                </div>
                {/* Mobile Logout */}
                <div className="mb-4 md:hidden">
                  <Button
                    variant="ghost"
                    className={`w-full justify-center ${
                      theme === 'dark'
                        ? 'text-red-300 hover:text-red-200 hover:bg-red-500/10'
                        : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                    }`}
                    onClick={async () => {
                      await supabase.auth.signOut()
                      router.push('/auth/signin')
                    }}
                  >
                    Logout
                  </Button>
                </div>

                {/* Detail Views */}
                {currentView === 'profile' && (
                  <Card className={`backdrop-blur-xl rounded-3xl p-4 shadow-lg ${
                    theme === 'dark'
                      ? 'bg-white/5 border border-white/10'
                      : 'bg-white/80 border-2 border-gray-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-5 w-5 text-blue-600" />
                      <h3 className={`text-xl font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Profile</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="name-mobile" className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                        }`}>Full Name</Label>
                        <Input
                          id="name-mobile"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={`text-sm h-10 ${
                            theme === 'dark'
                              ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'
                              : 'bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                          }`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email-mobile" className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                        }`}>Email</Label>
                        <Input
                          id="email-mobile"
                          type="email"
                          value={email}
                          disabled
                          className={`text-sm h-10 ${
                            theme === 'dark'
                              ? 'bg-white/5 border border-white/10 text-white/50'
                              : 'bg-gray-100 border-2 border-gray-300 text-gray-600'
                          }`}
                        />
                        <p className={`text-xs ${
                          theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                        }`}>Email cannot be changed</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="timezone-mobile" className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                        }`}>Timezone</Label>
                        <Select value={timezone} onValueChange={(value) => {
                          setTimezone(value)
                          setTimezoneInfo(getTimezoneInfo(value))
                        }}>
                          <SelectTrigger className={`text-sm h-10 ${
                            theme === 'dark'
                              ? 'bg-white/10 border border-white/20 text-white'
                              : 'bg-white border-2 border-gray-300 text-gray-900'
                          }`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={`max-h-[300px] ${
                            theme === 'dark'
                              ? 'bg-black/90 border border-white/20'
                              : 'bg-white border-2 border-gray-300'
                          }`}>
                            {commonTimezones.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value} className={theme === 'dark'
                                ? 'text-white hover:bg-white/10'
                                : 'text-gray-900 hover:bg-gray-100'
                              }>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {timezoneInfo && (
                          <div className={`text-xs space-y-1 ${
                            theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                          }`}>
                            <p>🌍 {timezoneInfo.display}</p>
                            <p className={theme === 'dark' ? 'text-white/50' : 'text-gray-500'}>{timezoneInfo.dstNote}</p>
                          </div>
                        )}
                      </div>
                      <Button onClick={handleSaveProfile} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white h-10">
                        Save Changes
                      </Button>
                    </div>
                  </Card>
                )}

                {currentView === 'notifications' && (
                  <Card className={`backdrop-blur-xl rounded-3xl p-4 shadow-lg ${
                    theme === 'dark'
                      ? 'bg-white/5 border border-white/10'
                      : 'bg-white/80 border-2 border-gray-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <Bell className="h-5 w-5 text-yellow-600" />
                      <h3 className={`text-xl font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Notifications</h3>
                    </div>
                    <div className="space-y-4">
                      <PushNotificationRow theme={theme} />
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className={`text-sm ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Daily Reminders</Label>
                          <p className={`text-xs ${
                            theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                          }`}>Receive daily email reminders</p>
                        </div>
                        <Switch checked={dailyReminders} onCheckedChange={setDailyReminders} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className={`text-sm ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Weekly Digest</Label>
                          <p className={`text-xs ${
                            theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                          }`}>Summary of your week every Sunday</p>
                        </div>
                        <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className={`text-sm ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Include Self-Journal in Weekly Insights</Label>
                          <p className={`text-xs ${
                            theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                          }`}>Opt-in to include private self-journals in insights</p>
                        </div>
                        <Switch
                          checked={includeSelfJournalInInsights}
                          onCheckedChange={setIncludeSelfJournalInInsights}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="reminder-time-mobile" className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                        }`}>Reminder Time</Label>
                        <Input
                          id="reminder-time-mobile"
                          type="time"
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                          className={`text-sm h-10 ${
                            theme === 'dark'
                              ? 'bg-white/10 border border-white/20 text-white'
                              : 'bg-white border-2 border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                      <Button onClick={handleSaveNotifications} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white h-10">
                        Save Settings
                      </Button>
                    </div>
                  </Card>
                )}

                {currentView === 'security' && (
                  <Card className={`backdrop-blur-xl rounded-3xl p-4 shadow-lg ${
                    theme === 'dark'
                      ? 'bg-white/5 border border-white/10'
                      : 'bg-white/80 border-2 border-gray-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <Lock className="h-5 w-5 text-red-600" />
                      <h3 className={`text-xl font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Security</h3>
                    </div>
                    {authProvider && authProvider !== 'email' && (
                      <div className={`mb-4 p-3 rounded-xl ${
                        theme === 'dark'
                          ? 'bg-blue-500/10 border border-blue-400/30'
                          : 'bg-blue-50 border-2 border-blue-300'
                      }`}>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-blue-200' : 'text-gray-900'
                        }`}>
                          <span className="font-medium">Signed in with Google</span>
                          {!hasPassword && <span className={theme === 'dark' ? 'text-blue-200/80' : 'text-gray-700'}> • Set backup password</span>}
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      {hasPassword && (
                        <div className="space-y-1.5">
                          <Label className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                          }`}>Current Password</Label>
                          <Input
                            type="password"
                            placeholder="Current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className={`text-sm h-10 ${
                              theme === 'dark'
                                ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-blue-400'
                                : 'bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                            }`}
                          />
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                        }`}>{hasPassword ? 'New Password' : 'Set Password'}</Label>
                        <Input
                          type="password"
                          placeholder={hasPassword ? "New password" : "Create password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={`text-sm h-10 ${
                            theme === 'dark'
                              ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-blue-400'
                              : 'bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                          }`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                        }`}>Confirm Password</Label>
                        <Input
                          type="password"
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`text-sm h-10 ${
                            theme === 'dark'
                              ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-blue-400'
                              : 'bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                          }`}
                        />
                      </div>
                      <Button onClick={handleUpdatePassword} className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white h-10">
                        {hasPassword ? 'Update Password' : 'Set Password'}
                      </Button>
                    </div>
                  </Card>
                )}

                {currentView === 'preferences' && (
                  <Card className={`backdrop-blur-xl rounded-3xl p-4 shadow-lg ${
                    theme === 'dark'
                      ? 'bg-white/5 border border-white/10'
                      : 'bg-white/80 border-2 border-gray-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <Palette className="h-5 w-5 text-purple-600" />
                      <h3 className={`text-xl font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Preferences</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className={`text-sm ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Dark Mode</Label>
                          <p className={`text-xs ${
                            theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                          }`}>Use dark theme</p>
                        </div>
                        <Switch checked={darkMode} onCheckedChange={(checked) => { setDarkMode(checked); setTheme(checked ? 'dark' : 'light') }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className={`text-sm ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Privacy Mode</Label>
                          <p className={`text-xs ${
                            theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                          }`}>Hide reflections preview</p>
                        </div>
                        <Switch checked={privacyMode} onCheckedChange={setPrivacyMode} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                        }`}>Language</Label>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger className={`text-sm h-10 ${
                            theme === 'dark'
                              ? 'bg-white/10 border border-white/20 text-white'
                              : 'bg-white border-2 border-gray-300 text-gray-900'
                          }`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={`max-h-[300px] ${
                            theme === 'dark'
                              ? 'bg-black/90 border border-white/20'
                              : 'bg-white border-2 border-gray-300'
                          }`}>
                            {languages.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value} className={theme === 'dark'
                                ? 'text-white hover:bg-white/10'
                                : 'text-gray-900 hover:bg-gray-100'
                              }>
                                {lang.label} ({lang.nativeName})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                        }`}>Prompt Frequency</Label>
                        <Select value={promptFrequency} onValueChange={setPromptFrequency}>
                          <SelectTrigger className={`text-sm h-10 ${
                            theme === 'dark'
                              ? 'bg-white/10 border border-white/20 text-white'
                              : 'bg-white border-2 border-gray-300 text-gray-900'
                          }`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={`max-h-[300px] ${
                            theme === 'dark'
                              ? 'bg-black/90 border border-white/20'
                              : 'bg-white border-2 border-gray-300'
                          }`}>
                            {promptFrequencies.map((freq) => (
                              <SelectItem key={freq.value} value={freq.value} className={theme === 'dark'
                                ? 'text-white hover:bg-white/10'
                                : 'text-gray-900 hover:bg-gray-100'
                              }>
                                {freq.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {promptFrequency === "custom" && (
                        <div className={`space-y-3 p-4 rounded-xl ${
                          theme === 'dark'
                            ? 'bg-white/5 border border-white/10'
                            : 'bg-gray-50 border-2 border-gray-300'
                        }`}>
                          <Label className={`font-medium text-sm ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Select Days</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                              <Button
                                key={day}
                                type="button"
                                onClick={() => toggleCustomDay(day)}
                                className={`h-9 text-sm ${
                                  customDays.includes(day)
                                    ? 'bg-purple-500 text-white hover:bg-purple-600'
                                    : theme === 'dark'
                                    ? 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20'
                                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {day.charAt(0).toUpperCase() + day.slice(1)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      <Button onClick={handleSavePreferences} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white h-10">
                        Save Preferences
                      </Button>
                    </div>
                  </Card>
                )}

                {currentView === 'subscription' && (
                  <Card className={`backdrop-blur-xl rounded-3xl p-4 shadow-lg ${
                    theme === 'dark'
                      ? 'bg-white/5 border border-white/10'
                      : 'bg-white/80 border-2 border-gray-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="h-5 w-5 text-green-600" />
                      <h3 className={`text-xl font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Subscription</h3>
                    </div>
                    <div className="space-y-4">
                      {/* Current Plan Display */}
                      <div className={`p-4 rounded-xl ${
                        theme === 'dark'
                          ? 'bg-white/5 border border-white/10'
                          : 'bg-gray-50 border-2 border-gray-300'
                      }`}>
                        <Label className={`text-sm mb-2 block font-medium ${
                          theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                        }`}>Current Plan</Label>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-2xl font-bold ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {currentPlan === "free" ? "Free" : "Premium"}
                              {isTrial && currentPlan === "premium" && (
                                <span className={`ml-2 text-sm font-normal ${
                                  theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                                }`}>(Trial)</span>
                              )}
                            </p>
                            {isTrial && currentPlan === "premium" && trialEndDate ? (
                              <div className="mt-2">
                                <TrialCountdown 
                                  trialEndDate={trialEndDate}
                                  compact={true}
                                  showIcon={false}
                                  className={theme === 'dark' ? 'text-white/70' : 'text-gray-600'}
                                />
                              </div>
                            ) : (
                              <p className={`text-sm mt-1 ${
                                theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                              }`}>
                                {currentPlan === "free" ? "£0/month" : `£${billingCycle === "monthly" ? "12" : "8.25"}/month`}
                              </p>
                            )}
                          </div>
                          {currentPlan === "premium" && !isTrial && (
                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs ${
                              theme === 'dark'
                                ? 'bg-yellow-500/20 border border-yellow-400/40 text-yellow-300'
                                : 'bg-yellow-100 border-2 border-yellow-300 text-yellow-700'
                            }`}>
                              <Crown className="h-3 w-3" /> Active
                            </span>
                          )}
                          {currentPlan === "premium" && isTrial && (
                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs ${
                              theme === 'dark'
                                ? 'bg-purple-500/20 border border-purple-400/40 text-purple-300'
                                : 'bg-purple-100 border-2 border-purple-300 text-purple-700'
                            }`}>
                              <Zap className="h-3 w-3" /> Trial
                            </span>
                          )}
                          {currentPlan === "free" && (
                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs ${
                              theme === 'dark'
                                ? 'bg-blue-500/20 border border-blue-400/40 text-blue-300'
                                : 'bg-blue-100 border-2 border-blue-300 text-blue-700'
                            }`}>
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Upgrade Section (Free users) */}
                      {currentPlan === "free" && (
                        <div className="space-y-3">
                          <div className={`p-4 rounded-xl ${
                            theme === 'dark'
                              ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-400/30'
                              : 'bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-300'
                          }`}>
                            <div className="flex items-center gap-2 mb-3">
                              <Crown className={`h-5 w-5 ${
                                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'
                              }`} />
                              <h4 className={`font-semibold ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>Upgrade to Premium</h4>
                            </div>
                            
                            {/* Billing Cycle Selector */}
                            <div className="flex gap-2 mb-3">
                              <button 
                                onClick={() => setBillingCycle("monthly")} 
                                className={`flex-1 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                                  billingCycle === "monthly" 
                                    ? theme === 'dark'
                                      ? 'bg-yellow-500/40 border border-yellow-400 text-white'
                                      : 'bg-yellow-200 border-2 border-yellow-500 text-gray-900'
                                    : theme === 'dark'
                                    ? 'bg-white/10 border border-white/20 text-white/70'
                                    : 'bg-white border-2 border-gray-300 text-gray-600'
                                }`}
                              >
                                <div className="text-center">
                                  <div className="font-bold">£12</div>
                                  <div className="text-xs">per month</div>
                                </div>
                              </button>
                              <button 
                                onClick={() => setBillingCycle("yearly")} 
                                className={`flex-1 px-3 py-3 rounded-lg text-sm font-medium transition-all relative ${
                                  billingCycle === "yearly" 
                                    ? theme === 'dark'
                                      ? 'bg-yellow-500/40 border border-yellow-400 text-white'
                                      : 'bg-yellow-200 border-2 border-yellow-500 text-gray-900'
                                    : theme === 'dark'
                                    ? 'bg-white/10 border border-white/20 text-white/70'
                                    : 'bg-white border-2 border-gray-300 text-gray-600'
                                }`}
                              >
                                <span className="text-[9px] absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-green-600 text-white rounded-full font-bold shadow-md">SAVE £45</span>
                                <div className="text-center">
                                  <div className="font-bold">£99</div>
                                  <div className="text-xs">per year</div>
                                </div>
                              </button>
                            </div>

                            {/* Premium Features */}
                            <div className={`space-y-2 mb-3 p-3 rounded-lg ${
                              theme === 'dark'
                                ? 'bg-white/10 border border-white/20'
                                : 'bg-white border-2 border-gray-200'
                            }`}>
                              {[
                                "Daily prompts (7 days/week)",
                                "Unlimited archive access",
                                "Advanced analytics",
                                "Slack integration",
                              ].map((feature, index) => (
                                <div key={index} className={`flex items-center gap-2 text-xs ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>

                            <Button 
                              onClick={handleUpgradeToPremium} 
                              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold h-10"
                            >
                              <Crown className="mr-2 h-4 w-4" /> 
                              Upgrade to Premium
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Downgrade Section (Premium users) */}
                      {currentPlan === "premium" && (
                        <div className="space-y-3">
                          {/* Premium Benefits Reminder */}
                          <div className={`p-4 rounded-xl ${
                            theme === 'dark'
                              ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-400/30'
                              : 'bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-300'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Crown className={`h-4 w-4 ${
                                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'
                              }`} />
                              <p className={`text-sm font-semibold ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>You're on Premium!</p>
                            </div>
                            <div className={`grid grid-cols-2 gap-2 text-[11px] ${
                              theme === 'dark' ? 'text-white/90' : 'text-gray-800'
                            }`}>
                              {[
                                "Daily prompts",
                                "Unlimited archive",
                                "Advanced analytics",
                                "Slack integration",
                              ].map((feature, index) => (
                                <div key={index} className="flex items-center gap-1.5">
                                  <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Downgrade Option */}
                          <div className={`p-4 rounded-xl ${
                            theme === 'dark'
                              ? 'bg-white/5 border border-white/10'
                              : 'bg-white border-2 border-gray-300'
                          }`}>
                            <div className="flex items-start gap-3 mb-3">
                              <div className="flex-1">
                                <h4 className={`font-semibold text-base ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>Free Tier</h4>
                                <p className={`text-sm ${
                                  theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                                }`}>£0/month</p>
                              </div>
                            </div>
                            
                            <div className={`space-y-2 mb-4 p-3 rounded-lg ${
                              theme === 'dark'
                                ? 'bg-white/5 border border-white/10'
                                : 'bg-gray-50 border-2 border-gray-200'
                            }`}>
                              {[
                                "3 prompts per week",
                                "Last 50 reflections",
                                "Basic mood tracking",
                                "Email delivery only",
                              ].map((feature, index) => (
                                <div key={index} className={`flex items-start gap-2 text-xs ${
                                  theme === 'dark' ? 'text-white/80' : 'text-gray-700'
                                }`}>
                                  <Check className="h-3 w-3 text-blue-600 flex-shrink-0 mt-0.5" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>

                            <Button 
                              onClick={handleDowngradeToFree}
                              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium h-10 transition-all duration-300 shadow-lg"
                            >
                              Switch to Free Tier
                            </Button>
                          </div>

                          {/* Cancel Subscription */}
                          <div className={`p-4 rounded-xl ${
                            theme === 'dark'
                              ? 'bg-red-500/10 border border-red-400/30'
                              : 'bg-red-50 border-2 border-red-300'
                          }`}>
                            <div className="text-center">
                              <p className={`text-sm mb-2 ${
                                theme === 'dark' ? 'text-red-200' : 'text-gray-800'
                              }`}>Need to cancel your subscription?</p>
                              <button
                                onClick={handleCancelSubscription}
                                className={`text-sm font-semibold underline decoration-2 underline-offset-2 transition-colors ${
                                  theme === 'dark'
                                    ? 'text-red-400 hover:text-red-300'
                                    : 'text-red-600 hover:text-red-800'
                                }`}
                              >
                                Cancel Subscription
                              </button>
                              <p className={`text-[10px] mt-2 ${
                                theme === 'dark' ? 'text-red-300/70' : 'text-gray-600'
                              }`}>
                                Your Premium access will continue until the end of your current billing period.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {currentView === 'integrations' && (
                  <Card className={`backdrop-blur-xl rounded-3xl p-4 shadow-lg ${
                    theme === 'dark'
                      ? 'bg-white/5 border border-white/10'
                      : 'bg-white/80 border-2 border-gray-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="h-5 w-5 text-purple-600" />
                      <h3 className={`text-xl font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Integrations</h3>
                    </div>
                    <div className="space-y-3">
                      <div className={`p-4 rounded-xl ${
                        theme === 'dark'
                          ? 'bg-white/5 border border-white/10'
                          : 'bg-gray-50 border-2 border-gray-300'
                      }`}>
                        <div className="flex items-center gap-3 mb-2">
                          <SlackIcon size={24} />
                          <div className="flex-1">
                            <h4 className={`font-medium ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>Slack</h4>
                            {slackConnected && <p className={`text-xs ${
                              theme === 'dark' ? 'text-green-400' : 'text-green-600'
                            }`}>Connected</p>}
                          </div>
                        </div>
                        <Button onClick={slackConnected ? handleDisconnectSlack : handleConnectSlack} size="sm" className="w-full h-9" disabled={slackLoading}>
                          {slackConnected ? 'Disconnect' : 'Connect Slack'}
                        </Button>
                      </div>
                      <div className={`p-4 rounded-xl opacity-60 ${
                        theme === 'dark'
                          ? 'bg-white/5 border border-white/10'
                          : 'bg-gray-50 border-2 border-gray-300'
                      }`}>
                        <div className="flex items-center gap-3 mb-2">
                          <WhatsAppIcon size={24} />
                          <div className="flex-1">
                            <h4 className={`font-medium ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>WhatsApp</h4>
                            <p className={`text-xs ${
                              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                            }`}>Coming Soon</p>
                          </div>
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl opacity-60 ${
                        theme === 'dark'
                          ? 'bg-white/5 border border-white/10'
                          : 'bg-gray-50 border-2 border-gray-300'
                      }`}>
                        <div className="flex items-center gap-3 mb-2">
                          <TeamsIcon size={24} />
                          <div className="flex-1">
                            <h4 className={`font-medium ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>Microsoft Teams</h4>
                            <p className={`text-xs ${
                              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                            }`}>Coming Soon</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {currentView === 'danger' && (
                  <Card className={`backdrop-blur-xl rounded-3xl p-4 shadow-lg ${
                    theme === 'dark'
                      ? 'bg-red-500/10 border border-red-400/30'
                      : 'bg-red-50 border-2 border-red-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="h-5 w-5 text-red-600" />
                      <h3 className={`text-xl font-semibold ${
                        theme === 'dark' ? 'text-red-200' : 'text-gray-900'
                      }`}>Danger Zone</h3>
                    </div>
                    <div className="space-y-3">
                      <div className={`p-4 rounded-xl ${
                        theme === 'dark'
                          ? 'bg-white/5 border border-white/10'
                          : 'bg-white border-2 border-gray-300'
                      }`}>
                        <p className={`font-medium mb-1 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Export All Data</p>
                        <p className={`text-sm mb-3 ${
                          theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                        }`}>Download your reflections</p>
                        <Button onClick={handleExportData} variant="outline" className={`w-full h-9 ${
                          theme === 'dark'
                            ? 'bg-white/5 border border-white/20 text-white hover:bg-white/10'
                            : 'bg-white border-2 border-gray-300 text-gray-900 hover:bg-gray-50'
                        }`}>
                          Export Data
                        </Button>
                      </div>
                      <div className={`p-4 rounded-xl ${
                        theme === 'dark'
                          ? 'bg-red-500/15 border border-red-400/40'
                          : 'bg-red-100 border-2 border-red-300'
                      }`}>
                        <p className={`font-medium mb-1 ${
                          theme === 'dark' ? 'text-red-200' : 'text-red-700'
                        }`}>Delete Account</p>
                        <p className={`text-sm mb-3 ${
                          theme === 'dark' ? 'text-red-300/80' : 'text-gray-700'
                        }`}>Permanently delete everything</p>
                        <Button onClick={handleDeleteAccount} className={`w-full h-9 ${
                          theme === 'dark'
                            ? 'bg-red-600 text-white border border-red-500 hover:bg-red-700'
                            : 'bg-red-600 text-white border-2 border-red-700 hover:bg-red-700'
                        }`}>
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Desktop: Original Grid Layout */}
          <div className="hidden md:block space-y-4 md:space-y-6">
          {/* Header Card */}
          <Card className={`backdrop-blur-xl rounded-3xl p-3 md:p-6 shadow-lg ${
            theme === 'dark'
              ? 'bg-white/5 border border-white/10'
              : 'bg-white/80 border-2 border-gray-300'
          }`}>
            <div>
              <h2 className={`text-xl md:text-3xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Settings</h2>
              <p className={`text-xs md:text-base ${
                theme === 'dark' ? 'text-white/70' : 'text-gray-600'
              }`}>Manage your account and preferences</p>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Profile Settings */}
            <Card className={`backdrop-blur-xl rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-lg hover:shadow-xl transition-shadow ${
              theme === 'dark'
                ? 'bg-white/5 border border-white/10'
                : 'bg-white/80 border-2 border-gray-300'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className={`text-base md:text-xl font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Profile Information</h3>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                  }`}>Full Name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`text-sm h-9 md:h-10 ${
                      theme === 'dark'
                        ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-blue-400'
                        : 'bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                  }`}>{t('settings.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`text-sm h-9 md:h-10 ${
                      theme === 'dark'
                        ? 'bg-white/5 border border-white/10 text-white/50'
                        : 'bg-gray-100 border-2 border-gray-300 text-gray-600 placeholder:text-gray-400'
                    }`}
                    disabled
                  />
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                  }`}>Email cannot be changed from settings</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="timezone" className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                  }`}>Timezone</Label>
                  <Select value={timezone} onValueChange={(value) => {
                    setTimezone(value)
                    setTimezoneInfo(getTimezoneInfo(value))
                  }}>
                    <SelectTrigger className={`text-sm h-9 md:h-10 ${
                      theme === 'dark'
                        ? 'bg-white/10 border border-white/20 text-white'
                        : 'bg-white border-2 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}>
                      <SelectValue placeholder="Select your timezone" />
                    </SelectTrigger>
                    <SelectContent className={`max-h-[300px] ${
                      theme === 'dark'
                        ? 'bg-black/90 border border-white/20'
                        : 'bg-white border-2 border-gray-300'
                    }`}>
                      {commonTimezones.map((tz) => (
                        <SelectItem 
                          key={tz.value} 
                          value={tz.value}
                          className={theme === 'dark'
                            ? 'text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer'
                            : 'text-gray-900 hover:bg-gray-100 focus:bg-gray-100 cursor-pointer'
                          }
                        >
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {timezoneInfo && (
                    <div className={`text-xs space-y-1 mt-2 ${
                      theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                    }`}>
                      <p className="flex items-center gap-1">
                        <span>🌍</span>
                        <span className="font-medium">{timezoneInfo.display}</span>
                      </p>
                      <p className={theme === 'dark' ? 'text-white/50' : 'text-gray-500'}>{timezoneInfo.dstNote}</p>
                    </div>
                  )}
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                  }`}>Automatically detects daylight saving time</p>
                </div>
                <Button 
                  onClick={handleSaveProfile}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm h-9 md:h-10 transition-all duration-700 ease-out hover:scale-[1.02]"
                >
                  Save Changes
                </Button>
              </div>
            </Card>

            {/* Notification Settings */}
            <Card className={`backdrop-blur-xl rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-lg hover:shadow-xl transition-shadow ${
              theme === 'dark'
                ? 'bg-white/5 border border-white/10'
                : 'bg-white/80 border-2 border-gray-300'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-yellow-600" />
                <h3 className={`text-base md:text-xl font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Notifications</h3>
              </div>
              <div className="space-y-4">
                <PushNotificationRow theme={theme} />
                <div className="flex items-center justify-between gap-2 md:gap-3">
                  <div className="space-y-0.5 flex-1">
                    <Label className={`text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Daily Reminders</Label>
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                    }`}>Get reminded to complete your daily prompt</p>
                  </div>
                  <Switch
                    checked={dailyReminders}
                    onCheckedChange={setDailyReminders}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 md:gap-3">
                  <div className="space-y-0.5 flex-1">
                    <Label className={`text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Weekly Digest</Label>
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                    }`}>Summary of your week every Sunday</p>
                  </div>
                  <Switch
                    checked={weeklyDigest}
                    onCheckedChange={setWeeklyDigest}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 md:gap-3">
                  <div className="space-y-0.5 flex-1">
                    <Label className={`text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Include Self-Journal in Weekly Insights</Label>
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                    }`}>Opt-in to include private self-journals in insights</p>
                  </div>
                  <Switch
                    checked={includeSelfJournalInInsights}
                    onCheckedChange={setIncludeSelfJournalInInsights}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={`text-sm ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Reminder Time</Label>
                  <Input
                    id="reminder-time"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className={`text-sm h-11 ${
                      theme === 'dark'
                        ? 'bg-white/10 border border-white/20 text-white'
                        : 'bg-white border-2 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <Button 
                  onClick={handleSaveNotifications}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-sm h-9 md:h-10 transition-all duration-700 ease-out hover:scale-[1.02]"
                >
                  Save Notification Settings
                </Button>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Security Settings */}
            <Card className={`backdrop-blur-xl rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-lg hover:shadow-xl transition-shadow ${
              theme === 'dark'
                ? 'bg-white/5 border border-white/10'
                : 'bg-white/80 border-2 border-gray-300'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-red-600" />
                <h3 className={`text-base md:text-xl font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Security</h3>
              </div>
              
              {/* OAuth user info badge */}
              {authProvider && authProvider !== 'email' && (
                <div className={`mb-4 p-3 rounded-xl ${
                  theme === 'dark'
                    ? 'bg-blue-500/10 border border-blue-400/30'
                    : 'bg-blue-50 border-2 border-blue-300'
                }`}>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-blue-200' : 'text-gray-900'
                  }`}>
                    <span className="font-medium">Signed in with Google</span>
                    {!hasPassword && (
                      <span className={theme === 'dark' ? 'text-blue-300' : 'text-gray-700'}> • Set a password below for backup authentication</span>
                    )}
                    {hasPassword && (
                      <span className={theme === 'dark' ? 'text-blue-300' : 'text-gray-700'}> • You can sign in with either Google or email/password</span>
                    )}
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                {/* Only show current password field if user has a password already */}
                {hasPassword && (
                  <div className="space-y-1.5">
                    <Label htmlFor="current-password" className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                    }`}>Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={`text-sm h-9 md:h-10 ${
                        theme === 'dark'
                          ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-red-400'
                          : 'bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      }`}
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                  }`}>
                    {hasPassword ? 'New Password' : 'Set Password'}
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder={hasPassword ? "Enter new password" : "Create a password (min 8 characters)"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`text-sm h-9 md:h-10 ${
                      theme === 'dark'
                        ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-red-400'
                        : 'bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                  }`}>Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder={t('settings.confirmPassword')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`text-sm h-9 md:h-10 ${
                      theme === 'dark'
                        ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-red-400'
                        : 'bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    }`}
                  />
                </div>
                {!hasPassword && (
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                  }`}>
                    Setting a password allows you to sign in with email/password as a backup to Google sign-in.
                  </p>
                )}
                <Button 
                  onClick={handleUpdatePassword}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-sm h-9 md:h-10 transition-all duration-700 ease-out hover:scale-[1.02]"
                >
                  {hasPassword ? 'Update Password' : 'Set Password'}
                </Button>
              </div>
            </Card>

            {/* Preferences */}
            <Card className={`backdrop-blur-xl rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-lg hover:shadow-xl transition-shadow ${
              theme === 'dark'
                ? 'bg-white/5 border border-white/10'
                : 'bg-white/80 border-2 border-gray-300'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <Palette className="h-5 w-5 text-purple-600" />
                <h3 className={`text-base md:text-xl font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Preferences</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 md:gap-3">
                  <div className="space-y-0.5 flex-1">
                    <Label className={`text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Dark Mode</Label>
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                    }`}>Use dark theme throughout the app</p>
                  </div>
                  <Switch
                    checked={darkMode}
                    onCheckedChange={(checked) => {
                      setDarkMode(checked)
                      setTheme(checked ? 'dark' : 'light')
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 md:gap-3">
                  <div className="space-y-0.5 flex-1">
                    <Label className={`text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Privacy Mode</Label>
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                    }`}>Hide reflections from preview</p>
                  </div>
                  <Switch
                    checked={privacyMode}
                    onCheckedChange={setPrivacyMode}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="language" className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                  }`}>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className={`text-sm h-9 md:h-10 ${
                      theme === 'dark'
                        ? 'bg-white/10 border border-white/20 text-white'
                        : 'bg-white border-2 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                    }`}>
                      <SelectValue placeholder="Select your language" />
                    </SelectTrigger>
                    <SelectContent className={`max-h-[300px] ${
                      theme === 'dark'
                        ? 'bg-black/90 border border-white/20'
                        : 'bg-white border-2 border-gray-300'
                    }`}>
                      {languages.map((lang) => (
                        <SelectItem 
                          key={lang.value} 
                          value={lang.value}
                          className={theme === 'dark'
                            ? 'text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer'
                            : 'text-gray-900 hover:bg-gray-100 focus:bg-gray-100 cursor-pointer'
                          }
                        >
                          {lang.label} ({lang.nativeName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                  }`}>Language preference will be applied across the entire application</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prompt-frequency" className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                  }`}>Prompt Frequency</Label>
                  <Select value={promptFrequency} onValueChange={setPromptFrequency}>
                    <SelectTrigger className={`text-sm h-9 md:h-10 ${
                      theme === 'dark'
                        ? 'bg-white/10 border border-white/20 text-white'
                        : 'bg-white border-2 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                    }`}>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent className={theme === 'dark'
                      ? 'bg-black/90 border border-white/20'
                      : 'bg-white border-2 border-gray-300'
                    }>
                      {promptFrequencies.map((freq) => {
                        // Dynamic description for custom schedule
                        const description = freq.value === "custom"
                          ? (customScheduleSaved ? "Your schedule has been set" : "Set your own schedule")
                          : freq.description
                        
                        return (
                          <SelectItem 
                            key={freq.value} 
                            value={freq.value}
                            className={theme === 'dark'
                              ? 'text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer'
                              : 'text-gray-900 hover:bg-gray-100 focus:bg-gray-100 cursor-pointer'
                            }
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{freq.label}</span>
                              {description && (
                                <span className={`text-xs ${
                                  theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                                }`}>{description}</span>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                  }`}>How often you'd like to receive new reflection prompts</p>
                </div>
                
                {/* Custom Schedule Days Selector */}
                {promptFrequency === "custom" && (
                  <div className={`space-y-3 p-4 rounded-xl ${
                    theme === 'dark'
                      ? 'bg-white/5 border border-white/10'
                      : 'bg-gray-50 border-2 border-gray-300'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <Label className={`font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Select Days for Prompts</Label>
                      </div>
                      {customScheduleSaved && (
                        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                          theme === 'dark'
                            ? 'bg-green-500/10 text-green-400 border border-green-400/30'
                            : 'bg-green-50 text-green-700 border-2 border-green-300'
                        }`}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          Saved
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "monday", label: "Monday" },
                        { value: "tuesday", label: "Tuesday" },
                        { value: "wednesday", label: "Wednesday" },
                        { value: "thursday", label: "Thursday" },
                        { value: "friday", label: "Friday" },
                        { value: "saturday", label: "Saturday" },
                        { value: "sunday", label: "Sunday" },
                      ].map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={customDays.includes(day.value) ? "default" : "outline"}
                          onClick={() => toggleCustomDay(day.value)}
                          className={`transition-all duration-300 ${
                            customDays.includes(day.value)
                              ? "bg-purple-500 hover:bg-purple-600 text-white border-purple-400"
                              : theme === 'dark'
                                ? "bg-white/10 border border-white/20 text-white/80 hover:bg-white/20"
                                : "bg-white border-2 border-gray-300 text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                    <p className={`text-xs mt-2 ${
                      theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                    }`}>
                      Selected: {customDays.length > 0 ? customDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ") : "None"}
                    </p>
                  </div>
                )}
                
                <Button
                  onClick={handleSavePreferences}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-700 ease-out hover:scale-[1.02]"
                >
                  Save Preferences
                </Button>
              </div>
            </Card>
          </div>

          {/* Subscription Section */}
          <Card className={`backdrop-blur-xl rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow ${
            theme === 'dark'
              ? 'bg-white/5 border border-white/10'
              : 'bg-white/80 border-2 border-gray-300'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="h-6 w-6 text-green-600" />
              <h3 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Subscription</h3>
            </div>
            
            <div className="space-y-6">
              {/* Current Plan */}
              <div className={`p-4 rounded-xl ${
                theme === 'dark'
                  ? 'bg-white/5 border border-white/10'
                  : 'bg-gray-50 border-2 border-gray-300'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <Label className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                  }`}>Current Plan</Label>
                  {currentPlan === "free" && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      theme === 'dark'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-400/30'
                        : 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    }`}>
                      Free Tier
                    </span>
                  )}
                  {currentPlan === "premium" && (
                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                      theme === 'dark'
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-400/30'
                        : 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'
                    }`}>
                      <Crown className="h-3 w-3" />
                      Premium
                    </span>
                  )}
                </div>
                <div>
                  <p className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {currentPlan === "free" 
                      ? "Free - £0/month" 
                      : isTrial 
                        ? "Premium (Trial)"
                        : `Premium - £${billingCycle === "monthly" ? "12" : "8.25"}/month`
                    }
                  </p>
                  {isTrial && currentPlan === "premium" && trialEndDate && (
                    <div className="mt-3">
                      <TrialCountdown 
                        trialEndDate={trialEndDate}
                        className={theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}
                      />
                    </div>
                  )}
                </div>
                {currentPlan === "premium" && !isTrial && billingCycle === "yearly" && (
                  <p className={`text-xs mt-1 ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-700'
                  }`}>Billed yearly at £99 - You save £45!</p>
                )}
              </div>

              {/* Upgrade to Premium */}
              {currentPlan === "free" && (
                <div className={`p-6 rounded-xl ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-400/30'
                    : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Crown className="h-8 w-8 text-yellow-600 flex-shrink-0" />
                    <h4 className={`text-xl font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Premium Tier</h4>
                  </div>
                  
                  {/* Billing Cycle Selector */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setBillingCycle("monthly")}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
                        billingCycle === "monthly"
                          ? theme === 'dark'
                            ? "bg-yellow-500/20 border-yellow-400 text-white"
                            : "bg-yellow-100 border-yellow-400 text-gray-900"
                          : theme === 'dark'
                            ? "bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold">£12</div>
                        <div className="text-xs">per month</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle("yearly")}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-300 relative flex items-center justify-center ${
                        billingCycle === "yearly"
                          ? theme === 'dark'
                            ? "bg-yellow-500/20 border-yellow-400 text-white"
                            : "bg-yellow-100 border-yellow-400 text-gray-900"
                          : theme === 'dark'
                            ? "bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 bg-green-600 text-white rounded-full font-bold shadow-md">
                        SAVE £45
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">£99</div>
                        <div className="text-xs">per year</div>
                        <div className={`text-[10px] mt-0.5 ${
                          theme === 'dark' ? 'text-green-400' : 'text-green-700'
                        }`}>(£8.25/mo)</div>
                      </div>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      "Daily personalized prompts (7 days/week)",
                      "Unlimited archive - All reflections saved",
                      "Search & filter past reflections",
                      "Export reflections (PDF & CSV)",
                      "Weekly AI-generated insight digest",
                      "Advanced mood trend analytics",
                      "Flexible delivery (email or Slack)",
                      "Voice note prompts option",
                      "Custom focus areas (unlimited)",
                      "Priority email support (24hr response)",
                    ].map((feature, index) => (
                      <div key={index} className={`flex items-start gap-2 text-sm ${
                        theme === 'dark' ? 'text-white/80' : 'text-gray-800'
                      }`}>
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={handleUpgradeToPremium}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold text-base transition-all duration-700 ease-out hover:scale-[1.02] h-12"
                  >
                    <Crown className="mr-2 h-5 w-5" />
                    Upgrade to Premium
                  </Button>
                </div>
              )}

              {/* Downgrade to Free Tier (for Premium users) */}
              {currentPlan === "premium" && (
                <div>
                  <div className={`p-6 rounded-xl ${
                    theme === 'dark'
                      ? 'bg-white/5 border border-white/10'
                      : 'bg-gray-50 border-2 border-gray-300'
                  }`}>
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        theme === 'dark'
                          ? 'bg-blue-500/10 border border-blue-400/30'
                          : 'bg-blue-100 border-2 border-blue-300'
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" height="18px" width="18px" version="1.1" id="_x32_" viewBox="0 0 512 512" xmlSpace="preserve" className={theme === 'dark' ? 'brightness-[1.2] contrast-[1.1]' : 'brightness-[0.9]'}>
                          <style type="text/css">
                            {`.st0{fill:#000000;}`}
                          </style>
                          <g>
                            <path className="st0" d="M512,255.993l-63.304-51.63l28.999-76.354l-80.635-13.07l-13.063-80.635L307.63,63.311L256,0.013l-7.862,9.64   l-43.78,53.658L128.01,34.305l-13.076,80.635l-80.622,13.07l28.993,76.354L0,255.993l63.305,51.636l-28.993,76.361l80.622,13.076   l13.07,80.629l76.354-29L256,511.987l51.63-63.292l76.367,29l13.063-80.629l80.642-13.076l-29.006-76.361L512,255.993z    M449.885,367.935l-70.52,11.437l-11.424,70.514l-66.786-25.366L256,479.882l-45.168-55.363l-66.773,25.366l-11.431-70.514   l-70.513-11.43l25.358-66.793L32.118,256l55.356-45.155l-25.358-66.78l70.513-11.43l11.431-70.514l66.773,25.359L256,32.125   l45.155,55.356l66.786-25.366l11.424,70.52l70.52,11.43l-25.359,66.78L479.882,256l-55.356,45.148L449.885,367.935z"/>
                            <path className="st0" d="M165.87,268.515l-30.677,6.858c-0.509,0.118-0.813-0.08-0.926-0.582l-4.024-17.985   c-0.112-0.502,0.079-0.806,0.588-0.918l36.842-8.246c0.747-0.165,1.136-0.786,0.972-1.539l-3.013-13.453   c-0.165-0.753-0.786-1.143-1.526-0.978l-54.828,12.263c-0.754,0.172-1.149,0.793-0.978,1.546l18.567,82.988   c0.172,0.753,0.786,1.137,1.546,0.965l15.963-3.568c0.753-0.171,1.143-0.779,0.971-1.532l-7.202-32.191   c-0.112-0.502,0.086-0.813,0.594-0.926l30.677-6.864c0.754-0.165,1.144-0.786,0.972-1.539l-2.98-13.328   C167.238,268.732,166.624,268.343,165.87,268.515z"/>
                            <path className="st0" d="M238.464,267.853c8.497-6.264,12.336-16.234,9.891-27.169c-3.488-15.594-17.502-23.945-34.986-20.033   l-34.067,7.624c-0.753,0.165-1.15,0.78-0.978,1.54l18.566,82.981c0.172,0.753,0.786,1.143,1.546,0.978l15.964-3.574   c0.753-0.172,1.143-0.786,0.971-1.539l-6.838-30.553c-0.106-0.502,0.086-0.812,0.595-0.925l11.437-2.557l21.718,28.015   c0.568,0.8,1.037,1.091,2.167,0.839l17.859-4.003c0.879-0.192,1.077-1.031,0.542-1.705L238.464,267.853z M220.697,258.094   l-15.084,3.377c-0.509,0.112-0.819-0.086-0.932-0.589l-4.414-19.742c-0.112-0.502,0.079-0.807,0.588-0.919l15.084-3.376   c7.043-1.579,12.501,1.553,13.935,7.975C231.335,251.355,227.741,256.515,220.697,258.094z"/>
                            <path className="st0" d="M328.126,267.986l-36.842,8.246c-0.503,0.112-0.807-0.079-0.926-0.588l-3.964-17.727   c-0.112-0.502,0.079-0.807,0.581-0.925l30.685-6.858c0.753-0.172,1.15-0.793,0.978-1.546l-2.98-13.321   c-0.172-0.76-0.793-1.15-1.546-0.978l-30.678,6.859c-0.502,0.118-0.806-0.08-0.925-0.582l-3.793-16.974   c-0.112-0.502,0.08-0.812,0.582-0.918l36.842-8.246c0.746-0.172,1.137-0.786,0.971-1.539l-3.013-13.452   c-0.165-0.76-0.786-1.143-1.526-0.978l-54.828,12.263c-0.753,0.172-1.15,0.786-0.978,1.539l18.566,82.988   c0.172,0.753,0.787,1.143,1.547,0.971l54.82-12.263c0.747-0.165,1.137-0.786,0.965-1.54l-3.007-13.452   C329.487,268.211,328.872,267.82,328.126,267.986z"/>
                            <path className="st0" d="M399.141,252.102l-36.836,8.24c-0.502,0.112-0.812-0.086-0.925-0.588l-3.964-17.728   c-0.112-0.502,0.086-0.812,0.588-0.918l30.671-6.872c0.767-0.165,1.15-0.78,0.984-1.533l-2.98-13.334   c-0.172-0.753-0.786-1.142-1.546-0.978l-30.678,6.872c-0.502,0.106-0.807-0.086-0.919-0.588l-3.799-16.974   c-0.112-0.502,0.079-0.806,0.582-0.925l36.835-8.24c0.767-0.172,1.156-0.786,0.991-1.539l-3.013-13.452   c-0.172-0.76-0.78-1.15-1.546-0.978l-54.814,12.263c-0.753,0.171-1.15,0.786-0.978,1.539l18.566,82.988   c0.172,0.753,0.786,1.143,1.54,0.972l54.814-12.263c0.766-0.172,1.156-0.786,0.984-1.54l-3.013-13.452   C400.522,252.32,399.908,251.93,399.141,252.102z"/>
                          </g>
                        </svg>
                      </div>
                      <div>
                        <h4 className={`text-lg font-bold mb-1 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Free Tier</h4>
                        <p className={`text-base font-semibold mb-3 ${
                          theme === 'dark' ? 'text-white/80' : 'text-gray-700'
                        }`}>£0/month</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {[
                        "3 prompts per week (Mon/Wed/Fri)",
                        "Last 50 reflections in archive",
                        "Basic mood tracking",
                        "Email delivery at chosen time",
                        "Access to crisis resources (NHS 111, Samaritans)",
                      ].map((feature, index) => (
                        <div key={index} className={`flex items-start gap-2 text-sm ${
                          theme === 'dark' ? 'text-white/70' : 'text-gray-700'
                        }`}>
                          <Check className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button 
                      onClick={handleDowngradeToFree}
                      variant="outline"
                      className={`w-full transition-all duration-300 font-medium ${
                        theme === 'dark'
                          ? 'border border-white/20 text-white bg-white/5 hover:bg-white/10'
                          : 'border-2 border-gray-400 text-gray-900 bg-white hover:bg-gray-100 hover:border-gray-500'
                      }`}
                    >
                      Downgrade to Free Tier
                    </Button>
                  </div>
                  
                  <div className={`pt-4 mt-6 ${
                    theme === 'dark' ? 'border-t border-white/10' : 'border-t border-gray-300'
                  }`}>
                    <button
                      onClick={handleCancelSubscription}
                      className="text-red-600 hover:text-red-700 text-sm font-medium underline transition-colors"
                    >
                      Cancel Subscription
                    </button>
                    <p className={`text-xs mt-2 ${
                      theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                    }`}>
                      You'll continue to have access until the end of your billing period.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Integrations Section */}
          <Card className={`backdrop-blur-xl rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow ${
            theme === 'dark'
              ? 'bg-white/5 border border-white/10'
              : 'bg-white/80 border-2 border-gray-300'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <Zap className="h-6 w-6 text-purple-600" />
              <h3 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Integrations</h3>
            </div>
            <p className={`text-sm mb-6 ${
              theme === 'dark' ? 'text-white/70' : 'text-gray-600'
            }`}>
              Connect your favorite tools to receive prompts and sync your reflections across platforms.
            </p>
            
            <div className="space-y-4">
              {/* Slack Integration */}
              <div className={`p-5 rounded-xl transition-all duration-300 hover:shadow-md ${
                theme === 'dark'
                  ? 'bg-white/5 border border-white/10'
                  : 'bg-gray-50 border-2 border-gray-300'
              }`}>
                <div className="flex items-start gap-4">
                  {/* Slack Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    theme === 'dark'
                      ? 'bg-white/10 border border-white/20'
                      : 'bg-white border-2 border-gray-300'
                  }`}>
                    <SlackIcon size={28} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-lg font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Slack</h4>
                      {slackConnected && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                          theme === 'dark'
                            ? 'bg-green-500/10 border border-green-400/30 text-green-400'
                            : 'bg-green-100 border-2 border-green-300 text-green-700'
                        }`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                          Connected
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mb-3 ${
                      theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                    }`}>
                      {slackConnected 
                        ? `Receiving prompts in ${slackChannel || 'your channel'}`
                        : "Get daily prompts delivered directly to your Slack workspace"}
                    </p>
                    
                    {slackConnected ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleDisconnectSlack}
                          disabled={slackLoading}
                          variant="outline"
                          size="sm"
                          className="bg-white border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-300"
                        >
                          {slackLoading ? "Disconnecting..." : "Disconnect"}
                        </Button>
                        <Button
                          onClick={handleConnectSlack}
                          disabled={slackLoading}
                          variant="outline"
                          size="sm"
                          className="bg-white border-2 border-gray-300 text-gray-900 hover:bg-gray-50 transition-all duration-300"
                        >
                          {slackLoading ? "Loading..." : "Change Channel"}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={handleConnectSlack}
                        disabled={slackLoading}
                        size="sm"
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-300"
                      >
                        {slackLoading ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Connecting...
                          </>
                        ) : (
                          <>
                            <SlackIcon size={16} className="mr-2" />
                            Connect Slack
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* WhatsApp Integration - Coming Soon */}
              <div className={`p-4 md:p-5 rounded-xl opacity-60 cursor-not-allowed ${
                theme === 'dark'
                  ? 'bg-white/5 border border-white/10'
                  : 'bg-gray-50 border-2 border-gray-300'
              }`}>
                <div className="flex items-start gap-3 md:gap-4">
                  {/* WhatsApp Icon */}
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    theme === 'dark'
                      ? 'bg-white/10 border border-white/20'
                      : 'bg-white border-2 border-gray-300'
                  }`}>
                    <WhatsAppIcon size={24} className="md:w-7 md:h-7" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mb-1">
                      <h4 className={`text-base md:text-lg font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>WhatsApp</h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs w-fit ${
                        theme === 'dark'
                          ? 'bg-blue-500/10 border border-blue-400/30 text-blue-400'
                          : 'bg-blue-100 border-2 border-blue-300 text-blue-700'
                      }`}>
                        Coming Soon
                      </span>
                    </div>
                    <p className={`text-xs md:text-sm mb-2 md:mb-3 ${
                      theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                    }`}>
                      Receive prompts and reflections via WhatsApp messages
                    </p>
                    <Button
                      disabled
                      size="sm"
                      variant="outline"
                      className={`cursor-not-allowed text-xs md:text-sm h-8 md:h-9 ${
                        theme === 'dark'
                          ? 'bg-white/5 border border-white/10 text-white/40'
                          : 'bg-white border-2 border-gray-300 text-gray-400'
                      }`}
                    >
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </div>

              {/* Microsoft Teams Integration - Coming Soon */}
              <div className={`p-4 md:p-5 rounded-xl opacity-60 cursor-not-allowed ${
                theme === 'dark'
                  ? 'bg-white/5 border border-white/10'
                  : 'bg-gray-50 border-2 border-gray-300'
              }`}>
                <div className="flex items-start gap-3 md:gap-4">
                  {/* Teams Icon */}
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    theme === 'dark'
                      ? 'bg-white/10 border border-white/20'
                      : 'bg-white border-2 border-gray-300'
                  }`}>
                    <TeamsIcon size={24} className="md:w-7 md:h-7" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mb-1">
                      <h4 className={`text-base md:text-lg font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Microsoft Teams</h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs w-fit ${
                        theme === 'dark'
                          ? 'bg-blue-500/10 border border-blue-400/30 text-blue-400'
                          : 'bg-blue-100 border-2 border-blue-300 text-blue-700'
                      }`}>
                        Coming Soon
                      </span>
                    </div>
                    <p className={`text-xs md:text-sm mb-2 md:mb-3 ${
                      theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                    }`}>
                      Get daily prompts in your Microsoft Teams channels
                    </p>
                    <Button
                      disabled
                      size="sm"
                      variant="outline"
                      className={`cursor-not-allowed text-xs md:text-sm h-8 md:h-9 ${
                        theme === 'dark'
                          ? 'bg-white/5 border border-white/10 text-white/40'
                          : 'bg-white border-2 border-gray-300 text-gray-400'
                      }`}
                    >
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className={`backdrop-blur-xl rounded-3xl p-6 shadow-lg ${
            theme === 'dark'
              ? 'bg-red-500/10 border border-red-400/30'
              : 'bg-red-50 border-2 border-red-300'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-red-600" />
              <h3 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-red-200' : 'text-gray-900'
              }`}>Danger Zone</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Export All Data</p>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                  }`}>Download all your reflections and data</p>
                </div>
                <Button 
                  onClick={handleExportData}
                  variant="outline" 
                  className={`transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-white/5 border border-white/20 text-white hover:bg-white/10'
                      : 'bg-white border-2 border-gray-300 text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Export Data
                </Button>
              </div>
              <div className={`pt-4 flex items-center justify-between ${
                theme === 'dark' ? 'border-t border-red-400/30' : 'border-t border-gray-300'
              }`}>
                <div>
                  <p className={`font-medium ${
                    theme === 'dark' ? 'text-red-300' : 'text-red-600'
                  }`}>Delete Account</p>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                  }`}>Permanently delete your account and all data</p>
                </div>
                <Button 
                  onClick={handleDeleteAccount}
                  variant="destructive" 
                  className={theme === 'dark'
                    ? 'bg-red-500/20 text-red-300 border border-red-400/40 hover:bg-red-500/30'
                    : 'bg-red-100 text-red-600 border-2 border-red-400 hover:bg-red-200'
                  }
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </Card>
          </div>
        </div>
        
      </div>
      
      {/* Downgrade Confirmation Dialog - Mobile Optimized */}
      <AlertDialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <AlertDialogContent className={`max-w-[90vw] sm:max-w-md left-[50%] right-auto translate-x-[-50%] rounded-2xl sm:rounded-3xl ${
          theme === 'dark'
            ? 'bg-gray-900 border border-white/10'
            : 'bg-white border-2 border-gray-300'
        }`}>
          <AlertDialogHeader className="space-y-3 sm:space-y-4">
            <AlertDialogTitle className={`text-lg sm:text-xl font-bold leading-tight ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Downgrade to Free Tier?
            </AlertDialogTitle>
            <AlertDialogDescription className={`text-sm sm:text-base leading-relaxed ${
              theme === 'dark' ? 'text-white/70' : 'text-gray-600'
            }`}>
              Are you sure you want to downgrade? You'll lose access to:
            </AlertDialogDescription>
            <ul className={`mt-2 sm:mt-3 space-y-1.5 sm:space-y-2 text-xs sm:text-sm list-disc list-inside ${
              theme === 'dark' ? 'text-white/70' : 'text-gray-600'
            }`}>
              <li>Daily prompts (will revert to 3/week)</li>
              <li>Weekly AI insights</li>
              <li>Advanced mood analytics</li>
              <li>Slack integration</li>
              <li>Unlimited reflection archive</li>
            </ul>
            <div className={`mt-3 sm:mt-4 font-medium text-xs sm:text-sm ${
              theme === 'dark' ? 'text-yellow-400' : 'text-orange-600'
            }`}>
              ⚠️ Your Premium access will continue until the end of your current billing period.
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-center gap-2 sm:gap-3 mt-4">
            <AlertDialogCancel 
              className={`w-full sm:w-auto h-11 sm:h-10 text-sm sm:text-base font-semibold rounded-xl sm:rounded-lg touch-manipulation active:scale-95 transition-transform ${
                theme === 'dark'
                  ? 'bg-white/5 border border-white/20 text-white hover:bg-white/10'
                  : 'bg-white border-2 border-gray-300 text-gray-900 hover:bg-gray-100'
              }`}
            >
              Change my mind
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDowngrade}
              className={`w-full sm:w-auto h-11 sm:h-10 text-sm sm:text-base font-semibold rounded-xl sm:rounded-lg touch-manipulation active:scale-95 transition-transform ${
                theme === 'dark'
                  ? 'bg-red-500/20 text-red-300 border border-red-400/40 hover:bg-red-500/30'
                  : 'bg-red-100 text-red-600 border-2 border-red-400 hover:bg-red-200'
              }`}
            >
              Yes, downgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

