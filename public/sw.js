const CACHE_NAME = 'prompt-and-pause-v1'
const RUNTIME_CACHE = 'runtime-cache-v1'

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/pwa-welcome',
  '/auth/signin',
  '/dashboard',
  '/icon.png',
  '/apple-icon.png',
  '/manifest.json',
]

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return
  }

  // Skip API calls and Supabase requests - always go to network
  if (
    request.url.includes('/api/') ||
    request.url.includes('supabase.co') ||
    request.url.includes('stripe.com')
  ) {
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response before caching
        const responseToCache = response.clone()

        // Cache successful responses
        if (response.status === 200) {
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache)
          })
        }

        return response
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // If no cache, return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/pwa-welcome')
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
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

// Handle push events - display notification
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch (e) {
    data = {
      title: 'Prompt & Pause',
      body: event.data.text(),
      icon: '/apple-icon.png',
      badge: '/icon.png',
    }
  }

  const options = {
    body: data.body || 'You have a new reflection prompt waiting.',
    icon: data.icon || '/apple-icon.png',
    badge: data.badge || '/icon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard',
      dateOfArrival: Date.now(),
    },
    actions: [
      {
        action: 'open',
        title: 'View Prompt',
      },
      {
        action: 'dismiss',
        title: 'Later',
      },
    ],
    tag: data.tag || 'prompt-notification',
    renotify: true,
    requireInteraction: false,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Prompt & Pause', options)
  )
})

// Handle notification click - open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/dashboard'

  if (event.action === 'dismiss') {
    return
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen)
          return client.focus()
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  // Analytics or cleanup if needed
})
