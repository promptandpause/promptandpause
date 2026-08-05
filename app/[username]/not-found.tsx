import Link from 'next/link'

export default function ProfileNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FBFB] dark:bg-[#0A0E18] px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-slate-900 dark:text-white mb-4">404</h1>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          This profile doesn&apos;t exist
        </h2>
        <p className="text-slate-500 dark:text-white/50 mb-8">
          The user you&apos;re looking for hasn&apos;t created an account or this link is broken.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#6366F1] text-white font-semibold hover:bg-[#4F46E5] transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
