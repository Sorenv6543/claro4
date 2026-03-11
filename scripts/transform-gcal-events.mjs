/**
 * Transform Google Calendar "Individuals 2" events → Booking schema
 * Outputs: individuals2-bookings.json (flat sorted array)
 *          individuals2-by-address.json (grouped by canonical address)
 *
 * All properties are in Palm Springs, CA 92264.
 */

import { readFileSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'

const INPUT         = new URL('../individuals2-march2026.json', import.meta.url)
const OUTPUT_FLAT   = new URL('../individuals2-bookings.json', import.meta.url)
const OUTPUT_GROUPED = new URL('../individuals2-by-address.json', import.meta.url)

const CITY_STATE_ZIP = 'Palm Springs, CA 92264'

// ── Property roster (from owner spreadsheet metadata) ─────────────────────
const PROPERTY_ROSTER = [
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 1,  address: '312 W Via Sol' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 2,  address: '585 S La Mirada' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 3,  address: '994 N Coronet Cir' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 4,  address: '1381 S Calle Marcus' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 5,  address: '1475 E Sunny Dunes' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 6,  address: '2102 N Berne' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 7,  address: '2510 S Sierra Madre' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 8,  address: '2927 E Plaimor Ave' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 9,  address: '49065 Mariposa' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 10, address: '36468 Sandsal Cir' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 11, address: '45745 Camino Del Rey' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 12, address: '1516 E Baristo Rd' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 13, address: '68426 Indigo Ln' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 14, address: '2380 Tamarisk Rd' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 15, address: '76858 Tomahawk Runl' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 16, address: '1052 Audrey' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 17, address: '333 W Stevens Rd' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 18, address: '2392 S Calle Palo Fierro' },
  { owner: 'Cory Perez',              file_uuid: '1RC_KXgQ0AfuZyW-uPoAfs1itQZRcmCrSvu_j8cKJefo', house: 19, address: '1924 S Navajo Dr' },
  { owner: 'Joann Renta',             file_uuid: '1t9i5Zx-6GrengAe_bNQKZcSWaXZbWa7vM8SxvY2SDUw', house: 1,  address: '590 Sycamore' },
  { owner: 'Joann Renta',             file_uuid: '1t9i5Zx-6GrengAe_bNQKZcSWaXZbWa7vM8SxvY2SDUw', house: 2,  address: '2065 Joshua Tree' },
  { owner: 'Kristin Maschka',         file_uuid: '1UPeNco17PqoDYzs9jZH30LlwpRWq06u6OFrfrqarNyc', house: 1,  address: '1006 St Thomas Circle' },
  { owner: 'Kristin Maschka',         file_uuid: '1UPeNco17PqoDYzs9jZH30LlwpRWq06u6OFrfrqarNyc', house: 2,  address: '2020 S Caliente Drive' },
  { owner: 'Michael Chen',            file_uuid: '1hGrHYUqisp_c2JcqjsWKiHBfGCMDhI42s5agJW7jV1k', house: 1,  address: '2282 Shannon Way' },
  { owner: 'Michael Chen',            file_uuid: '1hGrHYUqisp_c2JcqjsWKiHBfGCMDhI42s5agJW7jV1k', house: 2,  address: '550 via Miraleste' },
  { owner: 'Paul Gregory',            file_uuid: '1_YVkMzJV6NTLPdSoL3Es2qYq1VLEmQyNd0W0u20WDiI', house: 1,  address: '2370 N Starr Dr' },
  { owner: 'Paul Gregory',            file_uuid: '1_YVkMzJV6NTLPdSoL3Es2qYq1VLEmQyNd0W0u20WDiI', house: 2,  address: '291 E Mel Ave #271' },
  { owner: 'Matt',                    file_uuid: '1-Yy2LJzBdpgMUszRPaTTzGl46T9S-rK9BBDta3HykHg', house: 1,  address: '155 Hermosa Unit #12' },
  { owner: 'Matt',                    file_uuid: '1-Yy2LJzBdpgMUszRPaTTzGl46T9S-rK9BBDta3HykHg', house: 2,  address: '1901 Nogales' },
  { owner: 'Mark Diffie',             file_uuid: '1GjnoUMcX3QcKr45FUXqDiOt3gO3i6m3xK-hAiV1VUNY', house: 1,  address: '2110 N Starr Dr' },
  { owner: 'Lynn Mcrae',              file_uuid: '189T5jwh9o81uEgCy727C7ruIZhWMA_nC_uOBDAsIQhY', house: 1,  address: '71299 Biskra Road' },
  { owner: 'Jerry & Brian',           file_uuid: '1gBqoIP0bPfn99A8Xqr_ta2uXfw76pLc_dREEVSn2JW0', house: 1,  address: '470 South Calle Encilla B22' },
  { owner: 'Steve Klumb',             file_uuid: '1JSyWTsfCYGWHoHcB6VmFosTSGEerYj7hjZ1Q8_K0Ac0', house: 1,  address: '1525 E Mel' },
  { owner: 'Stacy Raddatz',           file_uuid: '1Hss2hzE3RWFxdHE_F9IyWIKM18rwSTR8NYhhTHnIhRY', house: 1,  address: '755 N Phillips Rd' },
  { owner: 'Melissa Marshall',        file_uuid: '1xpBrnRmmA6F0aH67wg_j633Uwa13KIYIX_ZzmBBEAkA', house: 1,  address: '2660 S Calle Fierro' },
  { owner: 'Sona',                    file_uuid: '1lrq5vjOvEc8PEYgZnicQhWWZISlTa_JejQnwB28JPBE', house: 1,  address: "2290 S Bob O'Link Lane" },
  { owner: 'Mark McDavitt',           file_uuid: '1VmlCmR5E_BMRW4sV_uZTUfz7cbRyUsxa0FY_m04-RLk', house: 1,  address: '558 N Hermosa Dr' },
  { owner: 'Betty Christianson',      file_uuid: '1RAs06bcGh-ZPfRIQsG-6MQOtAdvsl19fLsUeZAtIIIU', house: 1,  address: '2660 Palo Fierro' },
  { owner: 'Desert Luxury Concierge', file_uuid: '1o8_RwSAwEgR5o_XNa-IxmxPJ78A0XHmVPdp3dREQLEg', house: 1,  address: '1011 Sierra Way' },
  { owner: 'Andrew Herman',           file_uuid: '1OywF5CwVofrep-6hn2RmCeDxu8mrAs7LKr36mz4WQyc', house: 1,  address: '520 N Camino Real' },
  { owner: 'Jill Leonard',            file_uuid: '1PhRs44jUhWB7nHKOOhUaPytbX4SeQRcDhetv-pCR260', house: 1,  address: '457 Santiago Way' },
  { owner: 'Kyle Verwers',            file_uuid: '1LusXlblZcnOD-yeOr0HJFTD_HpD61ji7sVGvSCDG6KI', house: 1,  address: '194 W Camino Descanso' },
  { owner: 'Nick Holm',               file_uuid: '1F9Y2pfBxG-P-2PvDTtWB_0tuRnUHZhrxoD7S3y5xRTk', house: 1,  address: '590 Paseo de Anza' },
  { owner: 'Matt K',                  file_uuid: 'mattk',                                          house: 1,  address: '81124 Tranquility' },
  { owner: 'Matt K',                  file_uuid: 'mattk',                                          house: 2,  address: '890 Sunair' },
]

