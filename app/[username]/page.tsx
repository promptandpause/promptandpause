import { notFound } from 'next/navigation'
import { createClient, createServiceRoleClient, getAuthUser } from '@/lib/supabase/server'
import { ProfilePageClient } from './ProfilePageClient'
import type { ProfileWithSocial } from '@/lib/types/social'
import { decryptIfEncrypted } from '@/lib/utils/crypto'

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const raw = (await params).username
  const username = raw.replace(/^@/, '')

  let profile: any = null
  try {
    const serviceClient = createServiceRoleClient()
    const result = await serviceClient
      .from('profiles')
      .select('id, username, display_name, full_name, avatar_url, is_public_profile')
      .eq('username', username)
      .single()
    profile = result.data
  } catch {
    const anonClient = await createClient()
    const { data } = await anonClient
      .from('profiles')
      .select('id, username, display_name, full_name, avatar_url, is_public_profile')
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

  // Check if the viewer is the profile owner
  const currentUser = await getAuthUser()
  const isOwnProfile = currentUser?.id === profile.id

  if (!profile.is_public_profile && !isOwnProfile) {
    return (
      <ProfilePageClient
        profile={profileWithDefaults}
        reflections={[]}
        whiteboard={[]}
        isPrivate
        isOwnProfile={false}
      />
    )
  }

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

  const decryptedReflections = (reflections || []).map((r) => ({
    ...r,
    reflection_text: decryptIfEncrypted(r.reflection_text) || r.reflection_text,
  }))

  return (
    <ProfilePageClient
      profile={profileWithDefaults}
      reflections={decryptedReflections}
      whiteboard={whiteboard || []}
      isOwnProfile={isOwnProfile}
    />
  )
}
