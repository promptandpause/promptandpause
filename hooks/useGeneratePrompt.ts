'use client'

import { useState, useCallback } from 'react'
import { useInvalidateReflectionStats } from './useReflectionStats'

/**
 * Generated prompt response
 */
export interface GeneratedPrompt {
  id: string
  prompt_text: string
  ai_provider: string
  ai_model: string
  focus_area_used?: string
  date_generated: string
}

/**
 * Hook for generating prompts with automatic cache invalidation
 * 
 * Features:
 * - Automatic stats cache invalidation after successful generation
 * - Loading and error states
 * - Handles existing prompt for today (returns cached prompt)
 * 
 * Usage:
 * ```tsx
 * const { prompt, isLoading, error, generatePrompt } = useGeneratePrompt()
 * 
 * const handleGenerateClick = async () => {
 *   const result = await generatePrompt()
 *   if (result) {
 *     console.log('Generated:', result)
 *   }
 * }
 * ```
 */
export function useGeneratePrompt() {
  const [prompt, setPrompt] = useState<GeneratedPrompt | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const invalidateStats = useInvalidateReflectionStats()

  const generatePrompt = useCallback(async (): Promise<GeneratedPrompt | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/prompts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Unauthorized')
          setPrompt(null)
          return null
        }
        
        if (response.status === 429) {
          setError('Too many requests. Please wait a bit.')
          return null
        }

        throw new Error(`HTTP ${response.status}`)
      }

      const text = await response.text()
      if (!text || !text.trim()) {
        throw new Error('Empty response body')
      }
      const data = JSON.parse(text)

      if (!data.success || !data.data) {
        throw new Error('Invalid response format')
      }

      const generatedPrompt: GeneratedPrompt = {
        id: data.data.id,
        prompt_text: data.data.prompt_text,
        ai_provider: data.data.ai_provider,
        ai_model: data.data.ai_model,
        focus_area_used: data.data.focus_area_used,
        date_generated: data.data.date_generated,
      }

      setPrompt(generatedPrompt)
      setError(null)

      // Invalidate stats cache to trigger refresh
      console.log('📍 [useGeneratePrompt] Invalidating stats cache after prompt generation')
      invalidateStats()

      return generatedPrompt
    } catch (err) {
      console.error('Error generating prompt:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setPrompt(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [invalidateStats])

  return {
    prompt,
    isLoading,
    error,
    generatePrompt,
  }
}
