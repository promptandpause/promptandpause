# UI/UX Redesign Implementation Guide
## Prompt & Pause - Step-by-Step Implementation

**Version:** 1.0  
**Date:** January 2026  
**Prerequisites:** UI-REDESIGN-SPEC.md

---

## 📋 Overview

This guide provides concrete implementation steps to apply the new design system to your existing Prompt & Pause app. All changes are **visual only** - no functionality changes.

---

## 🎨 Step 1: Update Global CSS Variables

### File: `app/globals.css`

Replace the existing color variables with the new design system:

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

:root {
  /* ===== NEW DESIGN SYSTEM COLORS ===== */
  
  /* Backgrounds - Warm Beige Theme */
  --background: #F5F5DC;              /* Warm beige */
  --background-secondary: #FDFAF5;    /* Off-white */
  --background-tertiary: #EAE8E0;     /* Muted gray-beige */
  
  /* Glass Effects */
  --glass-light: rgba(255, 255, 255, 0.75);
  --glass-medium: rgba(255, 255, 255, 0.85);
  --glass-heavy: rgba(255, 255, 255, 0.95);
  --glass-border: rgba(255, 255, 255, 0.4);
  
  /* Text Colors */
  --foreground: #2C2C2C;              /* Dark charcoal */
  --text-secondary: #5A5A5A;          /* Medium gray */
  --text-tertiary: #8B8B8B;           /* Light gray */
  --text-on-glass: rgba(44, 44, 44, 0.9);
  
  /* Cards */
  --card: rgba(255, 255, 255, 0.75);
  --card-foreground: #2C2C2C;
  
  /* Popovers */
  --popover: rgba(255, 255, 255, 0.85);
  --popover-foreground: #2C2C2C;
  
  /* Primary Accent - Muted Sage */
  --primary: #A8B5A0;
  --primary-foreground: #FFFFFF;
  
  /* Secondary Accent - Soft Lavender */
  --secondary: #C8B5D4;
  --secondary-foreground: #FFFFFF;
  
  /* Muted/Disabled */
  --muted: rgba(0, 0, 0, 0.08);
  --muted-foreground: #8B8B8B;
  
  /* Accent - Soft Peach */
  --accent: #F4C6B8;
  --accent-foreground: #2C2C2C;
  
  /* Destructive */
  --destructive: #D8B8B8;
  --destructive-foreground: #FFFFFF;
  
  /* Borders */
  --border: rgba(0, 0, 0, 0.1);
  --input: rgba(0, 0, 0, 0.1);
  --ring: rgba(168, 181, 160, 0.5);
  
  /* Chart Colors - Soft Palette */
  --chart-1: #B8D8B8;  /* Soft green */
  --chart-2: #B8C8E8;  /* Soft blue */
  --chart-3: #E8D8B8;  /* Soft yellow */
  --chart-4: #D8B8B8;  /* Soft red */
  --chart-5: #C8B8D8;  /* Soft purple */
  
  /* Border Radius - Increased for softer look */
  --radius: 1.25rem;  /* 20px - increased from 16px */
  
  /* Sidebar */
  --sidebar: rgba(255, 255, 255, 0.75);
  --sidebar-foreground: #2C2C2C;
  --sidebar-primary: #A8B5A0;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #F4C6B8;
  --sidebar-accent-foreground: #2C2C2C;
  --sidebar-border: rgba(0, 0, 0, 0.08);
  --sidebar-ring: rgba(168, 181, 160, 0.5);
  
  /* Typography */
  --font-sans: 'Geist', 'Geist Fallback';
  --font-mono: 'Geist Mono', 'Geist Mono Fallback';
  --font-serif: 'Source Serif 4', 'Source Serif 4 Fallback';
  
  /* Shadows - Softer */
  --shadow-x: 0px;
  --shadow-y: 2px;
  --shadow-blur: 8px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.04;
  --shadow-color: #000000;
}

