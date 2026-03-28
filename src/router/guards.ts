import type { RouteLocationNormalized } from 'vue-router'
import type { UserRole } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { getDefaultRouteForRole } from '@/utils/authHelpers'

export async function authGuard (
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
) {
  const authStore = useAuthStore()

  // Only call checkAuth once per session. After logout, the auth store's
  // signOut action resets authChecked so the next navigation re-checks.
  if (!authStore.authChecked) {
    await authStore.checkAuth()
    authStore.authChecked = true
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/'
  }

  // Check role-based access
  const requiredRole = to.meta.role as UserRole
  if (requiredRole && authStore.user?.role !== requiredRole) {
    return getDefaultRouteForRole(authStore.user?.role)
  }

  // Block admin routes for non-admins
  if (to.path.startsWith('/admin') && !authStore.isAdmin) {
    return getDefaultRouteForRole(authStore.user?.role)
  }

  // Block owner routes for non-owners
  if (to.path.startsWith('/owner') && !authStore.isOwner) {
    return getDefaultRouteForRole(authStore.user?.role)
  }

  // Redirect authenticated users away from auth/login pages
  // (skip for roles without a dedicated UI, e.g. cleaner)
  if ((to.path === '/' || (to.path.startsWith('/auth') && to.path !== '/auth/no-access')) && authStore.isAuthenticated) {
    const dest = getDefaultRouteForRole(authStore.user?.role)
    if (dest !== '/' && dest !== to.path) {
      return dest
    }
  }
}

export function loadingGuard (
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
) {
  // TODO: set loading state here (e.g. uiStore.setLoading(true))
}

export function afterNavigationGuard (
  _to: RouteLocationNormalized,
) {
  // Post-navigation hook — add analytics, page title updates, etc. here
}

export function developmentGuard (
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
) {
  // Block development/demo routes in production
  if (import.meta.env.PROD && (to.path.startsWith('/dev') || to.meta.demo)) {
    return '/404'
  }
}
