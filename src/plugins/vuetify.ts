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
    'primary-light': '#9E95F5',
    'primary-dark': '#5E52EE',
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

// Preview theme: "Cluely" external design system, light variant.
// Activate via ?theme=preview-cluely (see usePreviewTheme composable).
// Cluely's source is dark/cinematic; this variant lifts the surfaces to light
// while preserving the blue accent, Geist family, and softer Cluely radii.
// Status colors retained from base light theme since Cluely tokens only specify error.
const previewCluelyTheme: ThemeDefinition = {
  dark: false,
  colors: {
    'primary': '#3C83F6',
    'primary-light': '#6AA0F8',
    'primary-dark': '#2563D8',
    'secondary': '#71717A',
    'background': '#FAFAFA',
    'surface': '#FFFFFF',
    'surface-variant': '#F4F4F5',
    'card-bg': '#FFFFFF',
    'success': '#28C76F',
    'warning': '#FF9F43',
    'error': '#EF4444',
    'info': '#00CFE8',
    'turn-urgent': '#EF4444',
    'turn-standard': '#FF9F43',
    'booking-standard': '#28C76F',
    'on-background': '#18181B',
    'on-surface': '#18181B',
    'text-secondary': '#18181BB8',
    'divider': '#E4E4E7',
  },
  variables: {
    'border-color': '#E4E4E7',
  },
}

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: lightTheme,
      previewCluely: previewCluelyTheme,
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
