# 🌍 Language Preferences - Implementation Complete

## ✅ Features Implemented

### 1. **Language Selector Dropdown**
- 33 Languages available including:
  - **Major European**: English, Spanish, French, German, Italian, Portuguese
  - **Eastern European**: Russian, Polish, Ukrainian, Czech, Greek
  - **Middle Eastern**: Arabic, Hebrew, Turkish
  - **South Asian**: Hindi, Bengali, Punjabi, Telugu, Marathi, Tamil
  - **East Asian**: Chinese (Simplified & Traditional), Japanese, Korean
  - **Southeast Asian**: Indonesian, Malay, Thai, Vietnamese
  - **Nordic**: Swedish, Danish, Norwegian, Finnish

### 2. **Native Names Displayed**
Each language shows both English name and native script:
- `English (English)`
- `Spanish (Español)`
- `Chinese (简体中文)`
- `Hindi (हिन्दी)`
- `Arabic (العربية)`

### 3. **Prompt Frequency Selector**
- **Daily** - Every day
- **Weekdays Only** - Monday through Friday
- **Every Other Day** - 3-4 times per week
- **Twice a Week** - Monday and Thursday
- **Weekly** - Once per week
- **Custom Schedule** - Set your own

---

## 🔧 How It Works

### Language Context System

**File**: `contexts/LanguageContext.tsx`

```typescript
// Language is stored in:
1. React Context (app-wide state)
2. localStorage (persists between sessions)
3. HTML lang attribute (for accessibility)
4. Will sync to database when backend connected
```

### Features:
- ✅ **Persistent**: Language saved in localStorage
- ✅ **Global**: Accessible from any component
- ✅ **Real-time**: Changes apply immediately
- ✅ **Accessible**: Updates HTML lang attribute
- ✅ **Backend Ready**: Prepared for API integration

---

## 📝 Using Language in Your Components

### Import the Hook:
```typescript
import { useLanguage } from '@/contexts/LanguageContext'
```

### Access Current Language:
```typescript
export default function MyComponent() {
  const { currentLanguage, setLanguage } = useLanguage()
  
  return (
    <div>
      <p>Current Language: {currentLanguage.name}</p>
      <p>Native Name: {currentLanguage.nativeName}</p>
      <p>Code: {currentLanguage.code}</p>
    </div>
  )
}
```

### Change Language:
```typescript
// From any component:
const { setLanguage } = useLanguage()

// Change to Spanish
setLanguage('es')

// Change to Japanese
setLanguage('ja')
```

---

## 🎯 How Settings Page Works

### User Flow:
1. User opens Settings page
2. Current language loaded from context
3. User selects new language from dropdown
4. User clicks "Save Preferences"
5. Language updates globally via context
6. Toast confirms save
7. Language saved to localStorage
8. (When backend connected) Language synced to user profile

### Code Flow:
```typescript
// 1. Load current language
const { currentLanguage, setLanguage: setGlobalLanguage } = useLanguage()
const [language, setLanguage] = useState(currentLanguage.code)

// 2. User selects new language
<Select value={language} onValueChange={setLanguage}>
  {languages.map(lang => (
    <SelectItem value={lang.value}>
      {lang.label} ({lang.nativeName})
    </SelectItem>
  ))}
</Select>

// 3. User saves preferences
const handleSavePreferences = () => {
  setGlobalLanguage(language) // Updates global context
  // TODO: Also save to backend API
}
```

---

## 🔌 Backend Integration (When DB Connected)

### Update API Call in Settings:
```typescript
const handleSavePreferences = async () => {
  // Update global language context
  setGlobalLanguage(language)
  
  try {
    // Save to backend
    const response = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'preferences',
        data: {
          language,
          darkMode,
          privacyMode,
          promptFrequency
        }
      })
    })
    
    if (response.ok) {
      toast({
        title: "Preferences Updated",
        description: "Your preferences have been saved.",
      })
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to save preferences.",
      variant: "destructive",
    })
  }
}
```

### Load User Language on Login:
```typescript
// After user logs in, fetch their saved language
const response = await fetch('/api/settings')
const data = await response.json()

// Set language from user profile
setGlobalLanguage(data.preferences.language)
```

---

## 🌐 Internationalization (i18n) - Future Step

When you're ready to translate the actual UI text:

### 1. Install i18n Library:
```bash
npm install next-intl
# or
npm install react-i18next
```

### 2. Create Translation Files:
```
locales/
  en/
    common.json
    dashboard.json
  es/
    common.json
    dashboard.json
  fr/
    common.json
    dashboard.json
```

