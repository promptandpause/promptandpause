import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // Performance and caching headers - use stale-while-revalidate for pages
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
          // Cookie security is handled by Supabase SSR client and middleware
          // CSP is set dynamically by middleware.ts per request
        ],
      },
      // Specific headers for dashboard routes
      {
        source: '/dashboard/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      // Static assets caching
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // API routes
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ]
  },

	async redirects() {
	  return [
		  { source: '/auth', destination: '/login', permanent: false },
		  { source: '/auth/signin', destination: '/login', permanent: false },
		  { source: '/auth/signup', destination: '/signup', permanent: false },
		  { source: '/auth/forgot-password', destination: '/forgot-password', permanent: false },
		  { source: '/auth/verify', destination: '/verify', permanent: false },
		  { source: '/auth/change-password', destination: '/change-password', permanent: false },
	  ]
	},
  // Add turbopack config to set root to the promptandpause repo directory
  turbopack: {
    root: __dirname,
  },
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle PDFKit for server-side rendering
      config.resolve.alias.canvas = false
      config.resolve.alias.encoding = false
      
      // Externalize pdfkit to avoid bundling issues
      config.externals = config.externals || []
      config.externals.push('canvas')
    }

    // Add support for WASM files (needed for DotLottie)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }

    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    })

    // Suppress Supabase Edge Runtime warnings
    // These are safe to ignore as they're just compatibility checks
    // that gracefully degrade in Edge Runtime
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/@supabase\/realtime-js\/dist\/module\/lib\/websocket-factory\.js/,
        message: /.*process\.versions.*/,
      },
      {
        module: /node_modules\/@supabase\/supabase-js\/dist\/module\/index\.js/,
        message: /.*process\.version.*/,
      },
    ]

    return config
  },
}

export default nextConfig
