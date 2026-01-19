# Task Plan: Fix Prompt Generation & Focus Areas

**Date**: 2025-10-16  
**Status**: Planning Phase  
**Owner**: Development Team  
**Priority**: High

---

## Overview

Three interconnected improvements to the prompt generation system:

1. **OpenRouter Multi-Model Fallback** – Try multiple free/cheap OpenRouter models before falling back to Gemini/OpenAI
2. **Focus Area Priority** – Distinguish between freemium (predefined) and premium (custom) focus areas; always pick one during prompt generation
3. **Dynamic Reflection Count Updates** – Real-time UI updates after prompts and reflections are created

---

## Problem Summary

### Issue 1: OpenRouter Hardcoded Single Model
**Current Behavior:**
```
OpenRouter API error: 404 No endpoints found for meta-llama/llama-3.1-8b-instruct:free.
Falling back to Google Gemini...
Falling back to OpenAI...
Successfully generated prompt with OpenAI
```

**Root Cause:** Only one OpenRouter model is configured; when it fails, immediate fallback to Gemini/OpenAI wastes the free tier.

**Desired Behavior:** Try multiple OpenRouter models (DeepSeek, Grok, LongCat, etc.) sequentially before falling back.

---

### Issue 2: Focus Area Mishandling & Lack of Tier Distinction
**Current Behavior:**
- Line 103 in `app/api/prompts/generate/route.ts`: "Using freemium focus areas" – misleading label
- Focus areas are included in the context but don't guarantee prompt will actually address them
- No weight/priority if user has multiple focus areas
- Premium users can't create custom focus areas

**Desired Behavior:**
- **Freemium:** Limited to ~10 predefined focus areas chosen during onboarding
- **Premium:** Unlimited custom focus areas with optional priority weighting
- **Prompt Generation:** Always pick ONE focus area (weighted random for premium); embed it explicitly in the system prompt
- **Logging:** Clearly distinguish tier and focus area selection

---

### Issue 3: Reflection Count Not Updating Dynamically
**Current Behavior:**
- User generates a prompt; reflection count remains unchanged
- User must manually refresh to see the updated count

**Desired Behavior:**
- After prompt generation, the reflection count on the dashboard updates automatically
- API endpoint `/api/reflections/stats` provides fresh counts
- Client invalidates cache and refetches via React Query/SWR after key mutations

---

## Technical Design

### Part 1: OpenRouter Multi-Model Fallback

#### New Constants (config)
```typescript
// lib/services/aiService.ts

export const OPENROUTER_MODELS = [
  // Free tier (0 cost or very cheap)
  "deepseek/deepseek-chat-v3.1:free",
  "x-ai/grok-4-fast",
  "alibaba/tongyi-deepresearch-30b-a3b:free",
  "meituan/longcat-flash-chat:free",
  "nvidia/nemotron-nano-9b-v2:free",
  // Affordable (< $1 per 1M tokens)
  "baidu/ernie-4.5-21b-a3b",
  "qwen/qwen3-next-80b-a3b-instruct",
  "anthropic/claude-haiku-4.5",
];

export const OPENROUTER_MAX_RETRIES = 3; // retry attempts per model
export const OPENROUTER_TIMEOUT_MS = 30000;
```

#### Enhanced Generation Function
```typescript
async function generateWithOpenRouter(
  systemPrompt: string,
  userContext: string
): Promise<{ text: string; model: string } | null> {
  if (!openrouter) {
    console.warn('OPENROUTER_API_KEY not configured');
    return null;
  }

  const models = (process.env.OPENROUTER_MODEL_PREFS || '')
    .split(',')
    .map(m => m.trim())
    .filter(Boolean)
    || OPENROUTER_MODELS;

  for (const model of models) {
    try {
      console.log(`Trying OpenRouter model: ${model}`);
      
      const completion = await openrouter.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContext },
        ],
        temperature: 0.9,
        max_tokens: 100,
        top_p: 0.95,
      });

      const text = completion.choices[0]?.message?.content?.trim();
      if (text) {
        console.log(`✓ Successfully generated with ${model}`);
        return { text, model };
      }
    } catch (error: any) {
      const status = error?.status || 'unknown';
      const message = error?.message || String(error);
      
      if (status === 404) {
        console.warn(`⚠ Model not available: ${model} (404 No endpoints found)`);
      } else if (status >= 500) {
        console.warn(`⚠ OpenRouter server error: ${model} (${status})`);
      } else if (status >= 400) {
        // Auth, rate limit, etc. – may want to stop retrying
        console.error(`✗ OpenRouter client error: ${model} (${status}) – ${message}`);
      } else {
        console.warn(`⚠ OpenRouter error: ${model} – ${message}`);
      }
    }
  }

  console.error('✗ All OpenRouter models exhausted. Falling back to Gemini.');
  return null;
}
```

