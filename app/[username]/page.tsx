import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfilePageClient } from './ProfilePageClient'

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id, full_name, display_name, username, avatar_url, bio,
      cover_image_url, profile_theme, mood_song_url, mood_song_title,
      is_public_profile, share_default, show_in_discover, subscription_tier
    `)
    .eq('username', username)
    .single()

  if (!profile) {
    notFound()
  }

  if (!profile.is_public_profile) {
    return (
      <ProfilePageClient
        profile={profile}
        reflections={[]}
        whiteboard={[]}
        isPrivate
      />
    )
  }

  const { data: reflections } = await supabase
    .from('reflections')
    .select('id, prompt_text, reflection_text, mood, tags, word_count, visibility, created_at')
    .eq('user_id', profile.id)
    .neq('visibility', 'private')
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: whiteboard } = await supabase
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
      profile={profile}
      reflections={reflections || []}
      whiteboard={whiteboard || []}
    />
  )
}
