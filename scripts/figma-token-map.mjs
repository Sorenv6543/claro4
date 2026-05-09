/**
 * figma-token-map.mjs
 *
 * Single source of truth for the CSS ↔ Figma Variables naming relationship.
 * Only tokens that Figma Variables can represent (color, number, string) are listed.
 * Excluded intentionally: rgba() values, var() references, gradients, shadows,
 * font stacks, layout dimensions — these cannot round-trip through Figma.
 *
 * Each entry: { css, collection, path, type, stripUnit? }
 *   css        — the CSS custom property name in tokens.css
 *   collection — Figma collection name (becomes the filename prefix)
 *   path       — nested path inside the JSON object (array of keys)
 *   type       — Figma type: 'color' | 'number' | 'string'
 *   stripUnit  — unit suffix to remove before converting to number (e.g. 'px')
 */

export const TOKEN_MAP = [
  // ─── PRIMITIVES collection ──────────────────────────────────────────────
  // Primary palette
  { css: '--claro-primary',        collection: 'Primitives', path: ['color', 'primary', 'default'],  type: 'color' },
  { css: '--claro-primary-light',  collection: 'Primitives', path: ['color', 'primary', 'light'],    type: 'color' },
  { css: '--claro-primary-dark',   collection: 'Primitives', path: ['color', 'primary', 'dark'],     type: 'color' },
  { css: '--claro-primary-tint',   collection: 'Primitives', path: ['color', 'primary', 'tint'],     type: 'color' },
  { css: '--claro-secondary',      collection: 'Primitives', path: ['color', 'secondary'],           type: 'color' },
  { css: '--claro-on-primary',     collection: 'Primitives', path: ['color', 'on-primary'],          type: 'color' },

  // Surfaces
  { css: '--claro-background',     collection: 'Primitives', path: ['color', 'background'],          type: 'color' },
  { css: '--claro-surface',        collection: 'Primitives', path: ['color', 'surface'],             type: 'color' },
  { css: '--claro-surface-variant',collection: 'Primitives', path: ['color', 'surface-variant'],     type: 'color' },
  { css: '--claro-card-bg',        collection: 'Primitives', path: ['color', 'card-bg'],             type: 'color' },

  // Status
  { css: '--claro-success',        collection: 'Primitives', path: ['color', 'success'],             type: 'color' },
  { css: '--claro-warning',        collection: 'Primitives', path: ['color', 'warning'],             type: 'color' },
  { css: '--claro-error',          collection: 'Primitives', path: ['color', 'error'],               type: 'color' },
  { css: '--claro-info',           collection: 'Primitives', path: ['color', 'info'],                type: 'color' },

  // Text (fg2–fg4 are rgba and cannot sync; fg1 is pure hex)
  { css: '--claro-fg1',            collection: 'Primitives', path: ['color', 'fg1'],                 type: 'color' },

  // Borders
  { css: '--claro-divider',        collection: 'Primitives', path: ['color', 'divider'],             type: 'color' },
  { css: '--claro-border',         collection: 'Primitives', path: ['color', 'border'],              type: 'color' },
  { css: '--claro-border-strong',  collection: 'Primitives', path: ['color', 'border-strong'],       type: 'color' },

  // Spacing scale (strip 'px' → number)
  { css: '--claro-space-xs',       collection: 'Primitives', path: ['spacing', 'xs'],  type: 'number', stripUnit: 'px' },
  { css: '--claro-space-sm',       collection: 'Primitives', path: ['spacing', 'sm'],  type: 'number', stripUnit: 'px' },
  { css: '--claro-space-md',       collection: 'Primitives', path: ['spacing', 'md'],  type: 'number', stripUnit: 'px' },
  { css: '--claro-space-lg',       collection: 'Primitives', path: ['spacing', 'lg'],  type: 'number', stripUnit: 'px' },
  { css: '--claro-space-xl',       collection: 'Primitives', path: ['spacing', 'xl'],  type: 'number', stripUnit: 'px' },
  { css: '--claro-space-2xl',      collection: 'Primitives', path: ['spacing', '2xl'], type: 'number', stripUnit: 'px' },

  // Border radii (all 2px except pill; strip 'px' → number)
  { css: '--claro-radius-sm',      collection: 'Primitives', path: ['radius', 'sm'],   type: 'number', stripUnit: 'px' },
  { css: '--claro-radius-md',      collection: 'Primitives', path: ['radius', 'md'],   type: 'number', stripUnit: 'px' },
  { css: '--claro-radius-lg',      collection: 'Primitives', path: ['radius', 'lg'],   type: 'number', stripUnit: 'px' },
  { css: '--claro-radius-card',    collection: 'Primitives', path: ['radius', 'card'],  type: 'number', stripUnit: 'px' },
  { css: '--claro-radius-pill',    collection: 'Primitives', path: ['radius', 'pill'],  type: 'number', stripUnit: 'px' },

  // Font sizes (strip 'px' → number)
  { css: '--claro-text-xs',        collection: 'Primitives', path: ['fontSize', 'xs'],   type: 'number', stripUnit: 'px' },
  { css: '--claro-text-sm',        collection: 'Primitives', path: ['fontSize', 'sm'],   type: 'number', stripUnit: 'px' },
  { css: '--claro-text-base',      collection: 'Primitives', path: ['fontSize', 'base'], type: 'number', stripUnit: 'px' },
  { css: '--claro-text-md',        collection: 'Primitives', path: ['fontSize', 'md'],   type: 'number', stripUnit: 'px' },
  { css: '--claro-text-lg',        collection: 'Primitives', path: ['fontSize', 'lg'],   type: 'number', stripUnit: 'px' },
  { css: '--claro-text-xl',        collection: 'Primitives', path: ['fontSize', 'xl'],   type: 'number', stripUnit: 'px' },
  { css: '--claro-text-2xl',       collection: 'Primitives', path: ['fontSize', '2xl'],  type: 'number', stripUnit: 'px' },
  { css: '--claro-text-3xl',       collection: 'Primitives', path: ['fontSize', '3xl'],  type: 'number', stripUnit: 'px' },
  { css: '--claro-text-4xl',       collection: 'Primitives', path: ['fontSize', '4xl'],  type: 'number', stripUnit: 'px' },

  // Font weights (unitless numbers)
  { css: '--claro-font-weight-normal',   collection: 'Primitives', path: ['fontWeight', 'normal'],   type: 'number' },
  { css: '--claro-font-weight-medium',   collection: 'Primitives', path: ['fontWeight', 'medium'],   type: 'number' },
  { css: '--claro-font-weight-semibold', collection: 'Primitives', path: ['fontWeight', 'semibold'], type: 'number' },

  // Line heights (unitless ratios)
  { css: '--claro-lh-tight',       collection: 'Primitives', path: ['lineHeight', 'tight'],  type: 'number' },
  { css: '--claro-lh-snug',        collection: 'Primitives', path: ['lineHeight', 'snug'],   type: 'number' },
  { css: '--claro-lh-normal',      collection: 'Primitives', path: ['lineHeight', 'normal'], type: 'number' },

  // Motion (Figma has no duration type — stored as string)
  { css: '--claro-dur-fast',       collection: 'Primitives', path: ['motion', 'dur-fast'], type: 'string' },
  { css: '--claro-dur-base',       collection: 'Primitives', path: ['motion', 'dur-base'], type: 'string' },
  { css: '--claro-dur-slow',       collection: 'Primitives', path: ['motion', 'dur-slow'], type: 'string' },

  // ─── DOMAIN collection ──────────────────────────────────────────────────
  // Turn status colors
  { css: '--claro-turn-urgent',      collection: 'Domain', path: ['turn', 'urgent'],      type: 'color' },
  { css: '--claro-turn-standard',    collection: 'Domain', path: ['turn', 'standard'],    type: 'color' },

  // Booking status colors
  { css: '--claro-booking-standard', collection: 'Domain', path: ['booking', 'standard'], type: 'color' },

  // Property accent palette (prop-1..5 are user-selectable; prop-6 is system-reserved)
  { css: '--claro-prop-1',           collection: 'Domain', path: ['property', '1'], type: 'color' },
  { css: '--claro-prop-2',           collection: 'Domain', path: ['property', '2'], type: 'color' },
  { css: '--claro-prop-3',           collection: 'Domain', path: ['property', '3'], type: 'color' },
  { css: '--claro-prop-4',           collection: 'Domain', path: ['property', '4'], type: 'color' },
  { css: '--claro-prop-5',           collection: 'Domain', path: ['property', '5'], type: 'color' },
  { css: '--claro-prop-6',           collection: 'Domain', path: ['property', '6'], type: 'color' },
]

/**
 * Maps CSS variable names to their corresponding vuetify.ts theme color key(s).
 * Used by import-tokens.mjs to keep vuetify.ts in sync when color values change.
 * Only color-type tokens need this — spacing/radius/font tokens live in CSS only.
 */
export const VUETIFY_COLOR_MAP = {
  '--claro-primary':           ['primary'],
  '--claro-primary-light':     ['primary-light'],
  '--claro-primary-dark':      ['primary-dark'],
  '--claro-secondary':         ['secondary'],
  '--claro-background':        ['background'],
  '--claro-surface':           ['surface'],
  '--claro-surface-variant':   ['surface-variant'],
  '--claro-card-bg':           ['card-bg'],
  '--claro-success':           ['success'],
  '--claro-warning':           ['warning'],
  '--claro-error':             ['error'],
  '--claro-info':              ['info'],
  '--claro-fg1':               ['on-background', 'on-surface'],
  '--claro-divider':           ['divider'],
  '--claro-turn-urgent':       ['turn-urgent'],
  '--claro-turn-standard':     ['turn-standard'],
  '--claro-booking-standard':  ['booking-standard'],
}
