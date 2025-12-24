# Translation Implementation - Complete Guide

**Status**: Ready to implement  
**Pages to translate**: Settings, Dashboard, Archive  
**Method**: Search and replace patterns

---

## ⚡ Quick Implementation Strategy

Since the pages are large (1000+ lines each), I'll provide you with **exact search/replace patterns** that you can apply yourself using your editor's Find & Replace feature.

---

## 📋 Step 1: Add Import to Each Page

### Settings Page (`app/dashboard/settings/page.tsx`)

**Find** (line 13):
```typescript
import { useLanguage } from "@/contexts/LanguageContext"
```

**Replace with**:
```typescript
import { useLanguage } from "@/contexts/LanguageContext"
import { useTranslation } from "@/hooks/useTranslation"
```

**Then find** (line 117):
```typescript
  const { currentLanguage, setLanguage: setGlobalLanguage } = useLanguage()
```

**Replace with**:
```typescript
  const { currentLanguage, setLanguage: setGlobalLanguage } = useLanguage()
  const { t } = useTranslation()
```

### Dashboard Page (`app/dashboard/page.tsx`)

**Add after other imports**:
```typescript
import { useTranslation } from "@/hooks/useTranslation"
```

**Add after other hooks**:
```typescript
const { t } = useTranslation()
```

### Archive Page (`app/dashboard/archive/page.tsx`)

**Add after other imports**:
```typescript
import { useTranslation } from "@/hooks/useTranslation"
```

**Add after other hooks**:
```typescript
const { t } = useTranslation()
```

---

## 🔄 Step 2: Search & Replace Patterns

### Settings Page - Navigation

**Find**:
```typescript
{item.label}
```

**Replace with**:
```typescript
{t(`nav.${item.label.toLowerCase()}` as any)}
```

**Then update sidebar navigation array** (lines 26-30):
```typescript
const sidebarNav = [
  { icon: LayoutDashboard, label: "dashboard", href: "/dashboard", active: false },
  { icon: Archive, label: "archive", href: "/dashboard/archive", active: false },
  { icon: Settings, label: "settings", href: "/dashboard/settings", active: true },
]
```

### Settings Page - Hardcoded Text Replacements

Use your editor's Find & Replace (case-sensitive) to make these changes:

| Find | Replace |
|------|---------|
| `"Settings ⚙️"` | `{t('settings.title')} ⚙️` |
| `"Manage your account and preferences"` | `{t('settings.subtitle')}` |
| `"Profile Information"` | `{t('settings.profile')}` |
| `"Full Name"` | `{t('settings.fullName')}` |
| `"Email"` | `{t('settings.email')}` |
| `"Email cannot be changed from settings"` | `{t('settings.emailNote')}` |
| `"Timezone"` | `{t('settings.timezone')}` |
| `"Used to send notifications at your local time"` | `{t('settings.timezoneNote')}` |
| `"Save Changes"` | `{t('settings.saveChanges')}` |
| `"Notifications"` | `{t('settings.notifications')}` |
| `"Push Notifications"` | `{t('settings.pushNotifications')}` |
| `"Receive notifications on your device"` | `{t('settings.pushNotificationsDesc')}` |
| `"Daily Reminders"` | `{t('settings.dailyReminders')}` |
| `"Get reminded to complete your daily prompt"` | `{t('settings.dailyRemindersDesc')}` |
| `"Weekly Digest"` | `{t('settings.weeklyDigest')}` |
| `"Receive weekly summary of your reflections"` | `{t('settings.weeklyDigestDesc')}` |
| `"Daily Reminder Time"` | `{t('settings.reminderTime')}` |
| `"Save Notification Settings"` | `{t('settings.saveNotifications')}` |
| `"Security"` | `{t('settings.security')}` |
| `"Current Password"` | `{t('settings.currentPassword')}` |
| `"New Password"` | `{t('settings.newPassword')}` |
| `"Set Password"` | `{t('settings.setPassword')}` |
| `"Confirm Password"` | `{t('settings.confirmPassword')}` |
| `"Update Password"` | `{t('settings.updatePassword')}` |
| `"Signed in with Google"` | `{t('settings.signedInWithGoogle')}` |
| `"Set a password below for backup authentication"` | `{t('settings.setPasswordBackup')}` |
| `"You can sign in with either Google or email/password"` | `{t('settings.dualSignIn')}` |
| `"Setting a password allows you to sign in with email/password as a backup to Google sign-in."` | `{t('settings.passwordBackupNote')}` |
| `"Preferences"` | `{t('settings.preferences')}` |
| `"Dark Mode"` | `{t('settings.darkMode')}` |
| `"Use dark theme throughout the app"` | `{t('settings.darkModeDesc')}` |
| `"Privacy Mode"` | `{t('settings.privacyMode')}` |
| `"Hide reflections from preview"` | `{t('settings.privacyModeDesc')}` |
| `"Language"` | `{t('settings.language')}` |
| `"Language preference will be applied across the entire application"` | `{t('settings.languageNote')}` |
| `"Prompt Frequency"` | `{t('settings.promptFrequency')}` |
| `"How often you'd like to receive new reflection prompts"` | `{t('settings.promptFrequencyNote')}` |
| `"Save Preferences"` | `{t('settings.savePreferences')}` |
| `"Subscription"` | `{t('settings.subscription')}` |
| `"Current Plan"` | `{t('settings.currentPlan')}` |
| `"Free Tier"` | `{t('settings.freeTier')}` |
| `"Premium"` | `{t('settings.premiumTier')}` |
| `"Upgrade to Premium"` | `{t('settings.upgradeToPremium')}` |
| `"Danger Zone"` | `{t('settings.dangerZone')}` |
| `"Export All Data"` | `{t('settings.exportData')}` |
| `"Download all your reflections and data"` | `{t('settings.exportDataDesc')}` |
| `"Delete Account"` | `{t('settings.deleteAccount')}` |
| `"Permanently delete your account and all data"` | `{t('settings.deleteAccountDesc')}` |
| `"Contact Support"` | `{t('nav.help')}` |
| `"Logout"` | `{t('nav.logout')}` |