#### Main Generation Flow
```typescript
export async function generatePrompt(context: GeneratePromptContext): Promise<{
  prompt: string;
  provider: AIProvider;
  model: string;
}> {
  const systemPrompt = buildSystemPrompt();
  const userContext = buildUserContext(context);

  // Try OpenRouter (with multi-model fallback)
  if (openrouter) {
    const result = await generateWithOpenRouter(systemPrompt, userContext);
    if (result) {
      return {
        prompt: result.text,
        provider: 'openai', // OpenRouter uses OpenAI-compatible API
        model: result.model,
      };
    }
  }

  // Fallback to Gemini
  if (gemini) {
    try {
      console.log('Falling back to Google Gemini...');
      const prompt = await generateWithGemini(systemPrompt, userContext);
      if (prompt) {
        return {
          prompt,
          provider: 'gemini',
          model: GEMINI_MODEL,
        };
      }
    } catch (error) {
      console.error('Gemini generation failed:', error);
    }
  }

  // Final fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log('Falling back to OpenAI...');
      const prompt = await generateWithOpenAI(systemPrompt, userContext);
      if (prompt) {
        return {
          prompt,
          provider: 'openai',
          model: OPENAI_MODEL,
        };
      }
    } catch (error) {
      console.error('OpenAI generation failed:', error);
    }
  }

  throw new Error('Failed to generate prompt with available AI providers');
}
```

---

### Part 2: Focus Area Tier & Selection Logic

#### Database Schema Changes

**New Tables:**

```sql
-- 1) Custom focus areas (premium feature)
CREATE TABLE public.focus_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  priority INTEGER DEFAULT 0, -- Higher = weighted more in random selection
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.focus_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their focus areas" ON public.focus_areas
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_focus_areas_user ON public.focus_areas(user_id);
CREATE INDEX idx_focus_areas_active ON public.focus_areas(user_id, is_active);

-- 2) Track focus area usage per prompt
CREATE TABLE public.prompt_focus_area_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts_history(id) ON DELETE CASCADE,
  focus_area_id UUID REFERENCES public.focus_areas(id) ON DELETE SET NULL,
  focus_area_name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.prompt_focus_area_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their usage" ON public.prompt_focus_area_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert their usage" ON public.prompt_focus_area_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_usage_prompt ON public.prompt_focus_area_usage(prompt_id);
CREATE INDEX idx_usage_user ON public.prompt_focus_area_usage(user_id);

-- 3) Update prompts_history to track provider, model, focus area
ALTER TABLE public.prompts_history
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS focus_area_used TEXT;
```

#### Freemium Focus Area Predefined List
```typescript
// lib/constants/focusAreas.ts

export const FREEMIUM_FOCUS_AREAS = [
  { name: 'Career', description: 'Work growth and professional development' },
  { name: 'Relationships', description: 'Family, friendships, and connections' },
  { name: 'Health', description: 'Physical and mental wellbeing' },
  { name: 'Finances', description: 'Money, savings, and financial goals' },
  { name: 'Personal Growth', description: 'Learning, skills, and self-improvement' },
  { name: 'Mindfulness', description: 'Meditation, presence, and calm' },
  { name: 'Gratitude', description: 'Appreciation and positive perspective' },
  { name: 'Family', description: 'Family dynamics and relationships' },
  { name: 'Self-Esteem', description: 'Confidence and self-worth' },
  { name: 'Work-Life Balance', description: 'Managing priorities and boundaries' },
];
```

