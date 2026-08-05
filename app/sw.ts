/// <reference lib="webworker" />

const CACHE_NAME = 'prompt-and-pause-v3'
const RUNTIME_CACHE = 'runtime-cache-v3'

declare const self: ServiceWorkerGlobalScope

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/pwa-welcome',
  '/#mode=signin',
  '/dashboard',
  '/icon.png',
  '/apple-icon.png',
  '/manifest.json',
]

// Navigation FetchEvents use redirect mode 'manual', so a Response produced by
// following an HTTP redirect (response.redirected === true) is rejected with
// "a redirected response was used for a request whose redirect mode is not
// 'follow'". Rebuild such responses as a clean copy (redirected === false)
// before serving or caching them. Adapted from Workbox's cleanRedirect().
function cleanRedirectedResponse(response: Response): Promise<Response> {
  if (!response.redirected) {
    return Promise.resolve(response)
  }

  const clonedResponse = response.clone()

  return clonedResponse.blob().then((body) => {
    return new Response(body, {
      headers: clonedResponse.headers,
      status: clonedResponse.status,
      statusText: clonedResponse.statusText,
    })
  })
}

// Install event - cache essential assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Fetch each asset individually and store a clean (non-redirected)
      // copy. cache.addAll() follows 3xx redirects and stores the redirected
      // response under the original URL, which later breaks navigations.
      return Promise.all(
        PRECACHE_ASSETS.map((asset) =>
          fetch(asset)
            .then((response) => cleanRedirectedResponse(response))
            .then((cleanResponse) => cache.put(asset, cleanResponse))
            .catch(() => {})
        )
      )
    })
  )
  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      )
    })
  )
  // Take control of all pages immediately
  self.clients.claim()
})

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return
  }

  // Skip API calls, Supabase requests, and auth routes - always go to network
  if (
    request.url.includes('/api/') ||
    request.url.includes('/auth/') ||
    request.url.includes('/onboarding') ||
    request.url.includes('supabase.co') ||
    request.url.includes('stripe.com')
  ) {
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => cleanRedirectedResponse(response))
      .then((cleanResponse) => {
        // Cache successful responses (cleaned copies only, so redirects never
        // get cached under their original URL)
        if (cleanResponse.status === 200) {
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, cleanResponse.clone())
          })
        }

        return cleanResponse
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cleanRedirectedResponse(cachedResponse)
          }

          // If no cache, return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/pwa-welcome').then((fallback) => {
              return (
                fallback ||
                new Response('Offline', {
                  status: 503,
                  statusText: 'Service Unavailable',
                })
              )
            })
          }

          // For other requests, return a basic response
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          })
        })
      })
  )
})

// Handle messages from the client
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

export {}
