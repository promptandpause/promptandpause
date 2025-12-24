"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'

/**
 * Global Sync Context
 * 
 * Automatically syncs data from Supabase every 5 minutes to ensure
 * all dashboard components have up-to-date information.
 * 
 * This works alongside any existing real-time sync mechanisms and
 * provides a fallback to catch any missed updates.
 */

interface GlobalSyncContextType {
  lastSyncTime: Date | null
  isSyncing: boolean
  syncNow: () => Promise<void>
  registerSyncCallback: (id: string, callback: () => Promise<void>) => void
  unregisterSyncCallback: (id: string) => void
}

const GlobalSyncContext = createContext<GlobalSyncContextType | undefined>(undefined)

const SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutes in milliseconds

export function GlobalSyncProvider({ children }: { children: React.ReactNode }) {
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncCallbacks, setSyncCallbacks] = useState<Map<string, () => Promise<void>>>(new Map())

  /**
   * Register a sync callback from any component
   * Components can register their own refresh functions to be called during global sync
   */
  const registerSyncCallback = useCallback((id: string, callback: () => Promise<void>) => {
    setSyncCallbacks(prev => {
      const updated = new Map(prev)
      updated.set(id, callback)
      return updated
    })
  }, [])

  /**
   * Unregister a sync callback when component unmounts
   */
  const unregisterSyncCallback = useCallback((id: string) => {
    setSyncCallbacks(prev => {
      const updated = new Map(prev)
      updated.delete(id)
      return updated
    })
  }, [])

  /**
   * Execute all registered sync callbacks
   */
  const syncNow = useCallback(async () => {
    if (isSyncing) {
      console.log('Sync already in progress, skipping...')
      return
    }

    console.log('🔄 Starting global sync with Supabase...')
    setIsSyncing(true)

    try {
      // Execute all registered callbacks in parallel for faster sync
      const syncPromises = Array.from(syncCallbacks.values()).map(callback => 
        callback().catch(error => {
          console.error('Sync callback error:', error)
          // Don't throw - allow other callbacks to continue
        })
      )

      await Promise.allSettled(syncPromises)
      
      setLastSyncTime(new Date())
      console.log(`✅ Global sync completed at ${new Date().toLocaleTimeString()}`)
      
    } catch (error) {
      console.error('Global sync error:', error)
      toast.error('Failed to sync data')
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, syncCallbacks])

  /**
   * Set up automatic sync interval
   */
  useEffect(() => {
    // Initial sync after 10 seconds (give components time to mount)
    const initialSyncTimeout = setTimeout(() => {
      syncNow()
    }, 10000)

    // Set up recurring sync every 5 minutes
    const syncInterval = setInterval(() => {
      syncNow()
    }, SYNC_INTERVAL)

    // Cleanup
    return () => {
      clearTimeout(initialSyncTimeout)
      clearInterval(syncInterval)
    }
  }, [syncNow])

  /**
   * Sync on window focus (user returns to tab)
   * This ensures data is fresh when user comes back
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only sync if last sync was more than 1 minute ago
        if (!lastSyncTime || Date.now() - lastSyncTime.getTime() > 60000) {
          console.log('🔄 Window focused - syncing data...')
          syncNow()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [syncNow, lastSyncTime])

  const value: GlobalSyncContextType = {
    lastSyncTime,
    isSyncing,
    syncNow,
    registerSyncCallback,
    unregisterSyncCallback,
  }

  return (
    <GlobalSyncContext.Provider value={value}>
      {children}
      
      {/* Optional: Visual indicator when syncing */}
      {isSyncing && (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
          <div className="bg-indigo-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Syncing...
          </div>
        </div>
      )}
    </GlobalSyncContext.Provider>
  )
}

/**
 * Hook to access global sync context
 */
export function useGlobalSync() {
  const context = useContext(GlobalSyncContext)
  if (context === undefined) {
    throw new Error('useGlobalSync must be used within a GlobalSyncProvider')
  }
  return context
}

/**
 * Hook to register a component's sync function
 * Usage in components:
 * 
 * useAutoSync('my-component', async () => {
 *   await fetchMyData()
 * })
 */
export function useAutoSync(id: string, syncCallback: () => Promise<void>) {
  const { registerSyncCallback, unregisterSyncCallback } = useGlobalSync()

  useEffect(() => {
    registerSyncCallback(id, syncCallback)
    return () => unregisterSyncCallback(id)
  }, [id, syncCallback, registerSyncCallback, unregisterSyncCallback])
}
