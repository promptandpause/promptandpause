import Link from 'next/link'

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FBFB] dark:bg-[#0A0E18] px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-slate-900 dark:text-white mb-4">404</h1>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Page not found
        </h2>
        <p className="text-slate-600 dark:text-white/50 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