#### UserService CRUD Functions
```typescript
// lib/services/userService.ts

/**
 * Get user's subscription tier
 */
export async function getUserTier(
  userId: string
): Promise<{ tier: SubscriptionTier; error?: string }> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { tier: 'freemium' }; // Safe fallback
    }

    const tier = data.subscription_status === 'active' ? data.subscription_tier : 'freemium';
    return { tier };
  } catch (error) {
    console.error('Error getting user tier:', error);
    return { tier: 'freemium' };
  }
}

/**
 * List focus areas for user (merged premium + freemium)
 */
export async function listFocusAreas(userId: string): Promise<{
  areas: Array<{ id?: string; name: string; priority?: number; isPremium: boolean }>;
  error?: string;
}> {
  try {
    const supabase = createServiceRoleClient();
    const { tier } = await getUserTier(userId);

    const areas: typeof Promise.resolve({ areas: [] }).then(r => r.areas) = [];

    if (tier === 'premium') {
      // Fetch custom premium focus areas
      const { data, error } = await supabase
        .from('focus_areas')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) {
        console.error('Error fetching premium focus areas:', error);
      } else {
        areas.push(
          ...(data || []).map(a => ({
            id: a.id,
            name: a.name,
            priority: a.priority,
            isPremium: true,
          }))
        );
      }
    }

    // For both tiers: fetch freemium defaults from user_preferences
    const { data: prefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('focus_areas')
      .eq('user_id', userId)
      .single();

    if (!prefsError && prefs?.focus_areas) {
      areas.push(
        ...prefs.focus_areas.map(name => ({
          name,
          isPremium: false,
        }))
      );
    }

    return { areas };
  } catch (error) {
    console.error('Unexpected error listing focus areas:', error);
    return { areas: [], error: String(error) };
  }
}

/**
 * Create custom focus area (premium only)
 */
export async function createFocusArea(
  userId: string,
  data: { name: string; description?: string; color?: string; icon?: string; priority?: number }
): Promise<{ area?: any; error?: string }> {
  try {
    const { tier } = await getUserTier(userId);
    if (tier !== 'premium') {
      return { error: 'Custom focus areas are a premium feature' };
    }

    const supabase = createServiceRoleClient();
    const { data: area, error } = await supabase
      .from('focus_areas')
      .insert({
        user_id: userId,
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        priority: data.priority || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating focus area:', error);
      return { error: error.message };
    }

    return { area };
  } catch (error) {
    console.error('Unexpected error creating focus area:', error);
    return { error: String(error) };
  }
}

/**
 * Update focus area
 */
export async function updateFocusArea(
  areaId: string,
  userId: string,
  updates: Partial<{ name: string; description: string; color: string; priority: number; is_active: boolean }>
): Promise<{ area?: any; error?: string }> {
  try {
    const { tier } = await getUserTier(userId);
    if (tier !== 'premium') {
      return { error: 'Custom focus areas are a premium feature' };
    }

    const supabase = createServiceRoleClient();
    const { data: area, error } = await supabase
      .from('focus_areas')
      .update(updates)
      .eq('id', areaId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating focus area:', error);
      return { error: error.message };
    }

    return { area };
  } catch (error) {
    console.error('Unexpected error updating focus area:', error);
    return { error: String(error) };
  }
}

/**
 * Delete focus area
 */
export async function deleteFocusArea(areaId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { tier } = await getUserTier(userId);
    if (tier !== 'premium') {
      return { success: false, error: 'Custom focus areas are a premium feature' };
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase.from('focus_areas').delete().eq('id', areaId).eq('user_id', userId);

    if (error) {
      console.error('Error deleting focus area:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting focus area:', error);
    return { success: false, error: String(error) };
  }
}
```

#### Focus Area Selection in Prompt Context
```typescript
// lib/services/aiService.ts – updated buildUserContext()

function buildUserContext(context: GeneratePromptContext): string {
  // ... existing code ...
  
  // Improved focus areas section
  if (context.focus_areas && context.focus_areas.length > 0) {
    const selectedArea = selectRandomFocusArea(context.focus_areas, context.focusAreaWeights);
    
    if (selectedArea) {
      profile.push(
        `**Current Focus Area (This is the priority):**\n` +
        `They want to explore: **${selectedArea}**\n` +
        `Make this the center of your prompt. Do not ignore this area. Build your reflection question directly around this topic.`
      );
    } else if (context.focus_areas.length > 1) {
      profile.push(
        `**Growth Areas:**\nThey're working on: ${context.focus_areas.join(', ')}\n` +
        `Pick one naturally and focus on it.`
      );
    } else {
      profile.push(
        `**Current Focus Area:**\nThey're focusing on: ${context.focus_areas[0]}`
      );
    }
  }

  return profile.join('\n\n') + instruction;
}

