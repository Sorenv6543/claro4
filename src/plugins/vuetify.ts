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
const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    'primary': '#1976D2',
    'secondary': '#5C6BC0',
    'accent': '#82B1FF',
    'error': '#FF5252',
    'info': '#2196F3',
    'success': '#4CAF50',
    'warning': '#FFC107',
    'background': '#cbd0d6',
    'surface': '#FFFFFF',
    'surface-variant': '#E8EAF6',
    'turn-urgent': '#F44336',
    'turn-standard': '#FF9800',
    'booking-standard': '#4CAF50',
    'on-background': '#1C1B1F',
    'on-surface': '#1C1B1F',
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