/** Generate owner email: firstname_L@claro.com */
function ownerEmail(name) {
  // Handle special cases
  const specials = {
    'Jerry & Brian':           'jerry_b@claro.com',
    'Desert Luxury Concierge': 'desert_l@claro.com',
  }
  if (specials[name]) return specials[name]

  const parts = name.trim().split(/\s+/)
  const first = parts[0].toLowerCase()
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0].toLowerCase() : ''
  return lastInitial ? `${first}_${lastInitial}@claro.com` : `${first}@claro.com`
}

// Extra address-level overrides for the fingerprint matcher
// handles: encoding junk (Andigo→Indigo), missing numbers (MARIPOSA),
// Road vs Drive, and Sunny Dunes directional
const PROPERTY_FP_OVERRIDES = {
  '68426|andigo':       '68426|indigo',     // Ándigo → Indigo Ln (encoding fix)
  '|mariposa':          '49065|mariposa',   // no house number in calendar
  '2020|caliente road': '2020|caliente',    // "Road" vs "Drive" — same street
  '2020|caliente':      '2020|caliente',
  '1475|sunny dunes':   '1475|sunny dunes', // directional already stripped
}

// Manual overrides: any fingerprint → canonical address to force-merge to
const OVERRIDE_CANONICAL = {
  // spelling variants → one address
  '48719|anastacia': '48719 Anastasia',
  '48719|anastasia': '48719 Anastasia',
  // number typo → pick lower
  '78299|desert mountain': '78229 Desert Mountain',
  '78229|desert mountain': '78229 Desert Mountain',
  // encoding-corrupted "Volara" events (no house number) → merge with the real address
  '|volara':  '41843 Volara',
  '|volara%': '41843 Volara',
  '41843|volara': '41843 Volara',
  '41843|volare': '41843 Volara',
}

