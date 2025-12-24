# Internationalization (i18n) Implementation Guide

**Status**: ✅ Translation System Created  
**Languages**: English, Spanish, French (expandable to 34 languages)

---

## 📁 Files Created

1. **`lib/i18n/translations.ts`** - Translation dictionaries for en, es, fr
2. **`hooks/useTranslation.ts`** - Hook to use translations in components

---

## 🚀 How to Use Translations

### Step 1: Import the Hook

```typescript
import { useTranslation } from '@/hooks/useTranslation'
```

### Step 2: Use the Hook in Your Component

```typescript
export default function MyPage() {
  const { t } = useTranslation()
  
  return (
    <div>
      <h1>{t('settings.title')}</h1>
      <p>{t('settings.subtitle')}</p>
    </div>
  )
}
```

### Step 3: Use Parameters (Optional)

For translations with placeholders like `{count}`:

```typescript
const count = 50
<p>{t('archive.viewingLast', { count })}</p>
// Output: "Viewing last 50 reflections" (English)
// Output: "Viendo las últimas 50 reflexiones" (Spanish)
```

---

## 📝 Example: Settings Page (Partial)

Here's how to update the Settings page header:

### Before (Hardcoded English):
```tsx
<Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-4 md:p-6">
  <div>
    <h2 className="text-2xl md:text-3xl font-bold text-white">Settings ⚙️</h2>
    <p className="text-white/60 text-sm md:text-base">Manage your account and preferences</p>
  </div>
</Card>
```

### After (Translated):
```tsx
import { useTranslation } from '@/hooks/useTranslation'

export default function SettingsPage() {
  const { t } = useTranslation()
  // ... rest of component
  
  return (
    <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-4 md:p-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white">{t('settings.title')} ⚙️</h2>
        <p className="text-white/60 text-sm md:text-base">{t('settings.subtitle')}</p>
      </div>
    </Card>
  )
}
```

---

## 🔄 Complete Settings Page Translation Pattern

Due to the length, I'll show the pattern for each section:

### Navigation Sidebar

```tsx
// BEFORE
<Button>
  <item.icon className="mr-3 h-5 w-5" />
  Dashboard
</Button>

// AFTER
const { t } = useTranslation()
<Button>
  <item.icon className="mr-3 h-5 w-5" />
  {t('nav.dashboard')}
</Button>
```

### Profile Section

```tsx
// BEFORE
<h3 className="text-xl font-semibold text-white">Profile Information</h3>
<Label htmlFor="name">Full Name</Label>
<Label htmlFor="timezone">Timezone</Label>
<p>Used to send notifications at your local time</p>
<Button>Save Changes</Button>

// AFTER
const { t } = useTranslation()
<h3 className="text-xl font-semibold text-white">{t('settings.profile')}</h3>
<Label htmlFor="name">{t('settings.fullName')}</Label>
<Label htmlFor="timezone">{t('settings.timezone')}</Label>
<p>{t('settings.timezoneNote')}</p>
<Button>{t('settings.saveChanges')}</Button>
```

### Notifications Section

```tsx
// BEFORE
<h3>Notifications</h3>
<Label>Push Notifications</Label>
<p>Receive notifications on your device</p>
<Label>Daily Reminders</Label>
<p>Get reminded to complete your daily prompt</p>
<Button>Save Notification Settings</Button>

// AFTER
const { t } = useTranslation()
<h3>{t('settings.notifications')}</h3>
<Label>{t('settings.pushNotifications')}</Label>
<p>{t('settings.pushNotificationsDesc')}</p>
<Label>{t('settings.dailyReminders')}</Label>
<p>{t('settings.dailyRemindersDesc')}</p>
<Button>{t('settings.saveNotifications')}</Button>
```

### Security Section

```tsx
// BEFORE
<h3>Security</h3>
<Label>Current Password</Label>
<Label>New Password</Label>
<Label>Confirm Password</Label>
<Button>Update Password</Button>
<p>Signed in with Google</p>

// AFTER
const { t } = useTranslation()
<h3>{t('settings.security')}</h3>
<Label>{t('settings.currentPassword')}</Label>
<Label>{hasPassword ? t('settings.newPassword') : t('settings.setPassword')}</Label>
<Label>{t('settings.confirmPassword')}</Label>
<Button>{hasPassword ? t('settings.updatePassword') : t('settings.setPassword')}</Button>
<p>{t('settings.signedInWithGoogle')}</p>
```

### Toast Notifications

```tsx
// BEFORE
toast({
  title: "Profile Updated",
  description: "Your profile information has been saved successfully.",
})

// AFTER
const { t } = useTranslation()
toast({
  title: t('toast.profileUpdated'),
  description: t('toast.profileUpdatedDesc'),
})
```

