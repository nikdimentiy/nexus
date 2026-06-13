/**
 * storage.js — shared utilities for all Nexus pages
 * Loaded as a plain <script> so these are available as globals.
 */

/** Safe localStorage JSON read with a fallback value. */
window.safeJSON = function safeJSON(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

/** Returns today as "YYYY-MM-DD" in local time. */
window.todayKey = function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Escape HTML special chars to prevent XSS when injecting user text into innerHTML. */
window.escapeHtml = function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Trap keyboard focus inside a modal element.
 * Focuses the first focusable child on call and returns a cleanup function.
 */
window.trapFocus = function trapFocus(modalEl) {
  const sel = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  const getFocusable = () => Array.from(modalEl.querySelectorAll(sel)).filter(el => !el.disabled)
  const first = getFocusable()[0]
  first?.focus()
  function handler(e) {
    if (e.key !== 'Tab') return
    const focusable = getFocusable()
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === focusable[0]) {
        e.preventDefault()
        last?.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        focusable[0]?.focus()
      }
    }
  }
  modalEl.addEventListener('keydown', handler)
  return () => modalEl.removeEventListener('keydown', handler)
}

/** Cross-tab sync via BroadcastChannel. */
window._nexusSync = (() => {
  try {
    const ch = new BroadcastChannel('nexus-sync')
    return {
      broadcast: src => ch.postMessage({ type: 'storage-update', source: src }),
      listen: cb => {
        ch.onmessage = e => {
          if (e.data?.type === 'storage-update') cb()
        }
      },
    }
  } catch {
    return { broadcast: () => {}, listen: () => {} }
  }
})()
