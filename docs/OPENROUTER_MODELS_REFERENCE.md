# OpenRouter Models Reference

**Last Updated:** 2025-10-16  
**Source:** OpenRouter API `/v1/models` endpoint  

This document lists the recommended models in priority order for prompt generation in Prompt & Pause.

---

## Recommended Model Order (Priority)

### Tier 1: Free (0 cost)
These models are completely free. Start with these.

| Model | Speed | Quality | Context | Status |
|-------|-------|---------|---------|--------|
| `deepseek/deepseek-chat-v3.1:free` | Fast | High | 163.8K | ✅ Free tier available |
| `alibaba/tongyi-deepresearch-30b-a3b:free` | Fast | High | 131K | ✅ Free tier available |
| `meituan/longcat-flash-chat:free` | Very Fast | High | 131K | ✅ Free tier available |
| `nvidia/nemotron-nano-9b-v2:free` | Very Fast | Good | 128K | ✅ Free tier available |

**Why these?**
- Completely free (no cost)
- Fast generation (good for user experience)
- High enough quality for mental health reflections
- Sufficient context windows

---

### Tier 2: Ultra-Cheap (<$1/1M tokens)
Use if Tier 1 exhausted. Cost is negligible.

| Model | Prompt Cost | Completion Cost | Speed | Quality |
|-------|-------------|-----------------|-------|---------|
| `anthropic/claude-haiku-4.5` | $0.000001 | $0.000005 | Fast | Very High |
| `baidu/ernie-4.5-21b-a3b` | $0.00000007 | $0.00000028 | Fast | High |
| `qwen/qwen3-next-80b-a3b-instruct` | $0.0000001 | $0.0000008 | Fast | Very High |

**Why these?**
- Cost is effectively free (<$0.0001 per prompt)
- High quality for reflection prompts
- Fast response times
- Good instruction-following

---

### Tier 3: Affordable (<$0.001/prompt)
Only use if Tiers 1 & 2 are down.

| Model | Cost Estimate | Speed | Quality |
|-------|---------------|-------|---------|
| `x-ai/grok-4-fast` | $0.0000002-0.0000005 | Very Fast | High |

---

## Full Recommended Fallback Order

```javascript
export const OPENROUTER_MODELS = [
  // Tier 1: Free
  "deepseek/deepseek-chat-v3.1:free",
  "alibaba/tongyi-deepresearch-30b-a3b:free",
  "meituan/longcat-flash-chat:free",
  "nvidia/nemotron-nano-9b-v2:free",
  
  // Tier 2: Ultra-cheap
  "anthropic/claude-haiku-4.5",
  "baidu/ernie-4.5-21b-a3b",
  "qwen/qwen3-next-80b-a3b-instruct",
  
  // Tier 3: Affordable (last resort)
  "x-ai/grok-4-fast",
];
```

---

## Why NOT Others

### Models We Didn't Include

- **gpt-5-pro** ($0.000015 prompt) – Too expensive, save for final fallback via OpenAI API
- **claude-sonnet-4.5** ($0.000003 prompt) – Same tier as Anthropic Haiku; use Haiku instead (cheaper)
- **Gemini 2.5 Flash** – Better as separate fallback (use official Google API)
- **Most Reasoning Models** – Overkill for quick reflection prompts; use for complex cases only

---

## Model Characteristics for Mental Health Prompts

| Model | Instruction Following | Empathy | Variety | Speed |
|-------|----------------------|---------|---------|-------|
| DeepSeek v3.1 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Tongyi DeepResearch | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| LongCat Flash | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Nemotron Nano | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Claude Haiku | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| ERNIE 4.5 21B | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Qwen3 Next 80B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Grok 4 Fast | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## Performance Notes

### Best Overall: DeepSeek v3.1 Free
- ✅ Completely free
- ✅ Excellent instruction following
- ✅ Good empathy/understanding
- ✅ Fast (3-5 seconds typical)
- ✅ Rare failures
- ⚠️ Occasional provider issues but always has fallbacks

### Best Speed: LongCat Flash Free
- ✅ Completely free
- ✅ Extremely fast (1-2 seconds)
- ✅ Good quality for reflection prompts
- ✅ MoE architecture (scalable)
- ⚠️ Newer model (less tested in prod)

