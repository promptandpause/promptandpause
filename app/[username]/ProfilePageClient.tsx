"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, MessageCircle, Music, Palette, Sparkles, Lock, Pencil, Settings, Layout, Archive, House, Heart, Rss, Trash2, X, ArrowLeft, Ban } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import { toast } from 'sonner'
import { FriendButton } from '@/components/social/FriendButton'
import { WhiteboardSection } from '@/components/social/WhiteboardSection'
import { CommentSection } from '@/components/social/CommentSection'
import { ProfileEditor } from '@/components/social/ProfileEditor'
import { ReportBlockMenu } from '@/components/social/ReportBlockMenu'
import { CursorTrail } from '@/components/social/CursorTrail'
import { WhoToFollow } from '@/app/dashboard/components/WhoToFollow'
import { TrendingTopics } from '@/app/dashboard/components/TrendingTopics'
import { SearchBar } from '@/app/dashboard/components/SearchBar'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  const [likesCursor, setLikesCursor] = useState<string | null>(null)
  const [likesHasMore, setLikesHasMore] = useState(false)
  const [likesLoadingMore, setLikesLoadingMore] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState<string[]>([])
  const isBlocked = !isOwnProfile && blockedUsers.includes(profile.id)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.ok ? r.json() : Promise.resolve(null))
      .then(d => setLoggedInUserId(d?.data?.id || null))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/social/block')
      .then(r => r.ok ? r.json() : Promise.resolve({ data: [] }))
      .then(d => setBlockedUsers((d?.data || []).map((b: { blocked_id: string }) => b.blocked_id)))
      .catch(() => {})
  }, [])


  useEffect(() => {
    if (activeTab === 'likes' && !likesLoaded) {
      setLikesLoading(true)
      fetch(`/api/social/liked-feed?user_id=${profile.id}`)
        .then(r => r.ok ? r.json() : Promise.resolve({ data: [] }))
        .then(({ data, nextCursor, hasMore }) => {
          setLikesFeed(data || [])
          setLikesCursor(nextCursor || null)
          setLikesHasMore(!!hasMore)
          setLikesLoaded(true)
        })
        .catch(() => {})
        .finally(() => setLikesLoading(false))
    }
  }, [activeTab, likesLoaded, profile.id])

  async function loadMoreLikes() {
    if (likesLoadingMore || !likesHasMore || !likesCursor) return
    setLikesLoadingMore(true)
    try {
      const res = await fetch(`/api/social/liked-feed?user_id=${profile.id}&before=${encodeURIComponent(likesCursor)}`)
      const { data, nextCursor, hasMore } = await res.json()
      setLikesFeed(prev => [...prev, ...(data || [])])
      setLikesCursor(nextCursor || null)
      setLikesHasMore(!!hasMore)
    } catch {}
    setLikesLoadingMore(false)
  }

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

  const accentColor = profile.profile_theme?.accent_color || '#1D9BF0'
  const coverStart = profile.profile_theme?.bg_gradient_start || `${accentColor}22`
  const coverEnd = profile.profile_theme?.bg_gradient_end || `${accentColor}44`
  const headingFont = profile.profile_theme?.font_heading || undefined
  const bodyFont = profile.profile_theme?.font_body || undefined
  const showSparkles = !!profile.profile_theme?.show_sparkles
  const showCursorTrail = !!profile.profile_theme?.show_cursor_trail
  const cardRadius = profile.profile_theme?.border_style === 'squared'
    ? '4px'
    : profile.profile_theme?.border_style === 'retro'
    ? '8px'
    : '16px'
  const cardBorderWidth = profile.profile_theme?.border_style === 'retro' ? '2px' : '1px'
  const cardStyle = { borderRadius: cardRadius, borderWidth: cardBorderWidth } as const

  const displayName = profile.display_name || profile.full_name || profile.username
  const initials = displayName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}>
      {showCursorTrail && <CursorTrail color={accentColor} />}
      {/* Cover Image */}
      <div
        className="h-32 sm:h-48 md:h-64 w-full relative overflow-hidden"
        style={{
          background: profile.cover_image_url
            ? `url(${profile.cover_image_url}) center/cover`
            : `linear-gradient(135deg, ${coverStart}, ${coverEnd})`,
        }}
      >
        {showSparkles && <SparkleField color={accentColor} />}
        {/* Back to Dashboard -- always visible, own profile or someone else's */}
        <Link
          href="/dashboard"
          className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-full bg-black/40 hover:bg-black/55 backdrop-blur-md text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs font-semibold hidden sm:inline">Dashboard</span>
        </Link>
      </div>

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
                <h1
                  className={`text-xl sm:text-2xl md:text-3xl font-bold truncate ${isDark ? 'text-white' : 'text-[#0F1419]'}`}
                  style={headingFont ? { fontFamily: `var(--font-${headingFont.toLowerCase().replace(/\s+/g, '-')}, ${headingFont}, inherit)` } : undefined}
                >
                  {displayName}
                </h1>
                {profile.username && (
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                    @{profile.username}
                  </p>
                )}
                {isBlocked && (
                  <span className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'}`}>
                    <Ban size={12} /> Blocked
                  </span>
                )}
              </div>
              <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
                {isOwnProfile ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditModal(true)}
                      className={`rounded-full text-xs font-semibold gap-1.5 ${
                        isDark
                          ? 'border-white/20 text-white hover:bg-white/10'
                          : 'border-[#CFD9DE] text-[#0F1419] hover:bg-[#EFF3F4]'
                      }`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Profile
                    </Button>
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
                  <div className="flex items-center gap-2">
                    <FriendButton profileUserId={profile.id} />
                    <ReportBlockMenu
                      targetType="user"
                      targetId={profile.id}
                      authorId={profile.id}
                      authorName={displayName ?? undefined}
                      currentUserId={loggedInUserId}
                      isBlocked={isBlocked}
                      onBlocked={() => setBlockedUsers(prev => prev.includes(profile.id) ? prev : [...prev, profile.id])}
                      onUnblock={() => setBlockedUsers(prev => prev.filter(id => id !== profile.id))}
                    />
                  </div>
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
                style={bodyFont ? { fontFamily: `var(--font-${bodyFont.toLowerCase().replace(/\s+/g, '-')}, ${bodyFont}, inherit)` } : undefined}
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
                  <button onClick={() => setShowEditModal(true)} className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                    isDark
                      ? 'bg-[#1D9BF0] text-white hover:bg-[#1A8CD8]'
                      : 'bg-[#1D9BF0] text-white hover:bg-[#1A8CD8]'
                  }`}>
                    Edit Settings
                  </button>
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
                    className={`p-4 sm:p-5 ${
                      isDark
                        ? 'bg-white/[0.04] border border-white/[0.06]'
                        : 'bg-white/80 border border-[#EFF3F4]'
                    }`}
                    style={cardStyle}
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
                        <CommentSection reflectionId={ref.id} reflectionOwnerId={profile.id} />
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
                      className={`p-4 sm:p-5 ${
                        isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/80 border border-[#EFF3F4]'
                      }`}
                      style={cardStyle}
                    >
                      <Link href={ref.profile?.username ? `/${ref.profile.username}` : '#'} className={`text-xs font-semibold mb-1 inline-block ${isDark ? 'text-white/60 hover:text-white' : 'text-[#536471] hover:text-[#0F1419]'}`}>
                        {authorName}
                      </Link>
                      {ref.user_id && (
                        <div className="float-right -mt-1">
                          <ReportBlockMenu
                            targetType="reflection"
                            targetId={ref.id}
                            authorId={ref.user_id}
                            authorName={authorName}
                            currentUserId={loggedInUserId}
                            isBlocked={blockedUsers.includes(ref.user_id)}
                            onBlocked={() => setLikesFeed(prev => prev.filter(f => f.user_id !== ref.user_id))}
                            onUnblock={() => setBlockedUsers(prev => prev.filter(id => id !== ref.user_id))}
                          />
                        </div>
                      )}
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
                          <CommentSection reflectionId={ref.id} reflectionOwnerId={ref.user_id} />
                        </div>
                      )}
                    </motion.div>
                  )
                })
              )}
              {likesHasMore && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={loadMoreLikes}
                    disabled={likesLoadingMore}
                    className={`text-xs font-semibold px-4 py-2 rounded-full transition-colors ${
                      isDark ? 'text-[#1D9BF0] hover:bg-white/[0.06]' : 'text-[#1D9BF0] hover:bg-[#EFF3F4]'
                    }`}
                  >
                    {likesLoadingMore ? 'Loading…' : 'Load more'}
                  </button>
                </div>
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

      {/* Edit Profile Modal (Twitter-style: same page, overlay, no navigation) */}
      <AnimatePresence>
        {showEditModal && isOwnProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto"
          >
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowEditModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className={`relative w-full sm:max-w-2xl sm:my-8 sm:rounded-2xl overflow-hidden ${
                isDark ? 'bg-[#0A0A0A]' : 'bg-white'
              }`}
            >
              <div className={`sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b backdrop-blur-md ${
                isDark ? 'bg-[#0A0A0A]/90 border-white/[0.08]' : 'bg-white/90 border-[#EFF3F4]'
              }`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-[#EFF3F4] text-[#0F1419]'}`}
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                    Edit profile
                  </h2>
                </div>
              </div>
              <div className="px-4 sm:px-6 py-5 max-h-[80vh] overflow-y-auto">
                <ProfileEditor
                  onSaved={() => {
                    setShowEditModal(false)
                    router.refresh()
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
</div>
  )
}

function SparkleField({ color }: { color: string }) {
  const sparkles = [
    { top: '15%', left: '8%', size: 14, delay: 0 },
    { top: '60%', left: '18%', size: 10, delay: 0.6 },
    { top: '25%', left: '85%', size: 12, delay: 1.1 },
    { top: '70%', left: '92%', size: 16, delay: 0.3 },
    { top: '40%', left: '50%', size: 10, delay: 1.6 },
    { top: '80%', left: '55%', size: 12, delay: 0.9 },
  ]

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {sparkles.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top: s.top, left: s.left, color }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], rotate: [0, 90] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
        >
          <Sparkles size={s.size} fill="currentColor" strokeWidth={0} />
        </motion.div>
      ))}
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