.dark {
  /* ===== DARK MODE COLORS ===== */
  
  /* Backgrounds - Dark Charcoal Theme */
  --background: #1A1D1F;              /* Dark charcoal */
  --background-secondary: #252829;    /* Lighter charcoal */
  --background-tertiary: #2F3335;     /* Medium dark gray */
  
  /* Glass Effects */
  --glass-light: rgba(40, 45, 48, 0.6);
  --glass-medium: rgba(40, 45, 48, 0.75);
  --glass-heavy: rgba(40, 45, 48, 0.9);
  --glass-border: rgba(255, 255, 255, 0.1);
  
  /* Text Colors */
  --foreground: #E8E8E8;              /* Off-white */
  --text-secondary: #B8B8B8;          /* Light gray */
  --text-tertiary: #888888;           /* Medium gray */
  --text-on-glass: rgba(232, 232, 232, 0.95);
  
  /* Cards */
  --card: rgba(40, 45, 48, 0.6);
  --card-foreground: #E8E8E8;
  
  /* Popovers */
  --popover: rgba(40, 45, 48, 0.75);
  --popover-foreground: #E8E8E8;
  
  /* Primary Accent - Dark Sage */
  --primary: #7A8A72;
  --primary-foreground: #FFFFFF;
  
  /* Secondary Accent - Dark Lavender */
  --secondary: #9A87A6;
  --secondary-foreground: #FFFFFF;
  
  /* Muted/Disabled */
  --muted: rgba(255, 255, 255, 0.1);
  --muted-foreground: #888888;
  
  /* Accent - Dark Peach */
  --accent: #C69888;
  --accent-foreground: #FFFFFF;
  
  /* Destructive */
  --destructive: #AA8A8A;
  --destructive-foreground: #FFFFFF;
  
  /* Borders */
  --border: rgba(255, 255, 255, 0.15);
  --input: rgba(255, 255, 255, 0.15);
  --ring: rgba(122, 138, 114, 0.5);
  
  /* Chart Colors - Dark Variants */
  --chart-1: #8AAA8A;  /* Dark green */
  --chart-2: #8A9ABA;  /* Dark blue */
  --chart-3: #BAA88A;  /* Dark yellow */
  --chart-4: #AA8A8A;  /* Dark red */
  --chart-5: #9A8AAA;  /* Dark purple */
  
  /* Sidebar */
  --sidebar: rgba(40, 45, 48, 0.6);
  --sidebar-foreground: #E8E8E8;
  --sidebar-primary: #7A8A72;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #C69888;
  --sidebar-accent-foreground: #FFFFFF;
  --sidebar-border: rgba(255, 255, 255, 0.1);
  --sidebar-ring: rgba(122, 138, 114, 0.5);
  
  /* Shadows - Stronger for dark mode */
  --shadow-opacity: 0.3;
}

