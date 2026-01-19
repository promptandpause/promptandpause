# UI/UX Redesign Specification
## Prompt & Pause - Mental Wellness App

**Version:** 1.0  
**Date:** January 2026  
**Scope:** Visual & experiential redesign only - NO functional changes

---

## 📋 Executive Summary

This document provides a complete UI/UX redesign specification to transform Prompt & Pause into a calming, wellness-focused mobile experience that matches the reference design aesthetic. All existing functionality, flows, and features remain unchanged.

### Design Philosophy
- **Soft & Calming:** Neutral tones, generous spacing, gentle interactions
- **Wellness-Focused:** Visual elements that promote mental peace and clarity
- **Modern Minimalism:** Clean layouts with purposeful design elements
- **Accessible:** Clear hierarchy, readable typography, inclusive design

---

## 🎨 Design System

### Color Palette

#### Light Mode (Primary)
```css
/* Background & Surfaces */
--bg-primary: #F5F5DC;           /* Warm beige - main background */
--bg-secondary: #FDFAF5;         /* Off-white - lighter variant */
--bg-tertiary: #EAE8E0;          /* Muted gray-beige */

/* Glass/Frosted Cards */
--glass-light: rgba(255, 255, 255, 0.75);
--glass-medium: rgba(255, 255, 255, 0.85);
--glass-heavy: rgba(255, 255, 255, 0.95);
--glass-border: rgba(255, 255, 255, 0.4);

/* Text Colors */
--text-primary: #2C2C2C;         /* Dark charcoal */
--text-secondary: #5A5A5A;       /* Medium gray */
--text-tertiary: #8B8B8B;        /* Light gray */
--text-on-glass: rgba(44, 44, 44, 0.9);

/* Accent Colors */
--accent-sage: #A8B5A0;          /* Muted sage green */
--accent-lavender: #C8B5D4;      /* Soft lavender */
--accent-peach: #F4C6B8;         /* Gentle peach */
--accent-mint: #B8D8D8;          /* Soft mint */
--accent-rose: #E8C5C5;          /* Dusty rose */

/* Mood Colors (Soft Variants) */
--mood-happy: #B8D8B8;           /* Soft green */
--mood-calm: #B8C8E8;            /* Soft blue */
--mood-neutral: #E8D8B8;         /* Soft yellow */
--mood-sad: #D8B8B8;             /* Soft red */
--mood-strong: #C8B8D8;          /* Soft purple */

/* Interactive Elements */
--button-primary: rgba(90, 90, 90, 0.9);
--button-hover: rgba(70, 70, 70, 0.95);
--button-secondary: rgba(168, 181, 160, 0.3);
--button-secondary-hover: rgba(168, 181, 160, 0.5);
```

#### Dark Mode
```css
/* Background & Surfaces */
--bg-primary: #1A1D1F;           /* Dark charcoal */
--bg-secondary: #252829;         /* Slightly lighter charcoal */
--bg-tertiary: #2F3335;          /* Medium dark gray */

/* Glass/Frosted Cards */
--glass-light: rgba(40, 45, 48, 0.6);
--glass-medium: rgba(40, 45, 48, 0.75);
--glass-heavy: rgba(40, 45, 48, 0.9);
--glass-border: rgba(255, 255, 255, 0.1);

/* Text Colors */
--text-primary: #E8E8E8;         /* Off-white */
--text-secondary: #B8B8B8;       /* Light gray */
--text-tertiary: #888888;        /* Medium gray */
--text-on-glass: rgba(232, 232, 232, 0.95);

/* Accent Colors (Darker Variants) */
--accent-sage: #7A8A72;          /* Dark sage */
--accent-lavender: #9A87A6;      /* Dark lavender */
--accent-peach: #C69888;         /* Dark peach */
--accent-mint: #8AACAC;          /* Dark mint */
--accent-rose: #BA9797;          /* Dark rose */

/* Mood Colors (Dark Variants) */
--mood-happy: #8AAA8A;           /* Dark green */
--mood-calm: #8A9ABA;            /* Dark blue */
--mood-neutral: #BAA88A;         /* Dark yellow */
--mood-sad: #AA8A8A;             /* Dark red */
--mood-strong: #9A8AAA;          /* Dark purple */

/* Interactive Elements */
--button-primary: rgba(232, 232, 232, 0.15);
--button-hover: rgba(232, 232, 232, 0.25);
--button-secondary: rgba(122, 138, 114, 0.3);
--button-secondary-hover: rgba(122, 138, 114, 0.5);
```

