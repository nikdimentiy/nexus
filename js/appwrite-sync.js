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
  try { await account.deleteSession('current') } catch (_) {}
}

export async function getCurrentUser() {
  try { return await account.get() } catch (_) { return null }
}

// ── INTERNALS ─────────────────────────────────────────────────────────

async function getUserId() {
  const user = await getCurrentUser()
  return user?.$id ?? null
}

/** Find a document for a given user + key pair (returns null if missing). */
async function findDoc(userId, key) {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('user_id', userId),
      Query.equal('key', key),
      Query.limit(1),
    ])
    return res.documents[0] ?? null
  } catch { return null }
}

/** Permissions for a document owned by userId. */
function ownerPerms(userId) {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]
}

/** Upsert a serialized value to cloud without touching local timestamps. */
async function _upsertDoc(userId, key, serialized) {
  const existing = await findDoc(userId, key)
  const payload  = { user_id: userId, key, value: serialized }
  if (existing) {
    await databases.updateDocument(DATABASE_ID, COLLECTION_ID, existing.$id, payload)
  } else {
    await databases.createDocument(
      DATABASE_ID, COLLECTION_ID, ID.unique(),
      payload, ownerPerms(userId)
    )
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
  } catch { return }

  for (const key of _syncKeys) {
    if (existingKeys.has(key)) continue
    const local = localStorage.getItem(key)
    if (local === null) continue
    try {
      await databases.createDocument(
        DATABASE_ID, COLLECTION_ID, ID.unique(),
        { user_id: userId, key, value: local },
        ownerPerms(userId)
      )
    } catch (_) {}
  }
}

/**
 * Download cloud values into localStorage (called on every page load).
 * Uses one batch query instead of one query per key.
 * Uses last-write-wins via Appwrite's $updatedAt vs a local timestamp.
 * If local data is newer (offline edits), pushes local to cloud instead.
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
  } catch { return }

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
    } catch (_) {}
  }
}

/**
 * Persist a single key to cloud and update the local cache.
 * Writes to localStorage immediately (optimistic cache), then syncs to Appwrite.
 * @param {string} key   — localStorage key name
 * @param {any}    value — the parsed JS value (object / array)
 */
export async function saveCloudKey(key, value) {
  const serialized = JSON.stringify(value)

  // Optimistic local write with write timestamp
  localStorage.setItem(key, serialized)
  localStorage.setItem(`${key}__ts`, Date.now().toString())

  const userId = await getUserId()
  if (!userId) return

  try {
    await _upsertDoc(userId, key, serialized)
  } catch (_) {}
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

/**
 * Remove a key from Appwrite (used by the data-vault wipe).
 * @param {string} key
 */
export async function deleteCloudKey(key) {
  const userId = await getUserId()
  if (!userId) return

  const existing = await findDoc(userId, key)
  if (!existing) return

  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, existing.$id)
    localStorage.removeItem(`${key}__ts`)
  } catch (_) {}
}
