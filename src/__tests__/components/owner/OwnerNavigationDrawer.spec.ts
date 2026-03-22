// src/__tests__/components/owner/OwnerNavigationDrawer.spec.ts
import { describe, expect, it } from 'vitest'

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

// propertyColor: cycles through 4 brand colors by index
const PROPERTY_COLORS = ['#5c6bc0', '#43a047', '#8e24aa', '#f57c00']
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
    expect(propertyColor(0)).toBe('#5c6bc0')
  })
  it('returns fourth color for index 3', () => {
    expect(propertyColor(3)).toBe('#f57c00')
  })
  it('cycles back to first color at index 4', () => {
    expect(propertyColor(4)).toBe('#5c6bc0')
  })
})
