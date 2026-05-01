import { defineConfig } from 'vite'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const buildDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')

function swBuildDatePlugin(date) {
  return {
    name: 'sw-build-date',
    writeBundle(outputOptions, bundle) {
      const outDir = outputOptions.dir ?? 'dist'

      // Collect every output asset (no source maps) and add the bare root entry.
      const assets = [
        './',
        ...Object.keys(bundle)
          .filter(name => !name.endsWith('.map'))
          .map(name => `./${name}`),
      ]

      const src = readFileSync('./sw.js', 'utf-8')
      const out = src
        .replace("'__BUILD_DATE__'", `'${date}'`)
        .replace("'__PRECACHE_ASSETS__'", JSON.stringify(assets))
      writeFileSync(resolve(outDir, 'sw.js'), out)
    },
  }
}

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main:    'index.html',
        offline: 'offline.html',
      },
    },
  },
  define: {
    __BUILD_DATE__: JSON.stringify(buildDate),
    __VERSION__:    JSON.stringify(pkg.version),
  },
  plugins: [swBuildDatePlugin(buildDate)],
})
