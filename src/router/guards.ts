import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getDefaultRouteForRole } from '@/utils/authHelpers';
import type { UserRole } from '@/types';

export async function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
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
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  // TODO: set loading state here
  if (to.meta.requiresAuth || to.meta.role) {
    console.log('⏳ Loading guard: Setting loading state for protected route');
  }
  
  next();
}

export function afterNavigationGuard(
  to: RouteLocationNormalized
) {
  console.log('📍 Navigation completed to:', to.path);
  
  // Initialize real-time sync if on protected routes
  if (to.meta.requiresAuth) {
    console.log('🔄 Protected route accessed, ensuring real-time sync is active');
  }
}

export function developmentGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  // Block development routes in production
  if (to.path.startsWith('/dev') && import.meta.env.PROD) {
    console.log('❌ Development route blocked in production');
    next('/404');
    return;
  }
  
  next();
}
