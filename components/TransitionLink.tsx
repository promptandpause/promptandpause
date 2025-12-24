"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { MouseEvent, ReactNode } from "react"

interface TransitionLinkProps {
  href: string
  children: ReactNode
  className?: string
  onClick?: () => void
}

export default function TransitionLink({
  href,
  children,
  className,
  onClick,
}: TransitionLinkProps) {
  const router = useRouter()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    
    // Call any additional onClick handler
    if (onClick) {
      onClick()
    }
    
    // Add a tiny delay to ensure smooth transition
    setTimeout(() => {
      router.push(href)
    }, 50)
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}
