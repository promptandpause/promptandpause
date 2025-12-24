# Crisis Resources Feature

## Overview
Added a comprehensive Crisis Resources page that provides 24/7 mental health support information for both UK and US users. This feature is available to **all users** (both free and premium) as mental health support should be universally accessible.

## What Was Added

### 1. Crisis Resources Page (`/crisis-resources`)
**Location**: `app/crisis-resources/page.tsx`

A standalone page featuring:
- **Emergency Information**: Immediate danger instructions (999 for UK, 911 for US)
- **UK Resources**:
  - Samaritans (116 123) - 24/7 emotional support
  - Shout (Text "SHOUT" to 85258) - 24/7 text support
  - Mind Infoline (0300 123 3393) - Mental health information
  - NHS 111 - Non-emergency medical help
  
- **US Resources**:
  - 988 Suicide & Crisis Lifeline - 24/7 crisis support
  - Crisis Text Line (Text "HELLO" to 741741)
  - NAMI HelpLine (1-800-950-6264)
  - Veterans Crisis Line (988 then Press 1)

- **Supportive Messaging**: Reminder messages about not being alone and the strength in seeking help

### 2. Dashboard Integration
**Location**: `app/dashboard/page.tsx`

- Added "Crisis Resources" button to desktop sidebar (above "Contact Support")
- Styled with red accent color (border and text) to stand out as important
- Uses LifeBuoy icon for visual recognition
- Automatically appears in mobile bottom navigation via shared `sidebarNav` array

### 3. Homepage Navigation
**Location**: `app/homepage/Navigation.tsx`

- Added "Crisis Resources" to desktop navigation menu
- Added to mobile hamburger menu
- Styled with red accent border to make it visually distinct and easy to find

### 4. Translations
**Location**: `lib/i18n/translations.ts`

Added translations for:
- English: "Crisis Resources"
- Spanish: "Recursos de Crisis"

## Design Decisions

### Universal Access
- **NO tier restrictions**: Available to all users (free and premium)
- Positioned prominently in navigation for easy discovery
- Clearly marked with distinct red styling for immediate recognition

### Visual Design
- Consistent with app's glass-morphism aesthetic
- Red accent color to indicate importance and urgency
- LifeBuoy icon for universal recognition
- Clear, empathetic messaging
- Easy-to-tap phone numbers and clickable links

### User Experience
- Direct "tel:" links for instant calling on mobile devices
- External resource links open in new tabs
- "Back to Dashboard" button for easy navigation
- Fully responsive design (mobile and desktop)

## Accessibility Features

1. **Multiple Contact Methods**: Phone, text, email, and web resources
2. **24/7 Availability**: Most resources are available round-the-clock
3. **Free Services**: All resources are free and confidential
4. **Language Options**: US resources include Spanish language support
5. **Device Optimized**: Phone links work on mobile, clickable on desktop

## Files Modified

```
✅ app/crisis-resources/page.tsx (NEW)
✅ app/dashboard/page.tsx (MODIFIED)
✅ app/homepage/Navigation.tsx (MODIFIED)
✅ lib/i18n/translations.ts (MODIFIED)
```

## Testing Checklist

- [ ] Visit `/crisis-resources` page and verify all content displays correctly
- [ ] Test "Back to Dashboard" button
- [ ] Click all phone number links (should trigger phone app on mobile)
- [ ] Click all website links (should open in new tabs)
- [ ] Verify "Crisis Resources" appears in dashboard sidebar (desktop)
- [ ] Verify "Crisis Resources" appears in mobile bottom navigation
- [ ] Verify "Crisis Resources" appears in homepage navigation (desktop and mobile)
- [ ] Test red styling and LifeBuoy icon display correctly
- [ ] Verify responsive design on mobile and tablet
- [ ] Check translation works correctly (if Spanish is selected)

## Important Notes

⚠️ **This feature provides information only** - it does not replace professional medical help or emergency services.

💡 **Consider Adding**:
- More international resources if your user base expands to other countries
- Local/regional resources based on user location detection
- Integration with app analytics to track usage (anonymously) to understand user needs
- Potential integration with in-app crisis support features in the future

## Build Status

✅ Build completed successfully with no errors
✅ All TypeScript types validated
✅ Translations properly integrated

---

**Created**: 2025-10-09
**Feature Type**: Safety & Support
**User Access**: All users (Free & Premium)
