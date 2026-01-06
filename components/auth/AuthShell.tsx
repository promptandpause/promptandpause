"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import styles from "./AuthShell.module.css"
import NoSSR from "./NoSSR"

interface Stat {
  label: string
  value: string
  detail: string
}

interface AuthShellProps {
  children: ReactNode
  heroEyebrow?: string
  heroTitle?: string
  heroSubtitle?: string
  stats?: Stat[]
  footerNote?: ReactNode
}

const defaultStats: Stat[] = [
  {
    label: "Daily prompts",
    value: "3-5 min",
    detail: "for meaningful reflection",
  },
  {
    label: "AI personalization",
    value: "6 areas",
    detail: "of focus to choose from",
  },
  {
    label: "Reflection streaks",
    value: "7 days",
    detail: "average for new users",
  },
  {
    label: "Your growth",
    value: "Starts",
    detail: "with today's thoughtful prompt",
  },
]

const defaultFooter = (
  <p className="text-xs sm:text-sm text-white/50 text-center">
    By continuing, you agree to our{" "}
    <Link
      href="/terms-of-service"
      className="text-white hover:text-white/80 underline-offset-4 hover:underline"
    >
      Terms
    </Link>{" "}
    and{" "}
    <Link
      href="/privacy-policy"
      className="text-white hover:text-white/80 underline-offset-4 hover:underline"
    >
      Privacy Policy
    </Link>
    .
  </p>
)

export default function AuthShell({
  children,
  heroEyebrow = "Prompt & Pause",
  heroTitle = "Pause. Reflect. Grow.",
  heroSubtitle = "Ground yourself with a single thoughtful question each day. Built for busy brains who still crave intentionality.",
  stats = defaultStats,
  footerNote = defaultFooter,
}: AuthShellProps) {
  return (
    <div className={styles.authShell}>
      <div className={styles.authBackground} />
      <div className={styles.authBlobs} />
      <div className={styles.authOverlay} />
      
      <div className={`${styles.authContent} relative z-10 flex min-h-screen flex-col lg:flex-row md:flex-col md:items-center md:justify-center`}>
        <aside className="hidden w-full max-w-xl flex-col justify-between border-r border-white/10 px-10 py-12 lg:flex md:border-r-0 md:border-b md:max-w-4xl md:mx-auto md:mb-8 md:text-center">
          <div className="space-y-8 md:text-center md:space-y-6 md:mb-8">
            <NoSSR fallback={<div className="h-12 w-auto bg-white/10" />}>
            <Link href="https://www.promptandpause.com" target="_blank" rel="noopener noreferrer">
              <img
                src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
                alt="Prompt & Pause"
                className="h-12 w-auto invert brightness-0 hover:opacity-80 transition-opacity md:mx-auto"
              />
            </Link>
          </NoSSR>
            <h1 className="text-3xl font-semibold leading-tight text-white drop-shadow-[0_15px_60px_rgba(17,24,39,0.55)] md:text-center">
              {heroTitle}
            </h1>
            <p className="text-lg text-white/70 md:text-center">{heroSubtitle}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 lg:gap-6 md:grid-cols-4 md:gap-4 md:justify-items-center md:max-w-3xl md:mx-auto">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20 lg:p-6 md:p-4 md:w-full md:max-w-xs"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">{stat.label}</p>
                <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
                <p className="mt-2 text-sm text-white/60">{stat.detail}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex min-h-screen flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-10 xl:px-12 2xl:px-16 md:min-h-0 md:py-8 md:w-full md:max-w-4xl md:mx-auto">
          <div className="w-full max-w-lg text-center lg:hidden xl:block xl:max-w-xl 2xl:max-w-2xl md:block md:max-w-4xl md:mb-8">
            <NoSSR fallback={<div className="mx-auto h-10 w-auto bg-white/10 mb-4" />}>
            <Link href="https://www.promptandpause.com" target="_blank" rel="noopener noreferrer">
              <img
                src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
                alt="Prompt & Pause"
                className="mx-auto h-10 w-auto invert brightness-0 mb-4 hover:opacity-80 transition-opacity"
              />
            </Link>
          </NoSSR>
            <h1 className="mt-3 text-3xl font-semibold text-white">{heroTitle}</h1>
            <p className="mt-3 text-base text-white/70">{heroSubtitle}</p>
          </div>
          <div className="w-full max-w-lg lg:max-w-xl xl:max-w-2xl md:max-w-md md:w-full mt-8">{children}</div>
          <div className="mt-10 w-full max-w-lg lg:max-w-xl xl:max-w-2xl md:max-w-md md:w-full">{footerNote}</div>
        </section>
      </div>
    </div>
  )
}
