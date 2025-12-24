import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          // Comprehensive CSP with all required services
          { 
            key: 'Content-Security-Policy', 
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' https://js.stripe.com https://m.stripe.network https://va.vercel-scripts.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.x.ai https://api.stripe.com https://api.resend.com https://hooks.slack.com https://*.upstash.io https://vitals.vercel-insights.com https://lottie.host https://*.lottiefiles.com https://cdn.jsdelivr.net https://unpkg.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com https://lottie.host https://res.cloudinary.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
        ],
      },
    ]
  },
  // Add empty turbopack config to silence warning about webpack config
  turbopack: {},
  
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
