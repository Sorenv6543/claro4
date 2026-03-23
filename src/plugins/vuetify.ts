// Vuetify plugin configuration
// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides

// Vuetify
import type { ThemeDefinition } from 'vuetify'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

// Import Vuetify styles
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
// Dark Teal Theme
const darkTealTheme: ThemeDefinition = {
  dark: true,
  colors: {
    'primary': '#26A69A', // Lighter Teal
    'secondary': '#26C6DA', // Lighter Cyan
    'accent': '#66BB6A', // Lighter Green
    'error': '#EF5350', // Lighter Red
    'info': '#29B6F6', // Lighter Blue
    'success': '#66BB6A', // Lighter Green
    'warning': '#FFA726', // Lighter Orange
    'background': '#121212', // Dark Grey
    'surface': '#1E1E1E', // Slightly lighter dark grey
    'on-background': '#E6E1E5',
    'on-surface': '#E6E1E5',
    'surface-variant': '#2D2D2D',
    'on-surface-variant': '#CAC4D0',
    'turn-urgent': '#EF5350', // Lighter Red
    'turn-standard': '#FFA726', // Lighter Orange
    'booking-standard': '#26A69A', // Lighter Teal
  },
}

export default createVuetify({
  // Icon configuration
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },

  // Theme configuration
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          'primary': '#1976D2',
          'secondary': '#5C6BC0',
          'accent': '#82B1FF',
          'error': '#FF5252',
          'info': '#2196F3',
          'success': '#4CAF50',
          'warning': '#FFC107',
          'background': '#F5F7FA',
          'surface': '#FFFFFF',
          'surface-variant': '#E8EAF6',
          'turn-urgent': '#F44336',
          'turn-standard': '#FF9800',
          'booking-standard': '#4CAF50',
          'on-background': '#1C1B1F',
          'on-surface': '#1C1B1F',
        },
      },
      darkTeal: darkTealTheme,
    },
    variations: {
      colors: ['primary', 'secondary', 'accent', 'error', 'info', 'success', 'warning'],
      lighten: 3,
      darken: 3,
    },
  },
  // Default configuration for components
  defaults: {
    VBtn: {
      variant: 'flat',
      rounded: true,
      elevation: 1,
    },
    VCard: {
      elevation: 2,
      rounded: 'lg',
      class: 'pa-2',
    },
    VChip: {
      rounded: 'pill',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      hideDetails: 'auto',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      hideDetails: 'auto',
    },
    VTextarea: {
      variant: 'outlined',
      rounded: 'lg',
      hideDetails: 'auto',
    },
    VAutocomplete: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      hideDetails: 'auto',
    },
    VCombobox: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      hideDetails: 'auto',
    },
    VList: {
      bgColor: 'transparent',
      rounded: 'lg',
    },
    VListItem: {
      rounded: 'lg',
      minHeight: '40px',
    },
    VNavigationDrawer: {
      rounded: 'lg',
      elevation: 3,
    },
    VDialog: {
      maxWidth: '700px',
      rounded: 'lg',
    },
    VAlert: {
      rounded: 'lg',
      variant: 'tonal',
    },
    VBadge: {
      rounded: 'pill',
    },
    VExpansionPanel: {
      rounded: 'lg',
      elevation: 0,
    },
  },

  // Display configuration for responsive design
  display: {
    mobileBreakpoint: 'sm',
    thresholds: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
})