// Helper: weighted random selection for premium, simple random for freemium
function selectRandomFocusArea(
  areas: string[],
  weights?: Record<string, number>
): string | null {
  if (areas.length === 0) return null;
  if (areas.length === 1) return areas[0];

  if (weights) {
    // Weighted random (premium with priorities)
    const weighted = areas
      .map(area => ({ area, weight: weights[area] || 1 }))
      .sort((a, b) => b.weight - a.weight);

    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const { area, weight } of weighted) {
      random -= weight;
      if (random <= 0) return area;
    }

    return weighted[0].area;
  } else {
    // Simple random (freemium)
    return areas[Math.floor(Math.random() * areas.length)];
  }
}
```

---

### Part 3: Reflection Count Dynamic Updates

#### New API Endpoint
```typescript
// app/api/reflections/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/reflections/stats
 * Returns reflection counts for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const last7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch all counts in parallel
    const [{ count: totalCount }, { count: last7Count }, { count: todayCount }] =
      await Promise.all([
        supabase
          .from('reflections')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('reflections')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('date', last7),
        supabase
          .from('reflections')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('date', today),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        total: totalCount || 0,
        last7Days: last7Count || 0,
        today: todayCount || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching reflection stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
```

#### Updated Prompt Generation Route
```typescript
// app/api/prompts/generate/route.ts – key changes

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ... existing rate limit and prompt check ...

    // Get user tier and focus areas
    const { tier } = await getUserTier(user.id);
    const { areas } = await listFocusAreas(user.id);

    // ... existing context building ...

    // Generate prompt (now returns provider and model)
    const { prompt, provider, model } = await generatePrompt(context);

    // Select focus area for this generation
    const focusAreaWeights = tier === 'premium'
      ? Object.fromEntries(areas
          .filter(a => a.isPremium && a.priority !== undefined)
          .map(a => [a.name, (a.priority || 0) + 1]))
      : undefined;

    const selectedFocusArea = selectRandomFocusArea(
      areas.map(a => a.name),
      focusAreaWeights
    );

    console.log(`Generating prompt with ${tier} tier, focus area: ${selectedFocusArea}`);

    // Save prompt with new fields
    const { data: savedPrompt, error: saveError } = await supabase
      .from('prompts_history')
      .insert({
        user_id: user.id,
        prompt_text: prompt,
        ai_provider: provider,
        ai_model: model,
        provider,
        model,
        focus_area_used: selectedFocusArea,
        personalization_context: context,
        date_generated: today,
        used: false,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving prompt:', saveError);
      // Continue even if save fails
    } else if (savedPrompt && selectedFocusArea) {
      // Track focus area usage
      const focusAreaId = tier === 'premium'
        ? areas.find(a => a.name === selectedFocusArea)?.id
        : null;

      await supabase.from('prompt_focus_area_usage').insert({
        prompt_id: savedPrompt.id,
        focus_area_id: focusAreaId || null,
        focus_area_name: selectedFocusArea,
        user_id: user.id,
      }).catch(e => console.warn('Usage tracking failed:', e));
    }

    // Return with all metadata
    return NextResponse.json({
      success: true,
      data: {
        id: savedPrompt?.id,
        prompt_text: prompt,
        ai_provider: provider,
        ai_model: model,
        focus_area_used: selectedFocusArea,
        date_generated: today,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/prompts/generate:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

#### Client-Side React Query Integration
```typescript
// hooks/usePromptGeneration.ts (or similar)

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useGeneratePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/prompts/generate', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate prompt');
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch stats
      queryClient.invalidateQueries({ queryKey: ['reflections', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['prompts', 'today'] });
    },
  });
}

export function useReflectionStats() {
  return useQuery({
    queryKey: ['reflections', 'stats'],
    queryFn: async () => {
      const res = await fetch('/api/reflections/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    staleTime: 30_000, // 30 seconds
  });
}
```

---

## Implementation Phases

### Phase 1: Foundation (Days 1–2)
- [ ] Database migrations: new tables and columns
- [ ] Type updates: GeneratePromptContext, GeneratePromptResult
- [ ] UserService tier and focus area CRUD

### Phase 2: AI Service (Days 3–4)
- [ ] OpenRouter multi-model fallback implementation
- [ ] System prompt updates to embed selected focus area
- [ ] Testing with mock failures

### Phase 3: Integration (Days 5–6)
- [ ] Update `/api/prompts/generate` to use new schema and AI service
- [ ] Add `/api/reflections/stats` endpoint
- [ ] Reflection creation also invalidates cache

### Phase 4: UI & Observability (Days 7–8)
- [ ] Client React Query setup
- [ ] Display selected focus area and model/provider on prompt card
- [ ] Logs and debug route for OpenRouter status
- [ ] Migration scripts for historical data

### Phase 5: QA & Polish (Days 9–10)
- [ ] Unit tests (fallback, focus area selection)
- [ ] Integration tests (RLS, persistence)
- [ ] End-to-end tests (count updates, multi-prompt generation)
- [ ] Docs and examples

---

## Testing Strategy

### Unit Tests
1. **OpenRouter Fallback:**
   - Mock API responses (200, 404, 500)
   - Verify correct model order and fallback
   - Ensure Gemini/OpenAI are tried only after all OpenRouter models fail

2. **Focus Area Selection:**
   - Premium with priorities: weighted random produces expected distribution
   - Freemium: simple random from list
   - Fallback when no areas set

### Integration Tests
1. **Tier Enforcement:**
   - Freemium users cannot create custom focus areas
   - Premium users can CRUD

2. **Persistence:**
   - Prompt saved with provider, model, focus_area_used
   - Usage record inserted correctly
   - RLS policies prevent cross-user access

3. **Stats API:**
   - Counts are accurate and real-time
   - Pagination/filtering if added later

### E2E Tests
1. Generate multiple prompts; verify focus areas rotate
2. Create reflection after prompt; count increments on dashboard
3. Refresh; count persists

---

## Rollout Plan

1. **Staging:** Deploy to staging; run full test suite
2. **Canary:** 10% of users; monitor logs for OpenRouter failures
3. **Gradual Rollout:** 50% → 100% over 24–48 hours
4. **Monitoring:** Alerting for repeated 404s, generation failures
5. **Fallback:** If critical issues, disable focus area selection; always use OpenRouter models in order without weighting

---

## Observability & Debugging

### Logging
```typescript
console.log(`[PROMPT_GEN] tier=${tier}, focus_area=${selectedFocusArea}, provider=${provider}, model=${model}`);
console.warn(`[OPENROUTER] model=${model} failed: status=${status}, code=${code}`);
```

### Debug Endpoint
```
GET /api/debug/ai-status
Response:
{
  "activeModels": ["deepseek/...", "x-ai/..."],
  "failedAttempts": [
    { "model": "...", "failures": 2, "lastFailedAt": "...", "status": 404 }
  ],
  "lastSelectedFocusAreas": { "user123": "Health", "user456": "Career" }
}
```

### Metrics to Track
- Prompt generation success rate by provider
- Average latency per OpenRouter model
- Fallback usage (% via Gemini/OpenAI)
- Focus area usage distribution (freemium vs premium)
- Reflection count update latency

---

## Dependencies & Prerequisites

- ✅ Supabase CLI access
- ✅ React Query or SWR installed
- ✅ OpenRouter API key validated
- ✅ Test data (users, reflections) for QA
- ✅ Staging environment ready

---

## Success Criteria

1. **OpenRouter:** No 404 errors in logs; successful fallback to other models observed
2. **Focus Areas:** Premium users can create custom areas; all prompts reference selected area
3. **Counts:** Reflection count updates within 500ms of API response on client
4. **Logs:** Clear, structured logs for each phase (model attempt, selection, generation, persistence)
5. **Tests:** >90% test coverage on new code; all integration tests passing
6. **Docs:** README updated; examples provided for future developers

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| OpenRouter API outage | Fallback to Gemini/OpenAI always available |
| Focus area data corruption | RLS policies + UNIQUE constraints + migrations tested on staging |
| Client out-of-sync counts | React Query cache invalidation on mutations |
| Performance regression | Profile key endpoints; add caching if needed |

---

## Next Steps

1. Review this plan with the team
2. Create migration files in `supabase/migrations/`
3. Begin Phase 1 implementation
4. Kickoff standup: review progress daily

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-16  
**Reviewed By:** —  
