"use client"

import Image from "next/image"
import { useScroll, useTransform, motion } from "framer-motion"
import { useRef } from "react"

export default function Promo() {
  const container = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"])
  const scale = useTransform(scrollYProgress, [0, 1], [1.08, 1.0])

  return (
    <section
      ref={container}
      aria-labelledby="promo-heading"
      className="relative isolate flex min-h-[90vh] items-end overflow-hidden bg-[#2F3B34]"
    >
      {/* Parallax image layer */}
      <motion.div
        style={{ y, scale }}
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-[120%] w-full"
      >
        <Image
          src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766469289/spiral-circles_wvgym8.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>

      {/* Cinematic gradient overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[#2F3B34]/40 via-[#2F3B34]/30 to-[#2F3B34]/85"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 py-20 sm:py-28 lg:px-12">
        {/* Top eyebrow */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between text-white/90"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8FBF9A]" />
            5-Minute Ritual
          </span>
          <span className="hidden text-xs uppercase tracking-[0.22em] text-white/60 sm:inline-block">
            Made for slower days
          </span>
        </motion.header>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          <h2
            id="promo-heading"
            className="font-serif text-4xl leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            No hour-long sessions. Just a few quiet minutes with&nbsp;one prompt.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
            Something you can fit into a morning coffee or a lunch break. No pressure. No performance.
            Just a small, honest moment with&nbsp;yourself.
          </p>
        </motion.div>

        {/* Stat row */}
        <motion.dl
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-120px" }}
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          className="grid grid-cols-1 gap-6 border-t border-white/15 pt-10 sm:grid-cols-3"
        >
          {[
            { value: "5 min", label: "Daily ritual, not a chore" },
            { value: "1:1", label: "One prompt, just for you" },
            { value: "0", label: "Likes, streaks, or audience" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
              }}
              className="flex flex-col"
            >
              <dt className="font-serif text-4xl text-white sm:text-5xl">{stat.value}</dt>
              <dd className="mt-2 text-sm uppercase tracking-[0.18em] text-white/70">
                {stat.label}
              </dd>
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </section>
  )
}

