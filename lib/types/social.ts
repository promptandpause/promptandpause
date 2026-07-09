export type Visibility = 'private' | 'friends_only' | 'public'

export interface Friend {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
  updated_at: string
  profile?: {
    id: string
    full_name: string | null
    display_name: string | null
    username: string | null
    avatar_url: string | null
    bio: string | null
  }
}

export interface Circle {
  id: string
  owner_id: string
  name: string
  description: string | null
  created_at: string
  members?: CircleMember[]
}

export interface CircleMember {
  circle_id: string
  friend_id: string
  added_at: string
  profile?: {
    id: string
    full_name: string | null
    display_name: string | null
    username: string | null
    avatar_url: string | null
  }
}

export interface Comment {
  id: string
  reflection_id: string
  author_id: string
  body: string
  created_at: string
  updated_at: string
  author?: {
    id: string
    full_name: string | null
    display_name: string | null
    username: string | null
    avatar_url: string | null
  }
}

export interface WhiteboardEntry {
  id: string
  profile_user_id: string
  author_id: string
  content_type: 'text' | 'doodle' | 'voice_note' | 'sticker'
  content: Record<string, any>
  created_at: string
  author?: {
    id: string
    full_name: string | null
    display_name: string | null
    username: string | null
    avatar_url: string | null
  }
}

export interface CommunityPrompt {
  id: string
  author_id: string
  prompt_text: string
  category: string | null
  votes_count: number
  is_featured: boolean
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  author?: {
    id: string
    full_name: string | null
    display_name: string | null
    username: string | null
  }
  user_vote?: 'up' | 'down' | null
}

export interface SocialNotification {
  id: string
  user_id: string
  type: 'friend_request' | 'friend_accepted' | 'new_comment' | 'whiteboard' | 'share'
  actor_id: string | null
  reflection_id: string | null
  body: string | null
  is_read: boolean
  created_at: string
  actor?: {
    id: string
    full_name: string | null
    display_name: string | null
    username: string | null
    avatar_url: string | null
  }
}

export interface ProfileWithSocial {
  id: string
  full_name: string | null
  display_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  cover_image_url: string | null
  profile_theme: ProfileTheme | null
  mood_song_url: string | null
  mood_song_title: string | null
  is_public_profile: boolean
  share_default: Visibility
  show_in_discover: boolean
  subscription_tier: string
  friend_status?: 'none' | 'pending_sent' | 'pending_received' | 'accepted'
}

export interface ProfileTheme {
  preset: string
  accent_color: string
  bg_gradient_start: string
  bg_gradient_end: string
  font_heading: string
  font_body: string
  custom_css?: string
  border_style?: 'rounded' | 'squared' | 'retro'
  show_sparkles?: boolean
  show_cursor_trail?: boolean
}

export interface FeedItem {
  reflection: {
    id: string
    prompt_text: string
    reflection_text: string
    mood: string
    tags: string[]
    word_count: number
    visibility: Visibility
    created_at: string
    allow_comments: boolean
  }
  author: {
    id: string
    full_name: string | null
    display_name: string | null
    username: string | null
    avatar_url: string | null
  }
  comment_count: number
}
