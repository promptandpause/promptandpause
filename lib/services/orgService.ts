import { createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { emailWrapper, h1, paragraph, infoBox, ctaButton, BRAND_COLORS } from '@/lib/services/emailTemplates'
import { logEmailDelivery } from '@/lib/services/emailService'
import { Resend } from 'resend'
import Stripe from 'stripe'
import crypto from 'crypto'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_NAME = 'Prompt & Pause'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://promptandpause.com'
const BILLING_EMAIL = process.env.BILLING_EMAIL || 'billing@promptandpause.com'

// Org seat pricing -- separate Stripe Price IDs from the individual plan,
// set these in .env once created in the Stripe dashboard.
const SEAT_PRICE_MONTHLY = process.env.STRIPE_ORG_SEAT_PRICE_MONTHLY
const SEAT_PRICE_ANNUAL = process.env.STRIPE_ORG_SEAT_PRICE_ANNUAL

const INVITE_EXPIRY_DAYS = 7

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'workspace'
  )
}

// =============================================================================
// CHECKOUT
// =============================================================================

/**
 * Creates a Stripe checkout session for a new org. The org row itself is NOT
 * created here -- it's created by handleOrgCheckoutCompleted once Stripe
 * confirms payment via webhook, so billing state and org existence can never
 * drift out of sync.
 */
