import { notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { ProfilePageClient } from './ProfilePageClient'
import type { ProfileWithSocial } from '@/lib/types/social'
import { decryptIfEncrypted } from '@/lib/utils/crypto'

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const raw = (await params).username
  const username = raw.replace(/^@/, '')

  // Use service role client to bypass RLS for the initial profile lookup
  // Falls back to anon client if service role key isn't configured
  // NOTE: Many columns (avatar_url, bio, cover_image_url, etc.) were added
  // by 20260709_social_features.sql migration — it MUST be applied to production.
  let profile: any = null
  try {
    const serviceClient = createServiceRoleClient()
    const result = await serviceClient
      .from('profiles')
      .select('id, username, display_name, full_name, is_public_profile')
      .eq('username', username)
      .single()
    profile = result.data
  } catch {
    const anonClient = await createClient()
    const { data } = await anonClient
      .from('profiles')
      .select('id, username, display_name, full_name, is_public_profile')
      .eq('username', username)
      .single()
    profile = data
  }

  if (!profile) {
    notFound()
  }

  const profileWithDefaults = {
    avatar_url: null,
    bio: null,
    cover_image_url: null,
    profile_theme: null,
    mood_song_url: null,
    mood_song_title: null,
    share_default: 'private' as const,
    show_in_discover: false,
    subscription_tier: 'free',
    ...profile,
  } as ProfileWithSocial

  if (!profile.is_public_profile) {
    return (
      <ProfilePageClient
        profile={profileWithDefaults}
        reflections={[]}
        whiteboard={[]}
        isPrivate
      />
    )
  }

  // Fetch reflections using the anon-key client so RLS filters private reflections
  const anonClient = await createClient()
  const { data: reflections } = await anonClient
    .from('reflections')
    .select('id, prompt_text, reflection_text, mood, tags, word_count, visibility, created_at')
    .eq('user_id', profile.id)
    .neq('visibility', 'private')
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: whiteboard } = await anonClient
    .from('whiteboard_entries')
    .select(`
      *,
      author:profiles(id, full_name, display_name, username)
    `)
    .eq('profile_user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Decrypt reflection_text for public viewing (stored encrypted, per encryption-at-rest)
  const decryptedReflections = (reflections || []).map((r) => ({
    ...r,
    reflection_text: decryptIfEncrypted(r.reflection_text) || r.reflection_text,
  }))

  return (
    <ProfilePageClient
      profile={profileWithDefaults}
      reflections={decryptedReflections}
      whiteboard={whiteboard || []}
    />
  )
}
