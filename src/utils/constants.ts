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
 * Phase 6 sweeps consumers to route reads through mapLegacyPropertyColor().
 */
export const LEGACY_PROPERTY_COLORS = [
  '#5c6bc0', // indigo  → #7367F0
  '#43a047', // green   → #28C76F
  '#8e24aa', // purple  → #9155FD
  '#f57c00', // orange  → #FF9F43
  '#e53935', // red     → #EA5455
] as const

export type PropertyColor =
  | typeof PROPERTY_COLORS[number]
  | typeof LEGACY_PROPERTY_COLORS[number]

const LEGACY_TO_CURRENT: Record<string, string> = {
  '#5c6bc0': '#7367F0',
  '#43a047': '#28C76F',
  '#8e24aa': '#9155FD',
  '#f57c00': '#FF9F43',
  '#e53935': '#EA5455',
}

/**
 * Translates a stored property color to its Claude Design v1 equivalent at
 * render time. Unknown hex values pass through unchanged. The DB is never
 * migrated; this helper is the read-side bridge.
 */
export function mapLegacyPropertyColor (hex: string | null | undefined): string {
  if (!hex) return PROPERTY_COLORS[0]
  return LEGACY_TO_CURRENT[hex.toLowerCase()] ?? hex
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
    default: { return 'warning'
    }
  }
}

/**
 * Formats a snake_case status string for display (e.g. "in_progress" → "in progress").
 */
export function formatStatus (status: string): string {
  return status.replace(/_/g, ' ')
}
