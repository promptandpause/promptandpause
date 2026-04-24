import { cn } from '@/lib/utils'

/**
 * Skeleton — Apple-grade shimmer primitive.
 *
 * Uses a specular highlight sweep (`.pp-shimmer` keyframe in globals.css)
 * instead of a plain opacity pulse. Respects `prefers-reduced-motion`.
 *
 * Variants:
 *  - default: shimmer on a soft surface tint
 *  - plain:   static soft tint (no sweep) — cheap, for dense lists
 */
function Skeleton({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & { variant?: 'default' | 'plain' }) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'rounded-md',
        variant === 'default' ? 'pp-shimmer' : 'bg-accent/60',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
