// 🛣️ ROUTING & GUARDS LAYER

// src/router/index.ts - 🗺️ ROUTE DEFINITIONS

// ✅ Maps URLs to components
// ✅ Declares auth requirements via meta.requiresAuth
// ✅ Declares role requirements via meta.role
// ✅ Applies navigation guards

import { createRouter, createWebHistory } from 'vue-router'
import { afterNavigationGuard, authGuard, loadingGuard } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [

    // Auth routes - only accessible to unauthenticated users
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/auth/login.vue'),
      meta: { layout: 'auth', title: 'Sign In' },
    },
    {
      path: '/auth/register',
      name: 'register',
      component: () => import('@/pages/auth/register.vue'),
      meta: { layout: 'auth', title: 'Sign Up' },
    },
    {
      path: '/auth/no-access',
      name: 'no-access',
      component: () => import('@/pages/auth/no-access.vue'),
      meta: { layout: 'auth', requiresAuth: true, role: 'cleaner', title: 'No Access' },
    },

    // Owner routes - only accessible to owner users
    {
      path: '/owner/overview',
      name: 'owner-overview',
      component: () => import('@/pages/owner/overview/index.vue'),
      meta: { layout: 'owner', role: 'owner', requiresAuth: true, title: 'Overview' },
    },
    {
      path: '/owner/calendar',
      name: 'owner-calendar',
      component: () => import('@/pages/owner/calendar/index.vue'),
      meta: { layout: 'owner', role: 'owner', requiresAuth: true, title: 'Calendar' },
    },
    {
      path: '/owner/bookings',
      name: 'owner-bookings',
      component: () => import('@/pages/owner/bookings/index.vue'),
      meta: { layout: 'owner', role: 'owner', requiresAuth: true, title: 'Bookings' },
    },
    {
      path: '/owner/properties',
      name: 'owner-properties',
      component: () => import('@/pages/owner/properties/index.vue'),
      meta: { layout: 'owner', role: 'owner', requiresAuth: true, title: 'Properties' },
    },
    {
      path: '/owner/properties/:id',
      name: 'owner-property-view',
      component: () => import('@/pages/owner/properties/view.vue'),
      meta: { layout: 'owner', role: 'owner', requiresAuth: true, title: 'Property' },
    },
    {
      path: '/owner/profile',
      redirect: '/owner/settings',
    },
    {
      path: '/owner/reports',
      name: 'owner-charts',
      component: () => import('@/pages/owner/reports/index.vue'),
      meta: { layout: 'owner', role: 'owner', requiresAuth: true, title: 'Reports' },
    },
    {
      path: '/owner/settings',
      name: 'owner-settings',
      component: () => import('@/pages/owner/settings/index.vue'),
      meta: { layout: 'owner', role: 'owner', requiresAuth: true, title: 'Settings' },
    },
    // Admin routes - only accessible to admin users
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: () => import('@/pages/admin/index.vue'),
      meta: { layout: 'admin', role: 'admin', requiresAuth: true, title: 'Dashboard' },
    },
    {
      path: '/admin/calendar',
      name: 'admin-calendar',
      component: () => import('@/pages/admin/calendar/index.vue'),
      meta: { layout: 'admin', role: 'admin', requiresAuth: true, title: 'Calendar' },
    },
    {
      path: '/admin/properties',
      name: 'admin-properties',
      component: () => import('@/pages/admin/properties/index.vue'),
      meta: { layout: 'admin', role: 'admin', requiresAuth: true, title: 'Properties' },
    },
    {
      path: '/admin/bookings',
      name: 'admin-bookings',
      component: () => import('@/pages/admin/bookings/index.vue'),
      meta: { layout: 'admin', role: 'admin', requiresAuth: true, title: 'Bookings' },
    },
    {
      path: '/admin/property-owners',
      name: 'admin-property-owners',
      component: () => import('@/pages/admin/property-owners/index.vue'),
      meta: { layout: 'admin', role: 'admin', requiresAuth: true, title: 'Property Owners' },
    },
    {
      path: '/admin/reports',
      name: 'admin-reports',
      component: () => import('@/components/smart/shared/Reports.vue'),
      meta: { layout: 'admin', role: 'admin', requiresAuth: true, title: 'Reports' },
    },
    {
      path: '/admin/cleaners',
      name: 'admin-cleaners',
      component: () => import('@/pages/admin/cleaners/index.vue'),
      meta: { layout: 'admin', role: 'admin', requiresAuth: true, title: 'Cleaners' },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('@/pages/admin/users/index.vue'),
      meta: { layout: 'admin', role: 'admin', requiresAuth: true, title: 'Users' },
    },
    {
      path: '/admin/owners/:id',
      name: 'admin-owner-detail',
      component: () => import('@/pages/admin/owners/[id].vue'),
      meta: { layout: 'admin', role: 'admin', requiresAuth: true, title: 'Owner' },
    },
    {
      path: '/admin/profile',
      name: 'admin-profile',
      component: () => import('@/pages/admin/profile/index.vue'),
      meta: { layout: 'admin', role: 'admin', requiresAuth: true, title: 'Profile' },
    },

    // Catch-all 404
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/404.vue'),
      meta: { layout: 'bare' },
    },
  ],
})

// Apply navigation guards

router.beforeEach(loadingGuard)
router.beforeEach(authGuard)
router.afterEach(afterNavigationGuard)

// Reload on stale Vite chunks (dev server restart invalidates dynamic import URLs)
router.onError(err => {
  if (err?.message?.includes('Failed to fetch dynamically imported module')) {
    window.location.reload()
  }
})

export default router