// ── Address normalisation ──────────────────────────────────────────────────

// Fix mojibake / percent-encoded chars that appear in the source calendar
const ENCODING_FIXES = [
  [/Ã©|AcE©|VolarAc|VOLARA%/gi, (s) => {
    // Covers "Volaŕe" written variously as VolarÃ©, VolarAc, VOLARA%
    if (/volar/i.test(s)) return 'Volara'
    return s
  }],
  [/Ã[^\s]|A\?n/g, 'A'],   // Ã-sequences → plain A  (e.g. Ándigo → Andigo)
]

function fixEncoding(str) {
  let s = str
  for (const [pat, rep] of ENCODING_FIXES) s = s.replace(pat, rep)
  return s
}

// Street-type suffixes (abbreviated → canonical)
const SUFFIX_MAP = {
  'dr': 'Dr', 'drive': 'Dr',
  'st': 'St', 'street': 'St',
  'rd': 'Rd', 'road': 'Rd',
  'ave': 'Ave', 'avenue': 'Ave',
  'blvd': 'Blvd', 'boulevard': 'Blvd',
  'ln': 'Ln', 'lane': 'Ln',
  'ct': 'Ct', 'court': 'Ct',
  'pl': 'Pl', 'place': 'Pl',
  'way': 'Way',
  'cir': 'Cir', 'circle': 'Cir',
  'trail': 'Trail', 'trl': 'Trail',
}

// Directional prefixes/suffixes
const DIRECTIONALS = new Set(['n', 's', 'e', 'w', 'north', 'south', 'east', 'west'])

/**
 * Return a canonical fingerprint for an address to use as a dedup key.
 * Strategy: extract leading house number, then normalise the street name by
 * removing optional directionals and standardising suffix spelling.
 * This lets "2392 S Calle Palo Fierro" and "2392 Palo Fierro" share a key.
 */
function addressFingerprint(raw) {
  const s = fixEncoding(raw)
    .replace(/[^a-zA-Z0-9\s]/g, ' ')  // strip punctuation
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

  const tokens = s.split(' ')

  // Leading number(s) form the house-number key
  const numTokens = []
  let i = 0
  while (i < tokens.length && /^\d+/.test(tokens[i])) numTokens.push(tokens[i++])
  const houseNum = numTokens.join(' ')

  // Remaining tokens = street name components
  const streetTokens = tokens.slice(i)

  // Strip leading directional (e.g. "s calle palo fierro" → "calle palo fierro")
  if (streetTokens.length > 1 && DIRECTIONALS.has(streetTokens[0])) streetTokens.shift()

  // Strip trailing suffix (e.g. "alda dr" → "alda")
  const last = streetTokens[streetTokens.length - 1]
  if (SUFFIX_MAP[last]) streetTokens.pop()

  // Strip "calle" prefix — a common Palm Springs street word that's sometimes omitted
  if (streetTokens[0] === 'calle') streetTokens.shift()

  return `${houseNum}|${streetTokens.join(' ')}`
}

/**
 * From a set of raw address strings that share a fingerprint, pick the best
 * canonical display form: prefer the longest, most complete version.
 */
function pickCanonical(addresses) {
  return [...addresses].sort((a, b) => b.length - a.length)[0]
}

// ── Other helpers ──────────────────────────────────────────────────────────

