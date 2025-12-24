# Production Environment Variables Checklist

**Last Updated:** 2025-10-17  
**Production Launch Date:** Monday (Next Week)

## ✅ Required Environment Variables for Vercel

### 🔐 Authentication & Security
- [ ] `ENCRYPTION_KEY` - Encryption key for sensitive data
- [ ] `CRON_SECRET` - Secret token for cron job authentication
- [ ] `ADMIN_EMAIL` - Primary admin email address
- [ ] `SUPPORT_ADMIN_EMAIL` - Support team email

### 🗄️ Database (Supabase)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key for client-side
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key for server-side operations

### 🤖 AI Services (4-Tier Fallback Chain)
- [ ] `OPENROUTER_API_KEY` - OpenRouter API key (Primary - FREE tier)
- [ ] `HUGGINGFACE_API_KEY` - Hugging Face API key (Fallback 1 - FREE)
- [ ] `GEMINI_API_KEY` - Google Gemini API key (Fallback 2 - FREE tier)
- [ ] `OPENAI_API_KEY` - OpenAI API key (Final fallback - Paid)
- [ ] `OPENROUTER_MODEL_PREFS` - (Optional) Custom model preference order

### 💳 Payment (Stripe)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- [ ] `STRIPE_PRICE_MONTHLY` - Monthly subscription price ID
- [ ] `STRIPE_PRICE_ANNUAL` - Annual subscription price ID

### 📧 Email (Resend)
- [ ] `RESEND_API_KEY` - Resend API key for transactional emails
- [ ] `RESEND_FROM_EMAIL` - Verified sender email address

### 🚀 Rate Limiting (Upstash Redis)
- [ ] `KV_URL` - Upstash Redis connection URL
- [ ] `KV_REST_API_URL` - Upstash REST API URL
- [ ] `KV_REST_API_TOKEN` - Upstash REST API write token
- [ ] `KV_REST_API_READ_ONLY_TOKEN` - Upstash REST API read-only token
- [ ] `REDIS_URL` - Redis connection string (if different from KV_URL)

### 💬 Slack Integration
- [ ] `SLACK_CLIENT_ID` - Slack OAuth app client ID
- [ ] `SLACK_CLIENT_SECRET` - Slack OAuth app client secret
- [ ] `SLACK_SIGNING_SECRET` - Slack request verification secret
- [ ] `SLACK_WEBHOOK_URL` - Default Slack webhook for notifications

### 🎫 Support & CRM
- [ ] `FRESHDESK_API_KEY` - Freshdesk API key
- [ ] `FRESHDESK_DOMAIN` - Freshdesk domain (e.g., yourcompany.freshdesk.com)
- [ ] `NEXT_PUBLIC_FRESHDESK_ENABLED` - Enable/disable Freshdesk integration

