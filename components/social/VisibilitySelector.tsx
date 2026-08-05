"use client"

import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faUserGroup, faGlobe } from '@fortawesome/free-solid-svg-icons'
import type { IconProp } from '@fortawesome/fontawesome-svg-core'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

type Visibility = 'private' | 'friends_only' | 'public'

interface VisibilitySelectorProps {
  value: Visibility
  onChange: (v: Visibility) => void
  className?: string
}

const options: { value: Visibility; icon: IconProp; label: string; desc: string }[] = [
  { value: 'private', icon: faLock, label: 'Private', desc: 'Only you' },
  { value: 'friends_only', icon: faUserGroup, label: 'Friends', desc: 'Your friends' },
  { value: 'public', icon: faGlobe, label: 'Public', desc: 'Everyone' },
]

export function VisibilitySelector({ value, onChange, className }: VisibilitySelectorProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={cn('flex gap-1 p-1 rounded-full', isDark ? 'bg-white/[0.06]' : 'bg-slate-100/80', className)}>
      {options.map(opt => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
              selected
                ? isDark ? 'text-white' : 'text-slate-900'
                : isDark ? 'text-white/30 hover:text-white/50' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            {selected && (
              <motion.div
                layoutId="visibility-bg"
                className={cn(
                  'absolute inset-0 rounded-full',
                  isDark ? 'bg-[#1B2436]' : 'bg-white shadow-sm'
                )}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <FontAwesomeIcon icon={opt.icon} className="h-3 w-3" />
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
