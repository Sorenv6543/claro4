// Vuetify plugin configuration
// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
//
// Color values here MUST match src/styles/tokens.css.
// Vuetify requires hex values (it generates --v-theme-* RGB tuples).
// Non-color tokens (spacing, radii, shadows, layout) live in tokens.css only.
// Two-way Pencil sync updates both files.

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
// Color values must stay in sync with src/styles/tokens.css (canonical source).
const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    'primary': '#7367F0',
    'secondary': '#A8AAAE',
    'accent': '#9E95F5',
    'error': '#EA5455',
    'info': '#00CFE8',
    'success': '#28C76F',
    'warning': '#FF9F43',
    'background': '#f1f1f1',
    'surface': '#FFFFFF',
    'surface-variant': '#F5F5F9',
    'turn-urgent': '#EA5455',
    'turn-standard': '#FF9F43',
    'booking-standard': '#28C76F',
    'on-background': '#2E263D',
    'on-surface': '#2E263D',
  },
}

// Create Vuetify instance

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: lightTheme,
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
      rounded: true,
      elevation: 1,
    },
    VCard: {
      elevation: 24,
      rounded: 'sm',
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
