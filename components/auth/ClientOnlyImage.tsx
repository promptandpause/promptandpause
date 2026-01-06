"use client"

import { useState, useEffect } from "react"

interface ClientOnlyImageProps {
  src: string
  alt: string
  className: string
}

export default function ClientOnlyImage({ src, alt, className }: ClientOnlyImageProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Always return the same HTML structure on server and client initially
  // Only replace content after client-side hydration is complete
  return (
    <div data-client-image="true">
      {isClient ? <img src={src} alt={alt} className={className} /> : <div className={`${className} bg-white/10`} />}
    </div>
  )
}
