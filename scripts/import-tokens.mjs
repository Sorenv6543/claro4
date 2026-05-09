/**
 * import-tokens.mjs
 *
 * Applies token changes pulled from Figma Variables back into the codebase.
 * Surgically patches src/styles/tokens.css and src/plugins/vuetify.ts — never
 * rewrites either file; only the matching value portion of each line is replaced.
 *
 * Usage: node scripts/import-tokens.mjs <pulled-tokens-dir>
 *   <pulled-tokens-dir>  Directory containing "{Collection} — Light.json" files
 *                        produced by the Figma Variables action's sync-figma-to-tokens script.
 *                        Typically .figma-action/tokens_new after cloning the action repo.
 */

import fs from 'node:fs'
import path from 'node:path'
import { TOKEN_MAP, VUETIFY_COLOR_MAP } from './figma-token-map.mjs'

const TOKENS_CSS = path.resolve('src/styles/tokens.css')
const VUETIFY_TS = path.resolve('src/plugins/vuetify.ts')

const pullDir = process.argv[2]
if (!pullDir) {
  console.error('Usage: node scripts/import-tokens.mjs <pulled-tokens-dir>')
  process.exit(1)
}
if (!fs.existsSync(pullDir)) {
  console.error(`Directory not found: ${pullDir}`)
  process.exit(1)
}

// Build reverse lookup: "Collection:a.b.c" → token map entry
const REVERSE = new Map()
for (const entry of TOKEN_MAP) {
  REVERSE.set(`${entry.collection}:${entry.path.join('.')}`, entry)
}

// Walk a nested token object and collect leaf values
function collectLeaves (obj, pathArr, collection, out) {
  for (const [key, val] of Object.entries(obj)) {
    const next = [...pathArr, key]
    if (val && '$value' in val) {
      const lookupKey = `${collection}:${next.join('.')}`
      const entry = REVERSE.get(lookupKey)
      if (entry) {
        out.push({ entry, newValue: val.$value })
      }
    } else if (val && typeof val === 'object') {
      collectLeaves(val, next, collection, out)
    }
  }
}

// Parse all pulled JSON files
const FILENAME_RE = /^(.+) — Light\.json$/
const updates = []

for (const file of fs.readdirSync(pullDir)) {
  const m = FILENAME_RE.exec(file)
  if (!m) {
    continue
  }
  const collection = m[1]
  const tokens = JSON.parse(fs.readFileSync(path.join(pullDir, file), 'utf8'))
  collectLeaves(tokens, [], collection, updates)
}

if (updates.length === 0) {
  console.log('No syncable token changes found.')
  process.exit(0)
}

// ── Patch tokens.css ────────────────────────────────────────────────────────
let cssContent = fs.readFileSync(TOKENS_CSS, 'utf8')
let cssChanges = 0
const changed = []

for (const { entry, newValue } of updates) {
  const formatted = formatForCss(newValue, entry.type, entry.stripUnit)
  // Match the property declaration; replace only the value portion.
  // Handles any amount of whitespace between the colon and the value.
  const escapedVar = entry.css.replace(/[-]/g, String.raw`\-`)
  const re = new RegExp('(' + escapedVar + String.raw`:\s+)` + String.raw`[^;/\n]+?` + String.raw`(;|\s*\/\*)`)
  const next = cssContent.replace(re, `$1${formatted}$2`)
  if (next !== cssContent) {
    cssContent = next
    cssChanges++
    changed.push(entry.css)
    console.log(`  tokens.css   ${entry.css}: ${newValue}`)
  }
}

if (cssChanges > 0) {
  fs.writeFileSync(TOKENS_CSS, cssContent)
  console.log(`✅  Updated ${cssChanges} token(s) in tokens.css`)
}

// ── Patch vuetify.ts (color tokens only) ────────────────────────────────────
let vuetifyContent = fs.readFileSync(VUETIFY_TS, 'utf8')
let vuetifyChanges = 0

for (const { entry, newValue } of updates) {
  if (entry.type !== 'color') {
    continue
  }
  const vuetifyKeys = VUETIFY_COLOR_MAP[entry.css]
  if (!vuetifyKeys) {
    continue
  }

  const hex = String(newValue).toUpperCase()
  for (const key of vuetifyKeys) {
    // Match: 'key': '#XXXXXX', (single or double quotes, any case hex)
    const re = new RegExp('([\'"]' + escapeRegex(key) + String.raw`['"]:\s*)['"]#[A-Fa-f0-9]{6,8}['"]`)
    const next = vuetifyContent.replace(re, `$1'${hex}'`)
    if (next !== vuetifyContent) {
      vuetifyContent = next
      vuetifyChanges++
      console.log(`  vuetify.ts   '${key}': ${hex}`)
    }
  }
}

if (vuetifyChanges > 0) {
  fs.writeFileSync(VUETIFY_TS, vuetifyContent)
  console.log(`✅  Updated ${vuetifyChanges} color(s) in vuetify.ts`)
}

if (cssChanges === 0 && vuetifyChanges === 0) {
  console.log('No changes — tokens.css and vuetify.ts already match Figma.')
}

function formatForCss (value, type, stripUnit) {
  if (type === 'color') {
    return String(value).toUpperCase()
  }
  if (type === 'number') {
    const unit = stripUnit ?? ''
    return `${value}${unit}`
  }
  return String(value)
}

function escapeRegex (str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
}
