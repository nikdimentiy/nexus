// Bump CACHE_VERSION after every deploy so stale assets are evicted automatically.
// Format: YYYYMMDD or a short git SHA injected by CI.
const CACHE_VERSION = '20260430'
const CACHE = `nexus-${CACHE_VERSION}`

const STATIC = [
  './',
  './index.html',
  './offline.html',
  './css/index.css',
  './css/vanguard.css',
  './css/mastery.css',
  './css/auth.css',
  './js/storage.js',
  './js/config.js',
  './js/appwrite-sync.js',
  './js/router.js',
  './js/views/nexus.js',
  './js/views/vanguard.js',
  './js/views/mastery.js',
]

self.addEventListener('install', e => {
  // skipWaiting inside waitUntil so activation waits for caching to finish
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  // Only intercept same-scope requests; skip Appwrite API, CDN fonts, etc.
  if (!e.request.url.startsWith(self.registration.scope)) return

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).catch(() =>
        caches.match('./offline.html')
      )
    })
  )
})
