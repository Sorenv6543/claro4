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
  { id: 'light',      label: 'Light',      primary: '#1976D2', background: '#F5F7FA', surface: '#FFFFFF' },
  { id: 'dark',       label: 'Dark',       primary: '#2196F3', background: '#121212', surface: '#1E1E1E' },
  { id: 'green',      label: 'Green',      primary: '#4CAF50', background: '#F5F7FA', surface: '#FFFFFF' },
  { id: 'darkGreen',  label: 'Dark Green', primary: '#66BB6A', background: '#121212', surface: '#1E1E1E' },
  { id: 'purple',     label: 'Purple',     primary: '#9C27B0', background: '#F5F7FA', surface: '#FFFFFF' },
  { id: 'darkPurple', label: 'Dark Purple',primary: '#AB47BC', background: '#121212', surface: '#1E1E1E' },
  { id: 'orange',     label: 'Orange',     primary: '#FF5722', background: '#F5F7FA', surface: '#FFFFFF' },
  { id: 'darkOrange', label: 'Dark Orange',primary: '#FF7043', background: '#121212', surface: '#1E1E1E' },
  { id: 'teal',       label: 'Teal',       primary: '#009688', background: '#F5F7FA', surface: '#FFFFFF' },
  { id: 'darkTeal',   label: 'Dark Teal',  primary: '#26A69A', background: '#121212', surface: '#1E1E1E' },
  { id: 'red',        label: 'Red',        primary: '#F44336', background: '#F5F7FA', surface: '#FFFFFF' },
  { id: 'darkRed',    label: 'Dark Red',   primary: '#EF5350', background: '#121212', surface: '#1E1E1E' },
  { id: 'brown',      label: 'Brown',      primary: '#795548', background: '#F5F7FA', surface: '#FFFFFF' },
  { id: 'darkBrown',  label: 'Dark Brown', primary: '#8D6E63', background: '#121212', surface: '#1E1E1E' },
]

// Theme keys registered in vuetify.ts — used to verify THEMES stays in sync.
export const REGISTERED_THEME_KEYS = [
  'light', 'dark', 'green', 'darkGreen', 'purple', 'darkPurple',
  'orange', 'darkOrange', 'teal', 'darkTeal', 'red', 'darkRed',
  'brown', 'darkBrown',
] as const