### Typography

#### Font Families
```css
--font-primary: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
--font-display: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'Geist Mono', 'SF Mono', monospace;
```

#### Type Scale
```css
/* Display - Hero sections */
--text-display: 32px / 38px;     /* size / line-height */
--text-display-weight: 600;
--text-display-tracking: -0.02em;

/* Headings */
--text-h1: 28px / 34px;
--text-h1-weight: 600;
--text-h1-tracking: -0.015em;

--text-h2: 22px / 28px;
--text-h2-weight: 600;
--text-h2-tracking: -0.01em;

--text-h3: 18px / 24px;
--text-h3-weight: 600;
--text-h3-tracking: -0.005em;

/* Body Text */
--text-body-lg: 17px / 26px;
--text-body-lg-weight: 400;

--text-body: 15px / 22px;
--text-body-weight: 400;

--text-body-sm: 13px / 19px;
--text-body-sm-weight: 400;

/* Labels & Captions */
--text-label: 14px / 18px;
--text-label-weight: 500;
--text-label-tracking: 0.01em;

--text-caption: 12px / 16px;
--text-caption-weight: 400;
--text-caption-tracking: 0.005em;

--text-overline: 11px / 14px;
--text-overline-weight: 600;
--text-overline-tracking: 0.08em;
--text-overline-transform: uppercase;
```

### Spacing System

```css
/* Base unit: 4px */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### Border Radius

```css
--radius-sm: 12px;    /* Small elements, tags */
--radius-md: 16px;    /* Buttons, inputs */
--radius-lg: 20px;    /* Cards, containers */
--radius-xl: 24px;    /* Large cards */
--radius-2xl: 32px;   /* Hero sections */
--radius-full: 9999px; /* Pills, avatars */
```

### Shadows & Blur

```css
/* Shadows */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.08);
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.12);

/* Dark Mode Shadows */
--shadow-sm-dark: 0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-md-dark: 0 4px 16px rgba(0, 0, 0, 0.4);
--shadow-lg-dark: 0 8px 32px rgba(0, 0, 0, 0.5);
--shadow-xl-dark: 0 16px 48px rgba(0, 0, 0, 0.6);

/* Backdrop Blur */
--blur-sm: blur(8px);
--blur-md: blur(16px);
--blur-lg: blur(24px);
--blur-xl: blur(32px);
```

---

## 🧩 Component Styles

### Glass Cards (Primary Pattern)

**Visual Characteristics:**
- Frosted glass effect with backdrop blur
- Subtle white/transparent overlay
- Soft border with low opacity
- Generous internal padding
- Rounded corners (lg to xl)

**Light Mode:**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
```

**Dark Mode:**
```css
.glass-card-dark {
  background: rgba(40, 45, 48, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}
```

### Buttons

#### Primary Button
```css
.btn-primary {
  background: rgba(90, 90, 90, 0.9);
  color: #FFFFFF;
  padding: 12px 24px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 500;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: rgba(70, 70, 70, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-primary:active {
  transform: translateY(0);
}
```

#### Secondary Button (Ghost/Outline)
```css
.btn-secondary {
  background: rgba(168, 181, 160, 0.15);
  color: var(--text-primary);
  padding: 12px 24px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 500;
  border: 1px solid rgba(168, 181, 160, 0.3);
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(168, 181, 160, 0.25);
  border-color: rgba(168, 181, 160, 0.5);
}
```

#### Pill Button (Small Actions)
```css
.btn-pill {
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-primary);
  padding: 8px 16px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
```

### Input Fields

```css
.input-field {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  padding: 14px 18px;
  font-size: 15px;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.input-field:focus {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(168, 181, 160, 0.5);
  outline: none;
  box-shadow: 0 0 0 3px rgba(168, 181, 160, 0.15);
}

.input-field::placeholder {
  color: var(--text-tertiary);
}
```

### Mood Bubbles (Emotion Visualization)

**From Reference Image 3:**
- Large circular bubbles with varying sizes
- Soft, muted colors
- White text labels
- Overlapping layout for organic feel

```css
.mood-bubble {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
}

/* Size variants */
.mood-bubble-lg { width: 140px; height: 140px; font-size: 18px; }
.mood-bubble-md { width: 100px; height: 100px; font-size: 16px; }
.mood-bubble-sm { width: 80px; height: 80px; font-size: 14px; }
```

### Progress Indicators

