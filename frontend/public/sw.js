const CACHE = 'valuation-shell-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))

self.addEventListener('fetch', e => {
  // Skip API calls — no offline data caching
  if (e.request.url.includes('/api/')) return
  if (e.request.method !== 'GET') return

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request)
      const networkPromise = fetch(e.request).then(res => {
        if (res.ok) cache.put(e.request, res.clone())
        return res
      }).catch(() => cached)
      return cached ?? networkPromise
    })
  )
})
