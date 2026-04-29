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

/** All localStorage keys that are synced to the cloud. */
const SYNC_KEYS = [
  'mastery_data',
  'vanguard-logs',
  'vanguard-cycle-goals',
  'streak_ontrack',
  'streak_timeTracking',
]

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

// ── SYNC API ──────────────────────────────────────────────────────────

/**
 * On first login, push any locally-stored data that doesn't yet exist
 * in the cloud. Cloud always wins if a document already exists.
 */
export async function ensureCloudDefaults() {
  const userId = await getUserId()
  if (!userId) return

  for (const key of SYNC_KEYS) {
    try {
      const existing = await findDoc(userId, key)
      if (!existing) {
        const local = localStorage.getItem(key)
        if (local !== null) {
          await databases.createDocument(
            DATABASE_ID, COLLECTION_ID, ID.unique(),
            { user_id: userId, key, value: local },
            ownerPerms(userId)
          )
        }
      }
    } catch (_) {}
  }
}

/**
 * Download all cloud values into localStorage.
 * Called once at page load after the user is authenticated.
 */
export async function bootstrapCloudToLocal() {
  const userId = await getUserId()
  if (!userId) return

  for (const key of SYNC_KEYS) {
    try {
      const doc = await findDoc(userId, key)
      if (doc) localStorage.setItem(key, doc.value)
    } catch (_) {}
  }
}

/**
 * Persist a single key to Appwrite (upsert).
 * @param {string} key   — localStorage key name
 * @param {any}    value — the parsed JS value (object / array)
 */
export async function saveCloudKey(key, value) {
  const userId = await getUserId()
  if (!userId) return

  const payload  = { user_id: userId, key, value: JSON.stringify(value) }
  const existing = await findDoc(userId, key)

  try {
    if (existing) {
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, existing.$id, payload)
    } else {
      await databases.createDocument(
        DATABASE_ID, COLLECTION_ID, ID.unique(),
        payload, ownerPerms(userId)
      )
    }
  } catch (_) {}
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
  } catch (_) {}
}
