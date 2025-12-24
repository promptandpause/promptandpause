# ============================================================================
# TRANSLATION AUTOMATION SCRIPT
# ============================================================================
# Automatically adds translations to Settings, Dashboard, and Archive pages
# Run from project root: .\apply-translations.ps1
# ============================================================================

Write-Host "🌍 Starting Translation Implementation..." -ForegroundColor Cyan
Write-Host ""

# Backup files first
Write-Host "📦 Creating backups..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backups_$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Copy-Item "app/dashboard/settings/page.tsx" "$backupDir/settings.tsx.bak"
Copy-Item "app/dashboard/page.tsx" "$backupDir/dashboard.tsx.bak"
Copy-Item "app/dashboard/archive/page.tsx" "$backupDir/archive.tsx.bak"

Write-Host "✅ Backups created in $backupDir" -ForegroundColor Green
Write-Host ""

# ============================================================================
# SETTINGS PAGE
# ============================================================================
Write-Host "⚙️  Processing Settings Page..." -ForegroundColor Cyan

$settingsPath = "app/dashboard/settings/page.tsx"
$content = Get-Content $settingsPath -Raw

# Add import
$content = $content -replace 'import \{ useLanguage \} from "@/contexts/LanguageContext"', @'
import { useLanguage } from "@/contexts/LanguageContext"
import { useTranslation } from "@/hooks/useTranslation"
'@

# Add hook initialization
$content = $content -replace '  const \{ currentLanguage, setLanguage: setGlobalLanguage \} = useLanguage\(\)', @'
  const { currentLanguage, setLanguage: setGlobalLanguage } = useLanguage()
  const { t } = useTranslation()
'@

