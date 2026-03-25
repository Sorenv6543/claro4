// 🛣️ ROUTING & GUARDS LAYER

// src/router/index.ts - 🗺️ ROUTE DEFINITIONS

// ✅ Maps URLs to components
// ✅ Declares auth requirements via meta.requiresAuth
// ✅ Declares role requirements via meta.role
// ✅ Applies navigation guards

import { createRouter, createWebHistory } from 'vue-router'
import { afterNavigationGuard, authGuard, developmentGuard, loadingGuard } from './guards'

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

    // Owner routes - only accessible to owner users
    {
      path: '/owner/dashboard',
      name: 'HomeOwner',
      component: () => import('@/pages/owner/dashboard.vue'),
      meta: {
        layout: 'owner',
        role: 'owner',
        requiresAuth: true,
      },
    },
    {
      path: '/owner/overview',
      name: 'owner-overview',
      component: () => import('@/pages/owner/overview.vue'),
      meta: {
        layout: 'owner',
        role: 'owner',
        requiresAuth: true,
      },
    },
    {
      path: '/owner/calendar',
      redirect: '/owner/dashboard',
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
      path: '/owner/profile',
      name: 'owner-profile',
      component: () => import('@/pages/owner/profile.vue'),
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
      path: '/owner/settings',
      name: 'owner-settings',
      component: () => import('@/pages/owner/settings.vue'),
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
      path: '/admin/schedule',
      name: 'admin-schedule',
      component: () => import('@/pages/admin/schedule/index.vue'),
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
      path: '/admin/properties/:id',
      name: 'admin-properties-view',
      component: () => import('@/pages/admin/properties/index.vue'),
      meta: {
        layout: 'admin',
        role: 'admin',
        requiresAuth: true,
      },
    },
    {
      path: '/admin/properties/:id/edit',
      name: 'admin-properties-edit',
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
      component: () => import('@/pages/admin/reports/index.vue'),
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

    // Dev/demo routes - no auth required, blocked in production
    {
      path: '/dev/demos',
      name: 'dev-demos',
      component: () => import('@/pages/demos/index.vue'),
      meta: { layout: 'bare' },
    },
    {
      path: '/dev/demos/:slug',
      name: 'dev-demo-viewer',
      component: () => import('@/pages/demos/[slug].vue'),
      meta: { layout: 'bare' },
    },

    // ── AI Component Lab (ui-mockups worktree only) ─────────────────────────
    {
      path: '/lab',
      name: 'lab',
      component: () => import('@/pages/lab/index.vue'),
      meta: { layout: 'bare', demo: true },
    },
  ],
})

// Apply navigation guards
router.beforeEach(developmentGuard)
router.beforeEach(loadingGuard)
router.beforeEach(authGuard)
router.afterEach(afterNavigationGuard)

export default router