function stableId(gcalId) {
  const hash = createHash('md5').update(gcalId).digest('hex')
  return [
    hash.slice(0,8), hash.slice(8,12), hash.slice(12,16),
    hash.slice(16,20), hash.slice(20,32)
  ].join('-')
}

function parseSummary(summary) {
  const raw = fixEncoding((summary || '').trim())

  const notesMatch = raw.match(/\s+-\s+Notes(?:\s+-\s+[A-Za-z]+\s+\d+)?\s*$/)
    || raw.match(/\s+-\s+[A-Za-z]{3}\s+\d{1,2}\s*$/)
  const notes = notesMatch ? notesMatch[0].replace(/^\s+-\s+/, '').trim() : null
  const clean = notesMatch ? raw.slice(0, notesMatch.index).trim() : raw

  const prefixRe = /^(TURN|T\/U(?:\s+Patio)?|OUT|IN)\s+/i
  const prefixMatch = clean.match(prefixRe)

  const prefix  = prefixMatch ? prefixMatch[1].toUpperCase() : null
  const address = prefixMatch ? clean.slice(prefixMatch[0].length).trim() : clean

  let booking_type = 'standard'
  if (prefix === 'TURN' || prefix?.startsWith('T/U')) booking_type = 'turn'

  return { prefix, booking_type, address, notes }
}

// ── Main ───────────────────────────────────────────────────────────────────

const raw = JSON.parse(readFileSync(INPUT, 'utf8').replace(/^\uFEFF/, ''))

// Pass 1: parse all events, attach fingerprint
const bookings = raw.map(event => {
  const { booking_type, address, notes, prefix } = parseSummary(event.summary)
  const date      = event.start?.date || event.start?.dateTime?.slice(0, 10)
  const isCheckin = prefix === 'IN'
  const priority  = booking_type === 'turn' ? 'high' : 'normal'
  const fp        = addressFingerprint(address)

  return {
    id:                  stableId(event.id),
    gcal_event_id:       event.id,
    property_id:         '',
    owner_id:            event.creator?.email ?? '',
    checkin_date:        date,
    checkout_date:       isCheckin ? null : date,
    checkin_time:        isCheckin ? '15:00:00' : '11:00:00',
    checkout_time:       isCheckin ? '15:00:00' : '11:00:00',
    booking_type,
    status:              event.status === 'confirmed' ? 'scheduled' : 'pending',
    priority,
    notes:               notes ?? undefined,
    assigned_cleaner_id: null,
    created_at:          date ? `${date}T00:00:00Z` : null,
    updated_at:          date ? `${date}T00:00:00Z` : null,
    _address:            address,
    _address_key:        fp,
    _gcal_summary:       event.summary,
    _prefix:             prefix,
    _html_link:          event.htmlLink,
  }
})

// Pass 2: build canonical address map  fingerprint → canonical display address
// Apply manual overrides first, then fall back to longest-wins heuristic
const canonicalMap = new Map()
for (const b of bookings) {
  const fp = b._address_key
  if (!canonicalMap.has(fp)) canonicalMap.set(fp, new Set())
  canonicalMap.get(fp).add(b._address)
}
for (const [fp, variants] of canonicalMap) {
  const override = OVERRIDE_CANONICAL[fp]
  canonicalMap.set(fp, override ?? pickCanonical(variants))
}

// Remap fingerprints that should collapse into an override's fingerprint
// e.g. '78299|desert mountain' → same bucket as '78229|desert mountain'
const fpRemap = new Map()
for (const [fp] of canonicalMap) {
  const override = OVERRIDE_CANONICAL[fp]
  if (override) {
    const targetFp = addressFingerprint(override)
    if (targetFp !== fp) fpRemap.set(fp, targetFp)
  }
}
// Ensure the target fingerprint exists in canonicalMap even if no event had that exact string
for (const [srcFp, targetFp] of fpRemap) {
  if (!canonicalMap.has(targetFp)) {
    canonicalMap.set(targetFp, OVERRIDE_CANONICAL[srcFp] ?? canonicalMap.get(srcFp))
  }
}
for (const b of bookings) {
  if (fpRemap.has(b._address_key)) b._address_key = fpRemap.get(b._address_key)
}

// Pass 3: apply canonical address + full address string
for (const b of bookings) {
  b._canonical_address = canonicalMap.get(b._address_key)
  b._full_address = `${b._canonical_address}, ${CITY_STATE_ZIP}`
}

