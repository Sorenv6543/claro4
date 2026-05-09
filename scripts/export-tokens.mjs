/**
 * export-tokens.mjs
 *
 * Reads src/styles/tokens.css and exports Tokens Studio–compatible JSON
 * files to tokens/ (one file per collection).
 *
 * Only tokens listed in figma-token-map.mjs are exported. Tokens that cannot
 * round-trip through Figma (rgba, var(), gradients, shadows, font stacks,
 * layout dimensions) are explicitly excluded in the map.
 *
 * Output format: Tokens Studio JSON — { value, type } per leaf.
 *   tokens/Primitives.json, tokens/Domain.json
 *
 * Usage: node scripts/export-tokens.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { TOKEN_MAP } from './figma-token-map.mjs'

const TOKENS_CSS = path.resolve('src/styles/tokens.css')
const EXPORT_DIR = path.resolve('tokens')

// Map our internal types to Tokens Studio type strings
const TS_TYPE = {
  color: 'color',
  number: 'sizing',
  string: 'other',
}

function parseCssVars (css) {
  const vars = new Map()
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
    if (v && 'value' in v) {
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
    value,
    type: TS_TYPE[type],
  })
}

if (errors > 0) {
  console.error(`\n${errors} error(s). Fix tokens.css before exporting.`)
  process.exit(1)
}

fs.mkdirSync(EXPORT_DIR, { recursive: true })

for (const [name, tokens] of Object.entries(collections)) {
  const filename = `${name}.json`
  fs.writeFileSync(path.join(EXPORT_DIR, filename), JSON.stringify(tokens, null, 2))
  console.log(`✅  tokens/${filename}  (${countLeaves(tokens)} tokens)`)
}
