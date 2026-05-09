/**
 * export-tokens.mjs
 *
 * Reads src/styles/tokens.css and exports a Figma Variables–compatible JSON
 * file per collection to figma-export/.
 *
 * Only tokens listed in figma-token-map.mjs are exported. Tokens that cannot
 * be represented in Figma Variables (rgba, var(), gradients, shadows, font
 * stacks, layout dimensions) are explicitly excluded in the map.
 *
 * Output format: W3C Design Tokens with com.figma extensions, one file per
 * collection named "{Collection}.Light.json" (dot separator).
 *
 * Usage: node scripts/export-tokens.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { TOKEN_MAP } from './figma-token-map.mjs'

const TOKENS_CSS = path.resolve('src/styles/tokens.css')
const EXPORT_DIR = path.resolve('figma-export')

const FIGMA_EXT = {
  'com.figma': {
    hiddenFromPublishing: false,
    scopes: ['ALL_SCOPES'],
    codeSyntax: {},
  },
}

function parseCssVars (css) {
  const vars = new Map()
  // Match single-line property declarations only.
  // Handles trailing comments and any amount of whitespace before the semicolon.
  const re = /(--claro-[\w-]+):\s+([^;\n]+);/g
  let m
  while ((m = re.exec(css)) !== null) {
    vars.set(m[1], m[2].trim())
  }
  return vars
}

function convertValue (raw, type, stripUnit) {
  if (type === 'color') {
    if (!/^#[A-Fa-f0-9]{6,8}$/.test(raw)) {
      throw new Error(`expected hex color, got: "${raw}"`)
    }
    return raw.toUpperCase()
  }
  if (type === 'number') {
    const cleaned = stripUnit ? raw.replace(stripUnit, '') : raw
    const n = Number.parseFloat(cleaned)
    if (Number.isNaN(n)) {
      throw new TypeError(`cannot parse number from: "${raw}"`)
    }
    return n
  }
  if (type === 'string') {
    return raw
  }
  throw new Error(`unknown type: ${type}`)
}

function setNested (obj, pathArr, value) {
  let cur = obj
  for (let i = 0; i < pathArr.length - 1; i++) {
    if (!(pathArr[i] in cur)) {
      cur[pathArr[i]] = {}
    }
    cur = cur[pathArr[i]]
  }
  cur[pathArr.at(-1)] = value
}

function countLeaves (obj) {
  let n = 0
  for (const v of Object.values(obj)) {
    if (v && '$value' in v) {
      n++
    } else if (v && typeof v === 'object') {
      n += countLeaves(v)
    }
  }
  return n
}

const css = fs.readFileSync(TOKENS_CSS, 'utf8')
const vars = parseCssVars(css)

const collections = {}
let errors = 0

for (const { css: cssVar, collection, path: tokenPath, type, stripUnit } of TOKEN_MAP) {
  if (!vars.has(cssVar)) {
    console.error(`❌  ${cssVar} — not found in tokens.css`)
    errors++
    continue
  }
  let value
  try {
    value = convertValue(vars.get(cssVar), type, stripUnit)
  } catch (error) {
    console.error(`❌  ${cssVar} — ${error.message}`)
    errors++
    continue
  }
  if (!collections[collection]) {
    collections[collection] = {}
  }
  setNested(collections[collection], tokenPath, {
    $type: type,
    $value: value,
    $description: '',
    $extensions: FIGMA_EXT,
  })
}

if (errors > 0) {
  console.error(`\n${errors} error(s). Fix before pushing to Figma.`)
  process.exit(1)
}

fs.mkdirSync(EXPORT_DIR, { recursive: true })

for (const [name, tokens] of Object.entries(collections)) {
  const filename = `${name}.Light.json`
  fs.writeFileSync(path.join(EXPORT_DIR, filename), JSON.stringify(tokens, null, 2))
  console.log(`✅  figma-export/${filename}  (${countLeaves(tokens)} tokens)`)
}
