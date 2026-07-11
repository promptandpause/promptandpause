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
      .select('id, username, display_name, full_name, avatar_url, bio, cover_image_url, profile_theme, mood_song_url, mood_song_title, is_public_profile, share_default, show_in_discover, subscription_tier')
      .eq('username', username)
      .single()
    profile = result.data
  } catch {
    const anonClient = await createClient()
    const { data } = await anonClient
      .from('profiles')
      .select('id, username, display_name, full_name, avatar_url, bio, cover_image_url, profile_theme, mood_song_url, mood_song_title, is_public_profile, share_default, show_in_discover, subscription_tier')
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
    .select('id, prompt_text, reflection_text, mood, tags, word_count, visibility, allow_comments, created_at, user_id')
    .eq('user_id', profile.id)
    .neq('visibility', 'private')
    .order('created_at', { ascending: false })
    .limit(20)

  const reflectionIds = (reflections || []).map(r => r.id)
  const likeCountMap: Record<string, number> = {}
  const commentCountMap: Record<string, number> = {}
  const viewerLikedSet = new Set<string>()

  if (reflectionIds.length > 0) {
    const [{ data: allLikes }, { data: allComments }] = await Promise.all([
      anonClient.from('reflection_likes').select('reflection_id').in('reflection_id', reflectionIds),
      anonClient.from('comments').select('reflection_id').in('reflection_id', reflectionIds),
    ])
    allLikes?.forEach((l: any) => {
      likeCountMap[l.reflection_id] = (likeCountMap[l.reflection_id] || 0) + 1
    })
    allComments?.forEach((c: any) => {
      commentCountMap[c.reflection_id] = (commentCountMap[c.reflection_id] || 0) + 1
    })
    if (currentUser) {
      const { data: viewerLikes } = await anonClient
        .from('reflection_likes')
        .select('reflection_id')
        .eq('user_id', currentUser.id)
        .in('reflection_id', reflectionIds)
      viewerLikes?.forEach((l: any) => viewerLikedSet.add(l.reflection_id))
    }
  }

  const { data: whiteboard } = await anonClient
    .from('whiteboard_entries')
    .select(`
      *,
      author:profiles!author_id(id, full_name, display_name, username, avatar_url)
    `)
    .eq('profile_user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const decryptedReflections = (reflections || []).map((r) => ({
    ...r,
    reflection_text: decryptIfEncrypted(r.reflection_text) || r.reflection_text,
    like_count: likeCountMap[r.id] || 0,
    comment_count: commentCountMap[r.id] || 0,
    is_liked_by_me: viewerLikedSet.has(r.id),
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
