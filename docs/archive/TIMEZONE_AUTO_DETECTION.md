# 🌍 Automatic Timezone Detection with DST Support

## Overview

The **Prompt & Pause** dashboard now automatically detects and saves the user's timezone based on their browser's location. This system uses **IANA timezone identifiers** (e.g., `Europe/London`, `America/New_York`) which automatically handle **Daylight Saving Time (DST)** transitions without any manual intervention.

---

## ✨ Features

### 1. **Automatic Detection on Page Load**
- When a user visits the settings page, their timezone is automatically detected from their browser
- Uses JavaScript's `Intl.DateTimeFormat().resolvedOptions().timeZone` API
- No user action required - works instantly

### 2. **IANA Timezone Identifiers**
- Uses standardized IANA timezone names (e.g., `Europe/London`, `America/New_York`)
- These timezones have built-in DST rules
- Automatically adjusts between standard and daylight saving time

### 3. **DST Detection & Display**
- Shows current UTC offset (which changes with DST)
- Displays whether user is currently in DST or standard time
- Example displays:
  - **Winter (GMT)**: "Europe/London (UTC+0) - Currently in Standard Time"
  - **Summer (BST)**: "Europe/London (UTC+1) - Currently in Daylight Saving Time"

### 4. **Global Coverage**
- Supports 50+ common timezones across all regions:
  - **Americas**: US, Canada, Mexico, South America
  - **Europe**: UK, France, Germany, etc.
  - **Asia**: India, China, Japan, Southeast Asia, Middle East
  - **Pacific**: Australia, New Zealand, Pacific Islands
  - **Africa**: Major cities and regions

### 5. **Smart Database Storage**
- Stores timezone in `timezone_iana` field (new)
- Keeps old `timezone` field for backwards compatibility
- Cron job uses `timezone_iana` preferentially

---

## 🔧 How It Works

### Browser Detection

```typescript
// Automatically runs when settings page loads
const detectedTimezone = detectUserTimezone()
// Returns: "Europe/London", "America/New_York", etc.

const tzInfo = getTimezoneInfo(detectedTimezone)
// Returns:
// {
//   timezone: "Europe/London",
//   offset: 0 (or 1 in summer),
//   abbreviation: "GMT" (or "BST" in summer),
//   inDST: false (or true in summer),
//   display: "Europe/London (UTC+0)",
//   dstNote: "(Currently in Standard Time)"
// }
```

### Database Storage

When user saves their profile, the timezone is stored as:

```javascript
{
  timezone_iana: "Europe/London",  // New field - used by cron jobs
  timezone: "Europe/London"         // Old field - backwards compatibility
}
```

### Cron Job Usage

The daily prompt cron job now uses the IANA timezone:

```javascript
// From: app/api/cron/send-daily-prompts/route.ts
const userTimezone = profile.timezone_iana || profile.timezone || 'Europe/London'

// Convert current UTC time to user's local time (DST-aware)
const nowInUserTZ = new Date().toLocaleString('en-US', {
  timeZone: userTimezone,  // e.g., "Europe/London"
  hour12: false,
  hour: '2-digit',
  minute: '2-digit'
})

// Automatically adjusts for DST!
// In winter: BST → GMT (UTC+0)
// In summer: GMT → BST (UTC+1)
```

---

## 📱 User Experience

### Settings Page

When users open **Dashboard → Settings → Profile**:

1. **Timezone Dropdown** shows list of common timezones
2. **Current Selection** displays with live info:
   - 🌍 Europe/London (UTC+0)
   - (Currently in Standard Time)
3. **Helper Text**: "Automatically detects daylight saving time"

### Mobile & Desktop

- **Mobile**: Compact display with timezone info below dropdown
- **Desktop**: Same information with better spacing
- Both update instantly when timezone is changed

---

## 🌐 Supported Timezones

### Americas (12 timezones)
- Eastern Time (US & Canada)
- Central Time (US & Canada)
- Mountain Time (US & Canada)
- Pacific Time (US & Canada)
- Alaska, Hawaii
- Toronto, Vancouver
- Mexico City, São Paulo, Buenos Aires

