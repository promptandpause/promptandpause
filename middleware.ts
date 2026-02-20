import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware
 *
 * Generates a per-request CSP nonce so that `'unsafe-inline'` and `'unsafe-eval'`
 * can be removed from `script-src`. The nonce is forwarded to the renderer via
 * the `x-nonce` request header, which Next.js reads automatically to tag its
 * own inline hydration scripts.
 *
 * All other security headers (HSTS, X-Frame-Options, etc.) remain in
 * next.config.mjs static headers — only CSP is handled here because it
 * requires a dynamic nonce value.
 */

export function middleware(request: NextRequest) {
  // Generate a cryptographically random nonce for this request
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // Build the Content-Security-Policy with the nonce
  //
  // NOTE: 'strict-dynamic' is intentionally omitted. When present it causes
  // browsers to ignore 'unsafe-inline' and host-based allowlists, which
  // blocks Next.js hydration scripts that don't carry the nonce.
  // Instead we use 'unsafe-inline' as a fallback alongside the nonce so
  // that Next.js inline scripts work while explicitly-tagged scripts
  // still benefit from nonce verification.
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'wasm-unsafe-eval' https://js.stripe.com https://m.stripe.network https://va.vercel-scripts.com`,
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.x.ai https://api.stripe.com https://api.resend.com https://hooks.slack.com https://*.upstash.io https://vitals.vercel-insights.com https://lottie.host https://*.lottiefiles.com https://cdn.jsdelivr.net https://unpkg.com",
    "img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com https://lottie.host https://res.cloudinary.com",
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ')

  // Clone the request headers and set the nonce for Next.js to read
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Set the CSP header on the response
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