export async function createOrgCheckoutSession(params: {
  userId: string
  userEmail: string
  orgName: string
  seatCount: number
  billingInterval: 'monthly' | 'annual'
}): Promise<{ success: boolean; checkoutUrl?: string; error?: string }> {
  try {
    const { userId, userEmail, orgName, seatCount, billingInterval } = params

    if (seatCount < 1) {
      return { success: false, error: 'At least 1 seat is required' }
    }

    const priceId = billingInterval === 'annual' ? SEAT_PRICE_ANNUAL : SEAT_PRICE_MONTHLY
    if (!priceId) {
      return { success: false, error: 'Organization billing is not configured yet' }
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: seatCount }],
      success_url: `${APP_URL}/workspace/setup?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/workspace/setup?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        type: 'organization',
        owner_id: userId,
        org_name: orgName,
        seat_count: String(seatCount),
        billing_interval: billingInterval,
      },
      subscription_data: {
        metadata: {
          type: 'organization',
          owner_id: userId,
        },
      },
    })

    return { success: true, checkoutUrl: session.url || undefined }
  } catch (error: any) {
    logger.error('org_checkout_create_error', { error })
    return { success: false, error: error.message || 'Failed to start checkout' }
  }
}

/**
 * Called from the Stripe webhook's `type === 'organization'` branch on
 * checkout.session.completed. Creates the organization row and the owner's
 * membership row. Idempotent -- safe to call twice for the same session
 * (webhooks can redeliver).
 */
export async function handleOrgCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const supabase = createServiceRoleClient()
    const meta = session.metadata || {}

    if (meta.type !== 'organization') {
      return { success: false, error: 'Not an organization checkout session' }
    }

    // Idempotency: has this Stripe subscription already created an org?
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_subscription_id', session.subscription as string)
      .maybeSingle()

    if (existing) {
      return { success: true, organizationId: existing.id }
    }

    const ownerId = meta.owner_id
    const orgName = meta.org_name || 'My Workspace'
    const seatCount = parseInt(meta.seat_count || '1', 10)
    const billingInterval = (meta.billing_interval as 'monthly' | 'annual') || 'monthly'

    let slug = slugify(orgName)
    // Ensure slug uniqueness by appending a short suffix on collision
    const { data: slugCollision } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (slugCollision) {
      slug = `${slug}-${crypto.randomBytes(3).toString('hex')}`
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName,
        slug,
        owner_id: ownerId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        seat_count: seatCount,
        billing_interval: billingInterval,
        status: 'active',
      })
      .select()
      .single()

    if (orgError) throw orgError

    const { error: memberError } = await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: ownerId,
      role: 'owner',
      status: 'active',
      joined_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    })

    if (memberError) throw memberError

    logger.info('org_created', { organizationId: org.id, ownerId, seatCount })

    return { success: true, organizationId: org.id }
  } catch (error: any) {
    logger.error('org_checkout_completed_error', { error })
    return { success: false, error: error.message }
  }
}

// =============================================================================
// MEMBERS
// =============================================================================

export async function getOrgMembership(organizationId: string, userId: string) {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  return data
}

export async function isOrgAdminOrOwner(organizationId: string, userId: string): Promise<boolean> {
  const membership = await getOrgMembership(organizationId, userId)
  return !!membership && ['owner', 'admin'].includes(membership.role)
}

/**
 * Roster listing -- name, email, role, join date, last active date only.
 * Never touches reflections. See docs/architecture/WORKSPACE_B2B_ARCHITECTURE.md
 * for why this is the intentional privacy boundary, not an oversight.
 */
export async function getOrgMembers(organizationId: string) {
  const supabase = createServiceRoleClient()

  const { data: members, error } = await supabase
    .from('organization_members')
    .select('id, user_id, role, status, joined_at, last_active_at, created_at')
    .eq('organization_id', organizationId)
    .neq('status', 'removed')
    .order('created_at', { ascending: true })

  if (error) throw error

  const userIds = (members || []).map((m) => m.user_id)
  const profileMap = new Map<string, any>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, display_name, username, avatar_url')
      .in('id', userIds)
    profiles?.forEach((p) => profileMap.set(p.id, p))
  }

  // Per-member analytics opt-in status, so admins can see who has (and hasn't)
  // consented to contributing aggregate numbers. Roster metadata only -- never
  // reflection content.
  const consentedUserIds = new Set<string>()
  if (userIds.length > 0) {
    const { data: consents } = await supabase
      .from('organization_consent')
      .select('user_id')
      .eq('organization_id', organizationId)
      .in('user_id', userIds)
    consents?.forEach((c) => consentedUserIds.add(c.user_id))
  }

  const { data: pendingInvites } = await supabase
    .from('organization_invites')
    .select('id, email, role, created_at, expires_at')
    .eq('organization_id', organizationId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())

  return {
    members: (members || []).map((m) => ({
      ...m,
      profile: profileMap.get(m.user_id) || null,
      consent_status: consentedUserIds.has(m.user_id),
    })),
    pendingInvites: pendingInvites || [],
  }
}

export async function updateOrgMemberRole(
  organizationId: string,
  targetUserId: string,
  role: 'admin' | 'member',
  actingUserId: string
) {
  const canManage = await isOrgAdminOrOwner(organizationId, actingUserId)
  if (!canManage) return { success: false, error: 'Not authorized' }

  const supabase = createServiceRoleClient()

  // Owners can't be demoted through this path -- ownership transfer is a
  // deliberately separate, more guarded action not built in Phase 1.
  const target = await getOrgMembership(organizationId, targetUserId)
  if (target?.role === 'owner') {
    return { success: false, error: "The workspace owner's role can't be changed here" }
  }

  const { error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('organization_id', organizationId)
    .eq('user_id', targetUserId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function removeOrgMember(organizationId: string, targetUserId: string, actingUserId: string) {
  const isSelf = targetUserId === actingUserId
  const canManage = isSelf || (await isOrgAdminOrOwner(organizationId, actingUserId))
  if (!canManage) return { success: false, error: 'Not authorized' }

  const target = await getOrgMembership(organizationId, targetUserId)
  if (target?.role === 'owner' && !isSelf) {
    return { success: false, error: "The workspace owner can't be removed" }
  }

  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from('organization_members')
    .update({ status: 'removed' })
    .eq('organization_id', organizationId)
    .eq('user_id', targetUserId)

  if (error) return { success: false, error: error.message }

  // Explicitly note: this never touches reflections, profiles, or any
  // personal data. Removing someone from an org is purely a roster change.
  return { success: true }
}

// =============================================================================
// INVITES
// =============================================================================

/**
 * Best-support add-user flow. If the email already has a Prompt & Pause
 * account they are added as a workspace member instantly (no invite round
 * trip). If it doesn't, a token invite is emailed so they can create an
 * account and accept. Enterprise convention (Slack, Notion, Headspace for
 * Work, Calm for Business): every member has one individual identity, and
 * workspace membership is layered on top of it.
 */
export async function addOrgMemberByEmail(params: {
  organizationId: string
  email: string
  role: 'admin' | 'member'
  addedBy: string
}): Promise<{
  success: boolean
  error?: string
  added?: boolean
  invited?: boolean
  invite?: any
  member?: any
}> {
  const { organizationId, email, role, addedBy } = params

  const canManage = await isOrgAdminOrOwner(organizationId, addedBy)
  if (!canManage) return { success: false, error: 'Not authorized' }

  const supabase = createServiceRoleClient()
  const normalized = email.toLowerCase().trim()

  // Seat check -- direct adds and pending invites both consume a seat.
  const { data: org } = await supabase
    .from('organizations')
    .select('name, seat_count')
    .eq('id', organizationId)
    .single()

  const { count: activeCount } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  const { count: pendingCount } = await supabase
    .from('organization_invites')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())

  if (org && (activeCount || 0) + (pendingCount || 0) >= org.seat_count) {
    return { success: false, error: 'No seats available -- add more seats or remove an inactive member' }
  }

  const profile = await findUserByEmail(normalized)

  // Existing account -> add directly, no invite email needed.
  if (profile) {
    const { data: existing } = await supabase
      .from('organization_members')
      .select('id, role, status')
      .eq('organization_id', organizationId)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (existing?.status === 'active') {
      return { success: false, error: `${normalized} is already a member of this workspace` }
    }

    // Re-adding a previously removed member (or a fresh member) -- upsert so
    // a stale `removed` row is resurrected rather than throwing a unique
    // constraint error.
    const { error: memberError } = await supabase
      .from('organization_members')
      .upsert(
        {
          organization_id: organizationId,
          user_id: profile.id,
          role,
          status: 'active',
          joined_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,user_id' }
      )

    if (memberError) return { success: false, error: memberError.message }

    // Any stale pending invite for this email is now moot -- consume it so it
    // doesn't keep eating a seat or allow a double-join.
    await supabase
      .from('organization_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .ilike('email', normalized)
      .is('accepted_at', null)

    return { success: true, added: true, member: { user_id: profile.id, role, status: 'active' } }
  }

  // No account yet -> classic token invite.
  const inviteResult = await createOrgInvite({ organizationId, email: normalized, role, invitedBy: addedBy })
  if (!inviteResult.success) return inviteResult

  return { success: true, invited: true, invite: inviteResult.invite }
}

export async function lookupOrgMemberCandidate(
  organizationId: string,
  email: string,
  actingUserId: string
): Promise<{
  success: boolean
  error?: string
  exists?: boolean
  name?: string | null
  alreadyMember?: boolean
  pendingInvite?: boolean
}> {
  const canManage = await isOrgAdminOrOwner(organizationId, actingUserId)
  if (!canManage) return { success: false, error: 'Not authorized' }

  const supabase = createServiceRoleClient()
  const normalized = email.toLowerCase().trim()
  const profile = await findUserByEmail(normalized)

  let alreadyMember = false
  if (profile) {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('status')
      .eq('organization_id', organizationId)
      .eq('user_id', profile.id)
      .maybeSingle()
    alreadyMember = membership?.status === 'active'
  }

  const { data: invite } = await supabase
    .from('organization_invites')
    .select('id')
    .eq('organization_id', organizationId)
    .ilike('email', normalized)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  return {
    success: true,
    exists: !!profile,
    name: profile?.display_name || profile?.full_name || null,
    alreadyMember,
    pendingInvite: !!invite,
  }
}

async function findUserByEmail(email: string) {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, display_name, username, avatar_url')
    .ilike('email', email.toLowerCase().trim())
    .limit(1)
    .maybeSingle()
  return data
}

export async function createOrgInvite(params: {
  organizationId: string
  email: string
  role: 'admin' | 'member'
  invitedBy: string
}) {
  const { organizationId, email, role, invitedBy } = params

  const canManage = await isOrgAdminOrOwner(organizationId, invitedBy)
  if (!canManage) return { success: false, error: 'Not authorized' }

  const supabase = createServiceRoleClient()

  // Seat check
  const { data: org } = await supabase
    .from('organizations')
    .select('name, seat_count')
    .eq('id', organizationId)
    .single()

  const { count: activeCount } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  const { count: pendingCount } = await supabase
    .from('organization_invites')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())

  if (org && (activeCount || 0) + (pendingCount || 0) >= org.seat_count) {
    return { success: false, error: 'No seats available -- add more seats or remove an inactive member' }
  }

  const token = crypto.randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: invite, error } = await supabase
    .from('organization_invites')
    .insert({
      organization_id: organizationId,
      email: email.toLowerCase().trim(),
      role,
      token,
      invited_by: invitedBy,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await sendOrgInviteEmail({
    email,
    orgName: org?.name || 'a workspace',
    token,
  })

  return { success: true, invite }
}

export async function acceptOrgInvite(token: string, userId: string, userEmail: string) {
  const supabase = createServiceRoleClient()

  const { data: invite } = await supabase
    .from('organization_invites')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .maybeSingle()

  if (!invite) {
    return { success: false, error: 'This invite is invalid or has already been used' }
  }

  if (new Date(invite.expires_at) < new Date()) {
    return { success: false, error: 'This invite has expired' }
  }

  if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
    return { success: false, error: 'This invite was sent to a different email address' }
  }

  const { error: memberError } = await supabase.from('organization_members').upsert(
    {
      organization_id: invite.organization_id,
      user_id: userId,
      role: invite.role,
      status: 'active',
      joined_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,user_id' }
  )

  if (memberError) return { success: false, error: memberError.message }

  await supabase
    .from('organization_invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  return { success: true, organizationId: invite.organization_id }
}

export async function revokeOrgInvite(organizationId: string, inviteId: string, actingUserId: string) {
  const canManage = await isOrgAdminOrOwner(organizationId, actingUserId)
  if (!canManage) return { success: false, error: 'Not authorized' }

  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from('organization_invites')
    .delete()
    .eq('id', inviteId)
    .eq('organization_id', organizationId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Re-sends an invite email with a fresh token and a new 7-day expiry. Useful
 * when the original email was lost, landed in spam, or the invite lapsed.
 */
export async function resendOrgInvite(organizationId: string, inviteId: string, actingUserId: string) {
  const canManage = await isOrgAdminOrOwner(organizationId, actingUserId)
  if (!canManage) return { success: false, error: 'Not authorized' }

  const supabase = createServiceRoleClient()
  const { data: invite } = await supabase
    .from('organization_invites')
    .select('*')
    .eq('id', inviteId)
    .eq('organization_id', organizationId)
    .is('accepted_at', null)
    .maybeSingle()

  if (!invite) return { success: false, error: 'Invite not found or already accepted' }

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single()

  const token = crypto.randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase
    .from('organization_invites')
    .update({ token, expires_at: expiresAt })
    .eq('id', inviteId)

  if (error) return { success: false, error: error.message }

  await sendOrgInviteEmail({ email: invite.email, orgName: org?.name || 'a workspace', token })

  return { success: true }
}

// =============================================================================
// ORG SETTINGS
// =============================================================================

export async function renameOrganization(organizationId: string, name: string, actingUserId: string) {
  const canManage = await isOrgAdminOrOwner(organizationId, actingUserId)
  if (!canManage) return { success: false, error: 'Not authorized' }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('organizations')
    .update({ name: name.trim() })
    .eq('id', organizationId)
    .select('id, name, slug, seat_count, plan, billing_interval, status, settings, created_at')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, organization: data }
}

// =============================================================================
// BILLING / SEATS
// =============================================================================

/**
 * Changes the number of paid seats. Updates the Stripe subscription quantity
 * so billing stays correct, then writes the new seat_count to the org row so
 * the roster UI reflects it immediately (the webhook confirms it later).
 * Owner only -- billing touches money.
 */
export async function updateOrgSeats(organizationId: string, seatCount: number, actingUserId: string) {
  const membership = await getOrgMembership(organizationId, actingUserId)
  if (!membership || membership.role !== 'owner') {
    return { success: false, error: 'Only the workspace owner can change seats' }
  }

  const supabase = createServiceRoleClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_subscription_id, seat_count')
    .eq('id', organizationId)
    .single()

  if (!org?.stripe_subscription_id) {
    return { success: false, error: 'No subscription on this workspace' }
  }

  const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id)
  const item = subscription.items.data[0]
  if (!item) {
    return { success: false, error: 'Subscription has no billable item' }
  }

  await stripe.subscriptions.update(subscription.id, {
    items: [{ id: item.id, quantity: seatCount }],
  })

  const { error } = await supabase
    .from('organizations')
    .update({ seat_count: seatCount, updated_at: new Date().toISOString() })
    .eq('id', organizationId)

  if (error) return { success: false, error: error.message }

  return { success: true, seatCount }
}

export async function getOrgBillingPortalUrl(organizationId: string, actingUserId: string) {
  const membership = await getOrgMembership(organizationId, actingUserId)
  if (!membership || membership.role !== 'owner') {
    return { success: false, error: 'Only the workspace owner can manage billing' }
  }

  const supabase = createServiceRoleClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', organizationId)
    .single()

  if (!org?.stripe_customer_id) {
    return { success: false, error: 'No billing details on this workspace' }
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${APP_URL.replace(/\/$/, '')}/workspace/${organizationId}`,
  })

  return { success: true, url: session.url }
}

