"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { Users, ArrowLeft, UserPlus, Trash2, Loader2, Mail, Crown, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

interface Member {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  status: string
  joined_at: string | null
  last_active_at: string | null
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
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const canManage = myRole === 'owner' || myRole === 'admin'

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
    } catch {
      setError('Failed to load workspace')
    }
    setLoading(false)
  }, [orgId])

  useEffect(() => { load() }, [load])

  async function sendInvite() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError(null)
    try {
      const res = await fetch(`/api/org/${orgId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: 'member' }),
      })
      const body = await res.json()
      if (!res.ok) {
        setInviteError(body.error || 'Failed to send invite')
        setInviting(false)
        return
      }
      setInviteEmail('')
      await load()
    } catch {
      setInviteError('Failed to send invite')
    }
    setInviting(false)
  }

  async function revokeInvite(inviteId: string) {
    await fetch(`/api/org/${orgId}/invite/${inviteId}`, { method: 'DELETE' })
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

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href="/workspace"
          className={`inline-flex items-center gap-2 text-sm mb-8 transition-colors ${
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

        {canManage && (
          <div className={`mt-8 p-4 rounded-xl border ${isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-[#F7F9FA] border-[#EFF3F4]'}`}>
            <h2 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
              <UserPlus className="h-4 w-4" /> Invite someone
            </h2>
            <div className="flex gap-2">
              <input
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="name@company.com"
                className={`flex-1 px-3.5 py-2 rounded-lg text-sm border outline-none focus:border-[#1D9BF0] ${
                  isDark ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-[#CFD9DE] text-[#0F1419]'
                }`}
              />
              <button
                onClick={sendInvite}
                disabled={inviting}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#1D9BF0] text-white hover:bg-[#1A8CD8] transition-colors disabled:opacity-60 shrink-0"
              >
                {inviting ? 'Sending\u2026' : 'Invite'}
              </button>
            </div>
            {inviteError && <p className="text-xs text-red-500 mt-2">{inviteError}</p>}
          </div>
        )}

        {pendingInvites.length > 0 && (
          <div className="mt-8">
            <h2 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white/70' : 'text-[#536471]'}`}>
              Pending invites
            </h2>
            <div className="space-y-2">
              {pendingInvites.map(invite => (
                <div
                  key={invite.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'border-white/[0.06]' : 'border-[#EFF3F4]'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className={`h-4 w-4 ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`} />
                    <span className={`text-sm ${isDark ? 'text-white/70' : 'text-[#0F1419]'}`}>{invite.email}</span>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => revokeInvite(invite.id)}
                      className={`text-xs font-medium ${isDark ? 'text-white/30 hover:text-red-400' : 'text-[#8B98A5] hover:text-red-500'}`}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
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

        <p className={`text-xs mt-8 text-center ${isDark ? 'text-white/25' : 'text-[#8B98A5]'}`}>
          Workspace admins only ever see this roster \u2014 name, role, and activity presence. Reflection content is
          never visible to anyone but the person who wrote it.
        </p>
      </div>
    </div>
  )
}
