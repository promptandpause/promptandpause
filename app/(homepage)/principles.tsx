"use client"

import { motion } from "framer-motion"
import { Feather, Leaf, Lock, Moon } from "lucide-react"

const principles = [
  {
    icon: Feather,
    title: "Gentle on purpose",
    body: "No streaks to defend, no badges to chase. Skip a day and we're still here — exactly where you left off.",
  },
  {
    icon: Lock,
    title: "Truly private",
    body: "Your reflections are encrypted at rest and never used to train models. This is your space, not a dataset.",
  },
  {
    icon: Leaf,
    title: "Slow by design",
    body: "One prompt at a time. No feeds to scroll, nothing to optimise. The pace is set by you, not an algorithm.",
  },
  {
    icon: Moon,
    title: "Calm first",
    body: "Quiet colours, soft motion, gentle copy. Everything here is tuned to lower your shoulders, not raise your pulse.",
  },
]

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any } },
}

export default function Principles() {
  return (
    <section
      aria-labelledby="principles-heading"
      className="relative isolate overflow-hidden bg-[#F0EDE6] px-6 py-24 sm:py-32 lg:px-12"
    >
      {/* Soft ambient wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(800px 500px at 20% 10%, rgba(111,169,132,0.10), transparent 60%), radial-gradient(700px 500px at 90% 100%, rgba(220,230,217,0.45), transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#6FA984]/25 bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4A5A49] backdrop-blur">
            How it feels
          </span>
          <h2
            id="principles-heading"
            className="mt-6 font-serif text-4xl leading-[1.1] tracking-tight text-[#2F3B34] sm:text-5xl lg:text-6xl"
          >
            Built around four quiet&nbsp;principles.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#4A5A49] sm:text-xl">
            Prompt &amp; Pause isn't another productivity app. It's a small, deliberate ritual —
            designed to make space, not fill it.
          </p>
        </motion.header>

        <motion.ul
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {principles.map(({ icon: Icon, title, body }) => (
            <motion.li
              key={title}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="group relative flex flex-col rounded-3xl border border-white/60 bg-white/60 p-7 shadow-sm shadow-[#2F3B34]/5 backdrop-blur-xl transition-colors hover:bg-white/80"
            >
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6FA984] to-[#5A8F6E] text-white shadow-lg shadow-[#6FA984]/25"
              >
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-6 font-serif text-xl text-[#2F3B34]">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#4A5A49] sm:text-base">{body}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