# Update sidebar navigation array
$content = $content -replace 'const sidebarNav = \[\s+\{ icon: LayoutDashboard, label: "Dashboard"', @'
const sidebarNav = [
  { icon: LayoutDashboard, label: "dashboard"
'@
$content = $content -replace '\{ icon: Archive, label: "Archive"', '{ icon: Archive, label: "archive"'
$content = $content -replace '\{ icon: Settings, label: "Settings"', '{ icon: Settings, label: "settings"'

# Navigation label rendering
$content = $content -replace '                      \{item\.label\}', '                      {t(`nav.${item.label}` as any)}'

# Replace hardcoded strings - Headers
$content = $content -replace '"Settings ⚙️"', "{t('settings.title')} ⚙️"
$content = $content -replace '"Manage your account and preferences"', "{t('settings.subtitle')}"

# Profile section
$content = $content -replace '"Profile Information"', "{t('settings.profile')}"
$content = $content -replace '"Full Name"', "{t('settings.fullName')}"
$content = $content -replace '(?<!")Email(?!")', "{t('settings.email')}"
$content = $content -replace '"Email cannot be changed from settings"', "{t('settings.emailNote')}"
$content = $content -replace '"Timezone"', "{t('settings.timezone')}"
$content = $content -replace '"Used to send notifications at your local time"', "{t('settings.timezoneNote')}"
$content = $content -replace '"Save Changes"', "{t('settings.saveChanges')}"

# Notifications section
$content = $content -replace '"Notifications"', "{t('settings.notifications')}"
$content = $content -replace '"Push Notifications"', "{t('settings.pushNotifications')}"
$content = $content -replace '"Receive notifications on your device"', "{t('settings.pushNotificationsDesc')}"
$content = $content -replace '"Daily Reminders"', "{t('settings.dailyReminders')}"
$content = $content -replace '"Get reminded to complete your daily prompt"', "{t('settings.dailyRemindersDesc')}"
$content = $content -replace '"Weekly Digest"', "{t('settings.weeklyDigest')}"
$content = $content -replace '"Receive weekly summary of your reflections"', "{t('settings.weeklyDigestDesc')}"
$content = $content -replace '"Daily Reminder Time"', "{t('settings.reminderTime')}"
$content = $content -replace '"Save Notification Settings"', "{t('settings.saveNotifications')}"

# Security section
$content = $content -replace '"Security"', "{t('settings.security')}"
$content = $content -replace '"Current Password"', "{t('settings.currentPassword')}"
$content = $content -replace '"New Password"', "{t('settings.newPassword')}"
$content = $content -replace '"Set Password"', "{t('settings.setPassword')}"
$content = $content -replace '"Confirm Password"', "{t('settings.confirmPassword')}"
$content = $content -replace '"Update Password"', "{t('settings.updatePassword')}"
$content = $content -replace '"Signed in with Google"', "{t('settings.signedInWithGoogle')}"
$content = $content -replace '"Set a password below for backup authentication"', "{t('settings.setPasswordBackup')}"
$content = $content -replace '"You can sign in with either Google or email/password"', "{t('settings.dualSignIn')}"
$content = $content -replace '"Setting a password allows you to sign in with email/password as a backup to Google sign-in\."', "{t('settings.passwordBackupNote')}"

# Preferences section
$content = $content -replace '"Preferences"', "{t('settings.preferences')}"
$content = $content -replace '"Dark Mode"', "{t('settings.darkMode')}"
$content = $content -replace '"Use dark theme throughout the app"', "{t('settings.darkModeDesc')}"
$content = $content -replace '"Privacy Mode"', "{t('settings.privacyMode')}"
$content = $content -replace '"Hide reflections from preview"', "{t('settings.privacyModeDesc')}"
$content = $content -replace '"Language"', "{t('settings.language')}"
$content = $content -replace '"Language preference will be applied across the entire application"', "{t('settings.languageNote')}"
$content = $content -replace '"Prompt Frequency"', "{t('settings.promptFrequency')}"
$content = $content -replace '"How often you''d like to receive new reflection prompts"', "{t('settings.promptFrequencyNote')}"
$content = $content -replace '"Save Preferences"', "{t('settings.savePreferences')}"

# Subscription section
$content = $content -replace '"Subscription"', "{t('settings.subscription')}"
$content = $content -replace '"Current Plan"', "{t('settings.currentPlan')}"
$content = $content -replace '"Free Tier"', "{t('settings.freeTier')}"
$content = $content -replace '(?<!>)Premium(?!<)', "{t('settings.premiumTier')}"
$content = $content -replace '"Upgrade to Premium"', "{t('settings.upgradeToPremium')}"

# Danger Zone
$content = $content -replace '"Danger Zone"', "{t('settings.dangerZone')}"
$content = $content -replace '"Export All Data"', "{t('settings.exportData')}"
$content = $content -replace '"Download all your reflections and data"', "{t('settings.exportDataDesc')}"
$content = $content -replace '"Delete Account"', "{t('settings.deleteAccount')}"
$content = $content -replace '"Permanently delete your account and all data"', "{t('settings.deleteAccountDesc')}"

# Navigation
$content = $content -replace '"Contact Support"', "{t('nav.help')}"
$content = $content -replace '"Logout"', "{t('nav.logout')}"

# Toast messages
$content = $content -replace 'title: "Profile Updated",', "title: t('toast.profileUpdated'),"
$content = $content -replace 'description: "Your profile information has been saved successfully\.",', "description: t('toast.profileUpdatedDesc'),"
$content = $content -replace 'title: "Notification Settings Updated",', "title: t('toast.notificationsUpdated'),"
$content = $content -replace 'description: "Your notification preferences have been saved\.",', "description: t('toast.notificationsUpdatedDesc'),"
$content = $content -replace 'title: "Password Updated",', "title: t('toast.passwordUpdated'),"
$content = $content -replace 'description: "Your password has been changed successfully\.",', "description: t('toast.passwordUpdatedDesc'),"
$content = $content -replace 'title: "Password Set Successfully",', "title: t('toast.passwordSet'),"
$content = $content -replace 'description: "You can now sign in with your email and password or continue using Google\.",', "description: t('toast.passwordSetDesc'),"
$content = $content -replace 'title: "Preferences Updated",', "title: t('toast.preferencesUpdated'),"
$content = $content -replace 'description: `Your preferences have been saved\. \$\{scheduleInfo\}`,', 'description: `${t(''toast.preferencesUpdatedDesc'')} ${scheduleInfo}`,'
$content = $content -replace 'title: "Error",\s+description: error\.message', "title: t('toast.error'),`n        description: error.message || t('toast.errorGeneric')"

# Save Settings page
Set-Content $settingsPath -Value $content
Write-Host "✅ Settings page translated" -ForegroundColor Green

# ============================================================================
# DASHBOARD PAGE
# ============================================================================
Write-Host "📊 Processing Dashboard Page..." -ForegroundColor Cyan

$dashboardPath = "app/dashboard/page.tsx"
$content = Get-Content $dashboardPath -Raw

# Add import (after other imports, before export)
$content = $content -replace '(import.*?from.*?\n)+', '$0' + "import { useTranslation } from '@/hooks/useTranslation'`n"

# Add hook (after other hooks)
$content = $content -replace '  const \{ tier, features', '  const { t } = useTranslation()' + "`n  const { tier, features"

# Replace hardcoded strings
$content = $content -replace '"Dashboard"', "{t('dashboard.title')}"
$content = $content -replace '"Welcome back"', "{t('dashboard.welcome')}"
$content = $content -replace '"Mood Tracker"', "{t('dashboard.moodTracker')}"
$content = $content -replace '"Quick Stats"', "{t('dashboard.quickStats')}"
$content = $content -replace '"Reflections"', "{t('dashboard.reflections')}"
$content = $content -replace '"Total Reflections"', "{t('dashboard.totalReflections')}"
$content = $content -replace '"Current Streak"', "{t('dashboard.currentStreak')}"
$content = $content -replace 'days(?=</)', "{t('dashboard.days')}"
$content = $content -replace '"Weekly Digest"', "{t('dashboard.weeklyDigest')}"
$content = $content -replace '"Upgrade to Premium"', "{t('dashboard.upgrade')}"

# Save Dashboard page
Set-Content $dashboardPath -Value $content
Write-Host "✅ Dashboard page translated" -ForegroundColor Green

# ============================================================================
# ARCHIVE PAGE
# ============================================================================
Write-Host "📦 Processing Archive Page..." -ForegroundColor Cyan

$archivePath = "app/dashboard/archive/page.tsx"
$content = Get-Content $archivePath -Raw

# Add import
$content = $content -replace '(import.*?from.*?\n)+', '$0' + "import { useTranslation } from '@/hooks/useTranslation'`n"

# Add hook
$content = $content -replace '  const \{ tier, features', '  const { t } = useTranslation()' + "`n  const { tier, features"

# Replace hardcoded strings
$content = $content -replace '"Archive 📚"', "{t('archive.title')} 📚"
$content = $content -replace '"Browse and search your past reflections"', "{t('archive.subtitle')}"
$content = $content -replace '"Search reflections\.\.\."', "{t('archive.search')}"
$content = $content -replace '"Filter"', "{t('archive.filter')}"
$content = $content -replace '"Sort by"', "{t('archive.sortBy')}"
$content = $content -replace '"All Reflections"', "{t('archive.allReflections')}"
$content = $content -replace '"Newest First"', "{t('archive.newest')}"
$content = $content -replace '"Oldest First"', "{t('archive.oldest')}"
$content = $content -replace '"No reflections found"', "{t('archive.noReflections')}"
$content = $content -replace '"Export"', "{t('archive.export')}"
$content = $content -replace '"Viewing last \{count\} reflections"', "t('archive.viewingLast', { count: features.archiveLimit })"
$content = $content -replace '"Upgrade to Premium for unlimited archive"', "{t('archive.upgradeForUnlimited')}"

# Save Archive page
Set-Content $archivePath -Value $content
Write-Host "✅ Archive page translated" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Translation implementation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review the changes in each file"
Write-Host "  2. Run: npm run build"
Write-Host "  3. Test language switching in Settings"
Write-Host "  4. If issues occur, restore from: $backupDir"
Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Cyan
