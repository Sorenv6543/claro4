/**
 * 5 user-selectable property colors (Claude Design v1 / Materio palette).
 * Used for property cards, sidebar icons, and calendar events.
 * Deliberately avoids Vuetify surface/on-surface theme variables.
 *
 * Index parity with --claro-prop-1..5 in tokens.css must be preserved.
 */
export const PROPERTY_COLORS = [
  '#7367F0', // violet (brand)
  '#28C76F', // green
  '#9155FD', // purple (distinct from brand violet)
  '#FF9F43', // orange
  '#EA5455', // red
] as const

/**
 * Pre-Claude-Design-v1 hex values that may still be stored on existing property
 * rows in the database. Kept as a typed const so legacy fallback literals scattered
 * across the codebase continue to type-check during the migration window.
 *
 * Safe to delete this const, the LegacyPropertyColor type, the LEGACY_TO_CURRENT
 * derivation, and the mapLegacyPropertyColor helper once: (a) a Supabase migration
 * normalizes existing property.color rows to PROPERTY_COLORS values, AND
 * (b) `grep` for these hex values across `src/` returns no hits.
 */
export const LEGACY_PROPERTY_COLORS = [
  '#5c6bc0', // indigo  → #7367F0
  '#43a047', // green   → #28C76F
  '#8e24aa', // purple  → #9155FD
  '#f57c00', // orange  → #FF9F43
  '#e53935', // red     → #EA5455
] as const

/** A property color from the current Claude Design v1 / Materio palette. */
export type CurrentPropertyColor = typeof PROPERTY_COLORS[number]

/** A property color from the pre-Claude-Design-v1 Material palette. */
export type LegacyPropertyColor = typeof LEGACY_PROPERTY_COLORS[number]

/**
 * Property color tolerant of both palettes — used for inputs that may flow
 * from DB rows still holding legacy hex. New code that produces colors should
 * prefer CurrentPropertyColor.
 */
export type PropertyColor = CurrentPropertyColor | LegacyPropertyColor

/**
 * 6 colors cycled deterministically (by hash of owner ID) for property
 * owner / operator avatars. Distinct from PROPERTY_COLORS — these are
 * not user-selectable and are not persisted to the DB; they're computed
 * at render time from a stable hash, so changing this array changes
 * what avatars render but does not require a data migration.
 *
 * Values preserved from the pre-Claude-Design-v1 Material palette since
 * no Materio-equivalent teal exists in PROPERTY_COLORS. Migration is a
 * separate design decision.
 */
export const OWNER_COLORS = [
  '#5c6bc0', // indigo
  '#43a047', // green
  '#8e24aa', // purple
  '#f57c00', // orange
  '#00897b', // teal
  '#e53935', // red
] as const

/** A color from the OWNER_COLORS avatar-cycle palette. */
export type OwnerColor = typeof OWNER_COLORS[number]

/**
 * Derived from the parallel LEGACY_PROPERTY_COLORS / PROPERTY_COLORS arrays
 * at module load. Single source of truth — index parity in the source arrays
 * is now structurally enforced.
 */
const LEGACY_TO_CURRENT: Record<string, CurrentPropertyColor> = Object.fromEntries(
  LEGACY_PROPERTY_COLORS.map((legacy, i) => [legacy.toLowerCase(), PROPERTY_COLORS[i]]),
)

/**
 * Translates a stored property color to its Claude Design v1 equivalent at
 * render time. The DB is never migrated; this helper is the read-side bridge.
 *
 * Lookup order:
 * 1. Legacy hex map (case-insensitive on input) → returns the canonical
 *    Materio replacement.
 * 2. Case-insensitive match against PROPERTY_COLORS → returns the canonical
 *    uppercase form (so `#7367f0` becomes `#7367F0` and matches the picker's
 *    strict equality).
 * 3. Unknown values pass through unchanged.
 *
 * The optional `fallback` is returned when `hex` is null/undefined. Default
 * is PROPERTY_COLORS[0] (brand violet). Pass a different value when the
 * caller needs a neutral "no color set" indicator (e.g. '#9E9E9E' gray).
 */
export function mapLegacyPropertyColor (hex: PropertyColor): CurrentPropertyColor
export function mapLegacyPropertyColor (hex: string | null | undefined, fallback: string): string
export function mapLegacyPropertyColor (hex: string | null | undefined, fallback?: string): CurrentPropertyColor | string
export function mapLegacyPropertyColor (hex: string | null | undefined, fallback?: string): CurrentPropertyColor | string {
  if (!hex) {
    return fallback ?? PROPERTY_COLORS[0]
  }
  const lower = hex.toLowerCase()
  return LEGACY_TO_CURRENT[lower]
    ?? PROPERTY_COLORS.find(c => c.toLowerCase() === lower)
    ?? hex
}

/**
 * Maps a booking status string to a Vuetify semantic color.
 */
export function getBookingStatusColor (status: string): string {
  switch (status) {
    case 'completed': { return 'success'
    }
    case 'in_progress': { return 'info'
    }
    case 'scheduled': { return 'primary'
    }
    case 'cancelled': { return 'error'
    }
    default: { return 'grey'
    }
  }
}

/**
 * Maps a property type to an MDI icon name.
 * Provides variety for 'house' types by using a deterministic hash of the ID.
 */
export function getPropertyIcon (type?: string, id?: string): string {
  const typeLower = type?.toLowerCase() || 'house'

  if (typeLower === 'house') {
    const houseVariants = [
      'mdi-home',
      'mdi-home-variant',
      'mdi-home-modern',
      'mdi-home-city',
      'mdi-home-outline',
      'mdi-home-variant-outline',
    ]
    if (id) {
      let hash = 0
      for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash)
      }
      return houseVariants[Math.abs(hash) % houseVariants.length]
    }
    return 'mdi-home'
  }

  switch (typeLower) {
    case 'apartment': return 'mdi-office-building'
    case 'condo':     return 'mdi-domain'
    case 'townhouse': return 'mdi-home-group'
    default:          return 'mdi-home'
  }
}


/**
 * Formats a snake_case status string for display (e.g. "in_progress" → "in progress").
 */
export function formatStatus (status: string): string {
  return status.replace(/_/g, ' ')
}
