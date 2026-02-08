"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import styles from "./AuthShell.module.css"
import NoSSR from "./NoSSR"

interface AuthShellProps {
  children: ReactNode
  footerNote?: ReactNode
}

const defaultFooter = (
  <p className="text-xs text-[#6B7F6E]/70 text-center">
    By continuing, you agree to our{" "}
    <Link
      href="/terms-of-service"
      className="text-[#6B7F6E] hover:text-[#2F3B34] underline-offset-4 hover:underline transition-colors"
    >
      Terms
    </Link>{" "}
    and{" "}
    <Link
      href="/privacy-policy"
      className="text-[#6B7F6E] hover:text-[#2F3B34] underline-offset-4 hover:underline transition-colors"
    >
      Privacy Policy
    </Link>
    .
  </p>
)

export default function AuthShell({
  children,
  footerNote = defaultFooter,
}: AuthShellProps) {
  return (
    <div className={styles.authShell}>
      <div className={styles.authBackground} />
      <div className={styles.authBlobs} />
      <div className={styles.authOverlay} />

      <div className={`${styles.authContent} relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-6`}>
        {/* Logo + Slogan */}
        <div className="mb-10 text-center">
          <NoSSR fallback={<div className="mx-auto h-14 w-auto" />}>
            <Link href="https://www.promptandpause.com" target="_blank" rel="noopener noreferrer">
              <img
                src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
                alt="Prompt & Pause"
                className="mx-auto h-11 w-auto hover:opacity-80 transition-opacity"
              />
            </Link>
          </NoSSR>
          <p className="mt-3 text-xs font-medium tracking-widest text-[#6B7F6E] uppercase">Pause. Reflect. Grow.</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-[420px]">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-8 w-full max-w-[420px]">
          {footerNote}
        </div>
      </div>
    </div>
  )
}