### Europe (7 timezones)
- London, Dublin (GMT/BST)
- Paris, Berlin, Rome (CET/CEST)
- Athens, Helsinki, Istanbul
- Moscow
- Madrid, Amsterdam, Zurich

### Asia (11 timezones)
- Dubai, Abu Dhabi
- Mumbai, New Delhi
- Bangkok, Jakarta
- Beijing, Shanghai, Singapore, Hong Kong
- Tokyo, Osaka, Seoul, Taipei
- Karachi, Tehran

### Pacific (6 timezones)
- Sydney, Melbourne, Perth, Adelaide, Brisbane
- Auckland, Wellington, Fiji

### Africa & Atlantic (6 timezones)
- Cairo, Johannesburg, Lagos, Nairobi
- Reykjavik, Azores

---

## 🔍 DST Transition Examples

### UK (Europe/London)

| Date | Timezone | UTC Offset | Display |
|------|----------|------------|---------|
| Jan 1 | GMT | UTC+0 | Europe/London (UTC+0) - Standard Time |
| Last Sunday in March | → BST | UTC+1 | Switches to Daylight Saving |
| Mar 31+ | BST | UTC+1 | Europe/London (UTC+1) - Daylight Saving Time |
| Last Sunday in October | → GMT | UTC+0 | Switches back to Standard Time |
| Nov 1+ | GMT | UTC+0 | Europe/London (UTC+0) - Standard Time |

### US Eastern (America/New_York)

| Date | Timezone | UTC Offset | Display |
|------|----------|------------|---------|
| Jan 1 | EST | UTC-5 | America/New_York (UTC-5) - Standard Time |
| 2nd Sunday in March | → EDT | UTC-4 | Switches to Daylight Saving |
| Mar 15+ | EDT | UTC-4 | America/New_York (UTC-4) - Daylight Saving Time |
| 1st Sunday in November | → EST | UTC-5 | Switches back to Standard Time |
| Nov 8+ | EST | UTC-5 | America/New_York (UTC-5) - Standard Time |

**Key Point**: All of this happens automatically! Users don't need to change anything.

---

## 🧪 Testing

### Test Auto-Detection

1. Open browser console on settings page
2. Look for log: `🌍 Auto-detected timezone: Europe/London`
3. Verify timezone info displays correctly below dropdown

### Test DST Display

```javascript
// Run in browser console
const tzInfo = getTimezoneInfo('Europe/London')
console.log(tzInfo)

// Output (winter):
// {
//   timezone: "Europe/London",
//   offset: 0,
//   abbreviation: "GMT",
//   inDST: false,
//   display: "Europe/London (UTC+0)",
//   dstNote: "(Currently in Standard Time)"
// }

// Output (summer):
// {
//   timezone: "Europe/London",
//   offset: 1,
//   abbreviation: "BST",
//   inDST: true,
//   display: "Europe/London (UTC+1)",
//   dstNote: "(Currently in Daylight Saving Time)"
// }
```

### Test Database Save

```sql
-- Check saved timezone in database
SELECT 
  id,
  email,
  timezone_iana,
  timezone,
  updated_at
FROM profiles
WHERE email = 'your-email@example.com';

-- Expected result:
-- timezone_iana: 'Europe/London'
-- timezone: 'Europe/London' (for backwards compatibility)
```

### Test Cron Job Time Matching

```sql
-- Check if user will receive prompt now
SELECT 
  p.email,
  p.timezone_iana,
  up.reminder_time,
  TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE p.timezone_iana, 'HH24:MI') as current_local_time,
  CASE 
    WHEN SPLIT_PART(up.reminder_time, ':', 1)::int = 
         EXTRACT(HOUR FROM (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE p.timezone_iana))::int
    THEN '✅ TIME MATCHES - WILL SEND'
    ELSE '❌ Time does not match'
  END as will_send
FROM profiles p
LEFT JOIN user_preferences up ON p.id = up.user_id
WHERE p.email = 'your-email@example.com';
```

---

## 🔄 Migration from Old System

### Old System (Static UTC Offsets)
```javascript
timezone: "UTC-05:00"  // Fixed offset, doesn't handle DST
```

**Problems:**
- Had to manually change timezone twice a year for DST
- Users in DST regions got emails at wrong time
- No automatic adjustment

