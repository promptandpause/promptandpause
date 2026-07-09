import Link from 'next/link'

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] dark:bg-[#0A0A0A] px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-[#0F1419] dark:text-white mb-4">404</h1>
        <h2 className="text-xl font-semibold text-[#0F1419] dark:text-white mb-2">
          Page not found
        </h2>
        <p className="text-[#536471] dark:text-white/50 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1D9BF0] text-white font-semibold hover:bg-[#1A8CD8] transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
