"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, MessageCircle, Music, Palette, Sparkles, Lock, Pencil, Settings, Layout, Archive, House, Heart, Rss, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import { FriendButton } from '@/components/social/FriendButton'
import { WhiteboardSection } from '@/components/social/WhiteboardSection'
import { CommentSection } from '@/components/social/CommentSection'
import { WhoToFollow } from '@/app/dashboard/components/WhoToFollow'
import { TrendingTopics } from '@/app/dashboard/components/TrendingTopics'
import { SearchBar } from '@/app/dashboard/components/SearchBar'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ProfileWithSocial, WhiteboardEntry } from '@/lib/types/social'

interface Reflection {
  id: string
  prompt_text: string
  reflection_text: string
  mood: string
  tags: string[]
  visibility: string
  allow_comments?: boolean
  created_at: string
  user_id?: string
  like_count?: number
  comment_count?: number
  is_liked_by_me?: boolean
}

interface LikedReflection extends Reflection {
  profile?: {
    id: string
    full_name: string | null
    display_name: string | null
    username: string | null
    avatar_url: string | null
  } | null
}

export function ProfilePageClient({
  profile,
  reflections,
  whiteboard,
  isPrivate,
  isOwnProfile,
}: {
  profile: ProfileWithSocial
  reflections: Reflection[]
  whiteboard: WhiteboardEntry[]
  isPrivate?: boolean
  isOwnProfile?: boolean
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [activeTab, setActiveTab] = useState<'reflections' | 'whiteboard' | 'likes'>('reflections')
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null)
  const [myReflections, setMyReflections] = useState<Reflection[]>(reflections)
  const [openComments, setOpenComments] = useState<Set<string>>(new Set())
  const [likesFeed, setLikesFeed] = useState<LikedReflection[]>([])
  const [likesLoading, setLikesLoading] = useState(false)
  const [likesLoaded, setLikesLoaded] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.ok ? r.json() : Promise.resolve(null))
      .then(d => setLoggedInUserId(d?.data?.id || null))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (activeTab === 'likes' && !likesLoaded) {
      setLikesLoading(true)
      fetch(`/api/social/liked-feed?user_id=${profile.id}`)
        .then(r => r.ok ? r.json() : Promise.resolve({ data: [] }))
        .then(({ data }) => { setLikesFeed(data || []); setLikesLoaded(true) })
        .catch(() => {})
        .finally(() => setLikesLoading(false))
    }
  }, [activeTab, likesLoaded, profile.id])

  function toggleComments(id: string) {
    setOpenComments(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function toggleLike(item: Reflection, list: 'reflections' | 'likes') {
    const res = await fetch('/api/social/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reflection_id: item.id }),
    })
    if (!res.ok) return
    const update = (r: Reflection) =>
      r.id === item.id
        ? { ...r, is_liked_by_me: !r.is_liked_by_me, like_count: (r.like_count || 0) + (r.is_liked_by_me ? -1 : 1) }
        : r
    if (list === 'reflections') {
      setMyReflections(prev => prev.map(update))
    } else {
      setLikesFeed(prev => prev.map(update))
    }
  }

  async function deleteReflection(id: string) {
    if (!confirm('Delete this reflection? This cannot be undone.')) return
    const res = await fetch(`/api/reflections/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setMyReflections(prev => prev.filter(r => r.id !== id))
    }
  }

  const isActive = (path: string) => pathname.startsWith(path)

  const accentColor = profile.profile_theme?.accent_color || (isDark ? '#1D9BF0' : '#1D9BF0')

  const displayName = profile.display_name || profile.full_name || profile.username
  const initials = displayName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}>
      {/* Cover Image */}
      <div
        className="h-32 sm:h-48 md:h-64 w-full relative overflow-hidden"
        style={{
          background: profile.cover_image_url
            ? `url(${profile.cover_image_url}) center/cover`
            : `linear-gradient(135deg, ${accentColor}22, ${accentColor}44)`,
        }}
      />

      {/* Main Content + Sidebar */}
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex gap-6">
          {/* Left Column */}
          <div className="flex-1 min-w-0">

      {/* Profile Header */}
      <div className="-mt-[40px] sm:-mt-16 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="self-start"
          >
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 border-4 border-white dark:border-[#0A0A0A] ring-2 ring-black/5">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className={`text-2xl sm:text-4xl font-light ${isDark ? 'bg-[#161618] text-white/60' : 'bg-white text-[#536471]'}`}>
                {initials}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          <div className="flex-1 pb-1 sm:pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="min-w-0">
                <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold truncate ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                  {displayName}
                </h1>
                {profile.username && (
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                    @{profile.username}
                  </p>
                )}
              </div>
              <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
                {isOwnProfile ? (
                  <>
                    <Link href="/settings/profile">
                      <Button variant="outline" size="sm" className={`rounded-full text-xs font-semibold gap-1.5 ${
                        isDark
                          ? 'border-white/20 text-white hover:bg-white/10'
                          : 'border-[#CFD9DE] text-[#0F1419] hover:bg-[#EFF3F4]'
                      }`}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit Profile
                      </Button>
                    </Link>
                    <Link href="/settings">
                      <Button variant="outline" size="sm" className={`rounded-full text-xs font-semibold gap-1.5 ${
                        isDark
                          ? 'border-white/20 text-white/60 hover:bg-white/10'
                          : 'border-[#CFD9DE] text-[#536471] hover:bg-[#EFF3F4]'
                      }`}>
                        <Settings className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <FriendButton profileUserId={profile.id} />
                )}
              </div>
            </div>

            {/* Quick links for own profile */}
            {isOwnProfile && (
              <div className="flex items-center gap-3 mt-3">
                <Link href="/dashboard" className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  isDark ? 'text-[#1D9BF0] hover:text-[#1A8CD8]' : 'text-[#1D9BF0] hover:text-[#1A8CD8]'
                }`}>
                  <Layout className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
                <Link href="/archive" className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  isDark ? 'text-white/40 hover:text-white/60' : 'text-[#536471] hover:text-[#0F1419]'
                }`}>
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </Link>
              </div>
            )}

            {profile.bio && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed max-w-xl ${isDark ? 'text-white/60' : 'text-[#536471]'}`}
              >
                {profile.bio}
              </motion.p>
            )}

            {profile.mood_song_url && (
              <div className={`mt-2 flex items-center gap-2 text-xs ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                <Music className="h-3.5 w-3.5" />
                <span>Current vibe: {profile.mood_song_title || '🎵'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden mt-4">
          <SearchBar />
        </div>

        {/* Navigation Tabs */}
        <div className={`mt-6 sm:mt-8 border-b ${isDark ? 'border-white/10' : 'border-[#EFF3F4]'}`}>
          <div className="flex gap-6 -mb-px">
            <TabButton
              active={activeTab === 'reflections'}
              onClick={() => setActiveTab('reflections')}
              isDark={isDark}
              accentColor={accentColor}
              loggedInUserId={loggedInUserId}
              isActive={isActive}
            >
              Reflections
            </TabButton>
            <TabButton
              active={activeTab === 'whiteboard'}
              onClick={() => setActiveTab('whiteboard')}
              isDark={isDark}
              accentColor={accentColor}
              loggedInUserId={loggedInUserId}
              isActive={isActive}
            >
              Whiteboard
            </TabButton>
            <TabButton
              active={activeTab === 'likes'}
              onClick={() => setActiveTab('likes')}
              isDark={isDark}
              accentColor={accentColor}
              loggedInUserId={loggedInUserId}
              isActive={isActive}
            >
              Likes
            </TabButton>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-4 sm:mt-6 pb-20 sm:pb-16 md:pb-16">
          {isPrivate ? (
            <div className={`rounded-2xl p-8 sm:p-10 text-center ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white/60 border border-[#EFF3F4]'}`}>
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-white/[0.06]' : 'bg-[#EFF3F4]'}`}>
                <Lock size={28} className={isDark ? 'text-white/20' : 'text-[#8B98A5]'} />
              </div>
              <h2 className={`text-lg sm:text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                {isOwnProfile ? 'Your profile is private' : "This account's profile is private"}
              </h2>
              <p className={`text-xs sm:text-sm mb-6 max-w-md mx-auto ${isDark ? 'text-white/40' : 'text-[#536471]'}`}>
                {isOwnProfile
                  ? 'Your reflections are currently hidden. Go to settings to make your profile public.'
                  : `@{profile.username} has marked their profile as private.`}
              </p>
              <div className="flex items-center justify-center gap-3">
                {isOwnProfile ? (
                  <Link href="/settings/profile" className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                    isDark
                      ? 'bg-[#1D9BF0] text-white hover:bg-[#1A8CD8]'
                      : 'bg-[#1D9BF0] text-white hover:bg-[#1A8CD8]'
                  }`}>
                    Edit Settings
                  </Link>
                ) : (
                  <>
                    <button onClick={() => window.history.back()} className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors border ${
                      isDark
                        ? 'border-white/20 text-white hover:bg-white/[0.06]'
                        : 'border-[#CFD9DE] text-[#0F1419] hover:bg-[#EFF3F4]'
                    }`}>Go Back</button>
                    <a href="/" className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                      isDark
                        ? 'bg-[#1D9BF0] text-white hover:bg-[#1A8CD8]'
                        : 'bg-[#1D9BF0] text-white hover:bg-[#1A8CD8]'
                    }`}>Go to Dashboard</a>
                  </>
                )}
              </div>
            </div>
          ) : activeTab === 'reflections' && (
            <div className="space-y-3 sm:space-y-4">
              {myReflections.length === 0 ? (
                <div className={`text-center py-12 sm:py-16 ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>
                  <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium mb-1">
                    {isOwnProfile ? 'No shared reflections yet' : 'No shared reflections yet.'}
                  </p>
                  <p className="text-xs">
                    {isOwnProfile ? 'Reflections you share publicly will appear here.' : ''}
                  </p>
                </div>
              ) : (
                myReflections.map((ref, i) => (
                  <motion.div
                    key={ref.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-xl sm:rounded-2xl p-4 sm:p-5 ${
                      isDark
                        ? 'bg-white/[0.04] border border-white/[0.06]'
                        : 'bg-white/80 border border-[#EFF3F4]'
                    }`}
                  >
                    {ref.prompt_text && (
                      <p className={`text-xs sm:text-sm font-medium mb-2 ${isDark ? 'text-white/50' : 'text-[#8B98A5]'}`}>
                        {ref.prompt_text}
                      </p>
                    )}
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-white/80' : 'text-[#0F1419]'}`}>
                      {ref.reflection_text.slice(0, 300)}
                      {ref.reflection_text.length > 300 ? '...' : ''}
                    </p>
                    <div className="flex items-center gap-2 sm:gap-3 mt-3 flex-wrap">
                      <span className="text-lg leading-none">{ref.mood}</span>
                      {ref.tags?.slice(0, 4).map(tag => (
                        <span
                          key={tag}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            isDark ? 'bg-white/[0.06] text-white/40' : 'bg-[#F7F9FA] text-[#8B98A5]'
                          }`}
                        >
                          #{tag}
                        </span>
                      ))}
                      {ref.visibility && ref.visibility !== 'public' && (
                        <span className={`text-[10px] ${isDark ? 'text-white/20' : 'text-[#CFD9DE]'}`}>
                          {ref.visibility === 'friends_only' ? 'Friends' : 'Private'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-6 mt-3">
                      <button
                        onClick={() => toggleComments(ref.id)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${isDark ? 'text-white/30 hover:text-[#1D9BF0]' : 'text-[#536471] hover:text-[#1D9BF0]'}`}
                      >
                        <MessageCircle size={14} /> {ref.comment_count ? ref.comment_count : 'Reply'}
                      </button>
                      <button
                        onClick={() => toggleLike(ref, 'reflections')}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                          ref.is_liked_by_me ? 'text-pink-500' : isDark ? 'text-white/30 hover:text-pink-400' : 'text-[#536471] hover:text-pink-500'
                        }`}
                      >
                        <Heart size={14} fill={ref.is_liked_by_me ? 'currentColor' : 'none'} /> {ref.like_count ? ref.like_count : 'Like'}
                      </button>
                      {isOwnProfile && (
                        <button
                          onClick={() => deleteReflection(ref.id)}
                          className={`flex items-center gap-1.5 text-xs transition-colors ml-auto ${isDark ? 'text-white/30 hover:text-red-400' : 'text-[#536471] hover:text-red-500'}`}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                    {openComments.has(ref.id) && (
                      <div className={`mt-3 -mx-4 sm:-mx-5 border-t ${isDark ? 'border-white/[0.06]' : 'border-[#EFF3F4]'}`}>
                        <CommentSection reflectionId={ref.id} />
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}

          {!isPrivate && activeTab === 'whiteboard' && (
            <WhiteboardSection
              profileUserId={profile.id}
              entries={whiteboard}
              isOwnProfile={isOwnProfile}
            />
          )}

          {!isPrivate && activeTab === 'likes' && (
            <div className="space-y-3 sm:space-y-4">
              {likesLoading ? (
                <div className={`text-center py-12 ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>Loading...</div>
              ) : likesFeed.length === 0 ? (
                <div className={`text-center py-12 sm:py-16 ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>
                  <Heart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium mb-1">No likes yet</p>
                  <p className="text-xs">
                    {isOwnProfile ? 'Reflections you like will show up here.' : `Reflections ${displayName} likes will show up here.`}
                  </p>
                </div>
              ) : (
                likesFeed.map((ref, i) => {
                  const authorName = ref.profile?.display_name || ref.profile?.full_name || ref.profile?.username || 'Unknown'
                  return (
                    <motion.div
                      key={ref.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`rounded-xl sm:rounded-2xl p-4 sm:p-5 ${
                        isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/80 border border-[#EFF3F4]'
                      }`}
                    >
                      <Link href={ref.profile?.username ? `/${ref.profile.username}` : '#'} className={`text-xs font-semibold mb-1 inline-block ${isDark ? 'text-white/60 hover:text-white' : 'text-[#536471] hover:text-[#0F1419]'}`}>
                        {authorName}
                      </Link>
                      {ref.prompt_text && (
                        <p className={`text-xs sm:text-sm font-medium mb-2 ${isDark ? 'text-white/50' : 'text-[#8B98A5]'}`}>
                          {ref.prompt_text}
                        </p>
                      )}
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-white/80' : 'text-[#0F1419]'}`}>
                        {ref.reflection_text}
                      </p>
                      <div className="flex items-center gap-6 mt-3">
                        <button
                          onClick={() => toggleComments(ref.id)}
                          className={`flex items-center gap-1.5 text-xs transition-colors ${isDark ? 'text-white/30 hover:text-[#1D9BF0]' : 'text-[#536471] hover:text-[#1D9BF0]'}`}
                        >
                          <MessageCircle size={14} /> {ref.comment_count ? ref.comment_count : 'Reply'}
                        </button>
                        <button
                          onClick={() => toggleLike(ref, 'likes')}
                          className={`flex items-center gap-1.5 text-xs transition-colors ${
                            ref.is_liked_by_me ? 'text-pink-500' : isDark ? 'text-white/30 hover:text-pink-400' : 'text-[#536471] hover:text-pink-500'
                          }`}
                        >
                          <Heart size={14} fill={ref.is_liked_by_me ? 'currentColor' : 'none'} /> {ref.like_count ? ref.like_count : 'Like'}
                        </button>
                      </div>
                      {openComments.has(ref.id) && (
                        <div className={`mt-3 -mx-4 sm:-mx-5 border-t ${isDark ? 'border-white/[0.06]' : 'border-[#EFF3F4]'}`}>
                          <CommentSection reflectionId={ref.id} />
                        </div>
                      )}
                    </motion.div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="hidden lg:block w-[320px] xl:w-[350px] shrink-0 pt-4">
        <div className="sticky top-3 space-y-4">
          <SearchBar />
          <WhoToFollow />
          <TrendingTopics />
        </div>
      </aside>
    </div>
  </div>
</div>
</div>
  )
}

function TabButton({
  active,
  onClick,
  children,
  isDark,
  accentColor,
  loggedInUserId,
  isActive,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  isDark: boolean
  accentColor: string
  loggedInUserId?: string | null
  isActive?: (path: string) => boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`relative pb-3 text-sm font-medium transition-colors ${
        active
          ? isDark ? 'text-white' : 'text-[#0F1419]'
          : isDark ? 'text-white/30 hover:text-white/50' : 'text-[#8B98A5] hover:text-[#536471]'
      }`}
    >
      {children}
      {active && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
      )}

      {/* ─── Mobile Bottom Tab Bar (when logged in) ─── */}
      {loggedInUserId && isActive && (
        <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom,0px)] ${
          isDark ? 'bg-[#0A0A0A]/90 backdrop-blur-lg border-t border-white/[0.06]' : 'bg-white/90 backdrop-blur-lg border-t border-[#EFF3F4]'
        }`}>
          <div className="flex items-center justify-around h-14">
            {[
              { id: 'home', label: 'Home', href: '/dashboard', icon: House },
              { id: 'reflect', label: 'Reflect', href: '/reflect', icon: MessageCircle },
              { id: 'feed', label: 'Feed', href: '/dashboard', icon: Rss },
              { id: 'wellness', label: 'Wellness', href: '/wellness', icon: Heart },
              { id: 'archive', label: 'Archive', href: '/archive', icon: Archive },
            ].map((item) => (
              <Link key={item.id} href={item.href}>
                <button className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? isDark ? 'text-white' : 'text-[#1D9BF0]'
                    : isDark ? 'text-white/30' : 'text-[#8B98A5]'
                }`}>
                  <item.icon size={20} />
                  <span className="text-[10px] font-medium leading-none">{item.label}</span>
                </button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </button>
  )
}
