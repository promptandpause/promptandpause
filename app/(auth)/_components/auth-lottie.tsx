"use client"

import { useEffect, useState } from "react"
import Lottie from "lottie-react"

type AuthLottieProps = {
  src: string
  className?: string
  loop?: boolean
  autoplay?: boolean
}

export function AuthLottie({
  src,
  className,
  loop = true,
  autoplay = true,
}: AuthLottieProps) {
  const [animationData, setAnimationData] = useState<any>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(encodeURI(src), { cache: "force-cache" })
        if (!res.ok) return
        const json = await res.json()
        if (!cancelled) setAnimationData(json)
      } catch {
        // ignore
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [src])

  if (!animationData) return null

  return (
    <div className={className}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        className="h-full w-full"
        style={{ background: "transparent" }}
      />
    </div>
  )
}
