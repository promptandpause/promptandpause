"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { DashboardSidebar } from '@/app/dashboard/components/DashboardSidebar'
import { useTheme } from '@/contexts/ThemeContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserPlus, Check, Spinner, MagnifyingGlass, X } from 'phosphor-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'
import type { Friend } from '@/lib/types/social'

export default function FriendsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()
  const { t } = useTranslation()
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'pending' | 'requests'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => { loadFriends() }, [])

  async function loadFriends() {
    try {
      const res = await fetch('/api/social/friends')
      const { data } = await res.json()
      setFriends(data || [])
      // Get current user id from the first friend record's requester/addressee that matches
      const userRes = await fetch('/api/user/profile')
      if (userRes.ok) {
        const { data: profile } = await userRes.json()
        setCurrentUserId(profile?.id || null)
      }
    } catch {}
    setLoading(false)
  }

  async function handleAction(id: string, action: 'accept' | 'remove') {
    setActionLoading(id)
    try {
      if (action === 'accept') {
        await fetch(`/api/social/friends/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'accept' }),
        })
      } else {
        await fetch(`/api/social/friends/${id}`, { method: 'DELETE' })
      }
      loadFriends()
    } catch {}
    setActionLoading(null)
  }

  const accepted = friends.filter(f => f.status === 'accepted')
  const sentRequests = currentUserId ? friends.filter(f => f.status === 'pending' && f.requester_id === currentUserId) : []
  const receivedRequests = currentUserId ? friends.filter(f => f.status === 'pending' && f.addressee_id === currentUserId) : []

  const filtered = tab === 'all' ? accepted : tab === 'pending' ? sentRequests : receivedRequests

  const displayList = search
    ? filtered.filter(f =>
        f.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        f.profile?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        f.profile?.username?.toLowerCase().includes(search.toLowerCase())
      )
    : filtered

  return (
    <AuthGuard redirectPath="/dashboard/friends">
      <div className={`min-h-screen ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}>
        <div className="flex h-screen overflow-hidden">
          <DashboardSidebar />
          <main className="flex-1 pb-32 md:pb-10 overflow-y-auto scrollbar-thin">
            <div className="max-w-[800px] mx-auto px-4 md:px-8 pt-16 md:pt-10 pb-6">
              <div className="flex items-center justify-between mb-6">
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                >
                  <h1 className={`text-2xl md:text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                    Friends
                  </h1>
                  <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                    Connect with others on their reflection journey
                  </p>
                </motion.div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <MagnifyingGlass size={16} weight="bold" className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/20' : 'text-[#8B98A5]'}`} />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search friends..."
                  className={`pl-9 text-sm rounded-xl ${
                    isDark
                      ? 'bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/20'
                      : 'bg-white/80 border-[#EFF3F4] text-[#0F1419] placeholder:text-[#8B98A5]'
                  }`}
                />
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-6">
                {[
                  { key: 'all', label: `All (${accepted.length})` },
                  { key: 'pending', label: `Sent (${sentRequests.length})` },
                  { key: 'requests', label: `Requests (${receivedRequests.length})` },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key as typeof tab)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      tab === t.key
                        ? isDark ? 'bg-white/10 text-white' : 'bg-white text-[#0F1419] shadow-sm'
                        : isDark ? 'text-white/30 hover:text-white/50' : 'text-[#8B98A5] hover:text-[#536471]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* List */}
              {loading ? (
                <div className="flex justify-center py-20">
                  <Spinner size={12} weight="bold" className={`animate-spin ${isDark ? 'text-white/20' : 'text-[#8B98A5]'}`} />
                </div>
              ) : displayList.length === 0 ? (
                <div className={`rounded-2xl p-10 text-center ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white/60 border border-[#EFF3F4]'}`}>
                  <UserPlus size={40} weight="bold" className={`mx-auto mb-4 ${isDark ? 'text-white/15' : 'text-[#D0CFC0]'}`} />
                  <h3 className={`font-semibold mb-1 ${isDark ? 'text-white/60' : 'text-[#536471]'}`}>
                    {tab === 'all' ? 'No friends yet' : tab === 'pending' ? 'No pending requests' : 'No incoming requests'}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>
                    {tab === 'all' ? 'Find people to connect with on their profiles.' : ''}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {displayList.map(friend => (
                      <motion.div
                        key={friend.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`rounded-xl p-3 flex items-center gap-3 transition-all ${
                          isDark
                            ? 'bg-white/[0.03] hover:bg-white/[0.06]'
                            : 'bg-white/60 hover:bg-white/80'
                        }`}
                      >
                        <button
                          onClick={() => friend.profile?.username && router.push(`/${friend.profile.username}`)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={friend.profile?.avatar_url || undefined} />
                            <AvatarFallback className={`text-xs ${isDark ? 'bg-[#161618] text-white/40' : 'bg-[#F7F9FA] text-[#8B98A5]'}`}>
                              {friend.profile?.full_name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                              {friend.profile?.display_name || friend.profile?.full_name || 'Unknown'}
                            </p>
                            {friend.profile?.username && (
                              <p className={`text-xs ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>
                                @{friend.profile.username}
                              </p>
                            )}
                          </div>
                        </button>

                        <div className="flex gap-1.5">
                          {friend.status === 'accepted' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction(friend.id, 'remove')}
                              disabled={actionLoading === friend.id}
                              className={`h-8 text-xs ${isDark ? 'text-white/30 hover:text-red-400' : 'text-[#8B98A5] hover:text-red-500'}`}
                            >
                              {actionLoading === friend.id ? (
                                <Spinner size={12} weight="bold" className="animate-spin" />
                              ) : (
                                'Remove'
                              )}
                            </Button>
                          )}
                          {friend.status === 'pending' && (
                            <>
                              {friend.addressee_id === currentUserId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAction(friend.id, 'accept')}
                                  disabled={actionLoading === friend.id}
                                  className={`h-8 text-xs ${
                                    isDark
                                      ? 'border-[#1D9BF0]/30 text-[#1D9BF0] hover:bg-[#1D9BF0]/10'
                                      : 'border-[#B3D9F2] text-[#1D9BF0] hover:bg-[#E8F5FE]'
                                  }`}
                                >
                                  {actionLoading === friend.id ? (
                                    <Spinner size={12} weight="bold" className="animate-spin mr-1" />
                                  ) : (
                                    <Check size={12} weight="bold" className="mr-1" />
                                  )}
                                  Accept
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAction(friend.id, 'remove')}
                                disabled={actionLoading === friend.id}
                                className={`h-8 text-xs ${isDark ? 'text-white/30 hover:text-red-400' : 'text-[#8B98A5] hover:text-red-500'}`}
                              >
                                {actionLoading === friend.id ? (
                                  <Spinner size={12} weight="bold" className="animate-spin" />
                                ) : (
                                  <X size={12} weight="bold" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
