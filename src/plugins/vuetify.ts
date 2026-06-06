// Vuetify plugin configuration — single source of truth for all color hex values.
// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
//
// Vuetify requires hex values and registers --v-theme-* custom properties as
// comma-separated R,G,B channel values (e.g. "115, 103, 240") at runtime.
// tokens.css aliases those via rgb(var(--v-theme-*)): edit hex values here only.
// Non-color tokens (spacing, radii, shadows, layout) live in tokens.css exclusively.

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

// default light theme

const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    'primary': '#1976D2',
    'primary-light': '#42A5F5',
    'primary-dark': '#1565C0',
    'secondary': '#A8AAAE',
    'background': '#F5F5F9',
    'surface': '#ffffff',
    'surface-variant': '#F5F5F9',
    'card-bg': '#ffffff',
    'success': '#28C76F',
    'warning': '#FF9F43',
    'error': '#EA5455',
    'info': '#00CFE8',

    'turn-urgent': '#EA5455',
    'turn-standard': '#FF9F43',
    'booking-standard': '#28C76F',

    /* ─── Colors: Text ────────────────────────────────────────────────── */
    'on-background': '#2E263D',
    'on-surface': '#2E263D',
    'text-secondary': '#2E263D80',
    'divider': '#E8E8E8',

  },
  variables: {
    'border-color': '#E8E8E8',
  },
}

const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    'primary': '#1976D2',
    'primary-light': '#42A5F5',
    'primary-dark': '#1565C0',
    'secondary': '#A8AAAE',
    'background': '#1C1B2D',
    'surface': '#28243D',
    'surface-variant': '#1C1B2D',
    'card-bg': '#28243D',
    'success': '#28C76F',
    'warning': '#FF9F43',
    'error': '#EA5455',
    'info': '#00CFE8',
    'turn-urgent': '#EA5455',
    'turn-standard': '#FF9F43',
    'booking-standard': '#28C76F',
    'on-background': '#E8E5F2',
    'on-surface': '#E8E5F2',
    'text-secondary': '#E8E5F280',
    'divider': '#3D3759',
  },
  variables: {
    'border-color': '#3D3759',
  },
}

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: lightTheme,
      dark: darkTheme,
    },
    variations: {
      colors: ['primary', 'secondary', 'error', 'info', 'success', 'warning'],
      lighten: 5,
      darken: 3,
    },
  },
  // Icon configuration
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },

  // Default configuration for components (https://vuetifyjs.com/en/features/global-configuration/#defaults)

  defaults: {
    VBtn: {
      variant: 'flat',
      rounded: 'pill',
      elevation: 2,
    },
    VCard: {
      elevation: 2,
      rounded: 'sm',
    },
    VChip: {
      rounded: 'pill',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'sm',
      hideDetails: 'auto',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'sm',
      hideDetails: 'auto',
    },
    VTextarea: {
      variant: 'outlined',
      rounded: 'sm',
      hideDetails: 'auto',
    },
    VAutocomplete: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'sm',
      hideDetails: 'auto',
    },
    VCombobox: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'sm',
      hideDetails: 'auto',
    },
    VList: {
      bgColor: 'transparent',
      rounded: 'sm',
    },
    VListItem: {
      rounded: 'sm',
      minHeight: '40px',
    },
    VNavigationDrawer: {
      rounded: 'sm',
      elevation: 3,
    },
    VDialog: {
      maxWidth: '700px',
      rounded: 'sm',
    },
    VAlert: {
      rounded: 'sm',
      variant: 'tonal',
    },
    VBadge: {
      rounded: 'pill',
    },
    VExpansionPanel: {
      rounded: 'sm',
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
