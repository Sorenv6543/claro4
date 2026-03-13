import { describe, it, expect } from 'vitest'
import { THEMES, REGISTERED_THEME_KEYS } from '@/layouts/ownerThemes'

describe('THEMES swatch array', () => {
  it('has an entry for every registered theme', () => {
    const ids = THEMES.map(t => t.id)
    for (const key of REGISTERED_THEME_KEYS) {
      expect(ids).toContain(key)
    }
  })

  it('has exactly 2 entries', () => {
    expect(THEMES).toHaveLength(2)
  })

  it('every entry has non-empty id, label, primary, background, surface', () => {
    for (const t of THEMES) {
      expect(t.id.length).toBeGreaterThan(0)
      expect(t.label.length).toBeGreaterThan(0)
      expect(t.primary).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(t.background).toMatch(/^#[0-9a-fA-F]{6}$/i)
      expect(t.surface).toMatch(/^#[0-9a-fA-F]{6}$/i)
    }
  })

  it('no duplicate ids', () => {
    const ids = THEMES.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