// =============================================================================
// OWNERSHIP
// =============================================================================

/**
 * Transfers workspace ownership to another member. The new owner becomes
 * `owner`, the previous owner is downgraded to `admin` so they keep manage
 * rights but can no longer bill/transfer. Owner only.
 */
export async function transferOrgOwnership(organizationId: string, newOwnerUserId: string, actingUserId: string) {
  const membership = await getOrgMembership(organizationId, actingUserId)
  if (!membership || membership.role !== 'owner') {
    return { success: false, error: 'Only the workspace owner can transfer ownership' }
  }

  if (newOwnerUserId === actingUserId) {
    return { success: false, error: 'You already own this workspace' }
  }

  const target = await getOrgMembership(organizationId, newOwnerUserId)
  if (!target || target.status !== 'active') {
    return { success: false, error: 'That person is not an active member of this workspace' }
  }

  const supabase = createServiceRoleClient()

  const { error: oldOwnerError } = await supabase
    .from('organization_members')
    .update({ role: 'admin', updated_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('user_id', actingUserId)

  if (oldOwnerError) return { success: false, error: oldOwnerError.message }

  const { error: newOwnerError } = await supabase
    .from('organization_members')
    .update({ role: 'owner', updated_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('user_id', newOwnerUserId)

  if (newOwnerError) return { success: false, error: newOwnerError.message }

  const { error: orgError } = await supabase
    .from('organizations')
    .update({ owner_id: newOwnerUserId, updated_at: new Date().toISOString() })
    .eq('id', organizationId)

  if (orgError) return { success: false, error: orgError.message }

  return { success: true }
}

// =============================================================================
// EMAIL -- reuses the same emailWrapper/h1/paragraph/ctaButton primitives
// and email_delivery_log pattern as lib/services/emailService.ts, kept here
// since this is workspace-specific and not part of the personal lifecycle.
// =============================================================================

async function sendOrgInviteEmail(params: { email: string; orgName: string; token: string }) {
  const { email, orgName, token } = params
  const acceptUrl = `${APP_URL.replace(/\/$/, '')}/workspace/invite/${token}`

  try {
    if (!process.env.RESEND_API_KEY) return

    const html = emailWrapper(
      `${h1(`You're invited to ${orgName}`)}
       ${paragraph(`You've been invited to join <strong>${orgName}</strong> on ${APP_NAME}.`)}
       ${infoBox(`Joining a workspace never affects your personal reflections. Only your name, email, and activity presence are visible to workspace admins -- never what you write.`)}
       ${paragraph('This invite expires in 7 days.', { fontSize: '14px', color: BRAND_COLORS.textMuted })}
       ${ctaButton('Accept invite', acceptUrl)}`
    )

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${BILLING_EMAIL}>`,
      to: email,
      subject: `You're invited to join ${orgName} on ${APP_NAME}`,
      html,
    })

    if (error) {
      logger.error('org_invite_email_send_error', { error, email })
      return
    }

    await logEmailDelivery('unknown', 'org_invite' as any, email, 'sent', data?.id || null)
  } catch (error) {
    logger.error('org_invite_email_unexpected_error', { error, email })
  }
}
