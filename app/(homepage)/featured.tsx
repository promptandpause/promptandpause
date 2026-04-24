"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowUpRight, Sparkles } from "lucide-react"

const revealUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any, delay: i * 0.08 },
  }),
}

const highlights = [
  {
    kicker: "Private by design",
    body: "Your words stay yours. No feeds, no likes, no public profile — just a quiet space that belongs to you.",
  },
  {
    kicker: "One prompt a day",
    body: "A single thoughtful question delivered at a time you choose. No catching up, no streak anxiety.",
  },
  {
    kicker: "Five calm minutes",
    body: "Short enough for a morning coffee or a lunch break. Long enough to actually feel like a pause.",
  },
]

export default function Featured() {
  return (
    <section
      aria-labelledby="featured-heading"
      className="relative isolate overflow-hidden bg-[#F5F3EE] px-6 py-24 sm:py-32 lg:px-12"
    >
      {/* Subtle gradient wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(1000px 600px at 85% 15%, rgba(111,169,132,0.10), transparent 60%), radial-gradient(900px 500px at 10% 95%, rgba(143,191,154,0.12), transparent 60%)",
        }}
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Text column */}
        <motion.div
          className="lg:col-span-6 lg:order-1"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        >
          <motion.span
            variants={revealUp}
            className="inline-flex items-center gap-2 rounded-full border border-[#6FA984]/25 bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4A5A49] backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#6FA984]" />
            One thoughtful question
          </motion.span>

          <motion.h2
            id="featured-heading"
            variants={revealUp}
            className="mt-6 font-serif text-4xl leading-[1.1] tracking-tight text-[#2F3B34] sm:text-5xl lg:text-6xl"
          >
            Reflection, without the&nbsp;noise.
          </motion.h2>

          <motion.p
            variants={revealUp}
            className="mt-6 max-w-xl text-lg leading-relaxed text-[#4A5A49] sm:text-xl"
          >
            Prompt &amp; Pause gives you a single prompt at a time — so your attention stays on what
            matters, not on metrics. Write privately, at your own pace, and return when you want a
            little more perspective.
          </motion.p>

          {/* Highlight list */}
          <motion.ul
            variants={revealUp}
            className="mt-10 space-y-5 border-l border-[#6FA984]/20 pl-6"
          >
            {highlights.map((item, i) => (
              <motion.li
                key={item.kicker}
                custom={i}
                variants={revealUp}
                className="group"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6FA984]">
                  {item.kicker}
                </p>
                <p className="mt-1 text-base text-[#2F3B34]/85 sm:text-lg">{item.body}</p>
              </motion.li>
            ))}
          </motion.ul>

          <motion.div variants={revealUp} className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/our-mission"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6FA984] to-[#5A8F6E] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#6FA984]/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#6FA984]/30"
            >
              Learn more about our mission
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-[#2F3B34] underline-offset-4 hover:underline"
            >
              Start free for 7 days →
            </Link>
          </motion.div>
        </motion.div>

        {/* Image column */}
        <motion.figure
          className="relative lg:col-span-6 lg:order-2"
          initial={{ opacity: 0, scale: 0.98, y: 24 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-2xl shadow-[#2F3B34]/15 ring-1 ring-black/5">
            <Image
              src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766469858/ivan-sitting-glear_t7agby.jpg"
              alt="Person reflecting with a journal in a calm, softly lit setting"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority={false}
            />
            {/* Soft gradient overlay for depth */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#2F3B34]/25 via-transparent to-transparent"
            />
          </div>

          {/* Floating quote card */}
          <motion.figcaption
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="absolute -bottom-6 left-4 right-4 rounded-2xl border border-white/60 bg-white/85 p-5 shadow-xl shadow-[#2F3B34]/10 backdrop-blur-xl sm:left-8 sm:right-auto sm:max-w-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6FA984]">
              Today's prompt
            </p>
            <blockquote className="mt-2 font-serif text-lg italic leading-snug text-[#2F3B34] sm:text-xl">
              &ldquo;What would feel like enough for you today?&rdquo;
            </blockquote>
          </motion.figcaption>
        </motion.figure>
      </div>
    </section>
  )
}

