# Security Fixes - October 13, 2025

## Overview
This document details critical security and functionality fixes applied to address issues found during development console testing.

## Issues Fixed

### 1. ❌ Invalid URL Error in Server-Side Fetch
**Problem:** Server-side API routes were calling `fetch()` with relative URLs (e.g., `/api/reflections?startDate=...`), which fails in Node.js server context.

**Root Cause:** The `supabaseReflectionService.ts` service was designed for client-side use but was being called from server-side API routes.

**Security Impact:** Medium - Could expose internal API structure and cause service failures.

**Solution:**
- Created new `reflectionServiceServer.ts` for server-side database queries
- Updated API routes to use direct Supabase queries instead of HTTP fetch
- Maintains RLS (Row Level Security) enforcement through user-bound Supabase clients

**Files Changed:**
- ✅ Created: `lib/services/reflectionServiceServer.ts`
- ✅ Updated: `app/api/prompts/generate/route.ts`

---

### 2. ❌ Incorrect Gemini AI Model Name
**Problem:** Code used `gemini-1.5-flash-latest` which is no longer valid for Google's v1beta API.

**Error:** `[404 Not Found] models/gemini-1.5-flash-latest is not found for API version v1beta`

**Solution:**
- Updated to stable model: `gemini-2.5-flash` (June 2025 stable release)
- Alternative option: `gemini-flash-latest` (auto-updates to newest version)
- Added GEMINI_API_KEY to environment configuration
- Created script to list available models: `scripts/list-gemini-models.js`

**Files Changed:**
- ✅ Updated: `lib/services/aiService.ts` (line 23)
- ✅ Updated: `.env.example` (added GEMINI_API_KEY with security notes)

---

### 3. ❌ Missing RLS INSERT Policy for prompts_history Table
**Problem:** Users couldn't insert records into `prompts_history` table due to missing RLS policy.

**Error:** `new row violates row-level security policy for table "prompts_history"`

**Security Impact:** HIGH - RLS policies are critical for data isolation between users.

**Solution:**
- Created comprehensive migration to ensure table exists with proper structure
- Added both SELECT and INSERT RLS policies
- Updated ai_provider constraint to include 'gemini'

**Files Changed:**
- ✅ Created: `supabase/migrations/20251013010000_create_prompts_history_table.sql`
- ✅ Created: `supabase/migrations/20251013020000_update_prompts_history_constraint.sql`

---

## Security Principles Enforced

### ✅ Row Level Security (RLS)
- All user data tables have RLS enabled
- Policies enforce `auth.uid() = user_id` for all operations
- No service role keys used in user-facing routes

### ✅ Server-Side Data Access
- Server API routes use user-bound Supabase clients
- RLS policies automatically filter data to current user
- No direct database bypass mechanisms

### ✅ Environment Security
- All API keys are server-side only
- Clear documentation on which keys are safe to expose
- No secrets logged in production code

### ✅ Input Validation
- All user IDs validated before database queries
- Date ranges properly encoded and validated
- Error messages don't leak sensitive information

---

## Migration Instructions

### Local Development

1. **Update Environment Variables**
   ```bash
   # Add to your .env.local file
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   Get your key from: https://aistudio.google.com/app/apikey

2. **Run Database Migrations**
   ```bash
   # If using Supabase CLI
   npx supabase db push
   
   # Or run migrations manually in Supabase SQL Editor
   # Execute the files in order:
   # 1. supabase/migrations/20251013010000_create_prompts_history_table.sql
   # 2. supabase/migrations/20251013020000_update_prompts_history_constraint.sql
   ```

3. **Restart Development Server**
   ```bash
   npm run dev
   ```

4. **Verify Fixes**
   - Navigate to dashboard
   - Click "Generate Prompt"
   - Check console - should see no errors
   - Verify Gemini provider is used (check logs)

### Production Deployment

1. **Set Environment Variable**
   ```bash
   # In your hosting platform (Vercel, Netlify, etc.)
   GEMINI_API_KEY=your_production_gemini_api_key
   ```

2. **Apply Migrations**
   - Migrations are idempotent and safe to run multiple times
   - Run via Supabase dashboard or CLI
   - Verify policies with: `SELECT * FROM pg_policies WHERE tablename = 'prompts_history';`

3. **Deploy Code**
   ```bash
   git add .
   git commit -m "fix: resolve Gemini model, RLS policies, and server-side fetch issues"
   git push origin main
   ```

4. **Post-Deployment Verification**
   - Test prompt generation with production account
   - Check logs for "Successfully generated prompt with Gemini"
   - Verify no "Invalid URL" or RLS policy errors

---

## Testing Checklist

### Functionality Tests
- [ ] Prompt generation works end-to-end
- [ ] No "Invalid URL" errors in console
- [ ] Gemini AI provider successfully generates prompts
- [ ] OpenAI fallback works if Gemini fails
- [ ] Prompts are saved to database successfully

### Security Tests
- [ ] User A cannot access User B's prompts
- [ ] RLS policies block cross-user queries
- [ ] No service role key usage in client code
- [ ] Environment variables properly scoped (server vs client)
- [ ] Error messages don't expose sensitive data

### Database Tests
- [ ] `prompts_history` table exists
- [ ] Indexes are created for performance
- [ ] Constraints allow 'gemini' as ai_provider
- [ ] Both SELECT and INSERT policies exist
- [ ] RLS is enabled on table

---

## Rollback Plan

If issues arise:

1. **Code Rollback**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Database Rollback**
   - Migrations are additive and don't delete data
   - If needed, manually drop policies:
   ```sql
   DROP POLICY IF EXISTS "Users can insert own prompts" ON public.prompts_history;
   ```

3. **Environment Rollback**
   - Remove GEMINI_API_KEY from environment
   - System will fall back to OpenAI

---

## Additional Notes

### Performance Impact
- **Positive:** Direct Supabase queries are faster than HTTP fetch to internal API
- **Positive:** Proper indexes reduce query time
- **Neutral:** RLS policies have minimal overhead with proper indexes

### Future Improvements
- [ ] Add UPDATE policy for prompts_history (if needed)
- [ ] Add DELETE policy for prompts_history (if needed)
- [ ] Consider caching recent reflections to reduce database queries
- [ ] Add monitoring/alerting for RLS policy violations

### Related Documentation
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js API Routes Best Practices](https://nextjs.org/docs/api-routes/introduction)
- [Google Gemini API Documentation](https://ai.google.dev/gemini-api/docs)

---

## Questions or Issues?

If you encounter any problems with these fixes:
1. Check environment variables are set correctly
2. Verify migrations ran successfully
3. Review server logs for detailed error messages
4. Test with a fresh user account to rule out data issues

**Security Concerns:** If you discover any security vulnerabilities, please report immediately via secure channels.