### New System (IANA Timezones)
```javascript
timezone_iana: "America/New_York"  // Handles DST automatically
```

**Benefits:**
- ✅ Automatic DST transitions
- ✅ No manual changes needed
- ✅ Always correct local time
- ✅ Globally accurate

### Backwards Compatibility

The system maintains both fields:
- **New users**: Automatically get `timezone_iana` set
- **Existing users**: Keep old `timezone` until they update settings
- **Cron job**: Uses `timezone_iana` if available, falls back to `timezone`

---

## 📊 Implementation Files

### Frontend
- **`lib/utils/timezoneDetection.ts`** - Core detection utilities
- **`app/dashboard/settings/page.tsx`** - Settings UI with auto-detection
- Uses React `useEffect` to detect on mount

### Backend
- **`lib/services/userService.ts`** - Handles `timezone_iana` field
- **`app/api/user/profile/route.ts`** - API endpoint for saving timezone
- **`app/api/cron/send-daily-prompts/route.ts`** - Uses IANA timezones for scheduling

### Database
- **`profiles.timezone_iana`** - New IANA timezone column
- **`profiles.timezone`** - Old timezone column (kept for compatibility)

---

## 🚀 Deployment

### Database Migration

If `timezone_iana` column doesn't exist yet:

```sql
-- Add timezone_iana column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS timezone_iana TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_timezone_iana 
ON profiles(timezone_iana);

-- Optionally migrate existing data from old timezone field
-- (Only if you want to preserve old values)
UPDATE profiles
SET timezone_iana = timezone
WHERE timezone_iana IS NULL AND timezone IS NOT NULL;
```

### Environment Variables

No new environment variables needed! Works out of the box.

---

## ✅ Benefits

### For Users
- 🌍 **Automatic timezone detection** - no manual selection needed
- ⏰ **Always correct local time** - DST handled automatically
- 🌞 **Seamless DST transitions** - prompts arrive at expected time all year
- 🗺️ **Global support** - works anywhere in the world

### For Developers
- 🔧 **Easy to maintain** - no manual DST logic needed
- 📊 **Accurate scheduling** - cron jobs respect real local time
- 🐛 **Fewer bugs** - browser handles complexity
- ♻️ **Backwards compatible** - old timezone field still works

### For the Business
- 📈 **Better engagement** - users get prompts at correct times
- 🌐 **Global expansion** - works for users worldwide
- 💪 **Reliable** - no seasonal bugs or user complaints
- 🎯 **Professional** - shows attention to detail

---

## 🆘 Troubleshooting

### "Timezone not detected"
- **Cause**: Browser doesn't support Intl API (very rare)
- **Solution**: Falls back to `Europe/London`
- **Fix**: Use manual dropdown selection

### "Wrong offset displayed"
- **Cause**: Browser time settings incorrect
- **Solution**: Check system clock and timezone settings
- **Fix**: Set correct timezone in OS settings

### "Cron sends at wrong time"
- **Cause**: Database has old static offset in `timezone` field
- **Solution**: User needs to visit settings and save once
- **Fix**: Automatic when user updates profile

### "DST note incorrect"
- **Cause**: System clock wrong or timezone database outdated
- **Solution**: Refresh browser or update OS
- **Fix**: Usually auto-corrects on next visit

---

## 📝 Future Enhancements

### Possible Additions
- 🗺️ Show timezone on a visual map
- 🔔 Warn users when DST transition is coming
- 📅 Show next DST transition date
- 🌐 Auto-suggest timezone based on IP geolocation
- 📱 Native app: Use device location for better accuracy

---

## 🎉 Summary

The automatic timezone detection with DST support makes **Prompt & Pause** a truly global application. Users from London to Tokyo to New York all receive their daily prompts at exactly the right local time, regardless of whether they're in daylight saving time or not.

**Key Features:**
- ✅ Automatic browser-based detection
- ✅ IANA timezone identifiers
- ✅ DST handling built-in
- ✅ Real-time offset display
- ✅ 50+ supported timezones
- ✅ Backwards compatible
- ✅ Production ready

**Result:** Users always get prompts when expected, every day of the year! 🎯

---

*Last Updated: January 10, 2025*
*Version: 2.0.0*
*Feature: Automatic Timezone Detection with DST*
