"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { MagnifyingGlass, X } from 'phosphor-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

interface SearchResult {
  reflections: any[]
  profiles: any[]
}

export function SearchBar() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null)
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=all`)
      const { data } = await res.json()
      setResults(data)
      setOpen(true)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => debouncedSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query, debouncedSearch])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const hasResults = results && (results.profiles.length > 0 || results.reflections.length > 0)
  const showDropdown = open && query.trim()

  return (
    <div className="relative">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${
        isDark ? 'bg-white/[0.06] text-white/50 focus-within:bg-white/[0.08]' : 'bg-[#EFF3F4] text-[#536471] focus-within:bg-white focus-within:shadow-sm'
      }`}>
        <MagnifyingGlass size={16} weight="bold" className="shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search"
          className={`flex-1 text-sm bg-transparent border-0 outline-none ${
            isDark ? 'text-white placeholder:text-white/30' : 'text-[#0F1419] placeholder:text-[#536471]'
          }`}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults(null); setOpen(false) }} className={`p-0.5 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-[#CFD9DE]'}`}>
            <X size={14} weight="bold" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className={`absolute top-full left-0 right-0 mt-1 rounded-2xl shadow-lg overflow-hidden z-50 ${
            isDark ? 'bg-[#161618] border border-white/[0.06]' : 'bg-white border border-[#EFF3F4]'
          }`}
        >
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-10 rounded-lg ${isDark ? 'bg-white/5' : 'bg-[#EFF3F4]'} animate-pulse`} />
              ))}
            </div>
          ) : hasResults ? (
            <div className="py-2">
              {results.profiles.length > 0 && (
                <div>
                  <p className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-white/30' : 'text-[#536471]'}`}>Profiles</p>
                  {results.profiles.map((p: any) => (
                    <Link
                      key={p.id}
                      href={`/${p.username}`}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-[#F7F9FA]'}`}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={p.avatar_url || undefined} />
                        <AvatarFallback className={`text-xs ${isDark ? 'bg-[#161618] text-white/40' : 'bg-[#EFF3F4] text-[#536471]'}`}>
                          {(p.display_name || p.full_name || '?')[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>{p.display_name || p.full_name}</p>
                        <p className={`text-xs truncate ${isDark ? 'text-white/30' : 'text-[#536471]'}`}>@{p.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {results.reflections.length > 0 && (
                <div>
                  <p className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-white/30' : 'text-[#536471]'}`}>Reflections</p>
                  {results.reflections.slice(0, 3).map((r: any) => (
                    <div
                      key={r.id}
                      className={`px-4 py-2.5 transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-[#F7F9FA]'}`}
                    >
                      <p className={`text-sm line-clamp-2 ${isDark ? 'text-white/70' : 'text-[#536471]'}`}>{r.reflection_text}</p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-white/20' : 'text-[#8B98A5]'}`}>by @{r.profile?.username || 'unknown'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={`px-4 py-6 text-center text-sm ${isDark ? 'text-white/30' : 'text-[#536471]'}`}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  )
}
