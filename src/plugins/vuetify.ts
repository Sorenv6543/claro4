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
    'primary': '#7367F0',
    'primary-light': '#9E95F5',
    'primary-dark': '#5E52EE',
    'secondary': '#94A3B8',
    'background': '#F8FAFC',
    'surface': '#FFFFFF',
    'surface-variant': '#F1F5F9',
    'card-bg': 'rgba(255, 255, 255, 0.8)',
    'success': '#22C55E',
    'warning': '#F59E0B',
    'error': '#EF4444',
    'info': '#0EA5E9',

    'turn-urgent': '#EF4444',
    'turn-standard': '#F59E0B',
    'booking-standard': '#22C55E',

    /* ─── Colors: Text ────────────────────────────────────────────────── */
    'on-background': '#0F172A',
    'on-surface': '#0F172A',
    'text-secondary': '#64748B',
    'divider': 'rgba(15, 23, 42, 0.08)',

  },
  variables: {
    'border-color': 'rgba(15, 23, 42, 0.08)',
    'medium-emphasis-opacity': 0.6,
    'glass-bg': 'rgba(255, 255, 255, 0.8)',
    'glass-border': 'rgba(15, 23, 42, 0.08)',
  },
}

const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    'primary': '#7367F0',
    'primary-light': '#9E95F5',
    'primary-dark': '#5E52EE',
    'secondary': '#94A3B8',
    'background': '#0F172A',
    'surface': '#1E293B',
    'surface-variant': '#334155',
    'card-bg': 'rgba(30, 41, 59, 0.7)',
    'success': '#22C55E',
    'warning': '#F59E0B',
    'error': '#EF4444',
    'info': '#0EA5E9',
    'on-background': '#F8FAFC',
    'on-surface': '#F8FAFC',
    'text-secondary': '#94A3B8',
    'divider': 'rgba(255, 255, 255, 0.1)',
  },
  variables: {
    'border-color': 'rgba(255, 255, 255, 0.1)',
    'medium-emphasis-opacity': 0.7,
    'glass-bg': 'rgba(30, 41, 59, 0.7)',
    'glass-border': 'rgba(255, 255, 255, 0.1)',
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
      elevation: 0,
      rounded: 'xl',
      border: true,
      class: 'glass-card',
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
      rounded: 'xl',
    },
    VListItem: {
      rounded: 'lg',
      minHeight: '40px',
    },
    VNavigationDrawer: {
      rounded: '0',
      elevation: 0,
      border: 'e',
    },
    VDialog: {
      maxWidth: '700px',
      rounded: 'xl',
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
