# Quick Fix Application Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Add Environment Variable
Add this line to your `.env.local` file:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```
Get your key from: https://aistudio.google.com/app/apikey

### Step 2: Apply Database Migrations
Run these SQL files in Supabase SQL Editor (in order):

1. `supabase/migrations/20251013010000_create_prompts_history_table.sql`
2. `supabase/migrations/20251013020000_update_prompts_history_constraint.sql`

Or use Supabase CLI:
```bash
npx supabase db push
```

### Step 3: Restart Your Dev Server
```bash
npm run dev
```

### Step 4: Test
1. Go to `/dashboard`
2. Click "Generate Prompt"
3. Check console - NO errors should appear
4. You should see: "Successfully generated prompt with Gemini"

---

## ✅ What Was Fixed

| Issue | Status | Impact |
|-------|--------|--------|
| Invalid URL fetch error | ✅ Fixed | Server-side API routes now use direct Supabase queries |
| Gemini model 404 error | ✅ Fixed | Updated to `gemini-2.5-flash` (stable) |
| RLS policy violation | ✅ Fixed | Added INSERT policy for `prompts_history` table |

---

## 🔒 Security Verified

- ✅ All database access uses user-bound clients
- ✅ RLS policies enforce user isolation
- ✅ No service role keys in user-facing code
- ✅ Environment variables properly scoped
- ✅ No sensitive data in logs

---

## 📝 Files Changed

### Code Changes
- `lib/services/aiService.ts` - Updated Gemini model
- `lib/services/reflectionServiceServer.ts` - NEW: Server-side service
- `app/api/prompts/generate/route.ts` - Uses new server service
- `lib/types/reflection.ts` - Added 'groq' to AIProvider type
- `.env.example` - Added GEMINI_API_KEY documentation

### Database Migrations
- `supabase/migrations/20251013010000_create_prompts_history_table.sql`
- `supabase/migrations/20251013020000_update_prompts_history_constraint.sql`

### Documentation
- `docs/SECURITY_FIX_2025_10_13.md` - Comprehensive security documentation
- `APPLY_FIXES.md` - This quick reference guide

---

## 🧪 Quick Test Commands

```bash
# Check if table exists
supabase db exec "SELECT tablename FROM pg_tables WHERE tablename = 'prompts_history';"

# Check if policies exist
supabase db exec "SELECT policyname FROM pg_policies WHERE tablename = 'prompts_history';"

# Check constraint
supabase db exec "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname LIKE '%prompts_history%';"
```

---

## 🆘 Troubleshooting

### "Failed to parse URL" error still appears
- Make sure you restarted your dev server after code changes
- Clear your browser cache and reload

### "models/gemini-1.5-flash-latest is not found"
- Verify GEMINI_API_KEY is set in `.env.local`
- Restart your dev server
- Check the key is valid at https://aistudio.google.com/

### "new row violates row-level security policy"
- Run the migrations again (they're idempotent)
- Verify policies exist with the SQL command above
- Try with a fresh user account

### Prompt generation still fails
- Check if OpenAI fallback is working
- Verify OPENAI_API_KEY is also set
- Check browser console for detailed errors

---

## 📞 Need Help?

1. Check `docs/SECURITY_FIX_2025_10_13.md` for detailed documentation
2. Review server logs for specific error messages
3. Test with a fresh user account to rule out data issues
4. Verify all environment variables are set correctly

---

## 🎯 Success Criteria

You'll know everything is working when:
- ✅ No console errors when generating prompts
- ✅ Prompts are successfully saved to database
- ✅ You see "Successfully generated prompt with Gemini" in logs
- ✅ Dashboard loads without RLS policy errors
- ✅ Multiple users can generate prompts independently

---

**Last Updated:** October 13, 2025