### Settings Page - Toast Messages

**Find all toast calls** and replace:

```typescript
// Profile save toast
toast({
  title: t('toast.profileUpdated'),
  description: t('toast.profileUpdatedDesc'),
})

// Notifications save toast
toast({
  title: t('toast.notificationsUpdated'),
  description: t('toast.notificationsUpdatedDesc'),
})

// Password updated toast
toast({
  title: t('toast.passwordUpdated'),
  description: t('toast.passwordUpdatedDesc'),
})

// Password set toast (OAuth users)
toast({
  title: t('toast.passwordSet'),
  description: t('toast.passwordSetDesc'),
})

// Preferences updated toast
toast({
  title: t('toast.preferencesUpdated'),
  description: t('toast.preferencesUpdatedDesc'),
})

// Error toast
toast({
  title: t('toast.error'),
  description: error.message || t('toast.errorGeneric'),
  variant: "destructive",
})
```

---

## 🎯 Dashboard Page Translations

### Dashboard Hardcoded Text Replacements

| Find | Replace |
|------|---------|
| `"Dashboard"` (in title) | `{t('dashboard.title')}` |
| `"Welcome back"` | `{t('dashboard.welcome')}` |
| `"Mood Tracker"` | `{t('dashboard.moodTracker')}` |
| `"Quick Stats"` | `{t('dashboard.quickStats')}` |
| `"Reflections"` | `{t('dashboard.reflections')}` |
| `"Total Reflections"` | `{t('dashboard.totalReflections')}` |
| `"Current Streak"` | `{t('dashboard.currentStreak')}` |
| `"days"` | `{t('dashboard.days')}` |
| `"Weekly Digest"` | `{t('dashboard.weeklyDigest')}` |
| `"Upgrade to Premium"` | `{t('dashboard.upgrade')}` |

---

## 📦 Archive Page Translations

### Archive Hardcoded Text Replacements

| Find | Replace |
|------|---------|
| `"Archive"` (in title) | `{t('archive.title')}` |
| `"Browse and search your past reflections"` | `{t('archive.subtitle')}` |
| `"Search reflections..."` | `{t('archive.search')}` |
| `"Filter"` | `{t('archive.filter')}` |
| `"Sort by"` | `{t('archive.sortBy')}` |
| `"All Reflections"` | `{t('archive.allReflections')}` |
| `"Newest First"` | `{t('archive.newest')}` |
| `"Oldest First"` | `{t('archive.oldest')}` |
| `"No reflections found"` | `{t('archive.noReflections')}` |
| `"Export"` | `{t('archive.export')}` |
| `"Viewing last {count} reflections"` | `{t('archive.viewingLast', { count: 50 })}` |
| `"Upgrade to Premium for unlimited archive"` | `{t('archive.upgradeForUnlimited')}` |

---

## ✅ Testing Checklist

After implementing:

1. Build the app: `npm run build`
2. Check for TypeScript errors
3. Test in browser:
   - Go to Settings → Change language to Spanish
   - Verify all text changes to Spanish
   - Navigate to Dashboard → Verify translated
   - Navigate to Archive → Verify translated
   - Change back to English → Verify it works
4. Refresh page → Language should persist

---

## 🚀 Alternative: Automated Script

If manual find/replace is too tedious, I can create a Node.js script that does all the replacements automatically. Would you like me to create that instead?

Or, since these are large changes, I can implement them file by file for you, but it will take multiple responses due to character limits.

**Which approach do you prefer?**
1. **Manual** - Follow this guide and do find/replace yourself
2. **Automated Script** - I create a script to do it automatically
3. **File by File** - I implement each file completely (will take 3-4 responses)

Let me know and I'll proceed accordingly!
