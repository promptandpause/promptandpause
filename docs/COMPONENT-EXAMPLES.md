# Component Examples & Quick Reference
## Prompt & Pause UI Redesign

**Version:** 1.0  
**Date:** January 2026

---

## 🎨 Quick Color Reference

### Light Mode
```tsx
// Backgrounds
bg-[#F5F5DC]           // Main background
bg-[#FDFAF5]           // Secondary background
bg-[#EAE8E0]           // Tertiary background

// Glass Effects
className="glass-light"    // 75% opacity
className="glass-medium"   // 85% opacity
className="glass-heavy"    // 95% opacity

// Text
text-[#2C2C2C]         // Primary text
text-[#5A5A5A]         // Secondary text
text-[#8B8B8B]         // Tertiary text

// Accents
bg-[#A8B5A0]           // Sage green
bg-[#C8B5D4]           // Lavender
bg-[#F4C6B8]           // Peach
bg-[#B8D8D8]           // Mint
bg-[#E8C5C5]           // Rose
```

### Dark Mode
```tsx
// Backgrounds
bg-[#1A1D1F]           // Main background
bg-[#252829]           // Secondary background
bg-[#2F3335]           // Tertiary background

// Text
text-[#E8E8E8]         // Primary text
text-[#B8B8B8]         // Secondary text
text-[#888888]         // Tertiary text

// Accents
bg-[#7A8A72]           // Dark sage
bg-[#9A87A6]           // Dark lavender
bg-[#C69888]           // Dark peach
```

---

## 🧩 Component Examples

### 1. Glass Card (Basic)

```tsx
import { cn } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"

export function BasicGlassCard() {
  const { theme } = useTheme()
  
  return (
    <div className={cn(
      "rounded-2xl md:rounded-3xl p-6 md:p-8 transition-all duration-200",
      theme === 'dark'
        ? 'glass-light shadow-soft-lg border-white/10'
        : 'glass-medium shadow-soft-md border-gray-300/20'
    )}>
      <h3 className={cn(
        "text-lg font-semibold mb-4",
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      )}>
        Card Title
      </h3>
      <p className={cn(
        "text-sm leading-relaxed",
        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
      )}>
        Card content goes here...
      </p>
    </div>
  )
}
```

### 2. Hero Card with Background Image

```tsx
export function HeroCard() {
  const { theme } = useTheme()
  
  return (
    <div className="relative rounded-3xl overflow-hidden h-[400px]">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'url("/images/hero-bg.jpg")',
          filter: 'brightness(0.7)'
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8">
        <p className="text-xs uppercase tracking-wider text-white/80 mb-2">
          Today's Thoughts
        </p>
        <h2 className="text-3xl font-semibold text-white leading-tight mb-6">
          Take the first step towards mental well-being today?
        </h2>
        
        {/* Nested Glass Card */}
        <div className="glass-light rounded-2xl p-5 border border-white/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/90 text-sm font-medium">Your Condition</span>
            <span className="text-white text-2xl font-bold">15</span>
          </div>
          <p className="text-white/80 text-xs leading-relaxed">
            Today, your mental state shows signs of low energy and emotional strain...
          </p>
        </div>
      </div>
    </div>
  )
}
```

### 3. Action Card with Icon

```tsx
import { MessageSquare, Plus } from "lucide-react"

export function ActionCard({ 
  title, 
  icon: Icon, 
  action,
  variant = "default" 
}: {
  title: string
  icon: React.ComponentType<any>
  action?: React.ReactNode
  variant?: "default" | "highlight"
}) {
  const { theme } = useTheme()
  
  return (
    <button className={cn(
      "w-full rounded-2xl p-5 flex items-center justify-between",
      "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-md",
      "active:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary/50",
      theme === 'dark'
        ? 'glass-light border-white/10'
        : 'glass-medium border-gray-300/20',
      variant === "highlight" && "ring-2 ring-primary/40"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          theme === 'dark' ? 'bg-white/10' : 'bg-gray-900/10'
        )}>
          <Icon className={cn(
            "w-5 h-5",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )} />
        </div>
        <span className={cn(
          "font-medium",
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {title}
        </span>
      </div>
      {action || <Plus className="w-5 h-5 text-gray-500" />}
    </button>
  )
}

// Usage:
<ActionCard 
  title="How are you feeling today?" 
  icon={MessageSquare}
  action={<span className="text-xs text-gray-500">Speak</span>}
/>
```

