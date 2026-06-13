/**
 * router.js — Hash-based SPA router with in-memory auth guard.
 *
 * Routes:   #  → nexus (hub dashboard)
 *           #vanguard → vanguard
 *           #mastery  → mastery
 *
 * Auth state is checked once on first load and cached in memory.
 * Subsequent navigations never hit Appwrite — zero latency between views.
 */

import { signIn, signOut, getCurrentUser, syncOnLogin, setupRealtime } from './appwrite-sync.js'

// ── CSS switcher ─────────────────────────────────────────────────────────────
// Each view's stylesheet has data-view="<name>". Inactive ones use media="not all"
// so the browser still downloads them (after first visit) but doesn't apply them.
function activateCSS(viewName) {
  document.querySelectorAll('link[data-view]').forEach(link => {
    link.media = link.dataset.view === viewName ? 'all' : 'not all'
  })
}

// ── Auth state — cached in memory after first check ──────────────────────────
let _user = undefined // undefined = not yet checked; null = not signed in
let _realtimeUnsub = null

async function getUser() {
  if (_user !== undefined) return _user
  _user = await getCurrentUser()
  return _user
}

// ── Auth overlay wiring (moved here from auth.js) ────────────────────────────
const overlay = document.getElementById('authOverlay')
const overlayEmail = document.getElementById('overlayEmail')
const overlayPass = document.getElementById('overlayPassword')
const overlayBtn = document.getElementById('overlaySignIn')
const overlayErr = document.getElementById('authOverlayError')
const userEl = document.getElementById('authUser') // may be null until nexus renders

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 60_000
let failCount = 0
let lockedUntil = 0

function showOverlayError(msg) {
  overlayErr.textContent = msg
  overlayErr.classList.add('visible')
}
function clearOverlayError() {
  overlayErr.textContent = ''
  overlayErr.classList.remove('visible')
}
function hideOverlay() {
  overlay.classList.add('auth-fade-out')
  setTimeout(() => overlay.classList.add('auth-gone'), 700)
}
function showOverlay() {
  overlay.classList.remove('auth-gone', 'auth-fade-out')
  overlayEmail.value = ''
  overlayPass.value = ''
  clearOverlayError()
}

function setLockout() {
  lockedUntil = Date.now() + LOCKOUT_MS
  overlayBtn.disabled = true
  const label = overlayBtn.querySelector('span')
  const tick = () => {
    const remaining = Math.ceil((lockedUntil - Date.now()) / 1000)
    if (remaining <= 0) {
      failCount = 0
      overlayBtn.disabled = false
      label.textContent = 'Sign In'
      clearOverlayError()
      return
    }
    showOverlayError(`Too many attempts — try again in ${remaining}s`)
    label.textContent = `Wait ${remaining}s`
    setTimeout(tick, 1000)
  }
  tick()
}

async function doOverlaySignIn() {
  if (Date.now() < lockedUntil) return
  clearOverlayError()
  const email = overlayEmail.value.trim()
  const pass = overlayPass.value
  if (!email || !pass) {
    showOverlayError('Please enter your email and password.')
    return
  }

  overlayBtn.disabled = true
  overlayBtn.classList.add('loading')
  const label = overlayBtn.querySelector('span')
  label.textContent = 'Signing in…'

  try {
    const { error } = await signIn(email, pass)
    if (error) {
      failCount++
      if (failCount >= MAX_ATTEMPTS) {
        overlayBtn.classList.remove('loading')
        setLockout()
        return
      }
      const isNetwork =
        !navigator.onLine ||
        error.code === 0 ||
        (typeof error.message === 'string' && /fetch|network|failed/i.test(error.message))
      const left = MAX_ATTEMPTS - failCount
      showOverlayError(
        isNetwork
          ? 'Cannot reach server. If opening via file://, use a local HTTP server instead.'
          : (error.message || error.type || `Error ${error.code}`) +
              ` (${left} attempt${left === 1 ? '' : 's'} left)`
      )
      return
    }
    failCount = 0
    try {
      await syncOnLogin()
    } catch (_) {}

    // Update in-memory user and wire realtime, then navigate
    _user = await getCurrentUser()
    _wireRealtime()
    hideOverlay()
    document.body.classList.add('auth-passed')
    // Re-render current view now that we're authenticated
    await _renderView(location.hash.slice(1) || '')
  } catch (err) {
    failCount++
    if (failCount >= MAX_ATTEMPTS) {
      overlayBtn.classList.remove('loading')
      setLockout()
      return
    }
    showOverlayError(
      location.protocol === 'file:'
        ? 'Open via HTTP server, not file://. Run: python3 -m http.server 8080'
        : err.message || 'Authentication failed.'
    )
  } finally {
    if (Date.now() >= lockedUntil) {
      overlayBtn.disabled = false
      overlayBtn.classList.remove('loading')
      overlayBtn.querySelector('span').textContent = 'Sign In'
    }
  }
}

overlayBtn.addEventListener('click', doOverlaySignIn)
;[overlayEmail, overlayPass].forEach(el => {
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter') doOverlaySignIn()
  })
})

// Sign-out is wired from within nexus view (button is rendered there)
// Sign-out is triggered by a 'nexus:signout' CustomEvent dispatched from the
// Nexus view's sign-out button. Using an event keeps the auth boundary inside
// the router and prevents any arbitrary script from calling sign-out directly.
document.addEventListener('nexus:signout', async () => {
  _realtimeUnsub?.()
  _realtimeUnsub = null
  await signOut()
  _user = null
  showOverlay()
  document.body.classList.remove('auth-passed')
  await _renderView('')
})

// ── Realtime subscription ─────────────────────────────────────────────────────
function _wireRealtime() {
  if (_realtimeUnsub) return // already subscribed
  try {
    _realtimeUnsub = setupRealtime()
  } catch (_) {}
}

// ── View lifecycle ────────────────────────────────────────────────────────────
let _destroyCurrent = null

const ROUTES = {
  '': () => import('./views/nexus.js'),
  vanguard: () => import('./views/vanguard.js'),
  mastery: () => import('./views/mastery.js'),
}
const AUTH_ROUTES = new Set(['vanguard', 'mastery'])

async function _renderView(hash) {
  const loader = ROUTES[hash] ?? ROUTES['']
  const resolvedHash = ROUTES[hash] ? hash : ''

  // Destroy previous view
  try {
    _destroyCurrent?.()
  } catch (err) {
    console.error('[router] view destroy failed:', err)
  }
  _destroyCurrent = null

  activateCSS(resolvedHash === '' ? 'nexus' : resolvedHash)

  const mod = await loader()
  const app = document.getElementById('app')
  _destroyCurrent = await mod.init(app, _user)
}

// ── Main navigation handler ───────────────────────────────────────────────────
async function navigate() {
  const hash = location.hash.slice(1)

  // Resolve auth state once
  const user = await getUser()

  if (AUTH_ROUTES.has(hash) && !user) {
    // Redirect unauthenticated users to nexus
    location.hash = ''
    return
  }

  if (user) {
    hideOverlay()
    _wireRealtime()
    document.body.classList.add('auth-passed')
  } else {
    showOverlay()
    document.body.classList.remove('auth-passed')
  }

  await _renderView(hash)
}

window.addEventListener('hashchange', navigate)
navigate()