// Sort: date asc, then canonical address asc
bookings.sort((a, b) => {
  const dateCmp = (a.checkout_date ?? a.checkin_date).localeCompare(b.checkout_date ?? b.checkin_date)
  if (dateCmp !== 0) return dateCmp
  return b._address_key.localeCompare(a._address_key)
})

// Group by fingerprint (deduplicated)
const byAddress = {}
for (const b of bookings) {
  const fp = b._address_key
  if (!byAddress[fp]) {
    byAddress[fp] = {
      canonical_address: b._canonical_address,
      full_address:      b._full_address,
      _variants:         [...canonicalMap.get(fp) !== b._canonical_address
                           ? [b._canonical_address]
                           : []],
      bookings: [],
    }
    // Collect all raw variants seen for this fingerprint
    const seen = new Set()
    for (const x of bookings) {
      if (x._address_key === fp) seen.add(x._address)
    }
    byAddress[fp]._variants = [...seen].filter(v => v !== b._canonical_address)
  }
  byAddress[fp].bookings.push(b)
}

const sortedByAddress = Object.fromEntries(
  Object.entries(byAddress).sort(([, a], [, b]) =>
    a.canonical_address.localeCompare(b.canonical_address)
  )
)

// ── Pass 4: match calendar events to property roster ──────────────────────

// Build fingerprint → property entry lookup from the roster
const rosterMap = new Map()
for (const prop of PROPERTY_ROSTER) {
  let fp = addressFingerprint(prop.address)
  // Apply property-level fp overrides
  fp = PROPERTY_FP_OVERRIDES[fp] ?? fp
  if (!rosterMap.has(fp)) rosterMap.set(fp, prop)
}

// Match each booking
let matchCount = 0
const unmatchedAddresses = new Set()
for (const b of bookings) {
  let calFp = b._address_key
  calFp = PROPERTY_FP_OVERRIDES[calFp] ?? calFp

  const prop = rosterMap.get(calFp)
  if (prop) {
    b.owner_id          = ownerEmail(prop.owner)
    b.property_id       = `${prop.file_uuid}#${prop.house}`
    b._owner_name       = prop.owner
    b._owner_email      = ownerEmail(prop.owner)
    b._house_number     = prop.house
    b._property_address = prop.address
    matchCount++
  } else {
    b._unmatched = true
    unmatchedAddresses.add(b._canonical_address)
  }
}

// Also attach match info to the grouped output
for (const group of Object.values(sortedByAddress)) {
  const first = group.bookings.find(b => !b._unmatched)
  if (first) {
    group.owner_name       = first._owner_name
    group.owner_email      = first._owner_email
    group.owner_id         = first.owner_id
    group.house_number     = first._house_number
    group.property_address = first._property_address
    group.matched          = true
  } else {
    group.matched = false
  }
}

writeFileSync(OUTPUT_FLAT,    JSON.stringify(bookings,        null, 2))
writeFileSync(OUTPUT_GROUPED, JSON.stringify(sortedByAddress, null, 2))

const groupCount = Object.keys(sortedByAddress).length
const mergedCount = 56 - groupCount

console.log(`✓ ${bookings.length} events transformed`)
console.log(`✓ ${groupCount} unique addresses  (${mergedCount} duplicates merged)`)
console.log(`✓ ${matchCount}/${bookings.length} events matched to owner  (${bookings.length - matchCount} unmatched)`)
console.log(`  → individuals2-bookings.json`)
console.log(`  → individuals2-by-address.json`)
console.log()

for (const { canonical_address, _variants, bookings: bks, owner_name, matched } of Object.values(sortedByAddress)) {
  const dates   = bks.map(b => (b.checkout_date ?? b.checkin_date).slice(5)).join(', ')
  const types   = [...new Set(bks.map(b => b.booking_type))].join('/')
  const varStr  = _variants?.length ? `  ← ${_variants.join(' | ')}` : ''
  const ownerStr = matched ? `  → ${owner_name}` : '  ⚠ NO MATCH'
  console.log(`  ${canonical_address.padEnd(38)} ${String(bks.length).padStart(2)}  [${types}]${ownerStr}${varStr}`)
}