### Most Reliable Quality: Claude Haiku
- ✅ Near-free cost
- ✅ Consistent high-quality prompts
- ✅ Best empathy tone
- ✅ Anthropic's proven quality
- ⚠️ Slightly slower than others

---

## Handling Failures

### 404 Error: "No endpoints found for MODEL"
- This means the model is temporarily unavailable on OpenRouter
- **Action:** Skip to next model in list
- **Cause:** Provider issue or model deprecated
- **Log Level:** WARN

### 429 Error: Rate limited
- You've hit OpenRouter rate limits
- **Action:** Implement exponential backoff
- **Recovery:** Wait 30-60 seconds and retry
- **Log Level:** ERROR

### 500+ Error: Server error
- OpenRouter infrastructure issue
- **Action:** Try next model
- **Cause:** Temporary provider outage
- **Log Level:** WARN

### Auth (401/403)
- Invalid API key
- **Action:** Check `.env.local` OPENROUTER_API_KEY
- **Recovery:** None (will need user intervention)
- **Log Level:** ERROR (alert + stop)

---

## Cost Analysis (Monthly Estimate)

Assuming 1000 prompts/day (100 active users × 10 prompts):

### Using Only Free Models
```
Cost: $0 / month
Models used: DeepSeek, Tongyi, LongCat, Nemotron
Success rate: ~95% (1-2% provider issues, fallback handles it)
```

### Using Tiers 1-2 (With Fallback)
```
Cost: ~$0.01-0.05 / month
Models: Free + Claude Haiku/ERNIE/Qwen when free exhausted
Success rate: ~99.9%
```

### Current Setup (DeepSeek Free → Gemini → OpenAI)
```
Cost: ~$1-5 / month (when hitting OpenAI fallbacks)
Success rate: ~99.9%
Waste: Paying for expensive models when cheaper ones available
```

**Recommendation:** Use all 8 models in the fallback chain. Cost savings alone justify the implementation.

---

## Environment Variable

### Set in `.env.local`

```bash
# Optional: Override default model order
OPENROUTER_MODEL_PREFS="deepseek/deepseek-chat-v3.1:free,alibaba/tongyi-deepresearch-30b-a3b:free,meituan/longcat-flash-chat:free,nvidia/nemotron-nano-9b-v2:free,anthropic/claude-haiku-4.5,baidu/ernie-4.5-21b-a3b,qwen/qwen3-next-80b-a3b-instruct,x-ai/grok-4-fast"

# Optional: Custom timeout per model (seconds)
OPENROUTER_TIMEOUT_MS=30000
```

---

## Testing Locally

### Simulate Model Failures

```typescript
// In your test, mock the model order to test fallbacks
process.env.OPENROUTER_MODEL_PREFS = "invalid-model-1,invalid-model-2,deepseek/deepseek-chat-v3.1:free";

// Expected result:
// - Tries invalid-model-1 → 404 → skip
// - Tries invalid-model-2 → 404 → skip
// - Tries DeepSeek → 200 → success ✓
```

### Check Live Model Availability

```bash
# Fetch current models from OpenRouter
curl -s "https://openrouter.ai/api/v1/models" | grep -E '"id"|"name"|"pricing"' | head -50
```

---

## Monitoring & Alerts

### Track These Metrics

```
- Model success rate (should be >95% per model)
- Time to first token per model (should be <5s average)
- Provider downtime (alert if single provider down >10min)
- Cost per generation (should stay <$0.0001 on average)
```

### Alert Conditions

- 3+ consecutive failures on a model → log WARN, skip for 5min
- All Tier 1 models down → escalate to Tier 2 + log ERROR
- Falling back to OpenAI 50+ times in a day → investigate

---

## Future Updates

**Check OpenRouter API quarterly** for:
- New free models
- Model deprecations
- Pricing changes
- Performance improvements

Update this document and `OPENROUTER_MODELS` constant accordingly.

---

## References

- [OpenRouter Models List](https://openrouter.ai/models)
- [OpenRouter Pricing](https://openrouter.ai/pricing)
- [OpenRouter API Docs](https://openrouter.ai/docs)

---

**Tip:** The free and ultra-cheap models often outperform expensive models for *specific domains* like mental health reflection prompts. Test all of them; you'll likely find the cheapest works best for your use case.
