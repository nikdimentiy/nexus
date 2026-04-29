/**
 * auth.js — Nexus auth overlay logic (index.html only)
 * Loaded as <script type="module" src="js/auth.js">
 */

import {
  signIn, signOut,
  getCurrentUser,
  bootstrapCloudToLocal,
  ensureCloudDefaults,
} from './appwrite-sync.js'

const emailEl    = document.getElementById('authEmail')
const passEl     = document.getElementById('authPassword')
const guestEl    = document.getElementById('authGuest')
const userEl     = document.getElementById('authUser')
const sessionEl  = document.getElementById('authSession')
const greetEl    = document.getElementById('greetingText')

const overlay      = document.getElementById('authOverlay')
const overlayEmail = document.getElementById('overlayEmail')
const overlayPass  = document.getElementById('overlayPassword')
const overlayBtn   = document.getElementById('overlaySignIn')
const overlayErr   = document.getElementById('authOverlayError')

let sessionStart = null
let sessionTimer = null

// ── overlay helpers ──────────────────────────────────────────────────

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

// ── greeting animation ───────────────────────────────────────────────

function animateGreeting(user) {
  const text = user.email || 'Thank you for coming!'
  greetEl.innerHTML = ''
  text.split('').forEach((ch, i) => {
    const s = document.createElement('span')
    s.className = 'g-char'
    s.textContent = ch === ' ' ? ' ' : ch
    s.style.animationDelay = `${i * 55}ms`
    greetEl.appendChild(s)
  })
}

// ── session clock ────────────────────────────────────────────────────

function formatDuration(ms) {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}h ${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`
    : `${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`
}

function stopSessionClock() {
  clearInterval(sessionTimer)
  sessionTimer = null
  sessionStart = null
  if (sessionEl) sessionEl.textContent = ''
}

// ── sign-in handlers ─────────────────────────────────────────────────

async function doOverlaySignIn() {
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
      const isNetwork = !navigator.onLine || (error.code === 0) ||
        (typeof error.message === 'string' && /fetch|network|failed/i.test(error.message))
      const msg = isNetwork
        ? 'Cannot reach server. If opening via file://, use a local HTTP server instead.'
        : error.message || error.type || `Error ${error.code}` || 'Authentication failed.'
      showOverlayError(msg)
      return
    }
    try { await ensureCloudDefaults() } catch (_) {}
    try { await bootstrapCloudToLocal() } catch (_) {}
    location.reload()
  } catch (err) {
    console.error('[NEXUS AUTH] Unexpected error:', err)
    const isFileProtocol = location.protocol === 'file:'
    showOverlayError(isFileProtocol
      ? 'Open via HTTP server, not file://. Run: python3 -m http.server 8080'
      : err.message || 'Authentication failed.')
  } finally {
    overlayBtn.disabled = false
    overlayBtn.classList.remove('loading')
    label.textContent = 'Sign In'
  }
}

async function doHeaderSignIn() {
  const btn = document.getElementById('btnSignIn')
  const label = btn.querySelector('span:last-child')
  const original = label.textContent
  btn.disabled = true
  label.textContent = '...'
  try {
    const { error } = await signIn(emailEl.value, passEl.value)
    if (error) { alert(error.message); return }
    try { await ensureCloudDefaults() } catch (_) {}
    try { await bootstrapCloudToLocal() } catch (_) {}
    location.reload()
  } catch (err) {
    alert(err.message || 'Sign in failed')
  } finally {
    btn.disabled = false
    label.textContent = original
  }
}

// ── auth state ───────────────────────────────────────────────────────

async function refreshAuth() {
  const user = await getCurrentUser()
  if (user) {
    hideOverlay()
    guestEl.style.display = 'none'
    userEl.style.display  = 'flex'
    if (!sessionStart) {
      sessionStart = true
      animateGreeting(user)
    }
  } else {
    showOverlay()
    guestEl.style.display = 'flex'
    userEl.style.display  = 'none'
    stopSessionClock()
  }
}

// ── event wiring ─────────────────────────────────────────────────────

overlayBtn.addEventListener('click', doOverlaySignIn)
;[overlayEmail, overlayPass].forEach(el => {
  el.addEventListener('keydown', e => { if (e.key === 'Enter') doOverlaySignIn() })
})

document.getElementById('btnSignIn').onclick = doHeaderSignIn
;[emailEl, passEl].forEach(el => {
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' && emailEl.value && passEl.value) doHeaderSignIn()
  })
})

document.getElementById('btnSignOut').onclick = async () => {
  await signOut()
  showOverlay()
  refreshAuth()
}

refreshAuth()