### 3. Example Translation File (`locales/en/dashboard.json`):
```json
{
  "todaysPrompt": "Today's Prompt",
  "moodTracker": "Mood Tracker",
  "weeklyDigest": "Weekly Digest",
  "archive": "Archive",
  "settings": "Settings",
  "saveChanges": "Save Changes"
}
```

### 4. Use Translations:
```typescript
import { useTranslations } from 'next-intl'

export default function Dashboard() {
  const t = useTranslations('dashboard')
  
  return (
    <h1>{t('todaysPrompt')}</h1>
  )
}
```

---

## 📊 Database Schema for Language

### Update User Settings Schema:
```typescript
// Prisma Schema
model UserSettings {
  id               String  @id @default(cuid())
  userId           String  @unique
  user             User    @relation(fields: [userId], references: [id])
  
  // Preferences
  language         String  @default("en")  // Language code
  darkMode         Boolean @default(true)
  privacyMode      Boolean @default(false)
  promptFrequency  String  @default("daily")
  
  // Notifications
  notifications    Boolean @default(true)
  dailyReminders   Boolean @default(true)
  weeklyDigest     Boolean @default(false)
  reminderTime     String  @default("09:00")
}
```

### SQL Schema:
```sql
CREATE TABLE user_settings (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  dark_mode BOOLEAN DEFAULT true,
  privacy_mode BOOLEAN DEFAULT false,
  prompt_frequency VARCHAR(50) DEFAULT 'daily',
  notifications BOOLEAN DEFAULT true,
  daily_reminders BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  reminder_time VARCHAR(5) DEFAULT '09:00',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🧪 Testing Language Features

### Test in Browser:
1. Go to `http://localhost:3000/dashboard/settings`
2. Scroll to "Preferences" section
3. Click on Language dropdown
4. Select a language (e.g., "Spanish (Español)")
5. Click "Save Preferences"
6. Check browser console: "Language changed to: Spanish (Español)"
7. Check localStorage: `localStorage.getItem('userLanguage')` should show "es"
8. Refresh page - language should persist
9. Check HTML: `<html lang="es">` attribute should be set

### Test in DevTools:
```javascript
// Open browser console
localStorage.getItem('userLanguage')  // Shows current language code

// Clear saved language
localStorage.removeItem('userLanguage')

// Check HTML lang attribute
document.documentElement.lang  // Shows current language code
```

---

## 🎨 UI Features

### Language Dropdown:
- **Glassmorphic design** matching app theme
- **Searchable** - type to filter languages
- **Scrollable** - max height with smooth scroll
- **Hover effects** - visual feedback
- **Native names** - easy identification

### Help Text:
Under each setting:
- **Language**: "Language preference will be applied across the entire application"
- **Prompt Frequency**: "How often you'd like to receive new reflection prompts"

---

## 🚀 What's Working Now

✅ Language selector with 33 languages
✅ Prompt frequency selector with 6 options
✅ Native language names displayed
✅ Global language context
✅ localStorage persistence
✅ HTML lang attribute updates
✅ Toast notifications
✅ Help text for users
✅ Glassmorphic UI
✅ Ready for backend integration

---

## 📱 Future Enhancements

### Phase 1: Backend Integration
- Save language to user profile in database
- Load language on login/authentication
- Sync across devices

### Phase 2: Full Internationalization
- Translate all UI text
- Translate prompts
- Translate notification messages
- Translate emails

### Phase 3: Regional Preferences
- Date format based on language
- Time format (12h/24h)
- Currency format
- Number format

### Phase 4: Content Translation
- AI-powered prompt translation
- User reflection translation (optional)
- Multi-language support for sharing

---

## 🔑 Key Files

### Language System:
- `contexts/LanguageContext.tsx` - Global language state
- `app/layout.tsx` - LanguageProvider wrapper
- `app/dashboard/settings/page.tsx` - Settings UI

### Usage Example:
Any component can access language:
```typescript
import { useLanguage } from '@/contexts/LanguageContext'

function MyComponent() {
  const { currentLanguage } = useLanguage()
  // Use currentLanguage.code for API calls
  // Use currentLanguage.name for display
  // Use currentLanguage.nativeName for native display
}
```

---

## ✅ Summary

**Language preferences are fully functional!**

Users can:
1. Select from 33 languages
2. See native language names
3. Save preferences globally
4. Have settings persist between sessions
5. See changes reflected immediately

**Backend Integration Ready:**
- Just connect the `handleSavePreferences` to your API
- Store language code in user_settings table
- Load language on user login

**All working in local dev!** 🎉
