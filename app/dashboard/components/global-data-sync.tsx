"use client"

import { useEffect } from 'react'
import { startGlobalSync, stopGlobalSync } from '@/lib/services/globalSyncService'

/**
 * Global Data Sync Component
 * 
 * Initializes automatic Supabase data synchronization.
 * Place this component at the root of the dashboard to enable
 * automatic syncing every 5 minutes.
 */
export default function GlobalDataSync() {
  useEffect(() => {
    // Start global sync service
    startGlobalSync()

    // Cleanup on unmount
    return () => {
      stopGlobalSync()
    }
  }, [])

  // This component doesn't render anything
  return null
}
