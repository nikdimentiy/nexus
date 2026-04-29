const CACHE = 'nexus-v1'

const STATIC = [
  './',
  './index.html',
  './vanguard.html',
  './mastery.html',
  './css/index.css',
  './css/vanguard.css',
  './css/mastery.css',
  './css/auth.css',
  './js/storage.js',
  './js/appwrite-sync.js',
  './js/auth-guard.js',
  './js/auth.js',
  './js/index.js',
  './js/mastery.js',
  './js/vanguard.js',
]

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)))
  self.skipWaiting()
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
    caches.match(e.request).then(cached => cached || fetch(e.request))
  )
})
