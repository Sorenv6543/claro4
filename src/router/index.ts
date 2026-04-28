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
      meta: {
        layout: 'auth',
      },
    },
    {
      path: '/auth/register',
      name: 'register',
      component: () => import('@/pages/auth/register.vue'),
      meta: {
        layout: 'auth',
      },
    },
    {
      path: '/auth/no-access',
      name: 'no-access',
      component: () => import('@/pages/auth/no-access.vue'),
      meta: {
        layout: 'auth',
        requiresAuth: true,
        role: 'cleaner',
      },
    },

    // Owner routes - only accessible to owner users
    // {
    //   path: '/owner/dashboard',
    //   name: 'owner-dashboard',
    //   component: () => import('@/pages/owner/dashboard.vue'),
    //   meta: {
    //     layout: 'owner',
    //     role: 'owner',
    //     requiresAuth: true,
    //   },
    // },
    {
      path: '/owner/overview',
      name: 'owner-overview',
      component: () => import('@/pages/owner/overview/index.vue'),
      meta: {
        layout: 'owner',
        role: 'owner',
        requiresAuth: true,
      },
    },
    {
      path: '/owner/timeline',
      name: 'owner-timeline',
      component: () => import('@/pages/owner/timeline/index.vue'),
      meta: {
        layout: 'owner',
        role: 'owner',
        requiresAuth: true,
      },
    },
    {
      path: '/owner/calendar',
      name: 'owner-calendar',
      component: () => import('@/pages/owner/calendar/index.vue'),
      meta: {
        layout: 'owner',
        role: 'owner',
        requiresAuth: true,
      },
    },
    {
      path: '/owner/bookings',
      name: 'owner-bookings',
      component: () => import('@/pages/owner/bookings/index.vue'),
      meta: {
        layout: 'owner',
        role: 'owner',
        requiresAuth: true,
      },
    },
    {
      path: '/owner/properties',
      name: 'owner-properties',
      component: () => import('@/pages/owner/properties/index.vue'),
      meta: {
        layout: 'owner',
        role: 'owner',
        requiresAuth: true,
      },
    },
    {
      path: '/owner/properties/:id',
      name: 'owner-property-view',
      component: () => import('@/pages/owner/properties/view.vue'),
      meta: {
        layout: 'owner',
        role: 'owner',
        requiresAuth: true,
      },
    },
    {
      path: '/owner/profile',
      name: 'owner-profile',
      component: () => import('@/pages/owner/profile/index.vue'),
      meta: {
        layout: 'owner',
        role: 'owner',
        requiresAuth: true,
      },
    },
    {
      path: '/owner/reports',
      name: 'owner-charts',
      component: () => import('@/pages/owner/reports/index.vue'),
      meta: {
        layout: 'owner',
        role: 'owner',
        requiresAuth: true,
      },
    },
    {
      path: '/owner/settings',
      name: 'owner-settings',
      component: () => import('@/pages/owner/settings/index.vue'),
      meta: {
        layout: 'owner',
        role: 'owner',
        requiresAuth: true,
      },
    },
    // Admin routes - only accessible to admin users
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: () => import('@/pages/admin/index.vue'),
      meta: {
        layout: 'admin',
        role: 'admin',
        requiresAuth: true,
      },
    },
    {
      path: '/admin/calendar',
      name: 'admin-calendar',
      component: () => import('@/pages/admin/calendar/index.vue'),
      meta: {
        layout: 'admin',
        role: 'admin',
        requiresAuth: true,
      },
    },
    {
      path: '/admin/properties',
      name: 'admin-properties',
      component: () => import('@/pages/admin/properties/index.vue'),
      meta: {
        layout: 'admin',
        role: 'admin',
        requiresAuth: true,
      },
    },
    {
      path: '/admin/bookings',
      name: 'admin-bookings',
      component: () => import('@/pages/admin/bookings/index.vue'),
      meta: {
        layout: 'admin',
        role: 'admin',
        requiresAuth: true,
      },
    },
    {
      path: '/admin/property-owners',
      name: 'admin-property-owners',
      component: () => import('@/pages/admin/property-owners/index.vue'),
      meta: {
        layout: 'admin',
        role: 'admin',
        requiresAuth: true,
      },
    },
    {
      path: '/admin/reports',
      name: 'admin-reports',
      component: () => import('@/components/smart/shared/Reports.vue'),
      meta: {
        layout: 'admin',
        role: 'admin',
        requiresAuth: true,
      },
    },
    {
      path: '/admin/cleaners',
      name: 'admin-cleaners',
      component: () => import('@/pages/admin/cleaners/index.vue'),
      meta: {
        layout: 'admin',
        role: 'admin',
        requiresAuth: true,
      },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('@/pages/admin/users/index.vue'),
      meta: {
        layout: 'admin',
        role: 'admin',
        requiresAuth: true,
      },
    },

    {
      path: '/admin/owners/:id',
      name: 'admin-owner-detail',
      component: () => import('@/pages/admin/owners/[id].vue'),
      meta: {
        layout: 'admin',
        role: 'admin',
        requiresAuth: true,
      },
    },
    {
      path: '/admin/profile',
      name: 'admin-profile',
      component: () => import('@/pages/admin/profile/index.vue'),
      meta: {
        layout: 'admin',
        role: 'admin',
        requiresAuth: true,
      },
    },
  ],
})

// Apply navigation guards

router.beforeEach(loadingGuard)
router.beforeEach(authGuard)
router.afterEach(afterNavigationGuard)

// Reload on stale Vite chunks (dev server restart invalidates dynamic import URLs)
router.onError((err) => {
  if (err?.message?.includes('Failed to fetch dynamically imported module')) {
    window.location.reload()
  }
})

export default router
