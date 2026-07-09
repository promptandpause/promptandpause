"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/hooks/use-toast'
import { Check, Palette, MusicNote, ImageSquare, Spinner, FloppyDisk, XCircle, CheckCircle } from 'phosphor-react'
import { profileThemePresets, getThemeById } from '@/lib/utils/profileThemes'
import { cn } from '@/lib/utils'

const RESERVED_USERNAMES = new Set([
  'dashboard', 'settings', 'admin', 'api', 'auth', 'login', 'signup',
  'feed', 'friends', 'archive', 'journals', 'saved', 'support',
  'wellness', 'achievements', 'profile', 'u', 'help', 'about',
  'privacy', 'terms', 'pricing', 'contact', 'security', 'crisis',
  'good-bye', 'admin-login', 'admin-panel', 'research', 'features',
  'our-mission', 'support-us', 'cookie-policy', 'privacy-policy',
  'terms-of-service', 'home', 'discover', 'explore',
])

export function ProfileEditor() {
  const { theme } = useTheme()
  const { toast } = useToast()
  const isDark = theme === 'dark'
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    display_name: '',
    username: '',
    bio: '',
    mood_song_url: '',
    mood_song_title: '',
    profile_theme_id: 'default',
    is_public_profile: false,
    show_in_discover: false,
    share_default: 'private' as 'private' | 'friends_only' | 'public',
  })
  const [usernameError, setUsernameError] = useState('')
  const [usernameValid, setUsernameValid] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const { data } = await res.json()
        setProfile({
          display_name: data.display_name || '',
          username: data.username || '',
          bio: data.bio || '',
          mood_song_url: data.mood_song_url || '',
          mood_song_title: data.mood_song_title || '',
          profile_theme_id: data.profile_theme?.preset || 'default',
          is_public_profile: data.is_public_profile || false,
          show_in_discover: data.show_in_discover || false,
          share_default: data.share_default || 'private',
        })
      }
    } catch {}
  }

  async function handleSave() {
    const u = profile.username.trim()
    if (u && RESERVED_USERNAMES.has(u)) {
      toast({ title: 'Invalid username', description: 'That username is reserved', variant: 'destructive' })
      setSaving(false)
      return
    }
    setSaving(true)
    try {
      const selectedTheme = getThemeById(profile.profile_theme_id)
        const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          profile_theme: {
            preset: selectedTheme.id,
            accent_color: selectedTheme.accent_color,
            bg_gradient_start: selectedTheme.bg_gradient_start,
            bg_gradient_end: selectedTheme.bg_gradient_end,
            font_heading: selectedTheme.font_heading,
            font_body: selectedTheme.font_body,
            border_style: selectedTheme.border_style,
            show_sparkles: selectedTheme.show_sparkles,
            show_cursor_trail: selectedTheme.show_cursor_trail,
          },
        }),
      })
      if (res.ok) {
        toast({ title: 'Profile updated', description: 'Your profile changes are live.' })
      } else {
        const body = await res.json().catch(() => ({}))
        toast({ title: 'Error', description: body?.error || `Failed to save (${res.status})`, variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Network error — could not save profile', variant: 'destructive' })
    }
    setSaving(false)
  }

  return (
    <div className="space-y-8">
      {/* Display Name & Username */}
      <Section title="Identity" isDark={isDark}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label isDark={isDark}>Display Name</Label>
            <Input
              value={profile.display_name}
              onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))}
              placeholder="How others see you"
              className={inputClass(isDark)}
            />
          </div>
          <div>
            <Label isDark={isDark}>Username</Label>
            <div className="relative">
              <Input
                value={profile.username}
                onChange={e => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()
                  setProfile(p => ({ ...p, username: val }))
                  setUsernameError('')
                  setUsernameValid(false)
                }}
                onBlur={async () => {
                  const u = profile.username.trim()
                  if (!u) { setUsernameError(''); setUsernameValid(false); return }
                  if (RESERVED_USERNAMES.has(u)) {
                    setUsernameError('This username is reserved')
                    setUsernameValid(false)
                    return
                  }
                  if (u.length < 2) {
                    setUsernameError('Username must be at least 2 characters')
                    setUsernameValid(false)
                    return
                  }
                  setCheckingUsername(true)
                  try {
                    const res = await fetch(`/api/user/check-username?username=${encodeURIComponent(u)}`)
                    const { available } = await res.json()
                    if (available) { setUsernameValid(true); setUsernameError('') }
                    else { setUsernameError('Username already taken'); setUsernameValid(false) }
                  } catch { setUsernameError('Could not verify username') }
                  setCheckingUsername(false)
                }}
                placeholder="your-username"
                className={cn(inputClass(isDark), usernameError ? 'border-rose-500/50' : usernameValid ? 'border-emerald-500/50' : '')}
              />
              {checkingUsername && <Spinner size={14} weight="bold" className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#8B98A5]" />}
              {usernameValid && <CheckCircle size={14} weight="bold" className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
              {usernameError && <XCircle size={14} weight="bold" className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500" />}
            </div>
            {usernameError ? (
              <p className="text-xs mt-1 text-rose-500">{usernameError}</p>
            ) : (
              <p className={`text-xs mt-1 ${isDark ? 'text-white/20' : 'text-[#8B98A5]'}`}>
                Your public profile: promptandpause.com/<strong>@{profile.username || 'username'}</strong>
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* Bio */}
      <Section title="Bio" isDark={isDark}>
        <Textarea
          value={profile.bio}
          onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
          placeholder="Tell people a bit about yourself..."
          maxLength={500}
          className={cn(inputClass(isDark), 'min-h-[80px]')}
        />
        <p className={`text-xs mt-1 ${isDark ? 'text-white/20' : 'text-[#8B98A5]'}`}>{profile.bio.length}/500</p>
      </Section>

      {/* Theme Selector */}
      <Section title="Profile Theme" isDark={isDark} icon={<Palette size={16} weight="bold" />}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {profileThemePresets.map(preset => (
            <button
              key={preset.id}
              onClick={() => setProfile(p => ({ ...p, profile_theme_id: preset.id }))}
              className={cn(
                'relative rounded-xl p-4 text-left transition-all border-2',
                profile.profile_theme_id === preset.id
                  ? 'border-current ring-2 ring-offset-2'
                  : 'border-transparent hover:opacity-80',
              )}
              style={{
                background: preset.preview.cover_gradient,
                color: preset.preview.text_color,
                borderColor: profile.profile_theme_id === preset.id ? preset.accent_color : 'transparent',
              }}
            >
              {profile.profile_theme_id === preset.id && (
                <div className="absolute top-2 right-2" style={{ color: preset.accent_color }}>
                  <Check size={16} weight="bold" />
                </div>
              )}
              <p className="text-sm font-semibold">{preset.name}</p>
              <p className="text-[10px] opacity-60 mt-0.5">{preset.description}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* Mood Song */}
      <Section title="Mood Song" isDark={isDark} icon={<MusicNote size={16} weight="bold" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label isDark={isDark}>Song URL (Spotify / YouTube)</Label>
            <Input
              value={profile.mood_song_url}
              onChange={e => setProfile(p => ({ ...p, mood_song_url: e.target.value }))}
              placeholder="https://open.spotify.com/track/..."
              className={inputClass(isDark)}
            />
          </div>
          <div>
            <Label isDark={isDark}>Song Title</Label>
            <Input
              value={profile.mood_song_title}
              onChange={e => setProfile(p => ({ ...p, mood_song_title: e.target.value }))}
              placeholder="Song name - Artist"
              className={inputClass(isDark)}
            />
          </div>
        </div>
      </Section>

      {/* Privacy & Sharing */}
      <Section title="Sharing Defaults" isDark={isDark}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-[#536471]'}`}>Default visibility</p>
              <p className={`text-xs ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>When you write a new reflection</p>
            </div>
            <select
              value={profile.share_default}
              onChange={e => setProfile(p => ({ ...p, share_default: e.target.value as any }))}
              className={`text-sm rounded-xl px-3 py-2 ${isDark ? 'bg-white/[0.06] text-white border-white/10' : 'bg-white text-[#0F1419] border-[#EFF3F4]'} border`}
            >
              <option value="private">Private</option>
              <option value="friends_only">Friends only</option>
              <option value="public">Public</option>
            </select>
          </div>
          <ToggleRow
            label="Public profile"
            description="Anyone can view your profile page"
            checked={profile.is_public_profile}
            onChange={v => setProfile(p => ({ ...p, is_public_profile: v }))}
            isDark={isDark}
          />
          <ToggleRow
            label="Show in Discover"
            description="Let others find you by your focus areas"
            checked={profile.show_in_discover}
            onChange={v => setProfile(p => ({ ...p, show_in_discover: v }))}
            isDark={isDark}
          />
        </div>
      </Section>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#0F1419] text-white hover:bg-[#536471]'}`}
        >
          {saving ? <Spinner size={16} weight="bold" className="animate-spin mr-2" /> : <FloppyDisk size={16} weight="bold" className="mr-2" />}
          Save Profile
        </Button>
      </div>
    </div>
  )
}

function Section({ title, children, isDark, icon }: { title: string; children: React.ReactNode; isDark: boolean; icon?: React.ReactNode }) {
  return (
    <div className={`rounded-2xl p-5 ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/80 border border-[#EFF3F4]'}`}>
      <h3 className={`flex items-center gap-2 text-sm font-semibold mb-4 ${isDark ? 'text-white/70' : 'text-[#536471]'}`}>
        {icon}{title}
      </h3>
      {children}
    </div>
  )
}

function Label({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return <p className={`text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-[#8B98A5]'}`}>{children}</p>
}

function ToggleRow({ label, description, checked, onChange, isDark }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void; isDark: boolean
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <div>
        <p className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-[#536471]'}`}>{label}</p>
        <p className={`text-xs ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-[#1D9BF0]' : isDark ? 'bg-white/10' : 'bg-[#EFF3F4]'}`}
      >
        <motion.div
          animate={{ x: checked ? 22 : 2 }}
          className={`absolute top-1 h-4 w-4 rounded-full ${checked ? 'bg-white' : isDark ? 'bg-white/30' : 'bg-white'}`}
        />
      </button>
    </label>
  )
}

function inputClass(isDark: boolean) {
  return isDark
    ? 'bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/20'
    : 'bg-white border-[#EFF3F4] text-[#0F1419] placeholder:text-[#8B98A5]'
}
