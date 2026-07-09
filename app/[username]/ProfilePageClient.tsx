"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, MessageCircle, Music, Palette, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import { FriendButton } from '@/components/social/FriendButton'
import { WhiteboardSection } from '@/components/social/WhiteboardSection'
import type { ProfileWithSocial, WhiteboardEntry } from '@/lib/types/social'

interface Reflection {
  id: string
  prompt_text: string
  reflection_text: string
  mood: string
  tags: string[]
  visibility: string
  created_at: string
}

export function ProfilePageClient({
  profile,
  reflections,
  whiteboard,
}: {
  profile: ProfileWithSocial
  reflections: Reflection[]
  whiteboard: WhiteboardEntry[]
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [activeTab, setActiveTab] = useState<'reflections' | 'whiteboard'>('reflections')

  const themePreset = profile.profile_theme?.preset || 'default'
  const accentColor = profile.profile_theme?.accent_color || (isDark ? '#1D9BF0' : '#1D9BF0')

  const displayName = profile.display_name || profile.full_name || profile.username
  const initials = displayName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}>
      {/* Cover Image */}
      <div
        className="h-48 md:h-64 w-full relative overflow-hidden"
        style={{
          background: profile.cover_image_url
            ? `url(${profile.cover_image_url}) center/cover`
            : `linear-gradient(135deg, ${accentColor}22, ${accentColor}44)`,
        }}
      />

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white dark:border-[#0A0A0A] ring-2 ring-black/5">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className={`text-4xl font-light ${isDark ? 'bg-[#161618] text-white/60' : 'bg-white text-[#536471]'}`}>
                {initials}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          <div className="flex-1 pb-2">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div>
                <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                  {displayName}
                </h1>
                {profile.username && (
                  <p className={`text-sm ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                    @{profile.username}
                  </p>
                )}
              </div>
              <div className="md:ml-auto">
                <FriendButton profileUserId={profile.id} />
              </div>
            </div>

            {profile.bio && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-3 text-sm leading-relaxed max-w-xl ${isDark ? 'text-white/60' : 'text-[#536471]'}`}
              >
                {profile.bio}
              </motion.p>
            )}

            {/* Mood Song */}
            {profile.mood_song_url && (
              <div className={`mt-3 flex items-center gap-2 text-xs ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                <Music className="h-3.5 w-3.5" />
                <span>Current vibe: {profile.mood_song_title || '🎵'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`mt-8 border-b ${isDark ? 'border-white/10' : 'border-[#EFF3F4]'}`}>
          <div className="flex gap-6">
            <TabButton
              active={activeTab === 'reflections'}
              onClick={() => setActiveTab('reflections')}
              isDark={isDark}
              accentColor={accentColor}
            >
              Reflections
            </TabButton>
            <TabButton
              active={activeTab === 'whiteboard'}
              onClick={() => setActiveTab('whiteboard')}
              isDark={isDark}
              accentColor={accentColor}
            >
              Whiteboard
            </TabButton>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6 pb-16">
          {activeTab === 'reflections' && (
            <div className="space-y-4">
              {reflections.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>
                  No shared reflections yet.
                </p>
              ) : (
                reflections.map((ref, i) => (
                  <motion.div
                    key={ref.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-2xl p-5 ${
                      isDark
                        ? 'bg-white/[0.04] border border-white/[0.06]'
                        : 'bg-white/80 border border-[#EFF3F4]'
                    }`}
                  >
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-white/50' : 'text-[#8B98A5]'}`}>
                      {ref.prompt_text}
                    </p>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-white/80' : 'text-[#0F1419]'}`}>
                      {ref.reflection_text.slice(0, 300)}
                      {ref.reflection_text.length > 300 ? '...' : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-lg">{ref.mood}</span>
                      {ref.tags?.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            isDark ? 'bg-white/[0.06] text-white/40' : 'bg-[#F7F9FA] text-[#8B98A5]'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === 'whiteboard' && (
            <WhiteboardSection
              profileUserId={profile.id}
              entries={whiteboard}
            />
          )}
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
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  isDark: boolean
  accentColor: string
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
    </button>
  )
}
