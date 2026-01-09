import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

const ALLOWED_FEATURE_FLAGS = [
  'export_reflections',
  'reflection_analytics',
  'custom_prompts',
  'voice_prompts',
] as const

type AllowedFeatureFlagKey = (typeof ALLOWED_FEATURE_FLAGS)[number]

type RuntimeAppConfig = {
  featureFlags: Record<AllowedFeatureFlagKey, boolean>
}

const DEFAULT_CONFIG: RuntimeAppConfig = {
  featureFlags: {
    export_reflections: false,
    reflection_analytics: false,
    custom_prompts: false,
    voice_prompts: false,
  },
}

let cached:
  | {
      value: RuntimeAppConfig
      expiresAt: number
    }
  | null = null

const CACHE_TTL_MS = 5 * 60 * 1000

function buildResponse(config: RuntimeAppConfig) {
  const res = NextResponse.json(config)
  res.headers.set('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400')
  return res
}

export async function GET(_request: NextRequest) {
  try {
    const now = Date.now()
    if (cached && cached.expiresAt > now) {
      return buildResponse(cached.value)
    }

    const supabase = createServiceRoleClient()

    // NOTE: We intentionally do NOT expose raw feature_flags rows.
    // We also intentionally do NOT read system_settings here.
    let rows: any[] = []

    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      rows = data || []
    } catch (_e) {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('key', { ascending: true })

      if (error) throw error
      rows = data || []
    }

    const featureFlags = { ...DEFAULT_CONFIG.featureFlags }

    for (const row of rows) {
      const key = String(row?.key ?? row?.name ?? '')
      if (!key) continue
      if (!(ALLOWED_FEATURE_FLAGS as readonly string[]).includes(key)) continue

      const enabled = Boolean(row?.enabled ?? row?.is_enabled ?? false)
      featureFlags[key as AllowedFeatureFlagKey] = enabled
    }

    const value: RuntimeAppConfig = { featureFlags }

    cached = {
      value,
      expiresAt: now + CACHE_TTL_MS,
    }

    return buildResponse(value)
  } catch (_error) {
    // Fail safely with defaults; do not leak internal errors.
    return buildResponse(DEFAULT_CONFIG)
  }
}
