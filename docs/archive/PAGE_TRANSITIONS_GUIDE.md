# Page Transitions System

## Overview
Smooth page transitions have been implemented throughout the Prompt & Pause dashboard using Framer Motion and Next.js App Router features.

## Implementation

### 1. **PageTransition Component** (`components/PageTransition.tsx`)
A wrapper component that provides smooth fade and slide animations when navigating between pages.

**Features:**
- Fade in/out effect (opacity: 0 → 1 → 0)
- Subtle slide animation (y: 10 → 0 → -10)
- 300ms transition duration
- Custom cubic-bezier easing for smooth motion

**Animation Details:**
- **Initial state**: `opacity: 0, y: 10px` (faded out, slightly below)
- **Animate to**: `opacity: 1, y: 0` (fully visible, normal position)
- **Exit to**: `opacity: 0, y: -10px` (faded out, slightly above)
- **Easing**: `cubic-bezier(0.22, 1, 0.36, 1)` (smooth acceleration/deceleration)

### 2. **Dashboard Template** (`app/dashboard/template.tsx`)
Wraps all dashboard pages with the PageTransition component.

**Usage:**
```tsx
export default function DashboardTemplate({ children }) {
  return <PageTransition>{children}</PageTransition>
}
```

**Effect:**
- Applies smooth transitions to Dashboard, Archive, and Settings pages
- Automatically triggers on route changes
- Uses Next.js `template.tsx` to ensure animation on every navigation

### 3. **TransitionLink Component** (`components/TransitionLink.tsx`)
Optional enhanced Link component for smoother navigation.

**Features:**
- Adds 50ms delay before navigation
- Prevents jarring instant navigation
- Compatible with all Next.js Link props

**Usage:**
```tsx
import TransitionLink from "@/components/TransitionLink"

<TransitionLink href="/dashboard/settings">
  Go to Settings
</TransitionLink>
```

### 4. **Global CSS Enhancements** (`app/globals.css`)

#### Smooth Scrolling
```css
html {
  scroll-behavior: smooth;
}
```

#### Interactive Element Transitions
```css
a, button {
  transition: all 0.2s ease-in-out;
}
```

#### View Transitions API (Progressive Enhancement)
For browsers that support the View Transitions API, additional native transitions are enabled:
```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}
```

## How It Works

### Route Change Flow:
1. User clicks navigation link
2. `AnimatePresence` detects route change via `usePathname()`
3. Current page animates out (fade + slide up)
4. Next.js navigates to new route
5. New page animates in (fade + slide down)
6. Total transition: ~300ms

### Why This Approach?
- **template.tsx**: Ensures animations trigger on every navigation (unlike layout.tsx which persists)
- **Framer Motion**: Provides smooth, customizable animations
- **AnimatePresence**: Handles exit animations properly
- **Progressive Enhancement**: View Transitions API adds native support where available

## Customization

### Adjust Animation Speed
In `components/PageTransition.tsx`:
```tsx
transition={{
  duration: 0.5, // Change from 0.3 to 0.5 for slower
  ease: [0.22, 1, 0.36, 1]
}}
```

### Change Animation Direction
```tsx
// Horizontal slide
initial={{ opacity: 0, x: 20 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -20 }}

// No slide, just fade
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}

// Scale effect
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 1.05 }}
```

### Different Transitions Per Page
Create page-specific templates:
```tsx
// app/dashboard/settings/template.tsx
<PageTransition>
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
  >
    {children}
  </motion.div>
</PageTransition>
```

## Performance Considerations

### Optimized Animations
- Uses GPU-accelerated properties (opacity, transform)
- Avoids expensive properties (width, height, color)
- Short duration (300ms) for snappy feel

### Mobile Performance
- Framer Motion automatically optimizes for mobile
- Reduced motion respected via system preferences
- Hardware acceleration enabled by default

## Browser Support

| Feature | Support |
|---------|---------|
| Framer Motion | All modern browsers |
| CSS Transitions | All browsers |
| View Transitions API | Chrome 111+, Edge 111+ (progressive enhancement) |
| Smooth Scroll | All modern browsers |

## Testing

### Verify Transitions Work:
1. Navigate between Dashboard → Archive → Settings
2. Should see smooth fade and slide effect
3. No jarring instant changes
4. Duration should be ~300ms

### Check Performance:
- Open Chrome DevTools → Performance
- Record navigation between pages
- Check for smooth 60fps animation
- No frame drops during transition

## Troubleshooting

### Animations Not Working?
1. Check Framer Motion is installed: `npm list framer-motion`
2. Verify `template.tsx` is in correct location
3. Check browser console for errors
4. Ensure `use client` directive is present

### Too Slow/Fast?
Adjust `duration` in `PageTransition.tsx`

### Prefer No Animation?
Remove `template.tsx` or set `duration: 0`

## Future Enhancements

### Potential Additions:
- Page-specific transition styles
- Direction-aware animations (forward vs back)
- Loading states during navigation
- Skeleton screens for slow loads
- Gesture-based transitions (swipe navigation)

## Related Files
- `components/PageTransition.tsx` - Main transition component
- `app/dashboard/template.tsx` - Dashboard template wrapper
- `components/TransitionLink.tsx` - Enhanced link component
- `app/globals.css` - Global transition styles

## Credits
Built with:
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Next.js App Router](https://nextjs.org/) - Routing system
- [View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions/) - Native browser transitions
