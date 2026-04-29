/**
 * Appwrite cloud sync — replaces supabase-sync.js
 *
 * SETUP (one-time, in Appwrite console):
 *  1. Create a project → paste its ID into PROJECT_ID
 *  2. Create a database → paste its ID into DATABASE_ID
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

// ── CONFIGURATION ───────────────────────────────────────────────────
const ENDPOINT      = 'https://sfo.cloud.appwrite.io/v1'
const PROJECT_ID    = '69f16dab00258a313360'
const DATABASE_ID   = '69f1709d0024647f5655'
const COLLECTION_ID = 'user_data'
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
 * Upsert a document using the cached $id when available.
 * Falls back to a full listDocuments lookup only on cache miss.
 * 1 API call in the normal path (update); 1 API call on first write (create).
 */
async function _upsertDoc(userId, key, serialized) {
  const payload  = { user_id: userId, key, value: serialized }
  const cachedId = _docIdCache.get(key)

  if (cachedId) {
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, cachedId, payload)
      return
    } catch {
      // Stale cache (document deleted remotely) — fall through to create
      _docIdCache.delete(key)
    }
  }

  // No cached id — create a new document and cache its id
  try {
    const doc = await databases.createDocument(
      DATABASE_ID, COLLECTION_ID, ID.unique(),
      payload, ownerPerms(userId)
    )
    _docIdCache.set(key, doc.$id)
  } catch (err) {
    console.error('[nexus sync] createDocument failed for key:', key, err)
  }
}

// ── SYNC API ──────────────────────────────────────────────────────────

/**
 * On first login, push any locally-stored data that doesn't yet exist
 * in the cloud. Cloud always wins if a document already exists.
 * Uses one batch query instead of one query per key.
 */
export async function ensureCloudDefaults() {
  const userId = await getUserId()
  if (!userId) return

  let existingKeys
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('user_id', userId),
      Query.limit(100),
    ])
    existingKeys = new Set(res.documents.map(d => d.key))
    // Seed cache from whatever Appwrite returned
    res.documents.forEach(d => _docIdCache.set(d.key, d.$id))
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
 * Uses one batch query instead of one query per key.
 * Uses last-write-wins via Appwrite's $updatedAt vs a local timestamp.
 * If local data is newer (offline edits), pushes local to cloud instead.
 * Populates _docIdCache so subsequent saves need zero extra lookups.
 */
export async function bootstrapCloudToLocal() {
  const userId = await getUserId()
  if (!userId) return

  let cloudDocs
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('user_id', userId),
      Query.limit(100),
    ])
    cloudDocs = new Map(res.documents.map(d => [d.key, d]))
    // Populate doc-id cache so saveCloudKey skips findDoc lookups
    res.documents.forEach(d => _docIdCache.set(d.key, d.$id))
  } catch (err) {
    console.error('[nexus sync] bootstrapCloudToLocal fetch failed:', err)
    return
  }

  if (cloudDocs.size === 0) {
    console.warn('[nexus sync] No cloud documents found for user. Is this a new account?')
  }

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
      } else {
        // Cloud is authoritative — pull to local cache
        localStorage.setItem(key, doc.value)
        localStorage.setItem(`${key}__ts`, cloudMs.toString())
      }
    } catch (err) {
      console.error('[nexus sync] bootstrap failed for key:', key, err)
    }
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
