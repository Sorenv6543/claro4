/**
 * 5 user-selectable property colors.
 * Used for property cards, sidebar icons, and calendar events.
 * Deliberately avoids Vuetify surface/on-surface theme variables.
 */
export const PROPERTY_COLORS = [
  '--v-theme-primary', // indigo
  '--v-theme-success', // green
  '--v-theme-warning', // amber
  '--v-theme-error', // red
  '--v-theme-info', // blue

] as const

export type PropertyColor = typeof PROPERTY_COLORS[number]

/**
 * Maps a booking status string to a Vuetify semantic color.
 */
export function getBookingStatusColor (status: string): string {
  switch (status) {
    case 'completed': {
      return '--v-theme-success'
    }
    case 'in_progress': { return '--v-theme-info'
    }
    case 'scheduled': { return '--v-theme-primary'
    }
    case 'cancelled': { return '--v-theme-error'
    }
    default: { return '--v-theme-warning'
    }
  }
}

/**
 * Formats a snake_case status string for display (e.g. "in_progress" → "in progress").
 */
export function formatStatus (status: string): string {
  return status.replace(/_/g, ' ')
}
