# Beige Theme - Remaining Pages Conversion Guide

## Overview
This document outlines the changes needed to convert the remaining dashboard pages (Archive, Settings, Support, and Crisis Resources) to match the beige light theme established in the main dashboard.

## Completed Changes

### Background & Base Theme
✅ All pages now use beige background (`#F5F5DC`)
✅ Sidebar cards updated to `bg-white/90` with `border-2 border-gray-400`
✅ Slogan text color changed to `text-gray-600`

## Remaining Text Color Updates Needed

### Pattern to Follow
Replace all instances of white text with dark text for readability on beige background:

| Old Class | New Class | Usage |
|-----------|-----------|-------|
| `text-white` | `text-gray-900` | Primary headings, titles |
| `text-white/80` | `text-gray-700` | Secondary text, labels |
| `text-white/70` | `text-gray-600` | Tertiary text, descriptions |
| `text-white/60` | `text-gray-500` | Muted text, placeholders |
| `text-white/40` | `text-gray-400` | Very subtle text, icons |

### Sidebar Navigation Updates

**Current (Dark Theme):**
```tsx
className="text-base text-white/80 hover:bg-white/10 hover:text-white"
```

**Should be (Beige Theme):**
```tsx
className="text-base text-gray-700 hover:bg-gray-100 hover:text-gray-900"
```

### Card Updates

**Current (Dark Theme):**
```tsx
className="backdrop-blur-xl bg-white/10 border border-white/20"
```

**Should be (Beige Theme):**
```tsx
className="backdrop-blur-xl bg-white/90 border-2 border-gray-400 shadow-xl"
```

### Button Updates

**Current (Dark Theme):**
```tsx
className="text-white/80 hover:bg-white/10"
```

**Should be (Beige Theme):**
```tsx
className="text-gray-700 hover:bg-gray-100"
```

## Specific Page Updates Needed

### Archive Page (`app/dashboard/archive/page.tsx`)

1. **Sidebar Navigation Buttons** (Lines ~230-245)
   - Change `text-white/80` → `text-gray-700`
   - Change `hover:bg-white/10` → `hover:bg-gray-100`
   - Change `hover:text-white` → `hover:text-gray-900`
   - Change `bg-white/20 text-white` (active) → `bg-gray-200 text-gray-900`

2. **Header Card** (Lines ~310-315)
   - Change `bg-white/10` → `bg-white/90`
   - Change `border-white/20` → `border-2 border-gray-400`
   - Change `text-white` → `text-gray-900`
   - Change `text-white/60` → `text-gray-600`

3. **Search Input** (Lines ~318-338)
   - Change `text-white` → `text-gray-900`
   - Change `placeholder:text-white/40` → `placeholder:text-gray-400`
   - Change `bg-white/5` → `bg-white`
   - Change `border-white/20` → `border-gray-300`

4. **Filter Dropdown** (Lines ~340-356)
   - Change `text-white/80` → `text-gray-700`
   - Change `hover:text-white` → `hover:text-gray-900`
   - Change `bg-white/10` → `bg-white/90`

5. **Reflection Cards** (Throughout content area)
   - Change all `text-white` → `text-gray-900`
   - Change `text-white/70` → `text-gray-700`
   - Change `bg-white/10` → `bg-white/90`

### Settings Page (`app/dashboard/settings/page.tsx`)

1. **Sidebar Navigation** (Lines ~786-802)
   - Same pattern as Archive page

2. **Mobile Settings Cards** (Lines ~878-950)
   - Change `text-white` → `text-gray-900`
   - Change `text-white/60` → `text-gray-600`
   - Change `bg-white/10` → `bg-white/90`
   - Change card borders to `border-gray-300`

3. **Form Inputs Throughout**
   - Change `text-white` → `text-gray-900`
   - Change `bg-white/5` → `bg-white`
   - Change `border-white/20` → `border-gray-300`

4. **Premium Upsell Card** (Lines ~808-827)
   - Keep gradient background but adjust text colors for readability
   - Change `text-white` → Use appropriate contrast

### Support Page (`app/dashboard/support/page.tsx`)

