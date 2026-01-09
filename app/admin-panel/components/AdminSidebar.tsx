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
  UserCircle,
  Tag,
  Gift,
  Crown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getSupabaseClient } from '@/lib/supabase/client'

interface AdminSidebarProps {
  userEmail: string
  userRole: 'super_admin' | 'admin' | 'employee'
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
    title: 'Discounts',
    href: '/admin-panel/discounts',
    icon: Tag,
    description: 'Discount codes'
  },
  {
    title: 'Gifts',
    href: '/admin-panel/gifts',
    icon: Gift,
    description: 'Gift management'
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

export default function AdminSidebar({ userEmail, userRole }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = getSupabaseClient()

  const visibleItems = navigationItems.filter((item) => {
    if (item.href === '/admin-panel/admin-users') {
      return userRole === 'super_admin' || userRole === 'admin'
    }

    if (item.href === '/admin-panel/settings') {
      return userRole === 'super_admin'
    }

    return true
  })

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500">Prompt & Pause</p>
          </div>
        </div>
      </div>

      <Separator className="bg-gray-100" />

      {/* Admin info */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-3 text-sm">
          <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200">
            <UserCircle className="h-6 w-6 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Signed in as</p>
            <p className="text-sm font-medium text-gray-900 truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      <Separator className="bg-gray-100" />

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/admin-panel' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 h-auto py-3 px-3 rounded-lg ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs opacity-60">{item.description}</div>
                </div>
              </Button>
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-gray-100 mt-auto" />

      {/* Footer actions */}
      <div className="p-4 space-y-2">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>User Dashboard</span>
          </Button>
        </Link>
        
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start gap-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </aside>
  )
}
