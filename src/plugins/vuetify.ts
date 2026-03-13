// src/plugins/vuetify.ts
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import type { ThemeDefinition } from 'vuetify';

// Import Vuetify styles
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';

// Dark Teal Theme
const darkTealTheme: ThemeDefinition = {
  dark: true,
  colors: {
    primary: '#26A69A', // Lighter Teal
    secondary: '#26C6DA', // Lighter Cyan
    accent: '#66BB6A', // Lighter Green
    error: '#EF5350', // Lighter Red
    info: '#29B6F6', // Lighter Blue
    success: '#66BB6A', // Lighter Green
    warning: '#FFA726', // Lighter Orange
    background: '#121212', // Dark Grey
    surface: '#1E1E1E', // Slightly lighter dark grey
    'on-background': '#E6E1E5',
    'on-surface': '#E6E1E5',
    'surface-variant': '#2D2D2D',
    'on-surface-variant': '#CAC4D0',
    'turn-urgent': '#EF5350', // Lighter Red
    'turn-standard': '#FFA726', // Lighter Orange
    'booking-standard': '#26A69A', // Lighter Teal
  }
};

export default createVuetify({
  components,
  directives,
  date: {},        // ← add this line

  // Icon configuration
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  },
  
  // Theme configuration
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#5C6BC0',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
          background: '#F5F7FA',
          surface: '#FFFFFF',
          'surface-variant': '#E8EAF6',
          'turn-urgent': '#F44336',
          'turn-standard': '#FF9800',
          'booking-standard': '#4CAF50',
        },
      },
      darkTeal: darkTealTheme,
    },
    variations: {
      colors: ['primary', 'secondary', 'accent', 'error', 'info', 'success', 'warning'],
      lighten: 5,
      darken: 5
    }
  },
  
  // Default configuration for components
  defaults: {
    VBtn: {
      variant: 'flat',
      rounded: true,
      elevation: 1
    },
    VCard: {
      elevation: 2,
      rounded: 'lg',
      class: 'pa-2'
    },
    VChip: {
      rounded: 'pill',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      hideDetails: 'auto'
    },
    VSelect: {
      variant: 'outlined', 
      density: 'comfortable',
      rounded: 'lg',
      hideDetails: 'auto'
    },
    VTextarea: {
      variant: 'outlined',
      rounded: 'lg',
      hideDetails: 'auto'
    },
    VAutocomplete: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      hideDetails: 'auto'
    },
    VCombobox: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      hideDetails: 'auto'
    },
    VList: {
      bgColor: 'transparent',
      rounded: 'lg'
    },
    VListItem: {
      rounded: 'lg',
      minHeight: '40px'
    },
    VNavigationDrawer: {
      rounded: 'lg',
      elevation: 3
    },
    VDialog: {
      maxWidth: '700px',
      rounded: 'lg'
    },
    VAlert: {
      rounded: 'lg',
      variant: 'tonal'
    },
    VBadge: {
      rounded: 'pill'
    },
    VExpansionPanel: {
      rounded: 'lg',
      elevation: 0
    }
  },
  
  // Display configuration for responsive design
  display: {
    mobileBreakpoint: 'sm',
    thresholds: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920
    }
  }
});