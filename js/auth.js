/**
 * auth.js — Nexus auth widget logic (index.html only)
 * Loaded as <script type="module" src="js/auth.js">
 */

import {
  signIn, signOut,
  getCurrentUser,
  bootstrapCloudToLocal,
  ensureCloudDefaults,
} from './appwrite-sync.js'

const userEl  = document.getElementById('authUser')
const greetEl = document.getElementById('greetingText')

const overlay      = document.getElementById('authOverlay')
const overlayEmail = document.getElementById('overlayEmail')
const overlayPass  = document.getElementById('overlayPassword')
const overlayBtn   = document.getElementById('overlaySignIn')
const overlayErr   = document.getElementById('authOverlayError')

let sessionStart = null

// Rate-limiting: lock out after MAX_ATTEMPTS failures for LOCKOUT_MS
const MAX_ATTEMPTS = 5
const LOCKOUT_MS   = 60_000  // 60 s
let failCount      = 0
let lockedUntil    = 0

// overlay helpers

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
  overlayPass.value  = ''
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

// greeting

function animateGreeting(user) {
  greetEl.textContent = user.email || 'Thank you for coming!'
}

// sign-in handler

async function doOverlaySignIn() {
  if (Date.now() < lockedUntil) return

  clearOverlayError()
  const email = overlayEmail.value.trim()
  const pass  = overlayPass.value
  if (!email || !pass) { showOverlayError('Please enter your email and password.'); return }

  overlayBtn.disabled = true
  overlayBtn.classList.add('loading')
  const label = overlayBtn.querySelector('span')
  label.textContent = 'Signing in…'

  try {
    const { error } = await signIn(email, pass)
    if (error) {
      console.error('[NEXUS AUTH] Sign-in error:', error)
      failCount++
      if (failCount >= MAX_ATTEMPTS) {
        overlayBtn.classList.remove('loading')
        setLockout()
        return
      }
      const isNetwork = !navigator.onLine || (error.code === 0) ||
        (typeof error.message === 'string' && /fetch|network|failed/i.test(error.message))
      const attemptsLeft = MAX_ATTEMPTS - failCount
      const suffix = attemptsLeft === 1 ? ' (1 attempt left)' : ` (${attemptsLeft} attempts left)`
      const msg = isNetwork
        ? 'Cannot reach server. If opening via file://, use a local HTTP server instead.'
        : (error.message || error.type || `Error ${error.code}` || 'Authentication failed.') + suffix
      showOverlayError(msg)
      return
    }
    failCount = 0
    try { await ensureCloudDefaults() } catch (_) {}
    try { await bootstrapCloudToLocal() } catch (_) {}
    location.reload()
  } catch (err) {
    console.error('[NEXUS AUTH] Unexpected error:', err)
    failCount++
    if (failCount >= MAX_ATTEMPTS) {
      overlayBtn.classList.remove('loading')
      setLockout()
      return
    }
    const isFileProtocol = location.protocol === 'file:'
    showOverlayError(isFileProtocol
      ? 'Open via HTTP server, not file://. Run: python3 -m http.server 8080'
      : err.message || 'Authentication failed.')
  } finally {
    if (Date.now() < lockedUntil) return
    overlayBtn.disabled = false
    overlayBtn.classList.remove('loading')
    label.textContent = 'Sign In'
  }
}

// auth state

async function refreshAuth() {
  const user = await getCurrentUser()
  if (user) {
    hideOverlay()
    userEl.style.display = 'flex'
    if (!sessionStart) {
      sessionStart = true
      animateGreeting(user)
    }
  } else {
    showOverlay()
    userEl.style.display = 'none'
    sessionStart = null
  }
}

// event wiring

overlayBtn.addEventListener('click', doOverlaySignIn)
;[overlayEmail, overlayPass].forEach(el => {
  el.addEventListener('keydown', e => { if (e.key === 'Enter') doOverlaySignIn() })
})

document.getElementById('btnSignOut').onclick = async () => {
  await signOut()
  showOverlay()
  refreshAuth()
}

refreshAuth()
