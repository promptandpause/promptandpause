"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { Users, ArrowLeft, UserPlus, Trash2, Loader2, Mail, Crown, ShieldCheck, Settings, RefreshCw, ExternalLink, CheckCircle2, LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { DashboardSidebar } from '@/app/dashboard/components/DashboardSidebar'
import { FeedCard } from '@/components/social/FeedCard'
import type { FeedItem } from '@/lib/types/social'

interface Member {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  status: string
  joined_at: string | null
  last_active_at: string | null
  consent_status: boolean
  profile: { id: string; email: string; full_name: string; display_name: string; username: string; avatar_url: string } | null
}

interface PendingInvite {
  id: string
  email: string
  role: string
  created_at: string
  expires_at: string
}

export default function WorkspaceDashboardPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const router = useRouter()
  const orgId = params.id as string

  const [org, setOrg] = useState<any>(null)
  const [myRole, setMyRole] = useState<'owner' | 'admin' | 'member' | null>(null)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [lookup, setLookup] = useState<{ exists: boolean; name: string | null; alreadyMember: boolean; pendingInvite: boolean } | null>(null)
  const [resending, setResending] = useState<string | null>(null)

  const canManage = myRole === 'owner' || myRole === 'admin'
  const isOwner = myRole === 'owner'
  const [tab, setTab] = useState<'members' | 'feed' | 'analytics' | 'settings'>('members')
  const [hasConsented, setHasConsented] = useState<boolean | null>(null)

  // Team feed state
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [feedLoading, setFeedLoading] = useState(false)
  const [feedLoaded, setFeedLoaded] = useState(false)
  const [feedHasMore, setFeedHasMore] = useState(false)
  const [feedPage, setFeedPage] = useState(1)
  const [feedLoadingMore, setFeedLoadingMore] = useState(false)

  const loadFeed = useCallback(async (pageNum: number, append = false) => {
    if (append) setFeedLoadingMore(true)
    else setFeedLoading(true)
    try {
      const res = await fetch(`/api/org/${orgId}/feed?page=${pageNum}&limit=20`)
      if (!res.ok) throw new Error('feed_failed')
      const body = await res.json()
      if (append) {
        setFeed(prev => [...prev, ...(body?.data || [])])
      } else {
        setFeed(body?.data || [])
      }
      setFeedHasMore(body?.pagination?.hasMore || false)
    } catch {
      if (!append) setFeed([])
    }
    setFeedLoading(false)
    setFeedLoadingMore(false)
    if (!append) setFeedLoaded(true)
  }, [orgId])

  useEffect(() => {
    if (tab === 'feed' && !feedLoading && !feedLoaded) {
      setFeedPage(1)
      loadFeed(1)
    }
  }, [tab, loadFeed, feedLoading, feedLoaded])

  // Settings state
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)
  const [renameSuccess, setRenameSuccess] = useState<string | null>(null)
  const [seatCountInput, setSeatCountInput] = useState(0)
  const [updatingSeats, setUpdatingSeats] = useState(false)
  const [seatsError, setSeatsError] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [transferUserId, setTransferUserId] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [transferError, setTransferError] = useState<string | null>(null)

  useEffect(() => {
    if (myRole === 'member' && orgId) {
      fetch(`/api/org/${orgId}/consent`)
        .then(r => (r.ok ? r.json() : Promise.resolve({ consented: false })))
        .then(body => setHasConsented(!!body.consented))
        .catch(() => setHasConsented(false))
    }
  }, [orgId, myRole])

  const load = useCallback(async () => {
    try {
      const [orgRes, membersRes, meRes] = await Promise.all([
        fetch(`/api/org/${orgId}`),
        fetch(`/api/org/${orgId}/members`),
        fetch('/api/user/profile'),
      ])

      if (!orgRes.ok) {
        const body = await orgRes.json().catch(() => null)
        setError(body?.error || 'Failed to load workspace')
        setLoading(false)
        return
      }

      const orgBody = await orgRes.json()
      const membersBody = await membersRes.json()
      const meBody = await meRes.json().catch(() => null)

      setOrg(orgBody.organization)
      setMyRole(orgBody.myRole)
      setMembers(membersBody.members || [])
      setPendingInvites(membersBody.pendingInvites || [])
      setMyUserId(meBody?.data?.id || null)
      setNewName(orgBody.organization?.name || '')
      setSeatCountInput(orgBody.organization?.seat_count || 0)
    } catch {
      setError('Failed to load workspace')
    }
    setLoading(false)
  }, [orgId])

  useEffect(() => { load() }, [load])

  // Debounced lookup so the admin sees add-vs-invite copy while typing.
  useEffect(() => {
    if (!canManage) return
    if (!inviteEmail || inviteEmail.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setLookup(null)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/org/${orgId}/members/lookup?email=${encodeURIComponent(inviteEmail)}`)
        const body = await res.json()
        if (res.ok && body.success) {
          setLookup({
            exists: !!body.exists,
            name: body.name || null,
            alreadyMember: !!body.alreadyMember,
            pendingInvite: !!body.pendingInvite,
          })
        }
      } catch {}
    }, 350)
    return () => clearTimeout(timer)
  }, [inviteEmail, orgId, canManage])

  async function sendInvite() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError(null)
    setInviteSuccess(null)
    try {
      const res = await fetch(`/api/org/${orgId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      const body = await res.json()
      if (!res.ok) {
        setInviteError(body.error || 'Failed to add this person')
        setInviting(false)
        return
      }
      setInviteEmail('')
      setLookup(null)
      setInviteSuccess(
        body.added
          ? 'Added to the workspace. They can sign in and start immediately.'
          : `Invite emailed to ${inviteEmail.trim()}. They'll need to accept it within 7 days.`
      )
      await load()
    } catch {
      setInviteError('Failed to add this person')
    }
    setInviting(false)
  }

  async function revokeInvite(inviteId: string) {
    await fetch(`/api/org/${orgId}/invite/${inviteId}`, { method: 'DELETE' })
    await load()
  }

  async function resendInvite(inviteId: string) {
    setResending(inviteId)
    await fetch(`/api/org/${orgId}/invite/${inviteId}/resend`, { method: 'POST' })
    setResending(null)
    await load()
  }

  async function changeRole(userId: string, role: 'admin' | 'member') {
    await fetch(`/api/org/${orgId}/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    await load()
  }

  async function removeMember(userId: string, isSelf: boolean) {
    const msg = isSelf ? 'Leave this workspace?' : 'Remove this person from the workspace?'
    if (!confirm(msg)) return
    await fetch(`/api/org/${orgId}/members/${userId}`, { method: 'DELETE' })
    if (isSelf) {
      router.push('/workspace')
    } else {
      await load()
    }
  }

  async function handleRename() {
    if (!newName.trim()) return
    setRenaming(true)
    setRenameError(null)
    setRenameSuccess(null)
    try {
      const res = await fetch(`/api/org/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const body = await res.json()
      if (!res.ok) {
        setRenameError(body.error || 'Failed to rename workspace')
        setRenaming(false)
        return
      }
      setOrg((prev: any) => ({ ...prev, name: body.organization?.name || prev?.name }))
      setRenameSuccess('Workspace renamed.')
      setRenaming(false)
    } catch {
      setRenameError('Failed to rename workspace')
      setRenaming(false)
    }
  }

  async function handleUpdateSeats() {
    const count = Math.max(1, Math.min(1000, seatCountInput || 1))
    setUpdatingSeats(true)
    setSeatsError(null)
    try {
      const res = await fetch(`/api/org/${orgId}/billing/seats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatCount: count }),
      })
      const body = await res.json()
      if (!res.ok) {
        setSeatsError(body.error || 'Failed to update seats')
        setUpdatingSeats(false)
        return
      }
      setSeatCountInput(body.seatCount)
      setOrg((prev: any) => ({ ...prev, seat_count: body.seatCount }))
      setUpdatingSeats(false)
    } catch {
      setSeatsError('Failed to update seats')
      setUpdatingSeats(false)
    }
  }

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch(`/api/org/${orgId}/billing/portal`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) {
        alert(body.error || 'Failed to open billing portal')
        setPortalLoading(false)
        return
      }
      window.location.href = body.url
    } catch {
      alert('Failed to open billing portal')
      setPortalLoading(false)
    }
  }

  async function handleTransferOwnership() {
    if (!transferUserId) return
    if (!confirm('Transfer ownership to this member? You will be downgraded to admin.')) return
    setTransferring(true)
    setTransferError(null)
    try {
      const res = await fetch(`/api/org/${orgId}/ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: transferUserId }),
      })
      const body = await res.json()
      if (!res.ok) {
        setTransferError(body.error || 'Failed to transfer ownership')
        setTransferring(false)
        return
      }
      setTransferUserId('')
      await load()
      setTransferring(false)
    } catch {
      setTransferError('Failed to transfer ownership')
      setTransferring(false)
    }
  }

  const activeSeatsUsed = members.filter(m => m.status === 'active').length + pendingInvites.length

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}>
        <Loader2 className={`h-6 w-6 animate-spin ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`} />
      </div>
    )
  }

  if (error || !org) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-6 ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}>
        <div className="text-center">
          <p className={`text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>{error || 'Workspace not found'}</p>
          <Link href="/workspace" className="text-sm text-[#1D9BF0] hover:underline">Back to workspaces</Link>
        </div>
      </div>
    )
  }

  const cardBorder = isDark ? 'border-white/[0.08]' : 'border-[#EFF3F4]'
  const cardBg = isDark ? 'bg-white/[0.04]' : 'bg-[#F7F9FA]'
  const inputCls = (disabled?: boolean) =>
    `flex-1 px-3.5 py-2 rounded-lg text-sm border outline-none focus:border-[#1D9BF0] ${
      isDark ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-[#CFD9DE] text-[#0F1419]'
    } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}>
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 pb-32 md:pb-10 overflow-y-auto scrollbar-thin">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-16 md:pt-10 pb-8">
        <Link
          href="/workspace"
          className={`hidden md:inline-flex items-center gap-2 text-sm mb-8 transition-colors ${
            isDark ? 'text-white/50 hover:text-white' : 'text-[#536471] hover:text-[#0F1419]'
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          All workspaces
        </Link>

        <div className="flex items-center gap-3 mb-1">
          <div className={`h-11 w-11 rounded-full flex items-center justify-center ${isDark ? 'bg-[#1D9BF0]/20' : 'bg-[#1D9BF0]/10'}`}>
            <Users className="h-5 w-5 text-[#1D9BF0]" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>{org.name}</h1>
            <p className={`text-xs ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
              {activeSeatsUsed} of {org.seat_count} seats used
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-6 mb-4">
          <button
            onClick={() => setTab('members')}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              tab === 'members'
                ? 'bg-[#1D9BF0] border-[#1D9BF0] text-white'
                : isDark ? 'border-white/10 text-white/60 hover:text-white' : 'border-[#CFD9DE] text-[#536471] hover:text-[#0F1419]'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setTab('feed')}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              tab === 'feed'
                ? 'bg-[#1D9BF0] border-[#1D9BF0] text-white'
                : isDark ? 'border-white/10 text-white/60 hover:text-white' : 'border-[#CFD9DE] text-[#536471] hover:text-[#0F1419]'
            }`}
          >
            Team feed
          </button>
          {canManage && (
            <button
              onClick={() => setTab('analytics')}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                tab === 'analytics'
                  ? 'bg-[#1D9BF0] border-[#1D9BF0] text-white'
                  : isDark ? 'border-white/10 text-white/60 hover:text-white' : 'border-[#CFD9DE] text-[#536471] hover:text-[#0F1419]'
              }`}
            >
              Analytics
            </button>
          )}
          {canManage && (
            <button
              onClick={() => setTab('settings')}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                tab === 'settings'
                  ? 'bg-[#1D9BF0] border-[#1D9BF0] text-white'
                  : isDark ? 'border-white/10 text-white/60 hover:text-white' : 'border-[#CFD9DE] text-[#536471] hover:text-[#0F1419]'
              }`}
            >
              Settings
            </button>
          )}
        </div>

        {tab === 'members' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] mt-8 items-start">
          <div className="space-y-8">
            {myRole === 'member' && hasConsented === false && (
              <div className={`p-4 rounded-xl border ${cardBg} ${cardBorder}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className={`text-sm font-semibold mb-0.5 ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                      Workspace analytics opt-in
                    </h2>
                    <p className={`text-xs ${isDark ? 'text-white/50' : 'text-[#536471]'}`}>
                      Your activity can contribute to anonymous team aggregates once you opt in.
                    </p>
                  </div>
                  <Link
                    href={`/workspace/${orgId}/consent`}
                    className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold bg-[#1D9BF0] text-white hover:bg-[#1A8CD8] transition-colors text-center"
                  >
                    Review & opt in
                  </Link>
                </div>
              </div>
            )}

            {canManage && (
              <div className={`p-4 rounded-xl border ${cardBg} ${cardBorder}`}>
                <h2 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                  <UserPlus className="h-4 w-4" /> Add someone
                </h2>
                <div className="flex gap-2">
                  <input
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="name@company.com"
                    className={inputCls()}
                  />
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as 'admin' | 'member')}
                    className={`shrink-0 px-3 py-2 rounded-lg text-sm border outline-none ${isDark ? 'bg-white/[0.04] border-white/10 text-white/70' : 'bg-white border-[#CFD9DE] text-[#536471]'}`}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={sendInvite}
                    disabled={inviting}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#1D9BF0] text-white hover:bg-[#1A8CD8] transition-colors disabled:opacity-60 shrink-0"
                  >
                    {inviting ? 'Adding...' : 'Add'}
                  </button>
                </div>

                {lookup && !inviteError && !inviteSuccess && (
                  <p className={`text-xs mt-2 flex items-center gap-1.5 ${
                    lookup.alreadyMember ? 'text-amber-500' : isDark ? 'text-white/50' : 'text-[#536471]'
                  }`}>
                    <LinkIcon className="h-3 w-3 shrink-0" />
                    {lookup.alreadyMember
                      ? 'Already a member of this workspace.'
                      : lookup.exists
                        ? `${lookup.name || 'This person'} already has an account — they'll be added instantly.`
                        : 'No account yet — we\'ll email an invite they can accept after signing up.'}
                  </p>
                )}
                {inviteSuccess && (
                  <p className="text-xs text-emerald-500 mt-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 shrink-0" /> {inviteSuccess}
                  </p>
                )}
                {inviteError && <p className="text-xs text-red-500 mt-2">{inviteError}</p>}
              </div>
            )}

            {pendingInvites.length > 0 && (
              <div>
                <h2 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white/70' : 'text-[#536471]'}`}>
                  Pending invites
                </h2>
                <div className="space-y-2">
                  {pendingInvites.map(invite => (
                    <div
                      key={invite.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'border-white/[0.06]' : 'border-[#EFF3F4]'}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Mail className={`h-4 w-4 shrink-0 ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`} />
                        <span className={`text-sm truncate ${isDark ? 'text-white/70' : 'text-[#0F1419]'}`}>{invite.email}</span>
                        <span className={`text-[10px] uppercase tracking-wide shrink-0 ${isDark ? 'text-white/25' : 'text-[#8B98A5]'}`}>
                          {invite.role === 'admin' ? 'Admin' : 'Member'}
                        </span>
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => resendInvite(invite.id)}
                            disabled={resending === invite.id}
                            className={`text-xs font-medium flex items-center gap-1 ${isDark ? 'text-white/40 hover:text-white' : 'text-[#8B98A5] hover:text-[#0F1419]'}`}
                          >
                            {resending === invite.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                            Resend
                          </button>
                          <button
                            onClick={() => revokeInvite(invite.id)}
                            className={`text-xs font-medium ${isDark ? 'text-white/30 hover:text-red-400' : 'text-[#8B98A5] hover:text-red-500'}`}
                          >
                            Revoke
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white/70' : 'text-[#536471]'}`}>
                Members
              </h2>
              <div className="space-y-2">
                {members.map(member => {
                  const name = member.profile?.display_name || member.profile?.full_name || member.profile?.username || member.profile?.email || 'Unknown'
                  const isSelf = member.user_id === myUserId
                  return (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'border-white/[0.06]' : 'border-[#EFF3F4]'}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-white/[0.06]' : 'bg-[#EFF3F4]'}`}>
                          {member.profile?.avatar_url ? (
                            <img src={member.profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <span className={`text-xs font-semibold ${isDark ? 'text-white/50' : 'text-[#536471]'}`}>
                              {name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-sm font-medium truncate flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                            {name} {isSelf && <span className={isDark ? 'text-white/30' : 'text-[#8B98A5]'}>(you)</span>}
                            {member.role === 'owner' && <Crown className="h-3 w-3 text-amber-500" />}
                            {member.role === 'admin' && <ShieldCheck className="h-3 w-3 text-[#1D9BF0]" />}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>
                            {member.last_active_at
                              ? `Active ${new Date(member.last_active_at).toLocaleDateString()}`
                              : 'Not active yet'}
                            {member.profile?.email ? ` · ${member.profile.email}` : ''}
                            {canManage && (member.consent_status ? ' · opted into analytics' : ' · analytics opt-out')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {canManage && member.role !== 'owner' && !isSelf && (
                          <select
                            value={member.role}
                            onChange={e => changeRole(member.user_id, e.target.value as 'admin' | 'member')}
                            className={`text-xs rounded-md px-2 py-1 border ${isDark ? 'bg-white/[0.04] border-white/10 text-white/70' : 'bg-white border-[#CFD9DE] text-[#536471]'}`}
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                        {(isSelf || (canManage && member.role !== 'owner')) && (
                          <button
                            onClick={() => removeMember(member.user_id, isSelf)}
                            className={`p-1.5 rounded-full transition-colors ${isDark ? 'text-white/30 hover:text-red-400 hover:bg-white/5' : 'text-[#8B98A5] hover:text-red-500 hover:bg-[#F7F9FA]'}`}
                            title={isSelf ? 'Leave workspace' : 'Remove member'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
            {/* Right column: privacy note, desktop only -- persistent alongside the roster on wide screens */}
            <div className={`hidden lg:block sticky top-6 p-4 rounded-xl border text-xs leading-relaxed ${
              isDark ? 'bg-white/[0.03] border-white/[0.06] text-white/40' : 'bg-[#F7F9FA] border-[#EFF3F4] text-[#8B98A5]'
            }`}>
              Workspace admins only ever see this roster -- name, role, and activity presence. Reflection content is
              never visible to anyone but the person who wrote it. Analytics are aggregate-only and members opt in
              separately before any of their activity contributes.
            </div>
          </div>
        )}

        {tab === 'feed' && (
          <div className="max-w-[680px] mt-8">
            <p className={`text-xs mb-4 ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
              Reflections your teammates chose to share with this workspace only. Nothing here appears on the public feed.
            </p>
            {feedLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className={`h-5 w-5 animate-spin ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`} />
              </div>
            ) : feed.length === 0 ? (
              <div className={`rounded-2xl p-10 text-center ${cardBg} ${cardBorder}`}>
                <Users className={`h-8 w-8 mx-auto mb-3 ${isDark ? 'text-white/15' : 'text-[#8B98A5]'}`} />
                <h3 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white/70' : 'text-[#0F1419]'}`}>
                  No workspace shares yet
                </h3>
                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                  Share something with your workspace and it will appear here for the whole team.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {feed.map((item, i) => (
                    <FeedCard key={`${item.reflection.id}-${i}`} item={item} />
                  ))}
                </div>
                {feedHasMore && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => {
                        const nextPage = feedPage + 1
                        setFeedPage(nextPage)
                        loadFeed(nextPage, true)
                      }}
                      disabled={feedLoadingMore}
                      className={`text-sm px-6 py-2 rounded-xl transition-all ${
                        isDark
                          ? 'bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white'
                          : 'bg-white/80 text-[#536471] hover:bg-white border border-[#EFF3F4]'
                      }`}
                    >
                      {feedLoadingMore ? (
                        <Loader2 className={`h-4 w-4 animate-spin mx-auto ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`} />
                      ) : (
                        'Load more'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'analytics' && (
          <div className="min-h-[300px]">
            <iframe
              src={`/workspace/${orgId}/analytics`}
              className="w-full min-h-[600px] border-0"
              title="Workspace Analytics"
            />
          </div>
        )}

        {tab === 'settings' && (
          <div className="max-w-[560px] mt-8 space-y-6">
            <div className={`p-5 rounded-xl border ${cardBg} ${cardBorder}`}>
              <h2 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                <Settings className="h-4 w-4" /> Workspace name
              </h2>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className={inputCls()}
              />
              {renameError && <p className="text-xs text-red-500 mt-2">{renameError}</p>}
              {renameSuccess && <p className="text-xs text-emerald-500 mt-2">{renameSuccess}</p>}
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleRename}
                  disabled={renaming || !newName.trim() || newName.trim() === org.name}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-[#1D9BF0] text-white hover:bg-[#1A8CD8] transition-colors disabled:opacity-60"
                >
                  {renaming ? 'Saving...' : 'Save name'}
                </button>
              </div>
            </div>

            {isOwner && (
              <>
                <div className={`p-5 rounded-xl border ${cardBg} ${cardBorder}`}>
                  <h2 className={`text-sm font-semibold mb-1 flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                    <Users className="h-4 w-4" /> Seats & billing
                  </h2>
                  <p className={`text-xs mb-4 ${isDark ? 'text-white/50' : 'text-[#536471]'}`}>
                    {activeSeatsUsed} of {org.seat_count} seats in use. Changing the seat count updates your subscription
                    immediately, billed by Stripe.
                  </p>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={seatCountInput || ''}
                      onChange={e => setSeatCountInput(parseInt(e.target.value) || 0)}
                      className={inputCls()}
                    />
                    <button
                      onClick={handleUpdateSeats}
                      disabled={updatingSeats || seatCountInput === org.seat_count}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#1D9BF0] text-white hover:bg-[#1A8CD8] transition-colors disabled:opacity-60 shrink-0"
                    >
                      {updatingSeats ? 'Updating...' : 'Update seats'}
                    </button>
                  </div>
                  {seatsError && <p className="text-xs text-red-500 mb-3">{seatsError}</p>}
                  <button
                    onClick={openPortal}
                    disabled={portalLoading}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#1D9BF0] hover:underline disabled:opacity-60"
                  >
                    {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                    Manage billing, payment methods & invoices
                  </button>
                </div>

                <div className={`p-5 rounded-xl border ${cardBg} ${cardBorder}`}>
                  <h2 className={`text-sm font-semibold mb-1 flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                    <Crown className="h-4 w-4 text-amber-500" /> Transfer ownership
                  </h2>
                  <p className={`text-xs mb-3 ${isDark ? 'text-white/50' : 'text-[#536471]'}`}>
                    Hand this workspace to another member. You'll become an admin.
                  </p>
                  <select
                    value={transferUserId}
                    onChange={e => setTransferUserId(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-lg text-sm border outline-none mb-3 ${isDark ? 'bg-white/[0.04] border-white/10 text-white' : 'bg-white border-[#CFD9DE] text-[#0F1419]'}`}
                  >
                    <option value="">Choose a member...</option>
                    {members.filter(m => m.status === 'active' && m.user_id !== myUserId).map(m => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.profile?.display_name || m.profile?.full_name || m.profile?.email || m.user_id}
                      </option>
                    ))}
                  </select>
                  {transferError && <p className="text-xs text-red-500 mb-2">{transferError}</p>}
                  <div className="flex justify-end">
                    <button
                      onClick={handleTransferOwnership}
                      disabled={transferring || !transferUserId}
                      className="px-4 py-2 rounded-full text-sm font-semibold border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-60"
                    >
                      {transferring ? 'Transferring...' : 'Transfer ownership'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <p className={`lg:hidden text-xs mt-8 text-center ${isDark ? 'text-white/25' : 'text-[#8B98A5]'}`}>
          Workspace admins only ever see this roster -- name, role, and activity presence. Reflection content is
          never visible to anyone but the person who wrote it.
        </p>
        </div>
        </main>
      </div>
    </div>
  )
}
