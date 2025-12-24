# Dark Mode Implementation Guide

## Overview
This application now supports both Light Mode (beige theme) and Dark Mode (original dark theme) with a toggle in Settings. The theme preference is saved to localStorage and synchronized with the database.

## Architecture

### 1. Theme Context (`contexts/ThemeContext.tsx`)
- Manages global theme state
- Syncs with localStorage for instant loading
- Syncs with Supabase `profiles.dark_mode` column
- Provides `theme`, `setTheme()`, and `toggleTheme()` functions

### 2. Theme Utilities (`lib/utils/themeStyles.ts`)
- Centralized theme-aware style definitions
- Provides consistent styling across light/dark modes
- Helper functions for conditional styling

### 3. Database Schema
```sql
-- Add to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT false;
```

## Using Dark Mode in Components

### Basic Usage

```tsx
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeStyles, getPageBackground } from '@/lib/utils/themeStyles'

export default function MyPage() {
  const { theme } = useTheme()
  const styles = getThemeStyles(theme)
  
  return (
    <div style={getPageBackground(theme)}>
      <Card className={`${styles.card} ${styles.shadow}`}>
        <h1 className={styles.text.primary}>Hello</h1>
        <p className={styles.text.secondary}>World</p>
      </Card>
    </div>
  )
}
```

### Theme-Specific Styles

#### Light Mode (Beige Theme)
- Page background: `#F5F5DC` (beige)
- Cards: `bg-white/90 border-gray-400`
- Text: `text-gray-900` (primary), `text-gray-700` (secondary)
- Borders: `border-gray-300`
- Shadows: `shadow-lg`

#### Dark Mode (Original Theme)
- Page background: Gradient `linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)`
- Cards: `bg-white/5 border-white/10`
- Text: `text-white` (primary), `text-white/80` (secondary)
- Borders: `border-white/10`
- Shadows: `shadow-2xl shadow-black/50`

## Migration Guide for Existing Pages

### Step 1: Import Theme Hook and Utilities
```tsx
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeStyles, getPageBackground } from '@/lib/utils/themeStyles'
```

### Step 2: Get Theme in Component
```tsx
const { theme } = useTheme()
const styles = getThemeStyles(theme)
```

### Step 3: Replace Static Background
**Before:**
```tsx
<div className="min-h-screen relative" style={{ backgroundColor: '#F5F5DC' }}>
```

**After:**
```tsx
<div 
  className="min-h-screen relative" 
  style={getPageBackground(theme)}
>
```

### Step 4: Replace Card Styles
**Before:**
```tsx
<Card className="bg-white/90 border-2 border-gray-400 rounded-3xl p-6 shadow-lg">
```

**After:**
```tsx
<Card className={`${styles.card} border-2 rounded-3xl p-6 ${styles.shadow}`}>
```

### Step 5: Replace Text Colors
**Before:**
```tsx
<h1 className="text-gray-900">Title</h1>
<p className="text-gray-600">Description</p>
```

**After:**
```tsx
<h1 className={styles.text.primary}>Title</h1>
<p className={styles.text.tertiary}>Description</p>
```

### Step 6: Replace Input Styles
**Before:**
```tsx
<Input className="bg-white border-2 border-gray-300 text-gray-900" />
```

**After:**
```tsx
<Input className={`${styles.input.background} ${styles.input.border} ${styles.input.text}`} />
```

### Step 7: Replace Button Styles
**Before:**
```tsx
<Button className="text-gray-900 hover:bg-gray-100">Click</Button>
```

**After:**
```tsx
<Button className={styles.button.ghost}>Click</Button>
```

## Pages to Update

### ✅ Dashboard Pages (Priority 1)
- [x] `/app/dashboard/page.tsx` - Main dashboard
- [ ] `/app/dashboard/archive/page.tsx` - Archive page
- [ ] `/app/dashboard/settings/page.tsx` - Settings page (already has toggle)
- [ ] `/app/dashboard/support/page.tsx` - Support page

### ✅ Resource Pages (Priority 2)
- [ ] `/app/crisis-resources/page.tsx` - Crisis resources

### ✅ Components (Priority 3)
- [ ] `/app/dashboard/components/DashboardSidebar.tsx` - Universal sidebar
- [ ] `/app/dashboard/components/todays-prompt.tsx`
- [ ] `/app/dashboard/components/mood-tracker.tsx`
- [ ] `/app/dashboard/components/weekly-insights.tsx`
- [ ] `/app/dashboard/components/mood-analytics.tsx`
- [ ] `/app/dashboard/components/quick-stats.tsx`
- [ ] `/app/dashboard/components/activity-calendar.tsx`
- [ ] `/app/dashboard/components/focus-areas-manager.tsx`
- [ ] `/app/dashboard/components/voice-prompt-player.tsx`

## Testing Checklist

### Light Mode (Default)
- [ ] Page backgrounds are beige (#F5F5DC)
- [ ] Cards have light gray borders and white backgrounds
- [ ] Text is dark (gray-900, gray-700, gray-600)
- [ ] Inputs have white backgrounds
- [ ] Buttons are visible with proper contrast
- [ ] Dropdowns and modals match theme
- [ ] Icons are visible (dark colors)

### Dark Mode
- [ ] Page backgrounds have dark gradient
- [ ] Cards have semi-transparent white backgrounds (white/5)
- [ ] Text is white or white with opacity
- [ ] Inputs have dark semi-transparent backgrounds
- [ ] Buttons use white with opacity
- [ ] Dropdowns and modals have dark backgrounds
- [ ] Icons are visible (white/light colors)

### Toggle Functionality
- [ ] Theme persists after page refresh
- [ ] Theme syncs across browser tabs
- [ ] Theme saves to database
- [ ] No flash of wrong theme on load
- [ ] Mobile and desktop both work
- [ ] Settings toggle reflects current theme

## Performance Considerations

1. **LocalStorage First**: Theme loads instantly from localStorage
2. **Database Sync**: Syncs asynchronously in background
3. **No Theme Flash**: Provider prevents flash by waiting for initial load
4. **Minimal Re-renders**: Only components using `useTheme()` re-render

## Common Patterns

### Conditional Rendering Based on Theme
```tsx
{theme === 'dark' ? (
  <div className="text-white">Dark content</div>
) : (
  <div className="text-gray-900">Light content</div>
)}
```

### Dynamic Inline Styles
```tsx
<div style={{
  background: theme === 'dark' 
    ? 'linear-gradient(...)' 
    : '#F5F5DC'
}}>
```

### Icon Colors
```tsx
<Icon className={theme === 'dark' ? 'text-white' : 'text-gray-900'} />
```

## Troubleshooting

### Theme Not Persisting
- Check if ThemeProvider wraps the app in `app/layout.tsx`
- Verify database column `dark_mode` exists in profiles table
- Check browser console for Supabase errors

### Flash of Wrong Theme
- Ensure ThemeContext has `mounted` state check
- Verify localStorage is being read on initial load

### Inconsistent Styling
- Use theme utilities from `lib/utils/themeStyles.ts`
- Avoid hardcoding colors directly in components
- Check if component is using `useTheme()` hook

## Future Enhancements

- [ ] System theme detection (prefer-color-scheme)
- [ ] Theme transition animations
- [ ] Per-component theme overrides
- [ ] High contrast mode
- [ ] Custom theme colors

## Support
For questions or issues, see:
- Theme Context: `contexts/ThemeContext.tsx`
- Theme Utilities: `lib/utils/themeStyles.ts`
- Settings Toggle: `/app/dashboard/settings/page.tsx` (Preferences section)
