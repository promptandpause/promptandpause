"use client"

import { useState, useEffect } from "react"

interface NoSSRProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Always return the same HTML structure on server and client initially
  // Only replace content after client-side hydration is complete
  return (
    <div data-no-ssr="true">
      {isClient ? children : fallback}
    </div>
  )
}
