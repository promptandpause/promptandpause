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
  MessageSquare,
  BookOpen,
  FileText,
  Wrench,
  UserCog,
  UserCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getSupabaseClient } from '@/lib/supabase/client'

interface AdminSidebarProps {
  userEmail: string
}

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/admin-panel',
    icon: LayoutDashboard,
    description: 'Overview & key metrics'
  },
  {
    title: 'Users',
    href: '/admin-panel/users',
    icon: Users,
    description: 'User management'
  },
  {
    title: 'Subscriptions',
    href: '/admin-panel/subscriptions',
    icon: CreditCard,
    description: 'Billing & subscriptions'
  },
  {
    title: 'Analytics',
    href: '/admin-panel/analytics',
    icon: BarChart3,
    description: 'Engagement & revenue'
  },
  {
    title: 'Activity Logs',
    href: '/admin-panel/activity',
    icon: Activity,
    description: 'Admin audit trail'
  },
  {
    title: 'Cron Jobs',
    href: '/admin-panel/cron-jobs',
    icon: Clock,
    description: 'Job monitoring'
  },
  {
    title: 'Email Tracking',
    href: '/admin-panel/emails',
    icon: Mail,
    description: 'Email delivery logs'
  },
  {
    title: 'Email Templates',
    href: '/admin-panel/email-templates',
    icon: FileText,
    description: 'Template management'
  },
  {
    title: 'Maintenance',
    href: '/admin-panel/maintenance',
    icon: Wrench,
    description: 'Maintenance windows'
  },
  {
    title: 'Support Tickets',
    href: '/admin-panel/support',
    icon: MessageSquare,
    description: 'User support'
  },
  {
    title: 'Prompt Library',
    href: '/admin-panel/prompts',
    icon: BookOpen,
    description: 'Prompt management'
  },
  {
    title: 'Admin Users',
    href: '/admin-panel/admin-users',
    icon: UserCog,
    description: 'Manage admin access'
  },
  {
    title: 'My Profile',
    href: '/admin-panel/profile',
    icon: UserCircle,
    description: 'Your admin account'
  },
  {
    title: 'Settings',
    href: '/admin-panel/settings',
    icon: Settings,
    description: 'System configuration'
  },
]

export default function AdminSidebar({ userEmail }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = getSupabaseClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-blue-500" />
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        </div>
        <p className="text-sm text-slate-400">Prompt & Pause</p>
      </div>

      <Separator className="bg-slate-800" />

      {/* Admin info */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Shield className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 truncate">Logged in as</p>
            <p className="text-sm text-white font-medium truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      <Separator className="bg-slate-800" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/admin-panel' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 h-auto py-3 px-3 ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs opacity-70">{item.description}</div>
                </div>
              </Button>
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-slate-800" />

      {/* Footer actions */}
      <div className="p-3 space-y-1">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>User Dashboard</span>
          </Button>
        </Link>
        
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </aside>
  )
}
