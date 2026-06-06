// src/layouts/ownerThemes.ts
// Extracted so it can be tested without mounting a Vuetify component.

export interface ThemeSwatch {
  id: string
  label: string
  primary: string
  background: string
  surface: string
}

export const THEMES: ThemeSwatch[] = [
  { id: 'light', label: 'Light', primary: '#1976D2', background: '#F5F5F9', surface: '#ffffff' },
  { id: 'dark', label: 'Dark', primary: '#1976D2', background: '#1C1B2D', surface: '#28243D' },
]

// Theme keys registered in vuetify.ts — used to verify THEMES stays in sync.
export const REGISTERED_THEME_KEYS = [
  'light', 'dark',
] as const
