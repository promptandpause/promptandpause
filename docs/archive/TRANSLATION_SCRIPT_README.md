# Translation Automation Script - Usage Guide

## 🚀 Quick Start

### Step 1: Run the Script

Open PowerShell in your project root and run:

```powershell
.\apply-translations.ps1
```

**If you get an execution policy error**, run this first:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then run the script again.

### Step 2: Build and Test

```powershell
npm run build
```

### Step 3: Test in Browser

1. Start the dev server: `npm run dev`
2. Go to Settings page
3. Change language to Spanish or French
4. Check that all text translates
5. Navigate to Dashboard and Archive
6. Verify translations work everywhere

---

## 🔍 What the Script Does

The script automatically:

1. **Creates backups** - Saves original files to `backups_[timestamp]/`
2. **Adds imports** - Adds `useTranslation` hook to each page
3. **Initializes hooks** - Adds `const { t } = useTranslation()`
4. **Replaces text** - Changes 100+ hardcoded strings to `t('key')` calls
5. **Updates navigation** - Makes sidebar labels translatable
6. **Fixes toast messages** - Translates all notification messages

---

## 📁 Files Modified

- ✅ `app/dashboard/settings/page.tsx` - 50+ translations
- ✅ `app/dashboard/page.tsx` - 10+ translations
- ✅ `app/dashboard/archive/page.tsx` - 12+ translations

---

## ⚠️ If Something Goes Wrong

Restore from backups:

```powershell
# Find your backup folder
ls backups_*

# Restore files (replace timestamp with yours)
Copy-Item "backups_20250108_011835/settings.tsx.bak" "app/dashboard/settings/page.tsx" -Force
Copy-Item "backups_20250108_011835/dashboard.tsx.bak" "app/dashboard/page.tsx" -Force
Copy-Item "backups_20250108_011835/archive.tsx.bak" "app/dashboard/archive/page.tsx" -Force
```

---

## 🧪 Testing Checklist

After running the script:

### Settings Page
- [ ] Header shows "Settings ⚙️" (or translated)
- [ ] All section titles translate
- [ ] All labels translate
- [ ] All buttons translate
- [ ] Toast messages translate
- [ ] OAuth message translates for Google users

### Dashboard
- [ ] Page title translates
- [ ] "Welcome back" translates
- [ ] Stats labels translate
- [ ] Navigation translates

### Archive  
- [ ] Page title translates
- [ ] Subtitle translates
- [ ] Search placeholder translates
- [ ] Filter/Sort options translate
- [ ] Free tier message translates

### Language Switching
- [ ] Change to Spanish → All text becomes Spanish
- [ ] Change to French → All text becomes French
- [ ] Change back to English → All text returns to English
- [ ] Refresh page → Language persists

---

## 🌍 Current Languages

- ✅ **English** (en) - Complete
- ✅ **Spanish** (es) - Complete
- ✅ **French** (fr) - Complete

### Want to Add More Languages?

Edit `lib/i18n/translations.ts` and add a new language dictionary following the existing pattern.

For example, to add German:

```typescript
export const de: Record<TranslationKey, string> = {
  'common.save': 'Speichern',
  'nav.dashboard': 'Dashboard',
  'settings.title': 'Einstellungen',
  // ... copy all keys from 'en' and translate
}

// Then add to exports
export const translations = {
  en,
  es,
  fr,
  de, // ✅ Add here
}
```

---

## 💡 Pro Tips

1. **Always test after running the script** - Make sure translations work
2. **Keep backups** - Don't delete the backup folder until you're sure everything works
3. **Check the build** - Run `npm run build` to catch TypeScript errors
4. **Review the changes** - Use git diff to see what changed
5. **Test all pages** - Don't just test one page

---

## 🎉 Success Indicators

You'll know it worked when:

- ✅ Build completes without errors
- ✅ All pages load without console errors
- ✅ Language selector changes text throughout app
- ✅ Text translates immediately (no page refresh needed)
- ✅ Language persists after page refresh

---

## 📞 Need Help?

If you encounter issues:

1. Check the backup folder for original files
2. Review `TRANSLATION_IMPLEMENTATION.md` for manual steps
3. Check `I18N_IMPLEMENTATION_GUIDE.md` for how the system works
4. Look at `lib/i18n/translations.ts` to see available keys

---

## ✨ You're Done!

Once the script runs successfully and the build passes, your app is fully internationalized! 🌍

Users can now switch between English, Spanish, and French, and you can easily add more languages by editing the translations file.
