import { getCurrentUser, bootstrapCloudToLocal, setupRealtime } from './appwrite-sync.js'

// Body is hidden via inline style in HTML — reveal only after auth passes.
try {
  const user = await getCurrentUser()
  if (!user) {
    location.replace('index.html')
  } else {
    await bootstrapCloudToLocal()
    setupRealtime()
    document.body.style.visibility = ''
  }
} catch {
  location.replace('index.html')
}
