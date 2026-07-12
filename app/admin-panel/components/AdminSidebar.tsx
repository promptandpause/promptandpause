'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Activity,
  CreditCard,
  Clock,
  Mail,
  BookOpen,
  FileText,
  Wrench,
  UserCog,
  UserCircle,
  Tag,
  Gift,
  ExternalLink,
  Flag,
  ChevronLeft,
  Search,
  Megaphone,
  Headphones
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface AdminSidebarProps {
  userEmail: string
  userRole: 'super_admin' | 'admin' | 'employee'
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  external?: boolean
}

const navigationItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin-panel', icon: LayoutDashboard, description: 'Overview & key metrics' },
  { title: 'Users', href: '/admin-panel/users', icon: Users, description: 'User management' },
  { title: 'Subscriptions', href: '/admin-panel/subscriptions', icon: CreditCard, description: 'Billing & subscriptions' },
  { title: 'Analytics', href: '/admin-panel/analytics', icon: BarChart3, description: 'Engagement & revenue' },
  { title: 'Activity Logs', href: '/admin-panel/activity', icon: Activity, description: 'Admin audit trail' },
  { title: 'Cron Jobs', href: '/admin-panel/cron-jobs', icon: Clock, description: 'Job monitoring' },
  { title: 'Email Tracking', href: '/admin-panel/emails', icon: Mail, description: 'Email delivery logs' },
  { title: 'Email Templates', href: '/admin-panel/email-templates', icon: FileText, description: 'Template management' },
  { title: 'Broadcasts', href: '/admin-panel/broadcasts', icon: Megaphone, description: 'Send announcements' },
  { title: 'Maintenance', href: '/admin-panel/maintenance', icon: Wrench, description: 'Maintenance windows' },
  { title: 'Tools', href: '/admin-panel/tools', icon: Settings, description: 'Admin utilities' },
  { title: 'Prompt Library', href: '/admin-panel/prompts', icon: BookOpen, description: 'Prompt management' },
  { title: 'Discounts', href: '/admin-panel/discounts', icon: Tag, description: 'Discount codes' },
  { title: 'Gifts', href: '/admin-panel/gifts', icon: Gift, description: 'Gift management' },
  { title: 'Admin Users', href: '/admin-panel/admin-users', icon: UserCog, description: 'Manage admin access' },
  { title: 'My Profile', href: '/admin-panel/profile', icon: UserCircle, description: 'Your admin account' },
  { title: 'Content Reports', href: '/admin-panel/reports', icon: Flag, description: 'Moderation queue' },
  { title: 'Tickets', href: '/admin-panel/tickets', icon: Headphones, description: 'Support tickets & replies' },
  { title: 'Settings', href: '/admin-panel/settings', icon: Settings, description: 'System configuration' },
]

export default function AdminSidebar({ userEmail, userRole }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [collapsed, setCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const visibleItems = navigationItems.filter((item) => {
    if (item.href === '/admin-panel/admin-users') return userRole === 'super_admin' || userRole === 'admin'
    if (item.href === '/admin-panel/settings') return userRole === 'super_admin'
    return true
  })

  const filteredItems = visibleItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (collapsed) {
    return (
      <aside className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-4">
        <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 w-full px-2">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`} title={item.title}>
                <Icon className="h-4 w-4" />
              </Link>
            )
          })}
        </div>
        <div className="flex flex-col items-center gap-1 w-full px-2">
          <button onClick={() => setCollapsed(false)} className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 tracking-tight">Admin Panel</h1>
              <p className="text-xs text-slate-500">Prompt & Pause</p>
            </div>
          </div>
          <button onClick={() => setCollapsed(true)} className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
          />
        </div>
      </div>

      <Separator className="bg-slate-100" />

      {/* Admin info */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center border border-slate-200 flex-shrink-0">
            <UserCircle className="h-5 w-5 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Signed in as</p>
            <p className="text-xs font-medium text-slate-700 truncate">{userEmail}</p>
          </div>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider ${
            userRole === 'super_admin' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            userRole === 'admin' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
            'bg-slate-50 text-slate-600 border border-slate-200'
          }`}>
            {userRole === 'super_admin' ? 'Super' : userRole}
          </span>
        </div>
      </div>

      <Separator className="bg-slate-100" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <div className="space-y-0.5">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin-panel' && pathname.startsWith(item.href))
            const Icon = item.icon

            if (item.external) {
              return (
                <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                  <div className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{item.title}</div>
                    </div>
                    <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-slate-500 transition-colors" />
                  </div>
                </a>
              )
            }

            return (
              <Link key={item.href} href={item.href}>
                <div className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}>
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{item.description}</div>
                  </div>
                  {isActive && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      <Separator className="bg-slate-100" />

      {/* Footer actions */}
      <div className="p-3 space-y-0.5">
        <Link href="/">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-sm font-medium">User Dashboard</span>
          </div>
        </Link>
        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all">
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}