### 4. Mood Selector

```tsx
import { motion } from "framer-motion"

const moods = [
  { emoji: "😔", label: "Sad", color: "#D8B8B8" },
  { emoji: "😐", label: "Neutral", color: "#E8D8B8" },
  { emoji: "😊", label: "Happy", color: "#B8D8B8" },
  { emoji: "😄", label: "Great", color: "#A8C8A8" },
  { emoji: "🤔", label: "Thoughtful", color: "#C8C8D8" },
  { emoji: "😌", label: "Calm", color: "#B8C8E8" },
  { emoji: "🙏", label: "Grateful", color: "#C8B8D8" },
  { emoji: "💪", label: "Strong", color: "#C8B8D8" },
]

export function MoodSelector({ 
  selected, 
  onSelect 
}: {
  selected: string
  onSelect: (emoji: string) => void
}) {
  const { theme } = useTheme()
  
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {moods.map((mood) => (
        <motion.button
          key={mood.emoji}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(mood.emoji)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center text-2xl",
            "transition-all duration-200 shadow-soft",
            "focus-visible:ring-2 focus-visible:ring-offset-2",
            selected === mood.emoji
              ? "ring-2 ring-offset-2 scale-110 shadow-soft-md"
              : "hover:shadow-soft-md",
            theme === 'dark'
              ? 'bg-white/10 ring-white/40 focus-visible:ring-white/50'
              : 'bg-white/80 ring-primary/60 focus-visible:ring-primary/50'
          )}
          style={{
            backgroundColor: selected === mood.emoji ? mood.color : undefined
          }}
          aria-label={mood.label}
        >
          {mood.emoji}
        </motion.button>
      ))}
    </div>
  )
}
```

### 5. Week Mood Tracker

```tsx
const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function WeekMoodTracker({ 
  weekData,
  activeDay,
  onDayClick
}: {
  weekData: Array<{ mood?: string; hasReflection: boolean }>
  activeDay: number
  onDayClick: (index: number) => void
}) {
  const { theme } = useTheme()
  
  return (
    <div className="flex justify-between gap-2">
      {daysOfWeek.map((day, i) => (
        <button
          key={day}
          onClick={() => onDayClick(i)}
          className="flex flex-col items-center gap-2 flex-1"
        >
          <span className={cn(
            "text-xs font-medium",
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            {day}
          </span>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-xl",
              "transition-all duration-200 shadow-soft",
              activeDay === i && "ring-2 ring-offset-2 scale-110 shadow-soft-md",
              theme === 'dark'
                ? 'bg-white/10 ring-white/40'
                : 'bg-white/80 ring-primary/60',
              !weekData[i]?.mood && "opacity-40"
            )}
          >
            {weekData[i]?.mood || "○"}
          </motion.div>
          {weekData[i]?.hasReflection && (
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              theme === 'dark' ? 'bg-white/60' : 'bg-gray-900/60'
            )} />
          )}
        </button>
      ))}
    </div>
  )
}
```

### 6. Progress Bar with Label

```tsx
export function ProgressBar({ 
  value, 
  max = 100, 
  label,
  color = "primary"
}: {
  value: number
  max?: number
  label?: string
  color?: "primary" | "secondary" | "accent"
}) {
  const { theme } = useTheme()
  const percentage = (value / max) * 100
  
  const colorMap = {
    primary: "bg-[#A8B5A0]",
    secondary: "bg-[#C8B5D4]",
    accent: "bg-[#F4C6B8]"
  }
  
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center">
          <span className={cn(
            "text-sm font-medium",
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            {label}
          </span>
          <span className={cn(
            "text-xs font-semibold",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {value}/{max}
          </span>
        </div>
      )}
      <div className={cn(
        "h-2 rounded-full overflow-hidden",
        theme === 'dark' ? 'bg-white/10' : 'bg-gray-900/10'
      )}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("h-full rounded-full", colorMap[color])}
        />
      </div>
    </div>
  )
}
```