1. **Sidebar** (Lines ~260-315)
   - Same navigation pattern as other pages

2. **Header Card** (Lines ~333-345)
   - Change `bg-white/10` → `bg-white/90`
   - Change `text-white` → `text-gray-900`
   - Change `text-white/70` → `text-gray-700`

3. **Form Card** (Lines ~348+)
   - Change `bg-white/10` → `bg-white/90`
   - All form labels: `text-white` → `text-gray-900`
   - All descriptions: `text-white/70` → `text-gray-700`

4. **Category Cards** (Support categories section)
   - Change `bg-white/10` → `bg-white/90`
   - Change `text-white` → `text-gray-900`
   - Change `hover:bg-white/15` → `hover:bg-gray-50`

### Crisis Resources Page (`app/crisis-resources/page.tsx`)

1. **Background** (Lines ~11-18)
   ```tsx
   <div className="min-h-screen relative" style={{ backgroundColor: '#F5F5DC' }}>
     <BubbleBackground interactive className="fixed inset-0 -z-10" />
     <div className="fixed inset-0 -z-10" style={{ backgroundColor: '#F5F5DC' }} />
   ```

2. **Header Card** (Lines ~33-56)
   - Change `bg-white/10` → `bg-white/90`
   - Change `border-white/20` → `border-2 border-gray-400`
   - Change `text-white` → `text-gray-900`
   - Change `text-white/80` → `text-gray-700`

3. **All Resource Cards** (Lines ~67+)
   - Change `bg-white/10` → `bg-white/90`
   - Change `border-white/20` → `border-2 border-gray-300`
   - Change `hover:bg-white/15` → `hover:bg-gray-50`
   - Change `text-white` → `text-gray-900`
   - Change `text-white/70` → `text-gray-700`
   - Change `text-white/60` → `text-gray-600`

4. **Back Button** (Lines ~24-30)
   - Change `text-white/80` → `text-gray-700`
   - Change `hover:text-white` → `hover:text-gray-900`
   - Change `hover:bg-white/10` → `hover:bg-gray-100`

## Logo Inversion

**All sidebar logos need to be UN-inverted for light theme:**

Current (Dark theme):
```tsx
<img src="/prompt&pause.svg" className="h-10 invert" alt="Prompt & Pause" />
```

Should be (Beige theme):
```tsx
<img src="/prompt&pause.svg" className="h-10" alt="Prompt & Pause" />
```

Remove the `invert` class from all logo images.

## Premium Badges

Keep the golden premium badges consistent with main dashboard:
```tsx
className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 border-2 border-yellow-600 rounded-lg font-black shadow-lg shadow-yellow-500/40 ring-2 ring-yellow-300/50"
```

## Mobile Bottom Navigation

If any pages have mobile bottom nav bars, update them:
- Change `bg-white/10` → `bg-white/95`
- Change `border-white/20` → `border-gray-300`
- Change icon colors from white variants to gray variants

## Testing Checklist

After making all changes, verify:

- [ ] All text is readable on beige background
- [ ] No white text remains (except in specific colored buttons/badges)
- [ ] All cards have proper borders and shadows
- [ ] Hover states work properly with dark text
- [ ] Logo is not inverted (shows properly on light background)
- [ ] Mobile views are consistent
- [ ] Forms and inputs are clearly visible
- [ ] Links maintain proper contrast
- [ ] All buttons have appropriate styling
- [ ] Premium badges are consistent

## Color Reference

**Beige Theme Palette:**
- Background: `#F5F5DC` (beige)
- Card Background: `bg-white/90`
- Card Border: `border-2 border-gray-400`
- Primary Text: `text-gray-900`
- Secondary Text: `text-gray-700`
- Tertiary Text: `text-gray-600`
- Muted Text: `text-gray-500`
- Subtle Text: `text-gray-400`
- Hover Background: `hover:bg-gray-100` or `hover:bg-gray-50`

## Build & Deploy

After completing all changes:
1. Run `npm run build` to verify no errors
2. Test all pages in dev mode
3. Check responsive behavior
4. Deploy to production

---

*This ensures consistency across all dashboard pages with the new beige light theme.*
