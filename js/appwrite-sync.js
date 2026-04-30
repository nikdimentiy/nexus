/**
 * Appwrite cloud sync — replaces supabase-sync.js
 *
 * SETUP (one-time, in Appwrite console):
 *  1. Create a project → paste its ID into js/config.js (see config.example.js)
 *  2. Create a database → paste its ID into js/config.js
 *  3. Inside that database create a collection named "user_data" with:
 *       user_id : String(36),    required
 *       key     : String(64),    required
 *       value   : String(65535), required
 *  4. Add a composite index on [user_id, key]
 *  5. Collection permissions → "Create" for role: users
 *     (document-level read/update/delete is set per-document in code)
 *  6. Appwrite project > Platforms → add Web platform with your hostname
 */

import { Client, Account, Databases, Query, Permission, Role, ID }
  from 'https://cdn.jsdelivr.net/npm/appwrite@16/dist/esm/sdk.js'
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_DATABASE_ID }
  from './config.js'

// ── CONFIGURATION ───────────────────────────────────────────────────
const ENDPOINT      = APPWRITE_ENDPOINT
const PROJECT_ID    = APPWRITE_PROJECT_ID
const DATABASE_ID   = APPWRITE_DATABASE_ID
const COLLECTION_ID = 'user_data'
const PAGE_SIZE     = 100  // Appwrite max per request
// ────────────────────────────────────────────────────────────────────

// Dynamic key registry — add built-in keys here; modules call registerSyncKey() to opt in
const _syncKeys = new Set([
  'mastery_data',
  'vanguard-logs',
  'vanguard-cycle-goals',
  'streak_ontrack',
  'streak_timeTracking',
])

/** Register a localStorage key for cloud sync. Call once per module at init time. */
export function registerSyncKey(key) {
  _syncKeys.add(key)
}

const client    = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID)
const account   = new Account(client)
const databases = new Databases(client)

// ── SESSION CACHE ─────────────────────────────────────────────────────
// Cached after first successful auth check; avoids account.get() on every save.
let _cachedUserId = null

// Maps localStorage key → Appwrite $id; populated by bootstrapCloudToLocal.
// Eliminates the findDoc() lookup from every saveCloudKey call.
const _docIdCache = new Map()

// ── TOAST ──────────────────────────────────────────────────────────────

function _showToast(msg, durationMs = 4000, isError = false) {
  const el = document.getElementById('nexusToast')
  if (!el) return
  el.textContent = msg
  if (isError) {
    el.style.borderColor = 'rgba(244,63,94,0.5)'
    el.style.color       = '#f87171'
    el.style.boxShadow   = '0 0 24px rgba(244,63,94,0.18), 0 8px 32px rgba(0,0,0,0.4)'
  } else {
    el.style.borderColor = ''
    el.style.color       = ''
    el.style.boxShadow   = ''
  }
  el.classList.add('show')
  clearTimeout(el._timer)
  el._timer = setTimeout(() => el.classList.remove('show'), durationMs)
}

/** Wrap a promise with a timeout. Rejects with an Error on timeout. */
function _withTimeout(promise, ms = 12000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), ms)
    ),
  ])
}

// ── AUTH ─────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  try {
    await account.createEmailPasswordSession(email, password)
    return { error: null }
  } catch (err) {
    return { error: err }
  }
}

export async function signOut() {
  _cachedUserId = null
  _docIdCache.clear()
  try { await account.deleteSession('current') } catch (_) {}
}

export async function getCurrentUser() {
  try { return await account.get() } catch (_) { return null }
}

// ── INTERNALS ─────────────────────────────────────────────────────────

async function getUserId() {
  if (_cachedUserId) return _cachedUserId
  const user = await getCurrentUser()
  _cachedUserId = user?.$id ?? null
  return _cachedUserId
}

/** Permissions for a document owned by userId. */
function ownerPerms(userId) {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]
}

/**
 * Fetch ALL documents for a user via cursor-based pagination.
 * Appwrite caps each page at PAGE_SIZE (100); this loops until exhausted.
 */
async function _fetchAllDocs(userId) {
  const all = []
  let cursor = null

  while (true) {
    const filters = [
      Query.equal('user_id', userId),
      Query.limit(PAGE_SIZE),
    ]
    if (cursor) filters.push(Query.cursorAfter(cursor))

    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, filters)
    all.push(...res.documents)

    if (res.documents.length < PAGE_SIZE) break  // last page
    cursor = res.documents[res.documents.length - 1].$id
  }

  return all
}

/**
 * Upsert a document using the cached $id when available.
 * Falls back to a full listDocuments lookup only on cache miss.
 * 1 API call in the normal path (update); 1 API call on first write (create).
 */
async function _upsertDoc(userId, key, serialized) {
  const payload  = { user_id: userId, key, value: serialized }
  const cachedId = _docIdCache.get(key)

  if (cachedId) {
    try {
      await _withTimeout(databases.updateDocument(DATABASE_ID, COLLECTION_ID, cachedId, payload))
      return
    } catch {
      // Stale cache (document deleted remotely) — fall through to create
      _docIdCache.delete(key)
    }
  }

  // No cached id — create a new document and cache its id
  try {
    const doc = await _withTimeout(databases.createDocument(
      DATABASE_ID, COLLECTION_ID, ID.unique(),
      payload, ownerPerms(userId)
    ))
    _docIdCache.set(key, doc.$id)
  } catch (err) {
    console.error('[nexus sync] createDocument failed for key:', key, err)
    throw err
  }
}