/* Add new utility classes for glass effects */
@layer utilities {
  .glass-light {
    background: var(--glass-light);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--glass-border);
  }
  
  .glass-medium {
    background: var(--glass-medium);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
  }
  
  .glass-heavy {
    background: var(--glass-heavy);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid var(--glass-border);
  }
  
  /* Soft shadows */
  .shadow-soft {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
  
  .shadow-soft-md {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }
  
  .shadow-soft-lg {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }
  
  .dark .shadow-soft {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .dark .shadow-soft-md {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }
  
  .dark .shadow-soft-lg {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }
}
```

---

## 🧩 Step 2: Update Tailwind Config

### File: `tailwind.config.js`

Add extended utilities for the new design system:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 12px)',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      fontSize: {
        'display': ['32px', { lineHeight: '38px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'h1': ['28px', { lineHeight: '34px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'h2': ['22px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '24px', letterSpacing: '-0.005em', fontWeight: '600' }],
        'body-lg': ['17px', { lineHeight: '26px', fontWeight: '400' }],
        'body': ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '19px', fontWeight: '400' }],
        'label': ['14px', { lineHeight: '18px', letterSpacing: '0.01em', fontWeight: '500' }],
        'caption': ['12px', { lineHeight: '16px', letterSpacing: '0.005em', fontWeight: '400' }],
        'overline': ['11px', { lineHeight: '14px', letterSpacing: '0.08em', fontWeight: '600' }],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

---

## 📱 Step 3: Update Dashboard Page

### File: `app/dashboard/page.tsx`

Update the background and container styling:

```tsx
// Find this section (around line 26-40):
<div 
  className="min-h-screen relative" 
  style={theme === 'light' ? { backgroundColor: '#F5F5DC' } : { background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)' }}
>

// Replace with:
<div 
  className="min-h-screen relative" 
  style={theme === 'light' 
    ? { backgroundColor: '#F5F5DC' } 
    : { 
        background: 'linear-gradient(135deg, #1A1D1F 0%, #252829 50%, #1A1D1F 100%)'
      }
  }
>
```

```tsx
// Find the theme overlay (around line 39):
<div className={`fixed inset-0 -z-10 ${theme === 'light' ? 'bg-[#F5F5DC]/60' : 'bg-black/20'}`} />

// Replace with:
<div className={`fixed inset-0 -z-10 ${theme === 'light' ? 'bg-[#F5F5DC]/50' : 'bg-[#1A1D1F]/30'}`} />
```

---

## 🎴 Step 4: Update Card Components

### Create New Glass Card Component

Create file: `components/ui/glass-card.tsx`

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "medium" | "heavy"
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "medium", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl md:rounded-3xl shadow-soft-md transition-all duration-200",
          variant === "light" && "glass-light",
          variant === "medium" && "glass-medium",
          variant === "heavy" && "glass-heavy",
          className
        )}
        {...props}
      />
    )
  }
)
GlassCard.displayName = "GlassCard"

export { GlassCard }
```

### Update Today's Prompt Component

### File: `app/dashboard/components/todays-prompt.tsx`

Find the main container (around line 200-250) and update:

```tsx
// Find:
<section className={`backdrop-blur-xl border rounded-2xl...`}>

// Replace with:
<section className={cn(
  "rounded-2xl md:rounded-3xl px-4 md:px-8 pt-5 md:pt-6 pb-5 md:pb-6 transition-all duration-200",
  theme === 'dark' 
    ? 'glass-light shadow-soft-lg' 
    : 'glass-medium shadow-soft-md'
)}>
```

Update the prompt text styling:

```tsx
// Find the prompt display text and update to larger, more readable:
<h3 className={cn(
  "text-xl md:text-2xl font-semibold leading-relaxed mb-6",
  theme === 'dark' ? 'text-white' : 'text-gray-900'
)}>
  {todaysPrompt}
</h3>
```

Update the textarea styling:

```tsx
// Find the reflection textarea:
<textarea
  className={cn(
    "w-full min-h-[200px] p-5 rounded-xl md:rounded-2xl resize-none",
    "backdrop-blur-sm transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    theme === 'dark'
      ? 'bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-white/30 focus:bg-white/15'
      : 'bg-white/60 border border-black/10 text-gray-900 placeholder:text-gray-500 focus:ring-primary/50 focus:bg-white/80'
  )}
  // ... rest of props
/>
```

---

## 🎭 Step 5: Update Mood Tracker Component

### File: `app/dashboard/components/mood-tracker.tsx`

Update the card container:

```tsx
// Find the section element (around line 87):
<section className={`backdrop-blur-xl border rounded-2xl...`}>

// Replace with:
<section className={cn(
  "rounded-2xl md:rounded-3xl px-3 md:px-7 pt-4 md:pt-5 pb-4 md:pb-5 flex flex-col transition-all duration-200",
  theme === 'dark' 
    ? 'glass-light shadow-soft-lg border-white/10' 
    : 'glass-medium shadow-soft-md border-gray-300/20'
)}>
```

Update mood indicator circles:

```tsx
// Find the mood day circles and update for softer colors:
<button
  className={cn(
    "w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-200",
    "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
    activeDay === i && "ring-2 ring-offset-2 scale-110 shadow-soft-md",
    getMoodColor(day.mood),
    theme === 'dark' 
      ? 'focus:ring-white/30 ring-white/40' 
      : 'focus:ring-primary/50 ring-primary/60'
  )}
  // ... rest of props
>
  {day.mood || "○"}
</button>
```

---

## 🎨 Step 6: Update Button Styles

### File: `components/ui/button.tsx`

Update button variants to match new design:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: cn(
          "bg-[rgba(90,90,90,0.9)] text-white shadow-soft hover:bg-[rgba(70,70,70,0.95)]",
          "hover:-translate-y-0.5 hover:shadow-soft-md active:translate-y-0",
          "dark:bg-[rgba(232,232,232,0.15)] dark:hover:bg-[rgba(232,232,232,0.25)]"
        ),
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: cn(
          "border border-input bg-background/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground",
          "shadow-soft hover:shadow-soft-md"
        ),
        secondary: cn(
          "bg-[rgba(168,181,160,0.15)] text-foreground border border-[rgba(168,181,160,0.3)]",
          "hover:bg-[rgba(168,181,160,0.25)] hover:border-[rgba(168,181,160,0.5)]",
          "dark:bg-[rgba(122,138,114,0.3)] dark:hover:bg-[rgba(122,138,114,0.5)]"
        ),
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-2xl",
        sm: "h-9 rounded-xl px-3",
        lg: "h-11 rounded-2xl px-8",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

---

## 🏗️ Step 7: Update Sidebar Component

### File: `app/dashboard/components/DashboardSidebar.tsx`

Update the sidebar card styling:

```tsx
// Find the Card component (around line 120-150):
<Card className={cn(
  "rounded-2xl md:rounded-3xl transition-all duration-200",
  theme === 'dark'
    ? 'glass-light shadow-soft-lg border-white/10'
    : 'glass-medium shadow-soft-md border-gray-300/20'
)}>
```

Update navigation items:

```tsx
// Find the navigation Link components:
<Link
  href={item.href}
  className={cn(
    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
    "hover:bg-accent/20 hover:-translate-x-0.5",
    item.active 
      ? theme === 'dark'
        ? 'bg-white/10 text-white shadow-soft'
        : 'bg-primary/15 text-primary shadow-soft'
      : theme === 'dark'
        ? 'text-gray-300 hover:text-white'
        : 'text-gray-700 hover:text-gray-900'
  )}
>
  <item.icon className="w-5 h-5" />
  <span className="text-sm font-medium">{t(item.label)}</span>
</Link>
```

---

## 🎯 Step 8: Update Onboarding Screen

### File: `app/onboarding/page.tsx`

Update the background and glass card:

```tsx
// Find the main container (around line 191):
<div className="min-h-screen flex items-center justify-center relative bg-gradient-to-tr from-[#fdf6ee] via-[#f3f2ee] to-[#e8e6e1] overflow-hidden py-4 sm:py-8">

// Replace with:
<div className="min-h-screen flex items-center justify-center relative overflow-hidden py-4 sm:py-8"
  style={{
    background: 'linear-gradient(135deg, #FDFAF5 0%, #F5F5DC 50%, #EAE8E0 100%)'
  }}
>
```

Update the card container:

```tsx
// Find the card (around line 200):
<div className="w-full max-w-md z-10 mx-4 sm:mx-6 px-4 sm:px-6 py-6 sm:py-8 rounded-2xl sm:rounded-3xl shadow-xl bg-white/30 backdrop-blur-xl border border-white/40">

// Replace with:
<div className="w-full max-w-md z-10 mx-4 sm:mx-6 px-4 sm:px-6 py-6 sm:py-8 rounded-2xl sm:rounded-3xl glass-medium shadow-soft-lg">
```

Update button styling:

```tsx
// Find the option buttons:
<Button
  className={cn(
    "w-full min-h-[48px] h-auto py-3 rounded-xl text-base sm:text-lg font-semibold",
    "transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0",
    "shadow-soft hover:shadow-soft-md",
    answers[steps[step].key] === opt
      ? "bg-[rgba(90,90,90,0.9)] text-white ring-2 ring-primary/60"
      : "bg-white/80 text-gray-900 border border-gray-300/30 hover:bg-white/90"
  )}
  onClick={() => selectOption(opt)}
>
  {opt}
</Button>
```

---

## 📊 Step 9: Create Mood Bubble Chart Component

### Create New File: `components/ui/mood-bubble-chart.tsx`

```tsx
"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface MoodData {
  label: string
  value: number
  color: string
  size: "sm" | "md" | "lg"
}

interface MoodBubbleChartProps {
  data: MoodData[]
  className?: string
}

const sizeMap = {
  sm: "w-20 h-20 text-sm",
  md: "w-28 h-28 text-base",
  lg: "w-36 h-36 text-lg"
}

export function MoodBubbleChart({ data, className }: MoodBubbleChartProps) {
  return (
    <div className={cn("relative h-80 w-full flex items-center justify-center", className)}>
      {data.map((mood, index) => (
        <motion.div
          key={mood.label}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            delay: index * 0.1,
            type: "spring",
            stiffness: 200,
            damping: 15
          }}
          className={cn(
            "absolute rounded-full flex items-center justify-center",
            "text-white font-medium shadow-soft-lg backdrop-blur-sm",
            sizeMap[mood.size]
          )}
          style={{
            backgroundColor: mood.color,
            left: `${20 + (index * 15)}%`,
            top: `${30 + (index % 2 === 0 ? 10 : -10)}%`,
          }}
        >
          {mood.label}
        </motion.div>
      ))}
    </div>
  )
}
```

### Usage Example:

```tsx
// In your insights/analytics component:
import { MoodBubbleChart } from "@/components/ui/mood-bubble-chart"

const moodData = [
  { label: "Happy", value: 40, color: "#A8B5A0", size: "lg" },
  { label: "Angry", value: 25, color: "#9A9A7A", size: "lg" },
  { label: "Sad", value: 20, color: "#8A8A8A", size: "md" },
  { label: "Cry", value: 15, color: "#7A7A7A", size: "md" },
]

<MoodBubbleChart data={moodData} />
```

---

## 🎨 Step 10: Update Input Components

### File: `components/ui/input.tsx`

```tsx
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-2xl px-4 py-2 text-sm",
          "bg-white/60 backdrop-blur-sm border border-black/10",
          "ring-offset-background transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          "focus-visible:bg-white/80 focus-visible:border-primary/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-white/10 dark:border-white/20 dark:text-white",
          "dark:focus-visible:bg-white/15 dark:focus-visible:ring-white/30",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

---

## 🎭 Step 11: Add Smooth Transitions

### Update `app/globals.css`

Add to the utilities section:

```css
@layer utilities {
  /* Smooth transitions for theme changes */
  * {
    transition-property: background-color, border-color, color, fill, stroke;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
  }
  
  /* Preserve animation and transform transitions */
  *[class*="animate-"],
  *[class*="transition-transform"] {
    transition-property: transform, opacity;
  }
  
  /* Hover lift effect for cards */
  .hover-lift {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
  
  .dark .hover-lift:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
}
```

---

## 🌓 Step 12: Implement Dark Mode Toggle

### Create Theme Toggle Component

Create file: `components/ui/theme-toggle.tsx`

```tsx
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "rounded-full transition-all duration-200",
        "hover:bg-accent/20 hover:rotate-12",
        "focus-visible:ring-2 focus-visible:ring-primary/50"
      )}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 text-gray-700" />
      ) : (
        <Sun className="h-5 w-5 text-gray-300" />
      )}
    </Button>
  )
}
```

Add to your dashboard header or sidebar.

---

## ♿ Step 13: Accessibility Enhancements

### Update Focus Styles in `app/globals.css`

```css
@layer utilities {
  /* Enhanced focus indicators */
  *:focus-visible {
    outline: 2px solid hsl(var(--primary));
    outline-offset: 2px;
    border-radius: inherit;
  }
  
  /* Remove default outline */
  *:focus {
    outline: none;
  }
  
  /* Keyboard navigation indicator */
  .focus-ring {
    @apply focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2;
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

---

## 📱 Step 14: Mobile Optimizations

### Add Touch-Friendly Styles

```css
@layer utilities {
  /* Touch target optimization */
  @media (hover: none) and (pointer: coarse) {
    .touch-target {
      min-height: 44px;
      min-width: 44px;
    }
    
    button, a, [role="button"] {
      min-height: 44px;
      min-width: 44px;
    }
  }
  
  /* Prevent text selection on interactive elements */
  .no-select {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  
  /* iOS safe area support */
  .safe-area-inset-top {
    padding-top: env(safe-area-inset-top);
  }
  
  .safe-area-inset-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

---

## 🧪 Step 15: Testing Checklist

### Visual Testing

- [ ] Light mode displays correctly on all screens
- [ ] Dark mode displays correctly on all screens
- [ ] Glass effects render properly (check browser support)
- [ ] All colors match design specification
- [ ] Typography scales appropriately
- [ ] Spacing is consistent across components
- [ ] Border radius is uniform (20-24px for cards)

### Responsive Testing

- [ ] Mobile (375px - 414px) - All components fit and are readable
- [ ] Tablet (768px - 1024px) - Layout adjusts appropriately
- [ ] Desktop (1280px+) - Optimal use of space
- [ ] Landscape orientation works on mobile
- [ ] Safe areas respected on iOS devices

### Interaction Testing

- [ ] All buttons have hover states (desktop)
- [ ] All buttons have active/pressed states
- [ ] Focus indicators visible for keyboard navigation
- [ ] Touch targets minimum 44x44px on mobile
- [ ] Animations smooth (60fps)
- [ ] Theme toggle works instantly
- [ ] No layout shifts during loading

### Accessibility Testing

- [ ] Keyboard navigation works throughout app
- [ ] Screen reader announces all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus indicators clearly visible
- [ ] Reduced motion preference respected
- [ ] All images have alt text
- [ ] Form inputs have labels

### Performance Testing

- [ ] Backdrop blur doesn't cause lag
- [ ] Page load time < 3 seconds
- [ ] Smooth scrolling maintained
- [ ] No jank during animations
- [ ] Images optimized and lazy-loaded

---

## 🚀 Deployment Steps

### 1. Create Feature Branch

```bash
git checkout -b feature/ui-redesign
```

### 2. Commit Changes in Phases

```bash
# Phase 1: Core styles
git add app/globals.css tailwind.config.js
git commit -m "feat: implement new design system colors and variables"

# Phase 2: Components
git add components/ui/
git commit -m "feat: update UI components with glass effect styling"

# Phase 3: Dashboard
git add app/dashboard/
git commit -m "feat: redesign dashboard with new visual system"

# Phase 4: Other screens
git add app/onboarding/ app/(auth)/
git commit -m "feat: apply new design to onboarding and auth screens"
```

### 3. Test Thoroughly

```bash
npm run dev
# Test all screens in both light and dark mode
# Test on different devices and browsers
```

### 4. Create Pull Request

```bash
git push origin feature/ui-redesign
# Create PR on GitHub/GitLab
# Request design review
```

### 5. Deploy to Staging

```bash
# After PR approval
git checkout main
git merge feature/ui-redesign
git push origin main
# Vercel/Netlify will auto-deploy
```

---

## 🐛 Common Issues & Solutions

### Issue: Backdrop blur not working

**Solution:** Check browser support and add fallback:

```css
.glass-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px); /* Safari */
}

