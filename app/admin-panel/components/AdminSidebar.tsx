'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Users, 
  Settings, 
  LogOut,
  Activity,
  CreditCard,
  Tag,
  Gift,
  LayoutDashboard
} from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'

interface AdminSidebarProps {
  userEmail: string
}

const navigationItems = [
  { title: 'Users', href: '/admin-panel/users', icon: Users },
  { title: 'Subscriptions', href: '/admin-panel/subscriptions', icon: CreditCard },
  { title: 'Discounts', href: '/admin-panel/discounts', icon: Tag },
  { title: 'Gifts', href: '/admin-panel/gifts', icon: Gift },
  { title: 'Activity / Logs', href: '/admin-panel/activity', icon: Activity },
  { title: 'Settings', href: '/admin-panel/settings', icon: Settings },
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
    <aside className="w-60 bg-white border-r border-neutral-200 flex flex-col">
      <div className="px-4 py-4">
        <div className="text-sm font-semibold text-neutral-900">Admin</div>
        <div className="text-xs text-neutral-500 truncate">{userEmail}</div>
      </div>

      <div className="h-px bg-neutral-200" />

      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                isActive
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <Icon className="h-4 w-4 text-neutral-500" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>

      <div className="h-px bg-neutral-200" />

      <div className="p-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <LayoutDashboard className="h-4 w-4 text-neutral-500" />
          <span>User Dashboard</span>
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <LogOut className="h-4 w-4 text-neutral-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
