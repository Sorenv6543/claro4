/**
 * 5 user-selectable property colors.
 * Used for property cards, sidebar icons, and calendar events.
 * Deliberately avoids Vuetify surface/on-surface theme variables.
 */
export const PROPERTY_COLORS = [
  '#5c6bc0', // indigo
  '#43a047', // green
  '#8e24aa', // purple
  '#f57c00', // orange
  '#e53935', // red
] as const

export type PropertyColor = typeof PROPERTY_COLORS[number]
