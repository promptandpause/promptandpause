'use client'

import { useState, useCallback } from 'react'
import { useInvalidateReflectionStats } from './useReflectionStats'

/**
 * Reflection creation data
 */
export interface CreateReflectionInput {
  reflection_text: string
  mood?: string
  tags?: string[]
  prompt_id?: string
}

/**
 * Created reflection response
 */
export interface CreatedReflection {
  id: string
  reflection_text: string
  mood?: string
  tags?: string[]
  created_at: string
}

/**
 * Hook for creating reflections with automatic stats cache invalidation
 * 
 * Features:
 * - Automatic stats cache invalidation after successful creation
 * - Loading and error states
 * - Validates required fields
 * 
 * Usage:
 * ```tsx
 * const { reflection, isLoading, error, createReflection } = useCreateReflection()
 * 
 * const handleSave = async () => {
 *   const result = await createReflection({
 *     reflection_text: 'My thoughts...',
 *     mood: '😊',
 *     tags: ['work', 'stress'],
 *   })
 * }
 * ```
 */
export function useCreateReflection() {
  const [reflection, setReflection] = useState<CreatedReflection | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const invalidateStats = useInvalidateReflectionStats()

  const createReflection = useCallback(
    async (data: CreateReflectionInput): Promise<CreatedReflection | null> => {
      try {
        setIsLoading(true)
        setError(null)

        // Validate required fields
        if (!data.reflection_text || data.reflection_text.trim().length === 0) {
          setError('Reflection text is required')
          return null
        }

        const response = await fetch('/api/reflections/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          if (response.status === 401) {
            setError('Unauthorized')
            setReflection(null)
            return null
          }

          if (response.status === 400) {
            const text = await response.text()
            if (text && text.trim()) {
              const errorData = JSON.parse(text)
              setError(errorData.error || 'Invalid input')
            } else {
              setError('Invalid input')
            }
            return null
          }

          throw new Error(`HTTP ${response.status}`)
        }

        const text = await response.text()
        if (!text || !text.trim()) {
          throw new Error('Empty response body')
        }
        const responseData = JSON.parse(text)

        if (!responseData.success || !responseData.data) {
          throw new Error('Invalid response format')
        }

        const createdReflection: CreatedReflection = {
          id: responseData.data.id,
          reflection_text: responseData.data.reflection_text,
          mood: responseData.data.mood,
          tags: responseData.data.tags,
          created_at: responseData.data.created_at,
        }

        setReflection(createdReflection)
        setError(null)

        // Invalidate stats cache to trigger refresh
        invalidateStats()

        return createdReflection
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        setReflection(null)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [invalidateStats]
  )

  return {
    reflection,
    isLoading,
    error,
    createReflection,
  }
}