/* Fallback for unsupported browsers */
@supports not (backdrop-filter: blur(16px)) {
  .glass-card {
    background: rgba(255, 255, 255, 0.95);
  }
}
```

### Issue: Colors look different than expected

**Solution:** Ensure you're using CSS variables correctly:

```tsx
// Wrong:
style={{ background: '#F5F5DC' }}

// Correct:
className="bg-background"
// or
style={{ background: 'var(--background)' }}
```

### Issue: Dark mode flickers on load

**Solution:** Add theme script to `app/layout.tsx` before body:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function() {
        const theme = localStorage.getItem('theme') || 
          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', theme === 'dark');
      })();
    `,
  }}
/>
```

### Issue: Animations causing performance issues

**Solution:** Use CSS transforms instead of layout properties:

```css
/* Bad - causes reflow */
.animate {
  width: 100px;
  height: 100px;
}

/* Good - GPU accelerated */
.animate {
  transform: scale(1.1);
  will-change: transform;
}
```

---

## 📚 Additional Resources

### Design Files
- Figma Design System: [Link to Figma]
- Color Palette Reference: `docs/UI-REDESIGN-SPEC.md`
- Component Library: `components/ui/`

### Documentation
- Main Spec: `docs/UI-REDESIGN-SPEC.md`
- This Guide: `docs/IMPLEMENTATION-GUIDE.md`
- Component Docs: `components/README.md`

### Tools
- Color Contrast Checker: https://webaim.org/resources/contrastchecker/
- Accessibility Checker: https://wave.webaim.org/
- Performance Testing: Chrome DevTools Lighthouse

---

## ✅ Final Checklist

Before marking the redesign complete:

- [ ] All CSS variables updated in `globals.css`
- [ ] Tailwind config extended with new utilities
- [ ] All dashboard components updated
- [ ] Onboarding screens redesigned
- [ ] Glass card component created and used
- [ ] Mood bubble chart component created
- [ ] Button styles updated
- [ ] Input styles updated
- [ ] Dark mode fully implemented
- [ ] Theme toggle added
- [ ] Accessibility enhancements applied
- [ ] Mobile optimizations complete
- [ ] All tests passing
- [ ] Design review approved
- [ ] Deployed to staging
- [ ] User testing completed
- [ ] Deployed to production

---

**Implementation Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Ready for Development
