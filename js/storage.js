/**
 * storage.js — shared utilities for all Nexus pages
 * Loaded as a plain <script> so these are available as globals.
 */

/** Safe localStorage JSON read with a fallback value. */
window.safeJSON = function safeJSON(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}

/** Returns today as "YYYY-MM-DD" in local time. */
window.todayKey = function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Cross-tab sync via BroadcastChannel. */
window._nexusSync = (() => {
  try {
    const ch = new BroadcastChannel('nexus-sync')
    return {
      broadcast: src => ch.postMessage({ type: 'storage-update', source: src }),
      listen:    cb  => { ch.onmessage = e => { if (e.data?.type === 'storage-update') cb() } },
    }
  } catch {
    return { broadcast: () => {}, listen: () => {} }
  }
})()
