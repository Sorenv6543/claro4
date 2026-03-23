#!/usr/bin/env node

/**
 * Format PWA Manifest Script
 *
 * This script formats the generated manifest.webmanifest file to be properly
 * formatted JSON instead of minified, which fixes browser syntax errors.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

async function formatManifest () {
  try {
    const manifestPath = path.resolve('dist/manifest.webmanifest')

    // Read the current manifest
    const manifestContent = await fs.readFile(manifestPath, 'utf8')

    // Parse and re-stringify with proper formatting
    const manifest = JSON.parse(manifestContent)
    const formattedManifest = JSON.stringify(manifest, null, 2)

    // Write back the formatted manifest
    await fs.writeFile(manifestPath, formattedManifest, 'utf8')

    console.log('✅ PWA manifest formatted successfully')
    console.log(`📁 Manifest location: ${manifestPath}`)
  } catch (error) {
    console.error('❌ Error formatting manifest:', error.message)
    process.exit(1)
  }
}

// Run the formatting
formatManifest()
