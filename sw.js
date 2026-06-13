// CACHE_VERSION is replaced at build time by the Vite swBuildDate plugin.
// In dev it stays as the literal string; in production dist/sw.js gets the actual date.
const CACHE_VERSION = '__BUILD_DATE__'
const CACHE = `nexus-${CACHE_VERSION}`

// Replaced at build time by the Vite swBuildDate plugin with all hashed output assets.
// In dev the fallback list is used (SW caching is not relied on in dev).
const STATIC = '__PRECACHE_ASSETS__'

self.addEventListener('install', e => {
  // skipWaiting inside waitUntil so activation waits for caching to finish
  e.waitUntil(
    caches
      .open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  // Only intercept same-scope requests; skip Appwrite API, CDN fonts, etc.
  if (!e.request.url.startsWith(self.registration.scope)) return

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).catch(() => caches.match('./offline.html'))
    })
  )
})
