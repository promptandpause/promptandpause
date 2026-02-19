# How to Get Your FREE Google Gemini API Key

## ✅ Why Gemini?

- **100% FREE**: No credit card required, ever
- **Generous Limits**: 1,500 requests/day, 15 requests/minute
- **High Quality**: Gemini 1.5 Flash Latest is fast and intelligent
- **Forever Free**: Not a trial - free tier is permanent
- **Perfect for Your App**: Way more than enough for daily prompts + weekly insights

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Visit Google AI Studio
Go to: **https://aistudio.google.com/app/apikey**

### Step 2: Sign In
- Use your existing Google account (Gmail)
- No signup fees, no credit card required

### Step 3: Create API Key
1. Click **"Get API Key"** or **"Create API Key"**
2. Select **"Create API key in new project"** (or use existing project)
3. Click **"Create API key"**
4. **COPY THE KEY IMMEDIATELY** (you can't see it again!)

### Step 4: Add to Your Project
1. Open `.env.local` in your project root
2. Find this line:
   ```bash
   GEMINI_API_KEY=your_gemini_key_here
   ```
3. Replace `your_gemini_key_here` with your actual key
4. Save the file

### Step 5: Test It
```bash
npm run dev
```

You should see in the console:
```
✓ Generating prompt with Google Gemini (free tier)...
✓ Successfully generated prompt with Gemini
```

---

## 📋 Example Configuration

Your `.env.local` should look like this:

```bash
# Primary AI provider: Google Gemini (FREE tier!)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY  # Add your own key

# Backup AI provider: OpenAI
OPENAI_API_KEY=YOUR_OPENAI_API_KEY  # Add your own key
```

---

## 💰 Cost Comparison

| Provider | Free Tier | Cost After Free |
|----------|-----------|-----------------|
| **Gemini** | ✅ **1,500 req/day** | Very cheap |
| OpenAI | ❌ No free tier | $0.15 / 1M tokens |
| xAI/Grok | ❌ No free tier | Requires prepaid credits |
| Groq | ⚠️ Unreliable | Varies |

**For your app:**
- ~50 users = ~50 prompts/day + ~10 insights/week = **~60 requests/day**
- Gemini free tier = **1,500 requests/day** 
- **You're covered for 25x your current usage! 🎉**

---

## 🔍 Usage Limits (Free Tier)

```
Daily Requests: 1,500
Per Minute: 15
Tokens per Request: 32,000 input + 8,000 output

Your typical usage:
- Daily prompt: ~500 tokens
- Weekly insight: ~1,200 tokens

You could support ~300 daily users on free tier alone!
```

---

## ✨ What You Get

### Gemini 1.5 Flash Features:
- ✅ Fast responses (<1 second)
- ✅ Natural, conversational output
- ✅ Great at personalization
- ✅ Understands context well
- ✅ Multimodal (text, images - if you expand later)
- ✅ Long context window (32k tokens)

---

## 🛠️ Troubleshooting

### Error: "API key not valid"
- Check you copied the entire key (starts with `AIzaSy...`)
- Make sure there are no spaces or line breaks
- Verify it's saved in `.env.local`
- Restart your dev server: `npm run dev`

### Error: "403 Forbidden" or "401 Unauthorized"
- Your API key may be restricted to specific IPs
- Go back to Google AI Studio → Click your key → "Unrestricted" or add your IP
- Make sure API is enabled for your project

### Not seeing "Generated with Gemini" in logs?
```bash
# Check your .env.local has:
GEMINI_API_KEY=YOUR_GEMINI_API_KEY  # Your actual key

# Restart your server:
npm run dev
```

### "Quota exceeded"
- You hit the 1,500/day limit (unlikely!)
- Wait until midnight UTC for reset
- Or upgrade to paid tier (still very cheap)

---

## 🔐 Security Best Practices

1. **Never commit** `.env.local` to GitHub
2. **Keep your key secret** - it's like a password
3. **Regenerate key** if accidentally exposed:
   - Go to Google AI Studio
   - Delete old key
   - Create new key
   - Update `.env.local`

---

## 📊 Monitor Your Usage

Track your API usage at:
**https://aistudio.google.com/app/apikey**

You'll see:
- Total requests today
- Requests per minute
- Any errors or rate limits

---

## 🚀 Next Steps

1. ✅ Get your FREE API key: https://aistudio.google.com/app/apikey
2. ✅ Add to `.env.local`
3. ✅ Run `npm run dev`
4. ✅ Test a daily prompt generation
5. ✅ Enjoy unlimited free AI for your app!

---

## 📚 Resources

- **Get API Key**: https://aistudio.google.com/app/apikey
- **Gemini Docs**: https://ai.google.dev/docs
- **Pricing**: https://ai.google.dev/pricing
- **Support**: https://ai.google.dev/support

---

**🎉 Congratulations! You now have a FREE, high-quality AI provider that will easily handle your app's needs!**
