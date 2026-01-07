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
    label: "Focus areas",
    value: "Pick a few",
    detail: "that match what you need",
  },
  {
    label: "No streak pressure",
    value: "Always",
    detail: "okay to miss a day",
  },
  {
    label: "Your space",
    value: "Private",
    detail: "by default",
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

      <div className={`${styles.authContent} relative z-10 min-h-screen px-4 py-10 sm:px-6 sm:py-12`}>
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1fr_460px] lg:items-center lg:gap-12">
          <aside className="hidden flex-col lg:flex">
            <div className="space-y-8">
              <NoSSR fallback={<div className="h-12 w-auto bg-white/10" />}>
                <Link href="https://www.promptandpause.com" target="_blank" rel="noopener noreferrer">
                  <img
                    src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
                    alt="Prompt & Pause"
                    className="h-12 w-auto invert brightness-0 hover:opacity-80 transition-opacity"
                  />
                </Link>
              </NoSSR>
              <div className="space-y-6">
                <p className="text-xs uppercase tracking-[0.32em] text-white/60">{heroEyebrow}</p>
                <h1 className="text-4xl font-semibold leading-tight text-white drop-shadow-[0_15px_60px_rgba(17,24,39,0.55)]">
                  {heroTitle}
                </h1>
                <p className="max-w-xl text-lg text-white/70">{heroSubtitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">{stat.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
                    <p className="mt-2 text-sm text-white/60">{stat.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="flex flex-col items-center">
            <div className="w-full max-w-md">
              <div className="text-center lg:hidden">
                <NoSSR fallback={<div className="mx-auto h-10 w-auto bg-white/10 mb-4" />}>
                  <Link href="https://www.promptandpause.com" target="_blank" rel="noopener noreferrer">
                    <img
                      src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
                      alt="Prompt & Pause"
                      className="mx-auto h-10 w-auto invert brightness-0 mb-4 hover:opacity-80 transition-opacity"
                    />
                  </Link>
                </NoSSR>
                <p className="text-xs uppercase tracking-[0.32em] text-white/60">{heroEyebrow}</p>
                <h1 className="mt-3 text-3xl font-semibold text-white">{heroTitle}</h1>
                <p className="mt-3 text-base text-white/70">{heroSubtitle}</p>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">{stat.label}</p>
                      <p className="mt-2 text-sm font-semibold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">{children}</div>
              <div className="mt-10">{footerNote}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
