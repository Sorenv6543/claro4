<!-- src/components/smart/owner/OwnerNavigationDrawer.vue -->
<template>
  <v-navigation-drawer
    :model-value="modelValue"
    :permanent="mdAndUp"
    :scrim="!mdAndUp"
    :temporary="!mdAndUp"
    :width="drawerWidth"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- Navigation section -->
    <nav aria-label="Main navigation" class="claro-nav">
      <div aria-hidden="true" class="claro-nav-section-label">Main</div>

      <component
        :is="item.disabled ? 'span' : 'router-link'"
        v-for="item in navItems"
        :key="item.label"
        :aria-current="isActive(item.to) ? 'page' : undefined"
        class="claro-nav-item"
        :class="{ 'claro-nav-item--active': isActive(item.to) }"
        :to="item.disabled ? undefined : item.to"
        @click="item.disabled ? undefined : onNavItemClick()"
      >
        <v-icon
          aria-hidden="true"
          class="claro-nav-icon"
          :icon="isActive(item.to) ? item.filledIcon : item.icon"
          size="20"
        />

        <span class="claro-nav-label">{{ item.label }}</span>

        <span
          v-if="item.badge"
          :aria-label="`${item.badge} items`"
          class="claro-nav-badge"
          :class="{ 'claro-nav-badge--active': isActive(item.to) }"
        >{{ item.badge }}</span>

        <v-chip
          v-if="item.soon"
          class="text-uppercase font-weight-bold ml-auto"
          color="success"
          size="x-small"
          variant="tonal"
        >
          Soon
        </v-chip>
      </component>

      <div aria-hidden="true" class="claro-nav-section-label">Account</div>

      <component
        :is="'router-link'"
        v-for="item in accountItems"
        :key="item.label"
        :aria-current="isActive(item.to) ? 'page' : undefined"
        class="claro-nav-item"
        :class="{ 'claro-nav-item--active': isActive(item.to) }"
        :to="item.to"
        @click="onNavItemClick()"
      >
        <v-icon
          aria-hidden="true"
          class="claro-nav-icon"
          :icon="isActive(item.to) ? item.filledIcon : item.icon"
          size="20"
        />

        <span class="claro-nav-label">{{ item.label }}</span>
      </component>
    </nav>

    <!-- Bottom: user profile -->
    <template #append>
      <v-divider />

      <div class="pa-3 pb-1">
        <!-- User row -->
        <div class="d-flex align-center gap-3 px-1 py-2">
          <v-avatar color="primary" size="30">
            <span class="text-caption font-weight-bold">{{ userInitials }}</span>
          </v-avatar>

          <div class="overflow-hidden">
            <div class="text-body-2 font-weight-semibold text-truncate">{{ userName }}</div>
            <div class="text-caption text-medium-emphasis text-truncate">{{ userEmail }}</div>
          </div>
        </div>

        <!-- Sign out -->
        <v-btn
          block
          class="mt-1"
          color="error"
          prepend-icon="mdi-logout"
          size="small"
          variant="tonal"
          @click="handleSignOut"
        >
          Sign out
        </v-btn>
      </div>

      <div class="pb-2" />
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
  import { useAuthStore } from '@stores/auth'
  import { computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'

  defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
  }>()

  const route = useRoute()
  const router = useRouter()
  const { mdAndUp } = useDisplay()
  const authStore = useAuthStore()
  const { myProperties } = useOwnerProperties()

  const propertyCount = computed(() => myProperties.value.length || null)

  // 260 on md+ (permanent), 280 below (temporary overlay — wider for
  // readability when slid in). The CSS token --claro-drawer-width in
  // tokens.css is documentary only; this computed owns width selection.
  const drawerWidth = computed(() => mdAndUp.value ? 260 : 280)

  // ── Nav items ──────────────────────────────────────────────────
  const navItems = computed(() => [
    {
      label: 'Overview',
      icon: 'mdi-view-dashboard-outline',
      filledIcon: 'mdi-view-dashboard',
      to: '/owner/overview',
      disabled: false,
      soon: false,
      badge: null,
    },
    {
      label: 'Calendar',
      icon: 'mdi-calendar-month-outline',
      filledIcon: 'mdi-calendar-month',
      to: '/owner/calendar',
      disabled: false,
      soon: false,
      badge: null,
    },
    {
      label: 'Bookings',
      icon: 'mdi-calendar-check-outline',
      filledIcon: 'mdi-calendar-check',
      to: '/owner/bookings',
      disabled: false,
      soon: false,
      badge: null,
    },
    {
      label: 'Properties',
      icon: 'mdi-home-outline',
      filledIcon: 'mdi-home',
      to: '/owner/properties',
      disabled: false,
      soon: false,
      badge: propertyCount.value,
    },
    {
      label: 'Reports',
      icon: 'mdi-chart-line',
      filledIcon: 'mdi-chart-line',
      to: '/owner/reports',
      disabled: false,
      soon: false,
      badge: null,
    },
  ])

  const accountItems = [
    {
      label: 'Settings',
      icon: 'mdi-cog-outline',
      filledIcon: 'mdi-cog',
      to: '/owner/settings',
    },
  ]

  // ── Active state ───────────────────────────────────────────────
  function isActive (itemPath: string): boolean {
    if (itemPath === route.path) return true
    return route.path.startsWith(itemPath + '/')
  }

  // ── User info ──────────────────────────────────────────────────
  const userName = computed(() => {
    return authStore.user?.name
      || authStore.user?.email?.split('@')[0]
      || 'Owner'
  })

  const userEmail = computed(() => authStore.user?.email || '')

  const userInitials = computed(() => {
    return userName.value
      .split(' ')
      .map((n: string) => n[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2)
  })

  // ── Close on mobile nav ────────────────────────────────────────
  function onNavItemClick () {
    if (!mdAndUp.value) {
      emit('update:modelValue', false)
    }
  }

  async function handleSignOut () {
    await authStore.logout()
    router.push('/')
  }
</script>

<!-- Non-scoped: temporary drawers are teleported to v-app root, so scoped CSS can't reach them.
     Scoped to .owner-layout to avoid affecting admin drawers. -->
<style>
.owner-layout .v-navigation-drawer--temporary {
  top: var(--app-bar-height, 64px) !important;
  height: calc(100% - var(--app-bar-height, 64px)) !important;
}
</style>

<style scoped>
/* ── Variant B — Ghost → Bold + Scale ── */
.claro-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 12px;
}

