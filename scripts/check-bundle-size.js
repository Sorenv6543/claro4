import { gzipSync } from 'node:zlib'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const MAX_GZIP_KB = 500

export function checkOwnerBundleSize(assetsDir, maxKB = MAX_GZIP_KB) {
  const files = fs.readdirSync(assetsDir)
    .filter(f => f.includes('owner-app') && f.endsWith('.js'))

  if (files.length === 0) {
    throw new Error(`No owner-app chunks found in ${assetsDir}. Run pnpm build:owner-only first.`)
  }

  let totalGzipBytes = 0
  for (const file of files) {
    const content = fs.readFileSync(path.join(assetsDir, file))
    totalGzipBytes += gzipSync(content).length
  }

  const totalKB = totalGzipBytes / 1024
  return { totalKB, passed: totalKB <= maxKB, maxKB }
}

// Only execute CLI logic when run directly (not imported by tests)
const isMain =
  process.argv[1] != null &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isMain) {
  const assetsDir = path.resolve('dist/assets')
  try {
    const { totalKB, passed, maxKB } = checkOwnerBundleSize(assetsDir)
    if (!passed) {
      console.error(`❌ owner-app bundle too large: ${totalKB.toFixed(1)} KB gzipped (limit: ${maxKB} KB)`)
      process.exit(1)
    }
    console.log(`✅ owner-app bundle: ${totalKB.toFixed(1)} KB / ${maxKB} KB`)
  } catch (err) {
    console.error(`❌ ${err.message}`)
    process.exit(1)
  }
}
