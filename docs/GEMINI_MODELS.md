# Available Gemini Models

Last updated: October 13, 2025

## Recommended Models for Prompt Generation

### 🥇 Primary Choice: `gemini-2.5-flash`
- **Status:** Stable (Released June 2025)
- **Input Tokens:** 1,048,576 (1M tokens)
- **Output Tokens:** 65,536
- **Description:** Latest stable version with best performance
- **Why use it:** Most reliable, well-tested, excellent for production

### 🔄 Auto-Update Option: `gemini-flash-latest`
- **Status:** Always points to latest Flash release
- **Input Tokens:** 1,048,576 (1M tokens)
- **Output Tokens:** 65,536
- **Description:** Automatically uses the newest Flash version
- **Why use it:** Always get latest features without code changes
- **Risk:** May introduce breaking changes with updates

### 📊 Alternative Options

#### Gemini 2.0 Flash (Older but stable)
- **Model:** `gemini-2.0-flash-001`
- **Released:** January 2025
- **Input:** 1M tokens
- **Output:** 8,192 tokens
- **Use case:** If 2.5 has issues, fallback to 2.0

#### Gemini 2.5 Flash-Lite (Faster, smaller)
- **Model:** `gemini-2.5-flash-lite`
- **Released:** July 2025
- **Input:** 1M tokens
- **Output:** 65,536 tokens
- **Use case:** Need faster responses, less complex prompts

#### Gemini 2.5 Pro (Most powerful)
- **Model:** `gemini-2.5-pro`
- **Released:** June 2025
- **Input:** 1M tokens
- **Output:** 65,536 tokens
- **Use case:** Complex reasoning, detailed analysis (not needed for simple prompts)

---

## How to Check Available Models

Run the included script:
```bash
node scripts/list-gemini-models.js
```

This will:
- List all available models
- Show supported methods
- Display token limits
- Highlight models that support `generateContent`

---

## Model Selection Criteria

### For Prompt Generation (Our Use Case)

**Requirements:**
- ✅ Supports `generateContent` method
- ✅ Fast response time (Flash models)
- ✅ Good with short prompts (15-25 words)
- ✅ Creative, conversational output
- ✅ Free tier friendly

**Current Choice:** `gemini-2.5-flash`
- Perfect balance of speed, quality, and stability
- Proven track record since June 2025
- Handles conversational prompts excellently

---

## API Version Notes

### v1beta API
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **Stability:** Beta, features may change
- **Models:** All Gemini 2.x models available
- **Our usage:** Yes (required for latest models)

### v1 API (Stable)
- **Endpoint:** `https://generativelanguage.googleapis.com/v1/models/{model}:generateContent`
- **Stability:** Stable, backwards compatible
- **Models:** Limited to older versions
- **Our usage:** No (doesn't have Gemini 2.5)

---

## Common Errors

### 404 Not Found
```
models/gemini-X-Y-Z is not found for API version v1beta
```

**Solution:** 
1. Run `node scripts/list-gemini-models.js` to see available models
2. Use an exact model name from the list (e.g., `gemini-2.5-flash`)
3. Don't use suffixes like `-latest` unless it's in the official list

### 400 Bad Request
```
Invalid model name
```

**Solution:**
- Remove any extra text or version suffixes
- Use full model name with `models/` prefix in some contexts
- For our SDK: use just the model name (e.g., `gemini-2.5-flash`)

---

## Migration Guide

### From Gemini 1.5 → 2.5

```typescript
// OLD (no longer works)
const GEMINI_MODEL = 'gemini-1.5-flash-latest'

// NEW (stable)
const GEMINI_MODEL = 'gemini-2.5-flash'

// NEW (auto-update)
const GEMINI_MODEL = 'gemini-flash-latest'
```

**Breaking changes:** None for prompt generation use case

**Performance improvements:**
- 2x faster generation
- Better context understanding
- More natural, conversational output
- Larger output token limit

---

## Cost & Rate Limits

### Free Tier (as of Oct 2025)
- **Rate:** 15 requests per minute
- **Daily quota:** 1,500 requests per day
- **Token limits:** Same as model specs
- **Cost:** FREE ✨

### Paid Tier
- **Rate:** Higher limits
- **Cost:** Pay per million tokens
- **When needed:** If exceeding free tier limits

**Our usage:** Free tier is sufficient for mental wellness prompts

---

## Testing Different Models

To test a different model, update `lib/services/aiService.ts`:

```typescript
// Line 25
const GEMINI_MODEL = 'gemini-2.5-flash' // Change this
```

Then restart your dev server:
```bash
npm run dev
```

---

## Monitoring Model Changes

**Recommended:**
1. Subscribe to Google AI newsletter for model updates
2. Check https://ai.google.dev/gemini-api/docs/models monthly
3. Run `node scripts/list-gemini-models.js` before major deployments
4. Test new models in development before switching in production

---

## Questions?

- **Google AI Docs:** https://ai.google.dev/gemini-api/docs/models
- **Model List Script:** `node scripts/list-gemini-models.js`
- **API Keys:** https://aistudio.google.com/app/apikey

**Last model check:** October 13, 2025
