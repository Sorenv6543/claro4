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
  { id: 'light', label: 'Light', primary: '#1976D2', background: '#F5F7FA', surface: '#FFFFFF' },
  { id: 'darkTeal', label: 'Dark Teal', primary: '#26A69A', background: '#121212', surface: '#1E1E1E' },
]

// Theme keys registered in vuetify.ts — used to verify THEMES stays in sync.
export const REGISTERED_THEME_KEYS = [
  'light', 'darkTeal',
] as const