```css
.progress-bar {
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #A8B5A0, #B8D8D8);
  border-radius: 9999px;
  transition: width 0.3s ease;
}
```

### Navigation Bar (Bottom)

**From Reference Images:**
- Fixed bottom position
- Frosted glass background
- 4 main icons: Home, Insights, Appointments, Doctor
- Soft icons with labels
- Active state with subtle highlight

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(24px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding: 12px 16px 20px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.04);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-item.active {
  color: var(--text-primary);
}

.nav-item svg {
  width: 24px;
  height: 24px;
  opacity: 0.7;
}

.nav-item.active svg {
  opacity: 1;
}
```

---

## 📱 Screen-Specific Guidelines

### 1. Home Screen (Dashboard)

**Layout Structure:**
- Full-screen background with subtle gradient or image overlay
- Frosted glass overlay (60% opacity)
- Top header with greeting and settings icon
- Hero card: "Today's Thoughts" with large text
- Condition card with score and description
- Action buttons: "How are you feeling today?" + "Make an appointment"
- Bottom navigation

**Key Elements:**
```
┌─────────────────────────────┐
│ 👤 Good Morning, Jennifer!  ⚙️│ ← Header (glass)
├─────────────────────────────┤
│                             │
│  [Background Image/Gradient]│
│                             │
│  ┌─────────────────────────┐│
│  │ Today's Thoughts        ││ ← Hero Card (glass)
│  │                         ││
│  │ Take the first step     ││
│  │ towards mental          ││
│  │ well-being today?       ││
│  │                         ││
│  │ ┌─────────────────────┐││
│  │ │ Your Condition      │││ ← Nested Card
│  │ │ 15 Good             │││
│  │ │ [Description...]    │││
│  │ │ [Need Solutions?]   │││
│  │ └─────────────────────┘││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ How are you feeling     ││ ← Action Card
│  │ today?          [Speak] ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ Make an appointment  [+]││ ← Action Card
│  └─────────────────────────┘│
│                             │
├─────────────────────────────┤
│ 🏠  📊  📅  👨‍⚕️              │ ← Bottom Nav
└─────────────────────────────┘
```

**Styling Notes:**
- Background: Soft nature image or gradient (beige to warm gray)
- All cards: Glass effect with 75-85% white overlay
- Text: Large, readable, generous line-height
- Spacing: 16-24px between cards
- Border radius: 20-24px for cards

### 2. Onboarding Screen

**From Reference Image 1 (Left):**
- Full-screen background image (person in contemplative pose)
- Dark overlay for text readability
- Large white text: "Find Balance in your life with equilibrium."
- Subtitle with softer opacity
- Bottom CTA button: "Start Now"

**Styling:**
```css
.onboarding-screen {
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3),
    rgba(0, 0, 0, 0.5)
  ), url('background-image.jpg');
  background-size: cover;
  background-position: center;
}

.onboarding-title {
  font-size: 32px;
  line-height: 38px;
  font-weight: 600;
  color: #FFFFFF;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin-bottom: 16px;
}

.onboarding-subtitle {
  font-size: 15px;
  line-height: 22px;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 40px;
}

