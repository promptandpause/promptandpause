'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

const DEFAULT_FEATURE_FLAGS = {
  export_reflections: false,
  reflection_analytics: false,
  custom_prompts: false,
  voice_prompts: false,
} as const

export type RuntimeFeatureFlagKey = keyof typeof DEFAULT_FEATURE_FLAGS

export type RuntimeAppConfig = {
  featureFlags: Record<RuntimeFeatureFlagKey, boolean>
}

type RuntimeAppConfigState = {
  config: RuntimeAppConfig
  isLoading: boolean
  error: string | null
}

let cached:
  | {
      value: RuntimeAppConfig
      expiresAt: number
    }
  | null = null

const CACHE_TTL_MS = 60 * 1000

function getDefaultConfig(): RuntimeAppConfig {
  return {
    featureFlags: { ...DEFAULT_FEATURE_FLAGS },
  }
}

function coerceRuntimeConfig(payload: any): RuntimeAppConfig {
  const defaults = getDefaultConfig()
  const incoming = payload?.featureFlags || {}

  return {
    featureFlags: {
      export_reflections: Boolean(incoming.export_reflections ?? defaults.featureFlags.export_reflections),
      reflection_analytics: Boolean(incoming.reflection_analytics ?? defaults.featureFlags.reflection_analytics),
      custom_prompts: Boolean(incoming.custom_prompts ?? defaults.featureFlags.custom_prompts),
      voice_prompts: Boolean(incoming.voice_prompts ?? defaults.featureFlags.voice_prompts),
    },
  }
}

export function useRuntimeAppConfig(options?: { autoFetch?: boolean }) {
  const autoFetch = options?.autoFetch ?? true

  const [state, setState] = useState<RuntimeAppConfigState>(() => {
    const now = Date.now()
    if (cached && cached.expiresAt > now) {
      return {
        config: cached.value,
        isLoading: false,
        error: null,
      }
    }

    return {
      config: getDefaultConfig(),
      isLoading: autoFetch,
      error: null,
    }
  })

  const refresh = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      const res = await fetch('/api/runtime/app-config', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      })

      if (!res.ok) {
        setState((prev) => ({ ...prev, isLoading: false }))
        return
      }

      const data = await res.json().catch(() => null)
      const nextConfig = coerceRuntimeConfig(data)

      cached = {
        value: nextConfig,
        expiresAt: Date.now() + CACHE_TTL_MS,
      }

      setState({
        config: nextConfig,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        config: getDefaultConfig(),
        isLoading: false,
        error: err?.message || 'Failed to load runtime app config',
      }))
    }
  }, [])

  useEffect(() => {
    if (!autoFetch) return
    if (cached && cached.expiresAt > Date.now()) return
    refresh()
  }, [autoFetch, refresh])

  const featureFlags = useMemo(() => state.config.featureFlags, [state.config.featureFlags])

  return {
    featureFlags,
    config: state.config,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
  }
}