### 7. Streak Badge

```tsx
import { Flame } from "lucide-react"

export function StreakBadge({ count }: { count: number }) {
  const { theme } = useTheme()
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.5 }}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
        "font-semibold text-xs shadow-soft",
        theme === 'dark'
          ? 'bg-orange-500/30 border border-orange-500/40 text-orange-300'
          : 'bg-orange-500/20 border border-orange-400/30 text-gray-900'
      )}
    >
      <Flame className="w-3.5 h-3.5" />
      <span>{count} day streak</span>
    </motion.div>
  )
}
```

### 8. Exercise/Meditation Card

```tsx
import { Play } from "lucide-react"

export function ExerciseCard({
  title,
  duration,
  description,
  color = "lavender",
  onPlay
}: {
  title: string
  duration: string
  description?: string
  color?: "lavender" | "mint" | "peach"
  onPlay?: () => void
}) {
  const colorMap = {
    lavender: "from-[#C8B5D4] to-[#D4C5E4]",
    mint: "from-[#B8D8D8] to-[#C8E8E8]",
    peach: "from-[#F4C6B8] to-[#FCD6C8]"
  }
  
  return (
    <div className={cn(
      "rounded-2xl p-5 text-white shadow-soft-md",
      "bg-gradient-to-br",
      colorMap[color]
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-base mb-1">{title}</h4>
          <p className="text-sm opacity-90">{duration}</p>
        </div>
        <button
          onClick={onPlay}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            "bg-white/30 backdrop-blur-sm hover:bg-white/40",
            "transition-all duration-200 hover:scale-110",
            "focus-visible:ring-2 focus-visible:ring-white/50"
          )}
          aria-label={`Play ${title}`}
        >
          <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
        </button>
      </div>
      {description && (
        <p className="text-xs opacity-80 leading-relaxed">{description}</p>
      )}
    </div>
  )
}
```

### 9. Bottom Navigation

```tsx
import { Home, BarChart3, Calendar, UserCircle } from "lucide-react"

const navItems = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: BarChart3, label: "Insights", href: "/dashboard/insights" },
  { icon: Calendar, label: "Appointments", href: "/dashboard/appointments" },
  { icon: UserCircle, label: "Doctor", href: "/dashboard/doctor" },
]

export function BottomNavigation({ activeRoute }: { activeRoute: string }) {
  const { theme } = useTheme()
  
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "safe-area-inset-bottom",
      "border-t shadow-soft-lg",
      theme === 'dark'
        ? 'glass-light border-white/10'
        : 'glass-heavy border-gray-300/20'
    )}>
      <div className="flex justify-around items-center px-4 py-3">
        {navItems.map((item) => {
          const isActive = activeRoute === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-4 rounded-xl",
                "transition-all duration-200 hover:bg-accent/10",
                "focus-visible:ring-2 focus-visible:ring-primary/50"
              )}
            >
              <item.icon className={cn(
                "w-6 h-6 transition-all duration-200",
                isActive
                  ? theme === 'dark'
                    ? 'text-white'
                    : 'text-gray-900'
                  : theme === 'dark'
                    ? 'text-gray-400'
                    : 'text-gray-600',
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-xs font-medium transition-all duration-200",
                isActive
                  ? theme === 'dark'
                    ? 'text-white'
                    : 'text-gray-900'
                  : theme === 'dark'
                    ? 'text-gray-400'
                    : 'text-gray-600'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

### 10. Input with Floating Label

```tsx
export function FloatingLabelInput({
  label,
  value,
  onChange,
  type = "text",
  ...props
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const { theme } = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value.length > 0
  
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "w-full h-14 px-4 pt-6 pb-2 rounded-2xl",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          theme === 'dark'
            ? 'bg-white/10 border border-white/20 text-white focus:bg-white/15'
            : 'bg-white/60 border border-black/10 text-gray-900 focus:bg-white/80'
        )}
        {...props}
      />
      <label className={cn(
        "absolute left-4 transition-all duration-200 pointer-events-none",
        isFocused || hasValue
          ? "top-2 text-xs"
          : "top-1/2 -translate-y-1/2 text-sm",
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      )}>
        {label}
      </label>
    </div>
  )
}
```

---

## 🎯 Common Patterns

### Pattern 1: Card with Header and Action

```tsx
<div className="glass-medium rounded-2xl p-6 shadow-soft-md">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
      Card Title
    </h3>
    <button className="text-sm text-primary hover:text-primary/80">
      View All
    </button>
  </div>
  <div className="space-y-3">
    {/* Card content */}
  </div>
