"use client"

import { useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function AuthHomeRedirect() {
  useEffect(() => {
    async function checkAuth() {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        window.location.replace("/dashboard")
      }
    }
    checkAuth()
  }, [])

  return null
}
