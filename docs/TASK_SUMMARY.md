# Task Summary: Prompt Generation Fixes

## What You Asked For

1. **Fix OpenRouter** – Use multiple available endpoints instead of just one
2. **Define focus area tiers** – Freemium (predefined) vs Premium (custom) with dynamic updates
3. **Create database schemas** – For focus areas and prompt/reflection tracking
4. **Make reflection counts update dynamically** – Real-time UI updates after prompts are generated

---

## What I've Delivered

### 📋 Task Plan Document
**File:** `TASK_PLAN_PROMPT_GENERATION_FIXES.md`

**Contains:**
- Complete technical design with code examples
- Database migration SQL
- API routes for stats and prompt generation
- React Query integration for real-time updates
- 5-phase implementation schedule
- Testing strategy and rollout plan

### ✅ 16-Item TODO List
All organized and ready to track progress through implementation.

---

## Key Decisions Made

### 1. OpenRouter Multi-Model Strategy
**Free/Cheap Models to Try (in order):**
```
1. deepseek/deepseek-chat-v3.1:free (0 cost)
2. x-ai/grok-4-fast
3. alibaba/tongyi-deepresearch-30b-a3b:free (0 cost)
4. meituan/longcat-flash-chat:free (0 cost)
5. nvidia/nemotron-nano-9b-v2:free (0 cost)
6. baidu/ernie-4.5-21b-a3b
7. qwen/qwen3-next-80b-a3b-instruct
8. anthropic/claude-haiku-4.5
```

**Then fallback to:** Gemini → OpenAI

### 2. Focus Area Architecture

**Freemium (Free Users):**
- Max 10 predefined areas (Career, Health, Relationships, etc.)
- Stored in `user_preferences.focus_areas` (existing TEXT[])
- Chosen during onboarding

**Premium (Paid Users):**
- Unlimited custom areas with priority weighting
- Stored in new `focus_areas` table
- Can be updated anytime

**Prompt Generation:**
- Always select exactly ONE focus area per generation (weighted random for premium)
- Embed it explicitly in system prompt
- Track which area was used via `prompt_focus_area_usage` table

### 3. Database Changes
**New Tables:**
- `focus_areas` – Custom areas for premium users
- `prompt_focus_area_usage` – Track which area was used per prompt

**Altered Tables:**
- `prompts_history` – Add `provider`, `model`, `focus_area_used` columns

### 4. Real-Time Reflection Counts
**New Endpoint:** `GET /api/reflections/stats`
- Returns: `{ total, last7Days, today }`

**Client-Side:**
- React Query invalidates cache after prompt generation and reflection creation
- Automatic refetch keeps UI in sync
- 30-second stale time for balance between freshness and performance

---

## Files to Create/Modify

### New Files
```
supabase/migrations/001_focus_areas.sql          -- DB schema
lib/constants/focusAreas.ts                      -- Freemium area list
app/api/reflections/stats/route.ts               -- Stats endpoint
app/api/debug/ai-status/route.ts (optional)     -- Debug observability
hooks/usePromptGeneration.ts                     -- React Query setup
```

### Modified Files
```
lib/services/aiService.ts                        -- Multi-model fallback
lib/services/userService.ts                      -- Focus area CRUD
lib/types/reflection.ts                          -- Type updates
app/api/prompts/generate/route.ts               -- Integration
```

---

## Implementation Roadmap

### Phase 1: Database (Days 1–2)
- [ ] Write migration SQL
- [ ] Create types
- [ ] Test on staging

### Phase 2: AI Service (Days 3–4)
- [ ] Implement OpenRouter loop
- [ ] Add focus area selection logic
- [ ] Test fallbacks

### Phase 3: Integration (Days 5–6)
- [ ] Update prompt generation route
- [ ] Add stats endpoint
- [ ] Wire up tier checks

### Phase 4: Client (Days 7–8)
- [ ] Set up React Query
- [ ] Display focus area on UI
- [ ] Auto-refresh counts

### Phase 5: QA & Docs (Days 9–10)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Update README

---

## Critical Config Values

Add to `.env.local` (if not present):

```env
# Already set in your .env.local:
OPENROUTER_API_KEY=sk-or-v1-...

# Optional overrides:
OPENROUTER_MODEL_PREFS=deepseek/...,x-ai/...,alibaba/...
NODE_ENV=development
```

---

## Console Log Examples (After Implementation)

```
[PROMPT_GEN] tier=premium, focus_area=Health, provider=openai, model=deepseek/deepseek-chat-v3.1:free
✓ Successfully generated with deepseek/deepseek-chat-v3.1:free

[PROMPT_GEN] tier=freemium, focus_area=Career, provider=gemini, model=gemini-2.5-flash
⚠ All OpenRouter models exhausted. Falling back to Gemini.
✓ Successfully generated with Gemini

[STATS] total_reflections=45, last7=12, today=1
✓ Reflection count updated dynamically on client
```

---

## Expected Outcomes After Implementation

✅ OpenRouter tries 8 different models before falling back  
✅ Focus areas are tier-specific and properly displayed  
✅ Prompts explicitly mention the selected focus area  
✅ Reflection counts update in real-time on dashboard  
✅ All changes are logged for debugging  
✅ Database is optimized with proper indexes and RLS  

---

## Questions or Clarifications?

Feel free to review the full plan document and let me know:
- Any models you'd prefer to prioritize/deprioritize in the OpenRouter list
- Specific predefined focus areas if the list of 10 needs adjustment
- UI details for how focus areas should be displayed
- Performance requirements for reflection count updates

Ready to start implementation whenever you are! 🚀
