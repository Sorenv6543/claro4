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
    <v-list class="pt-2" density="comfortable" nav>
      <v-list-subheader class="text-overline">Navigation</v-list-subheader>

      <template v-for="item in navItems" :key="item.label">
        <v-list-item
          :active="isActive(item.to)"
          color="primary"
          :disabled="item.disabled"
          :prepend-icon="isActive(item.to) ? item.filledIcon : item.icon"
          :title="item.label"
          :to="item.disabled ? undefined : item.to"
          @click="item.disabled ? undefined : onNavItemClick()"
        >
          <template v-if="item.soon" #append>
            <v-chip class="text-uppercase font-weight-bold" color="success" size="small" variant="tonal">
              Soon
            </v-chip>
          </template>
        </v-list-item>
      </template>
    </v-list>

    <v-divider class="mx-4 my-1" />

    <!-- Account section -->
    <v-list density="compact" nav>
      <v-list-subheader class="text-overline">Account</v-list-subheader>
      <v-list-item
        v-for="item in accountItems"
        :key="item.label"
        :active="isActive(item.to)"
        color="primary"
        :prepend-icon="isActive(item.to) ? item.filledIcon : item.icon"
        :title="item.label"
        :to="item.to"
        @click="onNavItemClick()"
      />
    </v-list>

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

      </div>
      <div class="pb-2" />
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
  import { useAuthStore } from '@stores/auth';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';

  defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
  }>()

  const route = useRoute()
  const { mdAndUp } = useDisplay()
  const authStore = useAuthStore()

  // 260 on md+ (permanent), 280 below (temporary overlay — wider for
  // readability when slid in). The CSS token --claro-drawer-width in
  // tokens.css is documentary only; this computed owns width selection.
  const drawerWidth = computed(() => mdAndUp.value ? 260 : 280)

  // ── Nav items ──────────────────────────────────────────────────
  const navItems = [
    {
      label: 'Overview',
      icon: 'mdi-view-dashboard-outline',
      filledIcon: 'mdi-view-dashboard',
      to: '/owner/overview',
      disabled: false,
      soon: false,
    },
    {
      label: 'Calendar',
      icon: 'mdi-calendar-month-outline',
      filledIcon: 'mdi-calendar-month',
      to: '/owner/calendar',
      disabled: false,
      soon: false,
    },
    {
      label: 'Bookings',
      icon: 'mdi-calendar-check-outline',
      filledIcon: 'mdi-calendar-check',
      to: '/owner/bookings',
      disabled: false,
      soon: false,
    },
    {
      label: 'Properties',
      icon: 'mdi-home-outline',
      filledIcon: 'mdi-home',
      to: '/owner/properties',
      disabled: false,
      soon: false,
    },
    {
      label: 'Reports',
      icon: 'mdi-chart-line',
      filledIcon: 'mdi-chart-line',
      to: '/owner/reports',
      disabled: false,
      soon: false,
    },
  ]

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
</script>

<!-- Non-scoped: temporary drawers are teleported to v-app root, so scoped CSS can't reach them.
     Scoped to .owner-layout to avoid affecting admin drawers. -->
<style>
.owner-layout .v-navigation-drawer--temporary {
  top: var(--app-bar-height, 64px) !important;
  height: calc(100% - var(--app-bar-height, 64px)) !important;
}
</style>