.onboarding-cta {
  background: rgba(255, 255, 255, 0.95);
  color: #2C2C2C;
  padding: 16px 48px;
  border-radius: 16px;
  font-size: 17px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
```

### 3. Assessment/Reports Screen

**From Reference Image 2 (Right):**
- Light background (soft gradient from beige to mint)
- Top header: "Assessment Reports" with back button
- Card sections with rounded corners
- Meditation/exercise cards with soft pastel backgrounds
  - Lavender cards for meditation
  - Mint/blue cards for focus exercises
  - Peach/pink cards for AI/doctor actions
- Play button icons on cards
- Bottom action buttons: "Ask AI Doc" + "Doctor Consult"

**Card Styling:**
```css
.exercise-card {
  background: linear-gradient(135deg, #C8B5D4, #D4C5E4);
  border-radius: 20px;
  padding: 20px;
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.exercise-card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.exercise-card-duration {
  font-size: 13px;
  opacity: 0.9;
}

.play-button {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}
```

### 4. Insights/Analytics Screen

**From Reference Image 3:**
- Light beige background
- Back button + title at top
- Large percentage display: "40%"
- Subtitle: "Your mental condition is Mid."
- Bubble chart with overlapping mood circles
  - Happy (large, sage green)
  - Sad (medium, gray)
  - Cry (medium, dark gray)
  - Angry (large, olive)
- Descriptive text below chart
- Bottom CTA: "Find Quick Solutions"

**Bubble Chart Layout:**
```css
.bubble-chart {
  position: relative;
  height: 300px;
  margin: 40px 0;
}

.bubble-chart .bubble {
  position: absolute;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* Positioning for organic overlap */
.bubble-happy { 
  width: 140px; height: 140px; 
  right: 20%; top: 30%;
  background: #A8B5A0;
}

.bubble-angry { 
  width: 130px; height: 130px; 
  left: 15%; top: 35%;
  background: #9A9A7A;
}

.bubble-sad { 
  width: 90px; height: 90px; 
  left: 35%; top: 20%;
  background: #8A8A8A;
}

.bubble-cry { 
  width: 100px; height: 100px; 
  left: 40%; bottom: 30%;
  background: #7A7A7A;
}
```

### 5. Mood Tracker Component

**Current Implementation Enhancement:**
- Glass card container
- Week view with 7 days (Mon-Sun)
- Circular mood indicators with soft colors
- Active day highlight
- Streak counter badge
- Reflection snippet preview

**Enhanced Styling:**
```css
.mood-tracker-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 24px;
  padding: 24px;
}

.mood-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.mood-indicator {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.2s ease;
}

.mood-indicator.active {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.streak-badge {
  background: rgba(244, 198, 184, 0.3);
  border: 1px solid rgba(244, 198, 184, 0.4);
  color: var(--text-primary);
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
}
```

### 6. Today's Prompt Component

**Enhanced Design:**
- Large glass card with generous padding
- Greeting text at top
- Prompt text in larger, readable font
- Timer display (if active)
- Mood selector with emoji buttons
- Text area with frosted background
- Word count indicator
- Submit button

```css
.prompt-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.prompt-text {
  font-size: 22px;
  line-height: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
  letter-spacing: -0.01em;
}

.reflection-textarea {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  padding: 20px;
  font-size: 15px;
  line-height: 24px;
  min-height: 200px;
  resize: vertical;
}

.mood-selector {
  display: flex;
  gap: 12px;
  margin: 20px 0;
}

.mood-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid transparent;
  font-size: 28px;
  transition: all 0.2s ease;
}

.mood-button.selected {
  border-color: var(--accent-sage);
  background: rgba(168, 181, 160, 0.2);
  transform: scale(1.1);
}
```

---

## 🎭 Animation & Interaction Guidelines

### Micro-interactions

```css
/* Smooth transitions for all interactive elements */
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Button press feedback */
.interactive:active {
  transform: scale(0.98);
}

/* Card hover (desktop) */
@media (hover: hover) {
  .card-interactive:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

/* Fade in animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out;
}

/* Stagger children animations */
.stagger-children > * {
  animation: fadeInUp 0.4s ease-out;
  animation-fill-mode: both;
}

.stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.1s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.15s; }
.stagger-children > *:nth-child(4) { animation-delay: 0.2s; }
.stagger-children > *:nth-child(5) { animation-delay: 0.25s; }
```

### Loading States

```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(255, 255, 255, 0.4) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: inherit;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Page Transitions

```css
/* Framer Motion variants for page transitions */
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
}
```

---

## 📐 Layout Guidelines

### Grid System

```css
/* Mobile-first responsive grid */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 768px) {
  .container {
    padding: 0 24px;
  }
}

/* Dashboard grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 2fr 5fr 3fr;
    gap: 24px;
  }
}
```

### Spacing Patterns

**Vertical Rhythm:**
- Section spacing: 32-48px
- Card spacing: 16-24px
- Element spacing within cards: 12-16px
- Text line spacing: 1.5-1.6x font size

**Horizontal Padding:**
- Mobile: 16px
- Tablet: 24px
- Desktop: 32px (max-width containers)

### Safe Areas (Mobile)

```css
/* iOS safe area support */
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Bottom navigation with safe area */
.bottom-nav {
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}
```

---

## 🌓 Dark Mode Implementation

### Automatic Theme Detection

```typescript
// Respect system preference by default
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Allow manual override
const theme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
```

### Theme Toggle Component

```tsx
<button 
  className="theme-toggle"
  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
>
  {theme === 'light' ? '🌙' : '☀️'}
</button>
```

### CSS Variables Switching

```css
:root {
  color-scheme: light;
  /* Light mode variables */
}

:root.dark {
  color-scheme: dark;
  /* Dark mode variables */
}

/* Smooth theme transition */
* {
  transition: background-color 0.3s ease, 
              border-color 0.3s ease, 
              color 0.3s ease;
}
```

---

## ♿ Accessibility Guidelines

### Color Contrast

- **Text on glass cards:** Minimum 4.5:1 contrast ratio
- **Interactive elements:** Minimum 3:1 contrast ratio
- **Focus indicators:** High contrast, visible outline

### Focus States

```css
*:focus-visible {
  outline: 2px solid var(--accent-sage);
  outline-offset: 2px;
  border-radius: inherit;
}

/* Remove default outline */
*:focus {
  outline: none;
}
```

### Touch Targets

```css
/* Minimum 44x44px touch targets */
.interactive {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### Screen Reader Support

```html
<!-- Semantic HTML -->
<nav aria-label="Main navigation">
<main aria-label="Dashboard content">
<section aria-labelledby="prompt-heading">

<!-- Hidden labels for icons -->
<button aria-label="Open settings">
  <SettingsIcon aria-hidden="true" />
</button>

<!-- Status announcements -->
<div role="status" aria-live="polite">
  Reflection saved successfully
</div>
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile first approach */

/* Small phones */
@media (min-width: 375px) { }

/* Large phones */
@media (min-width: 414px) { }

/* Tablets */
@media (min-width: 768px) { }

/* Small laptops */
@media (min-width: 1024px) { }

/* Desktops */
@media (min-width: 1280px) { }

/* Large screens */
@media (min-width: 1536px) { }
```

---

## 🎯 Implementation Priority

### Phase 1: Core Visual System (Week 1)
1. Update CSS variables in `globals.css`
2. Create new color palette (light + dark)
3. Update typography scale
4. Implement glass card component
5. Update button styles

### Phase 2: Key Components (Week 2)
1. Redesign Today's Prompt card
2. Redesign Mood Tracker
3. Update Dashboard layout
4. Implement bottom navigation
5. Create mood bubble chart component

### Phase 3: Screens & Flows (Week 3)
1. Redesign onboarding screens
2. Update assessment/reports screen
3. Redesign insights/analytics
4. Update settings screens
5. Polish all transitions

### Phase 4: Dark Mode & Polish (Week 4)
1. Implement dark mode variants
2. Test all components in both themes
3. Accessibility audit
4. Performance optimization
5. Final QA and adjustments

---

## 🔍 Quality Checklist

### Visual Consistency
- [ ] All cards use glass effect pattern
- [ ] Consistent border radius across components
- [ ] Spacing follows 4px grid system
- [ ] Typography scale applied consistently
- [ ] Color palette used correctly (no random colors)

### Interaction Design
- [ ] All buttons have hover/active states
- [ ] Touch targets minimum 44x44px
- [ ] Loading states for async actions
- [ ] Error states styled appropriately
- [ ] Success feedback visible

### Responsive Design
- [ ] Mobile layout tested (375px - 414px)
- [ ] Tablet layout tested (768px - 1024px)
- [ ] Desktop layout tested (1280px+)
- [ ] Safe areas respected on iOS
- [ ] Landscape orientation handled

### Dark Mode
- [ ] All components have dark variants
- [ ] Contrast ratios meet WCAG AA
- [ ] Images/illustrations work in both modes
- [ ] Theme toggle accessible
- [ ] Smooth theme transitions

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader tested
- [ ] Color contrast verified
- [ ] Reduced motion respected

### Performance
- [ ] Animations run at 60fps
- [ ] Images optimized
- [ ] Blur effects performant
- [ ] No layout shifts
- [ ] Fast initial render

---

## 📚 Reference Materials

### Design Inspiration
- Reference Image 1: Onboarding screen with hero image
- Reference Image 2: Home screen with glass cards and bottom nav
- Reference Image 3: Assessment screen with meditation cards
- Reference Image 4: Analytics screen with mood bubbles

### Design Principles
1. **Calm & Peaceful:** Every element should promote mental wellness
2. **Clear & Readable:** Information hierarchy is obvious
3. **Soft & Approachable:** No harsh edges or high contrast
4. **Consistent & Predictable:** Patterns repeat across the app
5. **Accessible & Inclusive:** Works for everyone

---

## 🚀 Next Steps

1. **Review this specification** with stakeholders
2. **Create component library** in Figma/design tool (optional)
3. **Begin implementation** following priority phases
4. **Test iteratively** with real users
5. **Gather feedback** and refine

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Maintained By:** Development Team  
**Status:** Ready for Implementation
