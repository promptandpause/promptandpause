# PWA (Progressive Web App) Setup Guide

## Overview

Prompt & Pause now supports Progressive Web App (PWA) functionality, allowing users to install the app on their mobile devices and use it like a native app.

## Features

### ✅ Implemented

- **Manifest Configuration** (`/app/manifest.json`)
  - App name, icons, and theme colors
  - Standalone display mode
  - Portrait orientation
  - App shortcuts for quick access

- **Service Worker** (`/public/sw.js`)
  - Offline caching strategy
  - Network-first with cache fallback
  - Runtime caching for assets
  - Automatic cache management

- **Custom Welcome Screen** (`/app/pwa-welcome/page.tsx`)
  - Beautiful gradient design
  - Feature highlights
  - Direct sign-in/sign-up access
  - Auto-redirect for authenticated users

- **Install Prompt Component** (`/components/PWAInstallPrompt.tsx`)
  - Smart install banner
  - Dismissible with localStorage persistence
  - Delayed appearance (3 seconds)
  - Only shows when installable

- **PWA Hook** (`/lib/hooks/usePWA.ts`)
  - Detect if app is installed
  - Check if app can be installed
  - Programmatic install prompt

## User Experience

### For PWA Users (Installed App)
1. User visits `promptandpause.com` on mobile
2. Browser shows "Add to Home Screen" option
3. After installation, app opens to `/pwa-welcome` (custom welcome screen)
4. Welcome screen shows:
   - App branding
   - Key features
   - Sign In / Create Account buttons
   - Link to full website
5. Authenticated users auto-redirect to dashboard

### For Web Users (Browser)
- Standard website experience
- Homepage at `/homepage`
- All features work normally
- Optional install prompt appears after 3 seconds

## File Structure

```
app/
├── manifest.json              # PWA manifest configuration
├── pwa-welcome/
│   └── page.tsx              # Custom welcome screen for PWA users
public/
└── sw.js                     # Service worker for offline support
components/
└── PWAInstallPrompt.tsx      # Install prompt banner
lib/
└── hooks/
    └── usePWA.ts             # PWA detection and install hook
```

## Configuration

### Manifest (`/app/manifest.json`)
```json
{
  "name": "Prompt & Pause - Mental Wellness",
  "short_name": "Prompt & Pause",
  "start_url": "/pwa-welcome",
  "display": "standalone",
  "theme_color": "#0f172a",
  "background_color": "#0f172a"
}
```

### Required Icons
- `/app/icon.png` - 192x192px (exists)
- `/app/apple-icon.png` - 180x180px (exists)
- `/app/icon-512.png` - 512x512px (needs to be created)

## Testing

### Local Testing

1. **Build the app:**
   ```bash
   pnpm build
   pnpm start
   ```

2. **Open Chrome DevTools:**
   - Navigate to Application tab
   - Check "Manifest" section
   - Verify "Service Workers" are registered
   - Use "Add to home screen" in Application > Manifest

### Mobile Testing (Android)

1. Open Chrome on Android
2. Navigate to `https://promptandpause.com`
3. Tap the menu (three dots)
4. Select "Add to Home Screen" or "Install app"
5. App icon appears on home screen
6. Opening the app shows `/pwa-welcome` screen

### Mobile Testing (iOS)

1. Open Safari on iOS
2. Navigate to `https://promptandpause.com`
3. Tap the Share button
4. Select "Add to Home Screen"
5. App icon appears on home screen
6. Opening the app shows `/pwa-welcome` screen

**Note:** iOS has limited PWA support compared to Android

## Deployment Checklist

- [x] Manifest.json created with correct paths
- [x] Service worker registered
- [x] PWA welcome screen created
- [x] Install prompt component created
- [x] Viewport meta tags optimized
- [ ] Create 512x512 icon (`/app/icon-512.png`)
- [ ] Test on Android device
- [ ] Test on iOS device
- [ ] Verify offline functionality
- [ ] Test install/uninstall flow

## Creating Missing Icons

You need to create a 512x512px version of your app icon:

1. Use your existing `/app/icon.png` as the source
2. Resize to 512x512px (maintain aspect ratio, add padding if needed)
3. Save as `/app/icon-512.png`
4. Ensure it's a PNG with transparency

**Tools:**
- Figma, Photoshop, or any image editor
- Online tools: https://www.iloveimg.com/resize-image
- PWA Asset Generator: https://github.com/elegantapp/pwa-asset-generator

## Troubleshooting

### Install Button Not Showing
- Check if app is already installed
- Clear browser cache and service workers
- Ensure HTTPS is enabled (required for PWA)
- Check browser console for errors

### Service Worker Not Registering
- Verify `/public/sw.js` exists
- Check browser console for registration errors
- Ensure proper HTTPS configuration
- Clear application cache in DevTools

### Offline Mode Not Working
- Check service worker is active (DevTools > Application)
- Verify cache names match in sw.js
- Test with DevTools offline mode
- Check network tab for cached responses

## Browser Support

| Browser | Support Level |
|---------|--------------|
| Chrome (Android) | ✅ Full support |
| Edge (Android) | ✅ Full support |
| Samsung Internet | ✅ Full support |
| Safari (iOS) | ⚠️ Limited (no service worker background sync) |
| Firefox (Android) | ⚠️ Partial (no install prompt) |

## Future Enhancements

- [ ] Push notifications for daily prompts
- [ ] Background sync for offline reflections
- [ ] App shortcuts for quick actions
- [ ] Share target API for sharing to app
- [ ] Periodic background sync
- [ ] Badge API for unread notifications

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Manifest Generator](https://www.simicart.com/manifest-generator.html/)
- [Service Worker Cookbook](https://serviceworke.rs/)
- [PWA Builder](https://www.pwabuilder.com/)

---

© 2026 Prompt & Pause. All rights reserved.
