import { getSupabaseClient } from '@/lib/supabase/client'

/**
 * Global Supabase Data Sync Service
 * 
 * Automatically syncs data from Supabase every 5 minutes to ensure
 * the application always has the latest data from the database.
 * 
 * This includes:
 * - User profile data (subscription status, tier, settings)
 * - User preferences
 * - Reflections count
 * - Any other cached data that needs periodic refresh
 */

const SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutes in milliseconds
let syncIntervalId: NodeJS.Timeout | null = null
let lastSyncTime: Date | null = null
let isSyncing = false

// Callback registry for components that want to be notified of syncs
const syncCallbacks: Map<string, () => void> = new Map()

/**
 * Register a callback to be called after each sync
 */
export function registerSyncCallback(id: string, callback: () => void) {
  syncCallbacks.set(id, callback)
}

/**
 * Unregister a sync callback
 */
export function unregisterSyncCallback(id: string) {
  syncCallbacks.delete(id)
}

/**
 * Notify all registered callbacks that sync has completed
 */
function notifyCallbacks() {
  syncCallbacks.forEach(callback => {
    try {
      callback()
    } catch (error) {
    }
  })
}

/**
 * Sync user profile data from Supabase
 */
async function syncUserProfile() {
  try {
    const supabase = getSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Fetch latest profile data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      // If profile doesn't exist (PGRST116 = no rows), create it
      if (error.code === 'PGRST116') {
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            subscription_status: 'free',
            subscription_tier: 'freemium',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (!createError) {
          return
        }
      }
      
      return
    }

  } catch (error) {
  }
}

/**
 * Sync user preferences from Supabase
 */
async function syncUserPreferences() {
  try {
    const supabase = getSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Fetch latest preferences
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return
    }
  } catch (error) {
  }
}

/**
 * Sync reflections metadata (count, latest, etc.)
 */
async function syncReflectionsMetadata() {
  try {
    const supabase = getSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Get total reflections count
    const { count, error } = await supabase
      .from('reflections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (error) {
      return
    }
  } catch (error) {
  }
}

/**
 * Sync all data from Supabase
 */
export async function syncAllData() {
  if (isSyncing) {
    return
  }

  isSyncing = true
  try {
    // Run all syncs in parallel for speed
    await Promise.allSettled([
      syncUserProfile(),
      syncUserPreferences(),
      syncReflectionsMetadata(),
    ])

    lastSyncTime = new Date()
    // Notify all registered callbacks
    notifyCallbacks()

  } catch (error) {
  } finally {
    isSyncing = false
  }
}

/**
 * Start automatic syncing every 5 minutes
 */
export function startGlobalSync() {
  // Don't start if already running
  if (syncIntervalId) {
    return
  }
  // Initial sync after 10 seconds
  setTimeout(() => {
    syncAllData()
  }, 10000)

  // Set up recurring sync every 5 minutes
  syncIntervalId = setInterval(() => {
    syncAllData()
  }, SYNC_INTERVAL)

  // Sync when user returns to tab
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Only sync if last sync was more than 1 minute ago
        if (!lastSyncTime || Date.now() - lastSyncTime.getTime() > 60000) {
          syncAllData()
        }
      }
    })
  }
}

/**
 * Stop automatic syncing
 */
export function stopGlobalSync() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId)
    syncIntervalId = null
  }
}

/**
 * Get last sync time
 */
export function getLastSyncTime(): Date | null {
  return lastSyncTime
}

/**
 * Check if currently syncing
 */
export function isCurrentlySyncing(): boolean {
  return isSyncing
}

/**
 * Force an immediate sync
 */
export function forceSyncNow() {
  syncAllData()
}
