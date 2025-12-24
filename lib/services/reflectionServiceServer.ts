import { SupabaseClient } from '@supabase/supabase-js'
import { Reflection } from '@/lib/types/reflection'

/**
 * Server-Side Reflection Service
 * 
 * SECURITY: This service is designed for use in API routes and server components only.
 * It queries Supabase directly using a user-bound client, which enforces RLS policies.
 * 
 * DO NOT use this in client-side code - use supabaseReflectionService instead.
 */

export const reflectionServiceServer = {
  /**
   * Get reflections for a date range
   * 
   * @param supabase - User-bound Supabase client (from createClient() in API route)
   * @param userId - The authenticated user's ID
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @returns Array of reflections within the date range
   * 
   * SECURITY: RLS policies automatically filter results to only include user's own data
   */
  async getReflectionsByDateRange(
    supabase: SupabaseClient,
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Reflection[]> {
    if (!supabase || !userId) {
      throw new Error('Supabase client and userId are required')
    }

    try {
      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59.999Z')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      return []
    }
  },

  /**
   * Get all reflections for a user
   * 
   * @param supabase - User-bound Supabase client
   * @param userId - The authenticated user's ID
   * @returns Array of all user reflections
   */
  async getAllReflections(
    supabase: SupabaseClient,
    userId: string
  ): Promise<Reflection[]> {
    if (!supabase || !userId) {
      throw new Error('Supabase client and userId are required')
    }

    try {
      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      return []
    }
  },

  /**
   * Get reflection by ID
   * 
   * @param supabase - User-bound Supabase client
   * @param userId - The authenticated user's ID
   * @param reflectionId - The reflection ID to fetch
   * @returns Reflection or null if not found
   */
  async getReflectionById(
    supabase: SupabaseClient,
    userId: string,
    reflectionId: string
  ): Promise<Reflection | null> {
    if (!supabase || !userId || !reflectionId) {
      throw new Error('Supabase client, userId, and reflectionId are required')
    }

    try {
      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .eq('id', reflectionId)
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      return null
    }
  },
}
