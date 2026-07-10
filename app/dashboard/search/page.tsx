"use client"

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { DashboardSidebar } from '../components/DashboardSidebar'
import { useTheme } from '@/contexts/ThemeContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Spinner, MagnifyingGlass, Hash } from 'phosphor-react'
import Link from 'next/link'

interface SearchReflection {
  id: string
  reflection_text: string
  prompt_text: string
  mood: string
  tags: string[]
  created_at: string
  user_id: string
  profile: {
    id: string
    full_name: string
    display_name: string
    username: string
    avatar_url: string
  }
}

interface SearchProfile {
  id: string
  full_name: string
  display_name: string
  username: string
  avatar_url: string
  bio: string
}

export default function SearchPage() {
  return (
    <AuthGuard redirectPath="/dashboard/search">
      <SearchContent />
    </AuthGuard>
  )
}

function SearchContent() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()
  const searchParams = useSearchParams()
  const tagParam = searchParams.get('tag') || ''
  const qParam = searchParams.get('q') || ''

  const [query, setQuery] = useState(qParam)
  const [tab, setTab] = useState<'all' | 'reflections' | 'profiles'>('all')
  const [reflections, setReflections] = useState<SearchReflection[]>([])
  const [profiles, setProfiles] = useState<SearchProfile[]>([])
  const [loading, setLoading] = useState(false)

  const doSearch = useCallback(async (searchQuery: string, searchTag: string) => {
    if (!searchQuery.trim() && !searchTag.trim()) {
      setReflections([])
      setProfiles([])
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('q', searchQuery.trim())
      if (searchTag.trim()) params.set('tag', searchTag.trim())
      if (tab !== 'all') params.set('type', tab)

      const res = await fetch(`/api/search?${params}`)
      const body = await res.json()
      if (body.success) {
        setReflections(body.data.reflections || [])
        setProfiles(body.data.profiles || [])
      }
    } catch {}
    setLoading(false)
  }, [tab])

  useEffect(() => {
    if (tagParam) {
      setQuery('')
      doSearch('', tagParam)
    }
  }, [tagParam, doSearch])

  useEffect(() => {
    if (qParam && !tagParam) {
      setQuery(qParam)
      doSearch(qParam, '')
    }
  }, [qParam, tagParam, doSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    router.replace(`/dashboard/search?q=${encodeURIComponent(trimmed)}`, { scroll: false })
    doSearch(trimmed, '')
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}>
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 overflow-y-auto scrollbar-thin border-r border-[#EFF3F4] dark:border-white/[0.06] max-w-[600px]">
          {/* Header */}
          <div className={`sticky top-0 z-10 backdrop-blur-md ${
            isDark ? 'bg-[#0A0A0A]/80 border-b border-white/[0.06]' : 'bg-white/80 border-b border-[#EFF3F4]'
          }`}>
            <div className="px-4 h-12 flex items-center gap-3">
              <button onClick={() => router.back()} className={`p-1 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-[#EFF3F4]'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isDark ? 'text-white' : 'text-[#0F1419]'}>
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                {tagParam ? `#${tagParam}` : 'Search'}
              </h1>
            </div>
          </div>

          {/* Search bar */}
          <div className={`px-4 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-[#EFF3F4]'}`}>
            <form onSubmit={handleSearch}>
              <div className={`flex items-center gap-3 px-4 py-2.5 rounded-full ${
                isDark ? 'bg-white/[0.06]' : 'bg-[#EFF3F4]'
              }`}>
                <MagnifyingGlass size={18} weight="bold" className={isDark ? 'text-white/30' : 'text-[#536471]'} />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={tagParam ? `Search within #${tagParam}...` : 'Search reflections, people...'}
                  className={`flex-1 bg-transparent text-sm outline-none placeholder:text-[#8B98A5] ${
                    isDark ? 'text-white' : 'text-[#0F1419]'
                  }`}
                  autoFocus={!tagParam}
                />
              </div>
            </form>

            {/* Tab bar */}
            <div className="flex mt-3">
              {(['all', 'reflections', 'profiles'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-sm font-semibold text-center transition-colors capitalize ${
                    tab === t
                      ? `border-b-2 border-[#1D9BF0] ${isDark ? 'text-white' : 'text-[#0F1419]'}`
                      : `${isDark ? 'text-white/40 hover:text-white/60' : 'text-[#536471] hover:text-[#0F1419]'}`
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size={24} weight="bold" className={`animate-spin ${isDark ? 'text-white/20' : 'text-[#8B98A5]'}`} />
            </div>
          ) : (
            <div className="pb-16">
              {/* Tag header */}
              {tagParam && !loading && (
                <div className={`px-4 py-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-[#EFF3F4]'}`}>
                  <div className="flex items-center gap-2">
                    <Hash size={20} weight="bold" className={isDark ? 'text-white/40' : 'text-[#536471]'} />
                    <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>{tagParam}</h2>
                  </div>
                  <p className={`text-sm mt-1 ${isDark ? 'text-white/30' : 'text-[#536471]'}`}>
                    {reflections.length} {reflections.length === 1 ? 'reflection' : 'reflections'}
                  </p>
                </div>
              )}

              {/* No results */}
              {!loading && !tagParam && !qParam && (
                <div className={`text-center py-16 px-8 ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>
                  <MagnifyingGlass size={40} weight="bold" className={`mx-auto mb-4 ${isDark ? 'text-white/15' : 'text-[#D0CFC0]'}`} />
                  <p className="text-sm font-medium mb-1">{tagParam ? `No results for #${tagParam}` : 'Search for something'}</p>
                  <p className="text-xs">Try searching for reflections, tags, or people.</p>
                </div>
              )}

              {!loading && (tagParam || qParam) && reflections.length === 0 && profiles.length === 0 && (
                <div className={`text-center py-16 px-8 ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>
                  <p className="text-sm font-medium mb-1">No results found</p>
                  <p className="text-xs">Try a different search term.</p>
                </div>
              )}

              {/* Profile results */}
              {profiles.length > 0 && tab !== 'reflections' && (
                <div className={`border-b ${isDark ? 'border-white/[0.06]' : 'border-[#EFF3F4]'}`}>
                  <h3 className={`px-4 py-3 text-sm font-semibold ${isDark ? 'text-white/50' : 'text-[#536471]'}`}>People</h3>
                  {profiles.map(p => {
                    const displayName = p.display_name || p.full_name || 'Unknown'
                    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    return (
                      <Link
                        key={p.id}
                        href={`/${p.username}`}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                          isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-[#F7F9FA]'
                        }`}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={p.avatar_url || undefined} />
                          <AvatarFallback className={`text-xs ${isDark ? 'bg-[#161618] text-white/40' : 'bg-[#EFF3F4] text-[#536471]'}`}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>{displayName}</p>
                          <p className={`text-xs truncate ${isDark ? 'text-white/30' : 'text-[#536471]'}`}>@{p.username}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* Reflection results */}
              {reflections.length > 0 && tab !== 'profiles' && (
                <div>
                  {profiles.length > 0 && tab === 'all' && (
                    <h3 className={`px-4 py-3 text-sm font-semibold border-b ${isDark ? 'text-white/50 border-white/[0.06]' : 'text-[#536471] border-[#EFF3F4]'}`}>
                      Reflections
                    </h3>
                  )}
                  {reflections.map(r => {
                    const displayName = r.profile?.display_name || r.profile?.full_name || 'Unknown'
                    return (
                      <div
                        key={r.id}
                        className={`px-4 py-3 cursor-pointer transition-colors ${
                          isDark
                            ? 'hover:bg-white/[0.02] border-b border-white/[0.06]'
                            : 'hover:bg-[#F7F9FA] border-b border-[#EFF3F4]'
                        }`}
                        onClick={() => r.profile?.username && router.push(`/${r.profile.username}`)}
                      >
                        <div className="flex gap-3">
                          <Link href={r.profile?.username ? `/${r.profile.username}` : '#'} onClick={e => e.stopPropagation()} className="shrink-0">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={r.profile?.avatar_url || undefined} />
                              <AvatarFallback className={`text-xs ${isDark ? 'bg-[#161618] text-white/40' : 'bg-[#EFF3F4] text-[#536471]'}`}>
                                {displayName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>{displayName}</span>
                              <span className={`text-sm ${isDark ? 'text-white/30' : 'text-[#536471]'}`}>@{r.profile?.username}</span>
                              <span className={`text-xs ${isDark ? 'text-white/20' : 'text-[#8B98A5]'}`}>· {timeAgo(r.created_at)}</span>
                            </div>
                            {r.prompt_text && (
                              <p className={`text-xs italic mt-0.5 ${isDark ? 'text-white/30' : 'text-[#536471]'}`}>
                                &ldquo;{r.prompt_text}&rdquo;
                              </p>
                            )}
                            <p className={`text-sm leading-relaxed mt-0.5 line-clamp-3 ${isDark ? 'text-white/80' : 'text-[#0F1419]'}`}>
                              {r.reflection_text}
                            </p>
                            {r.tags?.length > 0 && (
                              <div className="flex items-center gap-2 mt-1.5">
                                {r.tags.map(t => (
                                  <span
                                    key={t}
                                    className="text-xs text-[#1D9BF0] cursor-pointer hover:underline"
                                    onClick={e => {
                                      e.stopPropagation()
                                      router.push(`/dashboard/search?tag=${encodeURIComponent(t)}`)
                                    }}
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(date).toLocaleDateString()
}
