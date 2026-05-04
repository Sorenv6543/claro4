import { getDefaultRouteForRole, validateRoleNavigation } from '@utils/authHelpers'
import { describe, expect, it } from 'vitest'

describe('getDefaultRouteForRole', () => {
  it('routes owner to /owner/overview', () => {
    expect(getDefaultRouteForRole('owner')).toBe('/owner/overview')
  })

  it('routes admin to /admin', () => {
    expect(getDefaultRouteForRole('admin')).toBe('/admin')
  })

  it('routes cleaner to /auth/no-access', () => {
    expect(getDefaultRouteForRole('cleaner')).toBe('/auth/no-access')
  })

  it('routes undefined role to /auth/login', () => {
    expect(getDefaultRouteForRole(undefined)).toBe('/auth/login')
  })
})

describe('validateRoleNavigation', () => {
  it('blocks owner from admin routes', () => {
    const result = validateRoleNavigation('owner', '/admin')
    expect(result.allowed).toBe(false)
    expect(result.redirectTo).toBe('/owner/overview')
  })

  it('allows owner to access owner routes', () => {
    const result = validateRoleNavigation('owner', '/owner/bookings')
    expect(result.allowed).toBe(true)
  })

  it('blocks cleaner from admin routes', () => {
    const result = validateRoleNavigation('cleaner', '/admin')
    expect(result.allowed).toBe(false)
    expect(result.redirectTo).toBe('/auth/no-access')
  })

  it('blocks cleaner from owner routes', () => {
    const result = validateRoleNavigation('cleaner', '/owner/overview')
    expect(result.allowed).toBe(false)
    expect(result.redirectTo).toBe('/auth/no-access')
  })

  it('allows admin to access any route', () => {
    expect(validateRoleNavigation('admin', '/admin').allowed).toBe(true)
    expect(validateRoleNavigation('admin', '/owner/overview').allowed).toBe(true)
  })

  it('blocks unauthenticated users', () => {
    const result = validateRoleNavigation(undefined, '/owner/overview')
    expect(result.allowed).toBe(false)
    expect(result.redirectTo).toBe('/auth/login')
  })
})
