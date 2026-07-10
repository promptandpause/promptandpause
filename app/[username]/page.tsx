import { notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { ProfilePageClient } from './ProfilePageClient'
import type { ProfileWithSocial } from '@/lib/types/social'

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const raw = (await params).username
  const username = raw.replace(/^@/, '')

  // Use service role client to bypass RLS for the initial profile lookup
  // Falls back to anon client if service role key isn't configured
  // Note: subscription_tier is NOT a column in the profiles table
  let profile: any = null
  try {
    const serviceClient = createServiceRoleClient()
    const result = await serviceClient
      .from('profiles')
      .select(`
        id, full_name, display_name, username, avatar_url, bio,
        cover_image_url, profile_theme, mood_song_url, mood_song_title,
        is_public_profile, share_default, show_in_discover
      `)
      .eq('username', username)
      .single()
    profile = result.data
  } catch {
    // Fallback to anon client if service role client fails
    const anonClient = await createClient()
    const { data } = await anonClient
      .from('profiles')
      .select(`
        id, full_name, display_name, username, avatar_url, bio,
        cover_image_url, profile_theme, mood_song_url, mood_song_title,
        is_public_profile, share_default, show_in_discover
      `)
      .eq('username', username)
      .single()
    profile = data
  }

  if (!profile) {
    notFound()
  }

  const profileWithDefaults = {
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
      author:profiles(id, full_name, display_name, username, avatar_url)
    `)
    .eq('profile_user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <ProfilePageClient
      profile={profileWithDefaults}
      reflections={reflections || []}
      whiteboard={whiteboard || []}
    />
  )
}