.claro-nav-section-label {
  font-size: 0.65rem;
  color: var(--claro-fg3);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 800;
  padding: 12px 12px 8px;
  opacity: 0.5;
}

.claro-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  min-height: 48px;
  border-radius: 12px;
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: none;
  outline: none;
  font-family: var(--claro-font-family);
  color: var(--claro-fg2);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.claro-nav-item:hover {
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: var(--claro-fg1);
  transform: translateX(4px);
}

.claro-nav-item:focus-visible {
  outline: 2px solid var(--claro-primary);
  outline-offset: -2px;
}

/* Purple tint background on active — preserves current color styling */
.claro-nav-item--active {
  background: rgba(var(--v-theme-primary), 0.1) !important;
  color: var(--claro-primary) !important;
}

/* ── Icon: Ghost at rest → fills purple on active ── */
.claro-nav-icon {
  flex-shrink: 0;
  width: 24px;
  text-align: center;
  color: inherit;
  opacity: 0.7;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.claro-nav-item:hover .claro-nav-icon {
  opacity: 1;
  transform: scale(1.1);
}

/* Active: filled purple icon, scale overshoot */
.claro-nav-item--active .claro-nav-icon {
  opacity: 1;
  transform: scale(1.2);
}

/* ── Label: muted at rest → bold on active ── */
.claro-nav-label {
  flex: 1;
  min-width: 0;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.claro-nav-item--active .claro-nav-label {
  font-weight: 700;
}

/* ── Badge ── */
.claro-nav-badge {
  margin-left: auto;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 800;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: var(--claro-fg3);
}

.claro-nav-badge--active {
  background: var(--claro-primary);
  color: #fff;
}
</style>
