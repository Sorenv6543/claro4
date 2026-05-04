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