</div>
```

### Pattern 2: Empty State

```tsx
<div className="glass-light rounded-2xl p-12 text-center">
  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-900/10 dark:bg-white/10 flex items-center justify-center">
    <Icon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
  </div>
  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
    No data yet
  </h3>
  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
    Start your journey by completing your first reflection
  </p>
  <Button>Get Started</Button>
</div>
```

### Pattern 3: Loading Skeleton

```tsx
<div className="glass-medium rounded-2xl p-6 shadow-soft-md">
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-900/10 dark:bg-white/10 rounded w-3/4" />
    <div className="h-4 bg-gray-900/10 dark:bg-white/10 rounded w-1/2" />
    <div className="h-20 bg-gray-900/10 dark:bg-white/10 rounded" />
  </div>
</div>
```

### Pattern 4: Success/Error Toast

```tsx
import { CheckCircle, XCircle } from "lucide-react"

<div className={cn(
  "glass-medium rounded-2xl p-4 shadow-soft-lg flex items-start gap-3",
  variant === "success" && "border-l-4 border-green-500",
  variant === "error" && "border-l-4 border-red-500"
)}>
  {variant === "success" ? (
    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
  ) : (
    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
  )}
  <div>
    <h4 className="font-semibold text-sm mb-1">{title}</h4>
    <p className="text-xs text-gray-600 dark:text-gray-400">{message}</p>
  </div>
</div>
```

---

## 📱 Responsive Utilities

### Mobile-First Spacing

```tsx
// Mobile: 16px, Desktop: 24px
className="px-4 md:px-6"

// Mobile: 20px, Desktop: 32px
className="py-5 md:py-8"

// Mobile: 12px gap, Desktop: 20px gap
className="gap-3 md:gap-5"
```

### Conditional Rendering

```tsx
// Show on mobile only
<div className="block md:hidden">Mobile content</div>

// Show on desktop only
<div className="hidden md:block">Desktop content</div>

// Different layouts
<div className="flex flex-col md:flex-row gap-4">
  {/* Stacks on mobile, side-by-side on desktop */}
</div>
```

### Touch-Friendly Sizing

```tsx
// Minimum 44x44px touch targets
className="min-h-[44px] min-w-[44px]"

// Larger padding on mobile
className="p-4 md:p-3"

// Bigger text on mobile
className="text-base md:text-sm"
```

---

## 🎨 Animation Presets

### Fade In Up

```tsx
import { motion } from "framer-motion"

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
>
  Content
</motion.div>
```

### Stagger Children

```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  }}
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Scale on Hover

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Click me
</motion.button>
```

---

## ✅ Copy-Paste Checklist

When creating a new component:

```tsx
// 1. Import theme context
import { useTheme } from "@/contexts/ThemeContext"

// 2. Import cn utility
import { cn } from "@/lib/utils"

// 3. Get theme
const { theme } = useTheme()

// 4. Use glass effect
className={cn(
  "rounded-2xl md:rounded-3xl p-6",
  theme === 'dark'
    ? 'glass-light shadow-soft-lg'
    : 'glass-medium shadow-soft-md'
)}

// 5. Conditional text colors
className={cn(
  "text-base",
  theme === 'dark' ? 'text-white' : 'text-gray-900'
)}

// 6. Add transitions
className="transition-all duration-200"

// 7. Add focus states
className="focus-visible:ring-2 focus-visible:ring-primary/50"

// 8. Make touch-friendly
className="min-h-[44px] min-w-[44px]"
```

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Ready for Use
