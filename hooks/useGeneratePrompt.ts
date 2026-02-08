'use client'

import { useState, useCallback } from 'react'
import { useInvalidateReflectionStats } from './useReflectionStats'
import { PromptType } from '@/lib/types/reflection'

/**
 * Generated prompt response
 */
export interface GeneratedPrompt {
  id: string
  prompt_text: string
  ai_provider: string
  ai_model: string
  focus_area_used?: string
  prompt_type?: PromptType
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
 *
 *   }
 * }
 * ```
 */
export function useGeneratePrompt() {
  const [prompt, setPrompt] = useState<GeneratedPrompt | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const invalidateStats = useInvalidateReflectionStats()

  const generatePrompt = useCallback(async (retryCount = 0): Promise<GeneratedPrompt | null> => {
    const MAX_RETRIES = 1 // Allow one automatic retry
    
    try {
      setIsLoading(true)
      setError(null)

      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch('/api/prompts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in to generate prompts')
          setPrompt(null)
          return null
        }
        
        if (response.status === 429) {
          setError('Too many requests. Please wait a moment.')
          return null
        }

        if (response.status === 403) {
          const data = await response.json().catch(() => ({}))
          setError(data.message || 'Weekly limit reached. Upgrade for unlimited prompts.')
          return null
        }

        if (response.status === 503) {
          // AI service unavailable - retry once
          if (retryCount < MAX_RETRIES) {
            setError('AI service busy, retrying...')
            await new Promise(r => setTimeout(r, 2000)) // Wait 2 seconds
            return generatePrompt(retryCount + 1)
          }
          setError('AI service temporarily unavailable. Please try again.')
          return null
        }

        throw new Error(`Server error (${response.status})`)
      }

      const text = await response.text()
      if (!text || !text.trim()) {
        throw new Error('Empty response from server')
      }
      const data = JSON.parse(text)

      if (!data.success || !data.data) {
        // Check if it's a specific error message
        if (data.error) {
          setError(data.message || data.error)
          return null
        }
        throw new Error('Invalid response format')
      }

      const generatedPrompt: GeneratedPrompt = {
        id: data.data.id,
        prompt_text: data.data.prompt_text,
        ai_provider: data.data.ai_provider,
        ai_model: data.data.ai_model,
        focus_area_used: data.data.focus_area_used,
        prompt_type: data.data.prompt_type,
        date_generated: data.data.date_generated,
      }

      setPrompt(generatedPrompt)
      setError(null)

      // Invalidate stats cache to trigger refresh
      invalidateStats()

      // Dispatch event so PromptLimitBanner updates dynamically
      window.dispatchEvent(new CustomEvent('prompt-generated'))

      return generatedPrompt
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.')
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
      }
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
