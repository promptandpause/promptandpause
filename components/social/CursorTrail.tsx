"use client"

import { useEffect, useRef, useState } from 'react'

interface TrailPoint {
  id: number
  x: number
  y: number
}

/**
 * Lightweight sparkle cursor trail for profile themes with show_cursor_trail enabled.
 * Tracks mouse movement inside its parent (a relatively-positioned container) and
 * spawns small fading dots. Self-contained -- safe to mount/unmount per theme.
 */
export function CursorTrail({ color }: { color: string }) {
  const [points, setPoints] = useState<TrailPoint[]>([])
  const idCounter = useRef(0)
  const lastSpawn = useRef(0)

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const now = Date.now()
      if (now - lastSpawn.current < 28) return // throttle spawn rate
      lastSpawn.current = now

      const id = idCounter.current++
      setPoints(prev => [...prev.slice(-17), { id, x: e.clientX, y: e.clientY }])

      setTimeout(() => {
        setPoints(prev => prev.filter(p => p.id !== id))
      }, 700)
    }

    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[200]" aria-hidden>
      {points.map((p, i) => {
        const size = 5 + (i % 3) * 2 // 5 / 7 / 9px, gives the trail a slightly organic, non-uniform feel
        return (
          <span
            key={p.id}
            className="absolute rounded-full animate-[trail-fade_0.7s_ease-out_forwards]"
            style={{
              left: p.x - size / 2,
              top: p.y - size / 2,
              width: size,
              height: size,
              backgroundColor: color,
              boxShadow: `0 0 10px 1px ${color}`,
            }}
          />
        )
      })}
      <style jsx global>{`
        @keyframes trail-fade {
          from { opacity: 0.9; transform: scale(1); }
          to { opacity: 0; transform: scale(0.15); }
        }
      `}</style>
    </div>
  )
}
