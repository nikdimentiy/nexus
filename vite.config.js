import { defineConfig } from 'vite'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const buildDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    // Inject the build date into sw.js so the cache name auto-bumps on deploy
    rollupOptions: {
      input: {
        main:     'index.html',
        vanguard: 'vanguard.html',
        mastery:  'mastery.html',
        offline:  'offline.html',
      },
    },
  },
  define: {
    __BUILD_DATE__: JSON.stringify(buildDate),
    __VERSION__:    JSON.stringify(pkg.version),
  },
})
