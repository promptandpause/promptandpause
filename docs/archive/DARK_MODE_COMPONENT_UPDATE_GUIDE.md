# Dark Mode Component Update Guide

## ✅ Components Updated So Far

1. ✅ **Main Dashboard** (`app/dashboard/page.tsx`)
2. ✅ **DashboardSidebar** (`app/dashboard/components/DashboardSidebar.tsx`)
3. ✅ **Today's Prompt** (`app/dashboard/components/todays-prompt.tsx`)
4. ✅ **Archive Page** - Partially (`app/dashboard/archive/page.tsx`)

## 📋 Pattern for Each Component

### Step 1: Add Import
```tsx
import { useTheme } from '@/contexts/ThemeContext'
```

### Step 2: Get Theme
```tsx
const { theme } = useTheme()
```

### Step 3: Update Component Styling

#### Card/Section Wrapper
```tsx
// BEFORE:
className="backdrop-blur-xl bg-white/90 border-2 border-gray-400 p-6 shadow-xl"

// AFTER:
className={`backdrop-blur-xl border-2 p-6 ${
  theme === 'dark' 
    ? 'bg-white/5 border-white/10 shadow-2xl shadow-black/50' 
    : 'bg-white/90 border-gray-400 shadow-xl'
}`}
```

#### Headings
```tsx
// BEFORE:
className="text-xl font-bold text-gray-900"

// AFTER:
className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
```

#### Body Text
```tsx
// BEFORE:
className="text-gray-600"

// AFTER:
className={theme === 'dark' ? 'text-white/70' : 'text-gray-600'}
```

#### Secondary Text
```tsx
// BEFORE:
className="text-gray-500 text-sm"

// AFTER:
className={`text-sm ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}
```

#### Input Fields
```tsx
// BEFORE:
className="bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400"

// AFTER:
className={`border-2 ${
  theme === 'dark' 
    ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' 
    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
}`}
```

#### Buttons (Primary)
```tsx
// BEFORE:
className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300"

// AFTER:
className={theme === 'dark' 
  ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' 
  : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300'
}
```

#### Badges
```tsx
// BEFORE:
className="bg-gray-100 text-gray-700 border-gray-300"

// AFTER:
className={theme === 'dark' 
  ? 'bg-white/10 text-white/80 border-white/20' 
  : 'bg-gray-100 text-gray-700 border-gray-300'
}
```

#### Skeleton Loaders
```tsx
// BEFORE:
className="bg-gray-200"

// AFTER:
className={theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}
```

#### Dividers/Borders
```tsx
// BEFORE:
className="border-t border-gray-300"