---

## 📦 Available Translation Keys

### Common
- `common.save`, `common.cancel`, `common.delete`, `common.edit`
- `common.back`, `common.next`, `common.close`, `common.search`
- `common.loading`, `common.error`, `common.success`

### Navigation
- `nav.dashboard`, `nav.archive`, `nav.settings`
- `nav.logout`, `nav.help`

### Dashboard (30+ keys)
- `dashboard.title`, `dashboard.welcome`, `dashboard.moodTracker`
- `dashboard.quickStats`, `dashboard.reflections`, `dashboard.prompts`
- `dashboard.weeklyDigest`, `dashboard.upgrade`
- And more...

### Archive (15+ keys)
- `archive.title`, `archive.subtitle`, `archive.search`
- `archive.filter`, `archive.sortBy`, `archive.export`
- And more...

### Settings (50+ keys)
- Profile: `settings.profile`, `settings.fullName`, `settings.email`, etc.
- Notifications: `settings.notifications`, `settings.pushNotifications`, etc.
- Security: `settings.security`, `settings.currentPassword`, etc.
- Preferences: `settings.preferences`, `settings.darkMode`, etc.
- Subscription: `settings.subscription`, `settings.currentPlan`, etc.

### Toasts (12+ keys)
- `toast.profileUpdated`, `toast.notificationsUpdated`
- `toast.passwordUpdated`, `toast.preferencesUpdated`
- And more...

---

## 🌍 Supported Languages

Currently implemented:
- ✅ **English** (en) - Complete
- ✅ **Spanish** (es) - Complete  
- ✅ **French** (fr) - Complete

Ready to add (from LanguageContext):
- German (de), Italian (it), Portuguese (pt), Russian (ru)
- Chinese Simplified (zh), Chinese Traditional (zh-TW)
- Japanese (ja), Korean (ko), Arabic (ar)
- Hindi (hi), Bengali (bn), Punjabi (pa), Telugu (te)
- Marathi (mr), Tamil (ta), Turkish (tr), Polish (pl)
- Ukrainian (uk), Dutch (nl), Swedish (sv), Danish (da)
- Norwegian (no), Finnish (fi), Czech (cs), Greek (el)
- Hebrew (he), Indonesian (id), Malay (ms), Thai (th), Vietnamese (vi)

---

## ➕ Adding More Languages

### Step 1: Add Translation Dictionary

In `lib/i18n/translations.ts`:

```typescript
export const de: Record<TranslationKey, string> = {
  'common.save': 'Speichern',
  'common.cancel': 'Abbrechen',
  'nav.dashboard': 'Dashboard',
  'nav.archive': 'Archiv',
  'nav.settings': 'Einstellungen',
  'settings.title': 'Einstellungen',
  'settings.subtitle': 'Verwalten Sie Ihr Konto und Ihre Einstellungen',
  // ... add all keys
}
```

### Step 2: Add to Translations Object

```typescript
export const translations = {
  en,
  es,
  fr,
  de,  // ✅ Add new language here
}
```

That's it! The language will automatically work in all components using `t()`.

---

## 🧪 Testing Translations

1. Go to Settings page
2. Change language to Spanish or French
3. The text should update immediately
4. Refresh the page - language should persist (saved in localStorage)
5. Navigate to other pages - they should also be in the selected language

---

## 🚀 Quick Implementation Plan

Since there are many pages to update, here's a priority order:

### Phase 1: High-Traffic Pages (Do First)
1. ✅ **Settings Page** - Users change language here
2. **Dashboard** - Main page users see
3. **Archive** - Frequently accessed

### Phase 2: Auth & Onboarding
4. **Sign In / Sign Up** pages
5. **Onboarding** flow

### Phase 3: Other Pages
6. **Homepage**
7. Other miscellaneous pages

---

## 💡 Pro Tips

1. **Always use translation keys**: Never hardcode text after setting up i18n
2. **Group related keys**: Use prefixes like `settings.`, `dashboard.`, `archive.`
3. **Keep keys semantic**: Use `settings.fullName` not `settings.input1`
4. **Test with long translations**: German/French text is often longer than English
5. **Use parameters for dynamic content**: `{count}`, `{name}`, etc.
6. **Fallback to English**: If translation missing, English shows automatically

---

## ✅ Next Steps

1. **I'll implement translations in Settings page** - As a complete example
2. **You can then apply same pattern** - To Dashboard and Archive
3. **Expand to other pages** - Following the same pattern

Would you like me to implement the full Settings page translation now, or would you prefer to do it yourself following this pattern?
