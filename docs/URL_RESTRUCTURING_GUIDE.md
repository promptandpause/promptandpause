# URL Restructuring Guide

## Overview

This guide explains how to complete the URL restructuring to remove the `/homepage` prefix from all public-facing pages.

## Current Status

### ✅ Completed
- Updated `Navigation.tsx` - all links now use clean URLs (e.g., `/research` instead of `/homepage/research`)
- Updated `sitemap.ts` - all URLs now point to clean paths
- Fixed mobile responsiveness on research page tabs

### ⚠️ Remaining Work

The pages are still physically located in the `/app/homepage/` folder, which means Next.js will still route them as `/homepage/*`. To complete the restructuring, you need to **move the page folders** from `/app/homepage/` to `/app/`.

## How to Complete the Restructuring

### Option 1: Manual Move (Recommended)

Move these folders from `/app/homepage/` to `/app/`:

```
/app/homepage/contact/          → /app/contact/
/app/homepage/cookie-policy/    → /app/cookie-policy/
/app/homepage/features/         → /app/features/
/app/homepage/our-mission/      → /app/our-mission/
/app/homepage/pricing/          → /app/pricing/
/app/homepage/privacy-policy/   → /app/privacy-policy/
/app/homepage/research/         → /app/research/
/app/homepage/support-us/       → /app/support-us/
/app/homepage/systems/          → /app/systems/
/app/homepage/terms-of-service/ → /app/terms-of-service/
```

**Keep in `/app/homepage/`:**
- `page.tsx` (the actual homepage)
- `layout.tsx` (if exists)
- `Navigation.tsx`
- `footer.tsx`
- `hero-section.tsx`
- `hero-section-backup.tsx`
- Any other homepage-specific components

### Option 2: Using Next.js Route Groups (Alternative)

If you want to keep the folder structure but hide `/homepage` from URLs:

1. Rename `/app/homepage/` to `/app/(marketing)/`
2. The parentheses make it a "route group" - Next.js will ignore it in the URL
3. Pages in `/app/(marketing)/research/` will be accessible at `/research`

**Note:** This approach requires moving the homepage itself to `/app/page.tsx` or creating a separate structure.

## After Moving Files

### 1. Update Import Paths

Files that were moved will need their relative imports updated. For example, in the moved pages:

**Before:**
```tsx
import Navigation from "../Navigation"
import Footer from "../footer"
```

**After (if Navigation/Footer stay in /app/homepage/):**
```tsx
import Navigation from "../homepage/Navigation"
import Footer from "../homepage/footer"
```

**OR** move `Navigation.tsx` and `footer.tsx` to a shared location like `/app/components/` or `/app/(marketing)/`.

### 2. Test All Routes

After moving, test these URLs work correctly:
- `https://promptandpause.com/research`
- `https://promptandpause.com/features`
- `https://promptandpause.com/pricing`
- `https://promptandpause.com/our-mission`
- `https://promptandpause.com/contact`
- `https://promptandpause.com/support-us`
- `https://promptandpause.com/privacy-policy`
- `https://promptandpause.com/terms-of-service`
- `https://promptandpause.com/cookie-policy`

### 3. Set Up Redirects (Optional but Recommended)

To avoid breaking existing links, add redirects in `next.config.mjs`:

```javascript
async redirects() {
  return [
    {
      source: '/homepage/:path*',
      destination: '/:path*',
      permanent: true, // 301 redirect
    },
  ]
},
```

This will automatically redirect old `/homepage/*` URLs to the new clean URLs.

## Recommended Approach

**Best practice:** Move the folders manually (Option 1) and organize shared components:

1. Create `/app/components/marketing/` folder
2. Move `Navigation.tsx` and `footer.tsx` there
3. Move all page folders to `/app/` root
4. Update imports in moved pages to point to `/app/components/marketing/`
5. Add redirects in `next.config.mjs`

This keeps everything organized and makes the URL structure clean and SEO-friendly.

## Files Already Updated

These files have been updated to use the new URL structure:
- ✅ `/app/homepage/Navigation.tsx` - All navigation links updated
- ✅ `/app/sitemap.ts` - All sitemap URLs updated
- ✅ `/app/homepage/research/page.tsx` - Mobile responsiveness fixed

## Next Steps

1. Choose your approach (manual move or route groups)
2. Move/rename the folders
3. Update import paths in moved files
4. Test all routes locally
5. Add redirects to `next.config.mjs`
6. Deploy to Vercel
7. Test all URLs in production

---

© 2026 Prompt & Pause. All rights reserved.
