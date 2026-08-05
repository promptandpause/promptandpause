'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  ClipboardList,
  Clock,
  Mail,
  FileText,
  Send,
  Wrench,
  Hammer,
  BookOpen,
  Flag,
  Percent,
  Gift,
  MessageSquare,
  ShieldCheck,
  Settings,
  User,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getSupabaseClient } from '@/lib/supabase/client'

const navGroups = [
  {
    label: 'Core',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/admin-panel' },
      { label: 'Users', icon: Users, href: '/admin-panel/users' },
      { label: 'Subscriptions', icon: CreditCard, href: '/admin-panel/subscriptions' },
      { label: 'Analytics', icon: BarChart3, href: '/admin-panel/analytics' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Prompt Library', icon: BookOpen, href: '/admin-panel/prompts' },
      { label: 'Email Templates', icon: FileText, href: '/admin-panel/email-templates' },
      { label: 'Broadcasts', icon: Send, href: '/admin-panel/broadcasts' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Activity Logs', icon: ClipboardList, href: '/admin-panel/activity' },
      { label: 'Cron Jobs', icon: Clock, href: '/admin-panel/cron-jobs' },
      { label: 'Email Tracking', icon: Mail, href: '/admin-panel/emails' },
      { label: 'Maintenance', icon: Wrench, href: '/admin-panel/maintenance' },
      { label: 'Tools', icon: Hammer, href: '/admin-panel/tools' },
    ],
  },
  {
    label: 'Relationship',
    items: [
      { label: 'Tickets', icon: MessageSquare, href: '/admin-panel/tickets' },
      { label: 'Discounts', icon: Percent, href: '/admin-panel/discounts' },
      { label: 'Gifts', icon: Gift, href: '/admin-panel/gifts' },
      { label: 'Reports', icon: Flag, href: '/admin-panel/reports' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Admin Users', icon: ShieldCheck, href: '/admin-panel/admin-users' },
      { label: 'Settings', icon: Settings, href: '/admin-panel/settings' },
      { label: 'Profile', icon: User, href: '/admin-panel/profile' },
    ],
  },
]

interface AdminShellProps {
  userEmail: string
  userRole: 'super_admin' | 'admin' | 'employee'
  children: React.ReactNode
}

export default function AdminShell({ userEmail, userRole, children }: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const router = useRouter()
  const supabase = getSupabaseClient()

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    router.push(`/admin-panel/users?q=${encodeURIComponent(q)}`)
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } catch {
      // best-effort: admin_session cookie may already be gone
    }
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const groups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.href === '/admin-panel/admin-users') return userRole === 'super_admin' || userRole === 'admin'
        if (item.href === '/admin-panel/settings') return userRole === 'super_admin'
        return true
      }),
    }))
    .filter((group) => group.items.length > 0)

  const initials = userEmail
    ? userEmail
        .split('@')[0]
        .split(/[._-]/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD'

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'border-r bg-card transition-all duration-300 flex flex-col',
          isSidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div className={cn('flex items-center gap-2', !isSidebarOpen && 'hidden')}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              P
            </div>
            <span className="font-bold text-lg tracking-tight">Prompt&Pause</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(!isSidebarOpen && 'mx-auto')}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {groups.map((group, idx) => (
            <div key={idx} className="mb-6 last:mb-0">
              {isSidebarOpen && (
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        !isSidebarOpen && 'justify-center px-0'
                      )}
                    >
                      <item.icon size={18} />
                      {isSidebarOpen && <span>{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={cn(
              'w-full justify-start text-muted-foreground',
              !isSidebarOpen && 'justify-center px-0'
            )}
          >
            <LogOut size={18} className={cn(isSidebarOpen && 'mr-2')} />
            {isSidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b bg-card px-8 flex items-center justify-between shrink-0">
          <div className="flex-1 max-w-md relative">
            <form onSubmit={handleSearch}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users, prompts, or logs..."
                className="pl-10 h-10 bg-muted/50 border-none focus-visible:ring-1"
              />
            </form>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/admin-panel/profile')} className="cursor-pointer">
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/admin-panel/settings')} className="cursor-pointer">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable Page Area */}
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  )
}
