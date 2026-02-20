import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware
 *
 * Sets a dynamic Content-Security-Policy header on every page response.
 * CSP is handled here (rather than in next.config.mjs static headers)
 * so it can be extended with per-request values in the future.
 *
 * All other security headers (HSTS, X-Frame-Options, etc.) remain in
 * next.config.mjs static headers.
 */

export function middleware(request: NextRequest) {
  // Content-Security-Policy
  //
  // Nonce-based CSP is not used because Next.js has a known bug where the
  // nonce value is not propagated to <script> tags in production builds
  // (see https://github.com/vercel/next.js/issues/55638). When a nonce is
  // present in script-src, browsers ignore 'unsafe-inline', which breaks
  // Next.js hydration since its inline scripts don't carry the nonce.
  //
  // Instead we use 'self' + explicit host allowlist + 'unsafe-inline' for
  // script-src. This is the maximum CSP strictness achievable with Next.js
  // until the nonce bug is resolved. All other directives remain strict.
  //
  // 'unsafe-eval' is NOT included — eval() is blocked in production.
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://js.stripe.com https://m.stripe.network https://va.vercel-scripts.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.x.ai https://api.stripe.com https://api.resend.com https://hooks.slack.com https://*.upstash.io https://vitals.vercel-insights.com https://lottie.host https://*.lottiefiles.com https://cdn.jsdelivr.net https://unpkg.com",
    "img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com https://lottie.host https://res.cloudinary.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ')

  const response = NextResponse.next()

  response.headers.set('Content-Security-Policy', csp)

  return response
}

// Run middleware on all routes except static files and images
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png, apple-icon.png (metadata files)
     * - manifest.json, robots.txt, sitemap.xml (SEO files)
     * - .svg, .png, .jpg, .jpeg, .gif, .webp (image files)
     */
    {
      source:
        '/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|apple-icon\\.png|manifest\\.json|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
