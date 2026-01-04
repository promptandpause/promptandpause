"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

/**
 * On-demand trial expiry check.
 * Runs when the user signs in or refreshes, mirroring the cron downgrade logic.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const serviceClient = createServiceRoleClient()
    const { data: profile, error } = await serviceClient
      .from("profiles")
      .select("id, subscription_status, subscription_tier, is_trial, trial_end_date, subscription_end_date, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle()

    if (error || !profile) {
      return NextResponse.json({ success: true, downgraded: false })
    }

    const now = new Date()
    const trialEnd = profile.trial_end_date ? new Date(profile.trial_end_date) : null
    const isTrialExpired = profile.is_trial && trialEnd !== null && trialEnd.getTime() < now.getTime()

    // If still on trial but expired and not on an active subscription, downgrade to free
    const hasActiveSub = profile.subscription_status === "active"
    if (isTrialExpired && !hasActiveSub) {
      const { error: updateError } = await serviceClient
        .from("profiles")
        .update({
          subscription_status: "free",
          subscription_tier: "free",
          is_trial: false,
          trial_end_date: null,
          subscription_end_date: null,
        })
        .eq("id", user.id)

      if (updateError) {
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, downgraded: true })
    }

    return NextResponse.json({ success: true, downgraded: false })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 }
    )
  }
}

export const GET = POST
