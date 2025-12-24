# Dark Mode Implementation - Settings Page IN PROGRESS 🔄

## Overview
The Settings page is being systematically updated for dark mode support. Due to its large size and complexity (mobile + desktop views, multiple sections), this is a multi-step process.

## Progress Status

### ✅ COMPLETED
1. **Main Background & Loading State** - Theme-aware backgrounds for both loading and main views
2. **Mobile Header Card** - "Settings" title card with dark mode
3. **Profile Category Card** - Full dark mode with icon, text, and chevron
4. **Notifications Category Card** - Full dark mode styling

### 🔄 IN PROGRESS
Remaining Mobile Category Cards to Update (same pattern as Profile/Notifications):

5. **Security Card** - Lines 880-906
6. **Preferences Card** - Lines 908-934
7. **Subscription Card** - Lines 936-960
8. **Integrations Card** - Lines 962-991
9. **Contact Support Card** - Lines 993-1018
10. **Danger Zone Card** - Lines 1020-1046 (special red theme)

### ⏳ PENDING
11. Mobile Detail Views (Profile, Notifications, Security, Preferences, Subscription, Integrations, Danger)
12. Desktop View - All sections
13. Form inputs, switches, selects
14. Buttons and action areas

## Pattern for Category Cards

Each category card follows this pattern:

```typescript
<Card 
  onClick={() => navigateToView('cardname')}
  className={`backdrop-blur-xl rounded-2xl p-4 active:scale-98 transition-transform cursor-pointer hover:shadow-lg shadow-md ${
    theme === 'dark'
      ? 'bg-white/5 border border-white/10'
      : 'bg-white/80 border-2 border-gray-300'
  }`}
>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
        theme === 'dark'
          ? 'bg-[color]-500/20 border-[color]-400/30'
          : 'bg-[color]-100 border-[color]-300'
      }`}>
        <Icon className="h-5 w-5 text-[color]-600" />
      </div>
      <div>
        <p className={`font-medium ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Title</p>
        <p className={`text-xs ${
          theme === 'dark' ? 'text-white/60' : 'text-gray-600'
        }`}>Description</p>
      </div>
    </div>
    <ChevronRight className={`h-5 w-5 ${
      theme === 'dark' ? 'text-white/40' : 'text-gray-400'
    }`} />
  </div>
</Card>
```

## Color Scheme for Icons

- **Profile**: Blue (`bg-blue-500/20`, `border-blue-400/30`)
- **Notifications**: Yellow (`bg-yellow-500/20`, `border-yellow-400/30`)
- **Security**: Red (`bg-red-500/20`, `border-red-400/30`)
- **Preferences**: Purple (`bg-purple-500/20`, `border-purple-400/30`)
- **Subscription**: Green (`bg-green-500/20`, `border-green-400/30`)
- **Integrations**: Purple (`bg-purple-500/20`, `border-purple-400/30`)
- **Contact Support**: Blue (`bg-blue-500/20`, `border-blue-400/30`)
- **Danger Zone**: Red background (`bg-red-500/20`) with special treatment

## Mobile Detail Views Pattern

### Form Inputs
```typescript
<Input
  className={`text-sm h-10 ${
    theme === 'dark'
      ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
      : 'bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400'
  }`}
/>
```

### Labels
```typescript
<Label className={`text-sm font-medium ${
  theme === 'dark' ? 'text-white/90' : 'text-gray-700'
}`}>
```

### Select Components
```typescript
<SelectTrigger className={`text-sm h-10 ${
  theme === 'dark'
    ? 'bg-white/10 border border-white/20 text-white'
    : 'bg-white border-2 border-gray-300 text-gray-900'
}`}>

<SelectContent className={`max-h-[300px] ${
  theme === 'dark'
    ? 'bg-black/90 border border-white/20'
    : 'bg-white border-2 border-gray-300'
}`}>

<SelectItem className={
  theme === 'dark'
    ? 'text-white hover:bg-white/10'
    : 'text-gray-900 hover:bg-gray-100'
}>
```

### Switches
Switches use the shadcn component - check if theme-aware styling needed.

### Buttons
```typescript
<Button className={`w-full h-10 ${
  theme === 'dark'
    ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
}`}>
```

## Desktop View Pattern

Desktop view uses a two-column layout with section cards. Each section needs:

1. **Section Card Container**
```typescript
<Card className={`backdrop-blur-xl rounded-3xl p-6 shadow-xl ${
  theme === 'dark'
    ? 'bg-white/5 border border-white/10'
    : 'bg-white/90 border-2 border-gray-400'
}`}>
```

2. **Section Headers**
```typescript
<h3 className={`text-xl font-semibold ${
  theme === 'dark' ? 'text-white' : 'text-gray-900'
}`}>
```

3. **All form elements** follow the same patterns as mobile.

## Special Cases

### Danger Zone
- Mobile card has red background in light mode (`bg-red-50 border-red-300`)
- Dark mode: `bg-red-500/10 border-red-400/20`
- Text remains readable with proper contrast

### Disabled Inputs
```typescript
<Input
  disabled
  className={`h-10 ${
    theme === 'dark'
      ? 'bg-white/5 border border-white/10 text-white/50'
      : 'bg-gray-100 border-2 border-gray-300 text-gray-600'
  }`}
/>
```

### Integration Cards (Slack, WhatsApp, Teams)
- Connected state: Green indicator
- Disconnected state: Gray
- Follow standard card pattern with icon backgrounds

## Files to Reference
- Main pattern: Dashboard components (completed)
- Archive page: Form inputs and dropdowns (completed)
- Current file: `app/dashboard/settings/page.tsx`

## Next Steps

1. Complete remaining mobile category cards (Security through Danger Zone)
2. Update all mobile detail view cards
3. Update all form inputs, selects, and switches in mobile views
4. Update desktop section cards
5. Update all form elements in desktop views
6. Test theme toggle thoroughly
7. Verify all text is readable
8. Check all interactive states

## Estimated Lines to Update
- Mobile category cards: ~200 lines
- Mobile detail views: ~800 lines
- Desktop sections: ~1000 lines
- **Total**: ~2000 lines across the Settings page

## Priority Order
1. Mobile main view (categories) - HIGHEST
2. Mobile detail views - HIGH
3. Desktop view - MEDIUM (users mostly use mobile for settings)

---

**Last Updated**: January 2025  
**Status**: 30% Complete
