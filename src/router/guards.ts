import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getDefaultRouteForRole } from '@/utils/authHelpers';
import type { UserRole } from '@/types';

export async function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  // Skip auth entirely for dev/demo and lab routes
  if (to.path.startsWith('/dev') || to.path.startsWith('/lab')) return next();

  const authStore = useAuthStore();

  // Only call checkAuth once per session. After logout, the auth store's
  // signOut action resets authChecked so the next navigation re-checks.
  if (!authStore.authChecked) {
    await authStore.checkAuth();
    authStore.authChecked = true;
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/auth/login');
    return;
  }

  // Check role-based access
  const requiredRole = to.meta.role as UserRole;
  if (requiredRole && authStore.user?.role !== requiredRole) {
    const defaultRoute = getDefaultRouteForRole(authStore.user?.role);
    next(defaultRoute);
    return;
  }

  // Block admin routes for non-admins
  if (to.path.startsWith('/admin') && !authStore.isAdmin) {
    next(getDefaultRouteForRole(authStore.user?.role));
    return;
  }

  // Block owner routes for non-owners
  if (to.path.startsWith('/owner') && !authStore.isOwner) {
    next(getDefaultRouteForRole(authStore.user?.role));
    return;
  }

  // Redirect authenticated users away from auth/login pages
  if ((to.path === '/' || to.path.startsWith('/auth')) && authStore.isAuthenticated) {
    next(getDefaultRouteForRole(authStore.user?.role));
    return;
  }

  next();
}

export function loadingGuard(
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  // TODO: set loading state here (e.g. uiStore.setLoading(true))
  
  next();
}

export function afterNavigationGuard(
  _to: RouteLocationNormalized
) {
  // Post-navigation hook — add analytics, page title updates, etc. here
}

export function developmentGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  // Block development routes in production
  if ((to.path.startsWith('/dev') || to.path.startsWith('/lab')) && import.meta.env.PROD) {
    next('/404');
    return;
  }
  
  next();
}