### 🌐 Application Configuration
- [ ] `NEXT_PUBLIC_APP_URL` - Production app URL (e.g., https://promptandpause.com)
- [ ] `NODE_ENV` - Set to `production`

---

## 📋 Pre-Deployment Checklist

### Vercel Configuration
- [ ] All environment variables added to Vercel project settings
- [ ] Variables scoped correctly (Production, Preview, Development)
- [ ] Sensitive variables marked as sensitive in Vercel
- [ ] Test environment variables in Preview deployment first

### API Keys Validation
- [ ] All API keys are production keys (not test/sandbox)
- [ ] OpenRouter account has sufficient credits/quota
- [ ] Stripe webhook endpoint configured with production URL
- [ ] Resend domain verified and sender email approved
- [ ] Supabase project is on production plan (if needed)
- [ ] Upstash Redis has sufficient storage/requests

### Cron Jobs (Vercel Cron)
- [ ] `vercel.json` has cron job configurations
- [ ] Cron jobs use correct endpoints with CRON_SECRET
- [ ] Daily prompts: `/api/cron/send-daily-prompts` (hourly)
- [ ] Weekly insights: `/api/cron/regenerate-weekly-insights` (Mon/Fri 6am UTC)

### Security
- [ ] CRON_SECRET is a strong, random value
- [ ] ENCRYPTION_KEY is secure and backed up
- [ ] All Stripe webhook secrets match production webhooks
- [ ] No sensitive data hardcoded in codebase
- [ ] Rate limiting enabled on all public endpoints

---

## 🔄 AI Service Fallback Chain

**Order of Execution (Same for Prompts & Weekly Insights):**

1. **OpenRouter** (8 models: DeepSeek, Tongyi, LongCat, Nemotron, Claude Haiku, ERNIE, Qwen3, Grok)
2. **Hugging Face** (meta-llama/Llama-3.2-3B-Instruct)
3. **Gemini** (gemini-2.5-flash)
4. **OpenAI** (gpt-4o-mini)

**Environment Variable Support:**
- Set `OPENROUTER_MODEL_PREFS` to override model order (comma-separated)
- Missing API keys = provider skipped automatically

---

## ⚠️ Common Issues & Solutions

### Issue: Cron jobs not running
- **Solution**: Verify CRON_SECRET matches in both .env and cron job headers
- **Solution**: Ensure vercel.json cron schedule is valid

### Issue: AI generation fails
- **Solution**: Check all 4 AI provider API keys are valid
- **Solution**: Verify API quotas/credits haven't been exceeded
- **Solution**: Check console logs for specific provider errors

### Issue: Emails not sending
- **Solution**: Verify Resend domain is verified
- **Solution**: Check RESEND_FROM_EMAIL matches verified sender
- **Solution**: Review Resend dashboard for bounce/error logs

### Issue: Stripe webhooks failing
- **Solution**: Ensure STRIPE_WEBHOOK_SECRET matches production webhook
- **Solution**: Verify webhook endpoint URL in Stripe dashboard
- **Solution**: Check webhook event versions are supported

### Issue: Rate limiting not working
- **Solution**: Verify Upstash Redis connection with all KV_* variables
- **Solution**: Check Redis has sufficient storage quota
- **Solution**: Test with @upstash/ratelimit package directly

---

## 📊 Monitoring Post-Launch

### Day 1 Checklist
- [ ] Monitor Vercel deployment logs for errors
- [ ] Check Supabase database for new user signups
- [ ] Verify cron jobs execute successfully (check logs)
- [ ] Test Stripe checkout flow end-to-end
- [ ] Confirm emails are being sent and delivered
- [ ] Monitor AI API usage across all providers
- [ ] Check Redis rate limiting is preventing abuse

### Week 1 Checklist
- [ ] Review error logs and fix critical issues
- [ ] Monitor API response times and performance
- [ ] Check weekly insights generation for premium users
- [ ] Verify subscription renewals and billing
- [ ] Review user feedback and support tickets
- [ ] Analyze which AI providers are most used
- [ ] Optimize costs based on usage patterns

---

## 🆘 Emergency Contacts & Resources

### Rollback Plan
1. In Vercel dashboard, go to Deployments
2. Find previous stable deployment
3. Click "..." → "Promote to Production"
4. Rollback complete in ~30 seconds

### Service Dashboards
- **Vercel**: https://vercel.com/dashboard
- **Supabase**: https://supabase.com/dashboard
- **Stripe**: https://dashboard.stripe.com
- **Resend**: https://resend.com/emails
- **Upstash**: https://console.upstash.com
- **OpenRouter**: https://openrouter.ai/keys
- **Freshdesk**: https://[YOUR_DOMAIN].freshdesk.com

### Critical Metrics
- **Uptime Target**: 99.9%
- **API Response Time**: < 500ms (p95)
- **AI Generation Time**: < 5s (with fallbacks)
- **Email Delivery Rate**: > 95%
- **Error Rate**: < 0.1%

---

**Status**: ⏳ Ready for final review before production deployment
