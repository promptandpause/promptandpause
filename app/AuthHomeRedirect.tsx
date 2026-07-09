"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function AuthHomeRedirect() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Use router.replace for smooth client-side transition (no full reload)
        router.replace("/dashboard")
      }
    }
    checkAuth()
  }, [router])

  return null
}
