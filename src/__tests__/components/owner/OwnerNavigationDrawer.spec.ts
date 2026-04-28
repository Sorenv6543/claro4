// src/__tests__/components/owner/OwnerNavigationDrawer.spec.ts
import { describe, expect, it } from 'vitest'
import { PROPERTY_COLORS } from '@/utils/constants'

// Pure helpers extracted from the component — test them in isolation
// before the component exists to drive the design.

// isNavItemActive: returns true when the current path matches the item's route.
// It should also match child routes (e.g. /owner/properties/123 → Properties active).
function isNavItemActive (itemPath: string, currentPath: string): boolean {
  if (itemPath === currentPath) {
    return true
  }
  // Match child routes, but don't let /owner/dashboard match /owner/dashboard-other
  return currentPath.startsWith(itemPath + '/')
}

// propertyColor: cycles through PROPERTY_COLORS by index. Imports from constants
// so the test stays aligned with palette changes (5 Materio colors today).
function propertyColor (index: number): string {
  return PROPERTY_COLORS[index % PROPERTY_COLORS.length]
}

describe('isNavItemActive', () => {
  it('returns true for exact match', () => {
    expect(isNavItemActive('/owner/dashboard', '/owner/dashboard')).toBe(true)
  })
  it('returns true for child route', () => {
    expect(isNavItemActive('/owner/properties', '/owner/properties/abc123')).toBe(true)
  })
  it('returns false for different route', () => {
    expect(isNavItemActive('/owner/bookings', '/owner/dashboard')).toBe(false)
  })
  it('does not match partial prefix without slash', () => {
    // /owner/dashboard should NOT match /owner/dashboard-extra
    expect(isNavItemActive('/owner/dashboard', '/owner/dashboard-extra')).toBe(false)
  })
})

describe('propertyColor', () => {
  it('returns first color for index 0', () => {
    expect(propertyColor(0)).toBe(PROPERTY_COLORS[0])
  })
  it('returns last color at PROPERTY_COLORS.length - 1', () => {
    expect(propertyColor(PROPERTY_COLORS.length - 1))
      .toBe(PROPERTY_COLORS.at(-1))
  })
  it('cycles back to first color at length boundary', () => {
    expect(propertyColor(PROPERTY_COLORS.length)).toBe(PROPERTY_COLORS[0])
  })
})