// AFTER:
className={`border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-300'}`}
```

## 🎯 Remaining Components to Update

### Priority 1 - Dashboard Components

#### 1. Mood Tracker (`app/dashboard/components/mood-tracker.tsx`)
- Card wrapper
- Title and text
- Mood buttons/selectors
- Stats display

#### 2. Weekly Insights (`app/dashboard/components/weekly-insights.tsx`)
- Card wrapper
- Headings
- Insight cards
- Email button

#### 3. Mood Analytics (`app/dashboard/components/mood-analytics.tsx`)
- Card wrapper
- Chart backgrounds
- Labels and legends
- Trend indicators

#### 4. Quick Stats (`app/dashboard/components/quick-stats.tsx`)
- Card wrapper
- Stat numbers
- Labels
- Icons

#### 5. Activity Calendar (`app/dashboard/components/activity-calendar.tsx`)
- Card wrapper
- Calendar cells
- Day labels
- Tooltip/hover states

#### 6. Focus Areas Manager (`app/dashboard/components/focus-areas-manager.tsx`)
- Card wrapper
- Focus area items
- Add/edit buttons
- Icon colors

#### 7. Voice Prompt Player (`app/dashboard/components/voice-prompt-player.tsx`)
- Player controls
- Progress bar
- Text labels

### Priority 2 - Complete Archive Page

#### Archive Page Remaining (`app/dashboard/archive/page.tsx`)
Update:
- Search input styling
- Filter dropdown
- Export button
- Stats cards (loading skeletons, icons, text)
- Reflection cards
- Expanded reflection content
- Tags in reflections

### Priority 3 - Settings Page Content

#### Settings Page (`app/dashboard/settings/page.tsx`)
Update desktop cards:
- Profile card
- Notifications card
- Security card
- Preferences card (check if already has toggle)
- Subscription card
- Integrations card
- Danger zone

Update mobile views:
- Category cards
- Detail pages
- Form inputs
- Buttons

### Priority 4 - Support & Crisis Pages

#### Support Page (`app/dashboard/support/page.tsx`)
- Background
- Card wrapper
- Form inputs
- Category buttons
- Quick links
- Success messages

#### Crisis Resources (`app/crisis-resources/page.tsx`)
- Background (already partially done)
- Resource cards
- Contact buttons
- Alert boxes
- "Remember" section

## 🚀 Quick Test Checklist

After updating each component:

### Light Mode
- [ ] Card has white/light background
- [ ] Text is dark (gray-900, gray-700)
- [ ] Borders are visible (gray-300, gray-400)
- [ ] Shadows are subtle
- [ ] Buttons have proper contrast

### Dark Mode
- [ ] Card has frosted glass effect (bg-white/5)
- [ ] Text is white/white with opacity
- [ ] Borders are subtle (white/10, white/20)
- [ ] Shadows are dramatic
- [ ] Buttons glow properly

## 💡 Common Issues & Solutions

### Issue: Text not visible in dark mode
**Solution:** Check if text color is still `text-gray-XXX`, change to `text-white` or `text-white/80`

### Issue: Cards blend into background
**Solution:** Ensure proper border (`border-white/10` for dark) and shadow (`shadow-2xl shadow-black/50`)

### Issue: Input fields invisible
**Solution:** Add `bg-white/5` for dark mode, adjust placeholder to `text-white/40`

### Issue: Icons disappear
**Solution:** Change icon colors to `text-white/80` for dark, `text-gray-700` for light

### Issue: Hover states broken
**Solution:** Add dark mode hover classes: `hover:bg-white/10`, `hover:text-white`

## 📊 Progress Tracker

- Infrastructure: 100% ✅
- Main Dashboard: 100% ✅
- Sidebar: 100% ✅
- Today's Prompt: 100% ✅
- Archive: 40% ⚠️
- Mood Tracker: 0% ⏳
- Weekly Insights: 0% ⏳
- Mood Analytics: 0% ⏳
- Quick Stats: 0% ⏳
- Activity Calendar: 0% ⏳
- Focus Areas: 0% ⏳
- Voice Player: 0% ⏳
- Settings: 20% ⚠️
- Support: 0% ⏳
- Crisis Resources: 30% ⚠️

**Overall:** ~35% Complete

## 🎨 Color Reference

### Light Mode (Beige)
- Background: `#F5F5DC`
- Card: `bg-white/90`
- Border: `border-gray-400` or `border-gray-300`
- Primary Text: `text-gray-900`
- Secondary Text: `text-gray-700`
- Tertiary Text: `text-gray-600`
- Muted Text: `text-gray-500`
- Shadow: `shadow-xl` or `shadow-lg`

### Dark Mode (Frosted Glass)
- Background: `linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)`
- Card: `bg-white/5`
- Border: `border-white/10` or `border-white/20`
- Primary Text: `text-white`
- Secondary Text: `text-white/80`
- Tertiary Text: `text-white/70`
- Muted Text: `text-white/50` or `text-white/40`
- Shadow: `shadow-2xl shadow-black/50`

## ✨ Tips

1. **Use Ternary Operators** for inline conditional styling
2. **Template Literals** for complex className combinations
3. **Test Both Themes** after each component update
4. **Check Mobile View** - dark mode should work on mobile too
5. **Preserve Animations** - keep existing transitions and animations
6. **Watch z-index** - ensure layers stack correctly in dark mode

---

**Need Help?** Check these files:
- `contexts/ThemeContext.tsx` - Theme state management
- `lib/utils/themeStyles.ts` - Theme style utilities
- `app/dashboard/components/todays-prompt.tsx` - Example updated component
- `app/dashboard/components/DashboardSidebar.tsx` - Example sidebar