// ── SYNC API ──────────────────────────────────────────────────────────

/**
 * On first login, push any locally-stored data that doesn't yet exist
 * in the cloud. Cloud always wins if a document already exists.
 * Paginates through all documents to avoid the 100-doc cap.
 */
export async function ensureCloudDefaults() {
  const userId = await getUserId()
  if (!userId) return

  let existingKeys
  try {
    const docs = await _fetchAllDocs(userId)
    existingKeys = new Set(docs.map(d => d.key))
    docs.forEach(d => _docIdCache.set(d.key, d.$id))
  } catch (err) {
    console.error('[nexus sync] ensureCloudDefaults fetch failed:', err)
    return
  }

  for (const key of _syncKeys) {
    if (existingKeys.has(key)) continue
    const local = localStorage.getItem(key)
    if (local === null) continue
    try {
      const doc = await databases.createDocument(
        DATABASE_ID, COLLECTION_ID, ID.unique(),
        { user_id: userId, key, value: local },
        ownerPerms(userId)
      )
      _docIdCache.set(key, doc.$id)
    } catch (err) {
      console.error('[nexus sync] ensureCloudDefaults upload failed for key:', key, err)
    }
  }
}

/**
 * Download cloud values into localStorage (called on every page load).
 * Paginates through all documents to avoid the 100-doc cap.
 * Uses last-write-wins via Appwrite's $updatedAt vs a local timestamp.
 * If local data is newer (offline edits), pushes local to cloud and shows a toast.
 * Populates _docIdCache so subsequent saves need zero extra lookups.
 */
export async function bootstrapCloudToLocal() {
  const userId = await getUserId()
  if (!userId) return

  let cloudDocs
  try {
    const docs = await _fetchAllDocs(userId)
    cloudDocs = new Map(docs.map(d => [d.key, d]))
    docs.forEach(d => _docIdCache.set(d.key, d.$id))
  } catch (err) {
    console.error('[nexus sync] bootstrapCloudToLocal fetch failed:', err)
    _showToast('Could not reach cloud — showing local data.', 5000, true)
    return
  }

  if (cloudDocs.size === 0) {
    console.warn('[nexus sync] No cloud documents found for user. Is this a new account?')
  }

  let conflictCount = 0

  for (const key of _syncKeys) {
    try {
      const doc = cloudDocs.get(key)
      if (!doc) continue

      const cloudMs  = new Date(doc.$updatedAt).getTime()
      const localMs  = parseInt(localStorage.getItem(`${key}__ts`) ?? '0', 10)
      const hasLocal = localStorage.getItem(key) !== null

      if (hasLocal && localMs > cloudMs) {
        // Local is newer (offline edit) — push to cloud, keep local as-is
        await _upsertDoc(userId, key, localStorage.getItem(key))
        conflictCount++
      } else {
        // Cloud is authoritative — pull to local cache
        localStorage.setItem(key, doc.value)
        localStorage.setItem(`${key}__ts`, cloudMs.toString())
      }
    } catch (err) {
      console.error('[nexus sync] bootstrap failed for key:', key, err)
    }
  }

  if (conflictCount > 0) {
    const label = conflictCount === 1 ? '1 key' : `${conflictCount} keys`
    _showToast(`Sync conflict resolved — your offline changes (${label}) were pushed to cloud.`)
  }
}

/**
 * Persist a single key to cloud and update the local cache.
 * Writes to localStorage immediately (optimistic cache), then syncs to Appwrite.
 * Uses cached userId and docId — typically 1 API call total.
 * @param {string} key   — localStorage key name
 * @param {any}    value — the parsed JS value (object / array)
 */
export async function saveCloudKey(key, value) {
  const serialized = JSON.stringify(value)

  // Optimistic local write with write timestamp
  localStorage.setItem(key, serialized)
  localStorage.setItem(`${key}__ts`, Date.now().toString())

  const userId = await getUserId()
  if (!userId) {
    console.warn('[nexus sync] saveCloudKey skipped — no authenticated user')
    return
  }

  try {
    await _upsertDoc(userId, key, serialized)
  } catch (err) {
    console.error('[nexus sync] saveCloudKey failed for key:', key, err)
    _showToast('Cloud sync failed — data saved locally only.', 5000, true)
  }
}

/**
 * Subscribe to Appwrite Realtime for cross-device updates.
 * On any write event, re-bootstraps local cache and broadcasts to other tabs.
 * Returns the unsubscribe function.
 */
export function setupRealtime() {
  return client.subscribe(
    `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`,
    async payload => {
      const events  = payload.events ?? []
      const isWrite = events.some(e => e.includes('.create') || e.includes('.update') || e.includes('.delete'))
      if (!isWrite) return

      await bootstrapCloudToLocal()
      window._nexusSync?.broadcast('realtime')
    }
  )
}

// ── ONLINE RECOVERY ───────────────────────────────────────────────────
// Trigger a full sync whenever the device reconnects after being offline.

window.addEventListener('online', async () => {
  const userId = await getUserId()
  if (!userId) return
  console.info('[nexus sync] Network restored — re-syncing…')
  try {
    await bootstrapCloudToLocal()
    window._nexusSync?.broadcast('online-sync')
    _showToast('Back online — data synced.', 3000)
  } catch (err) {
    console.error('[nexus sync] Online recovery sync failed:', err)
  }
})
