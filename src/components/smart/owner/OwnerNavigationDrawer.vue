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
