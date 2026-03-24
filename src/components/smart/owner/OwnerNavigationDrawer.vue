<!-- src/components/smart/owner/OwnerNavigationDrawer.vue -->
<template>
  <v-navigation-drawer
    :model-value="modelValue"
    :permanent="mdAndUp"
    :temporary="!mdAndUp"
    width="264"
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
          :prepend-icon="item.icon"
          rounded="lg"
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

    <!-- My Properties list -->
    <div v-if="properties.length > 0" class="mt-1">
      <div class="text-overline text-medium-emphasis px-5 mb-1" style="font-size:0.67rem">My Properties</div>
      <v-list class="pa-0" density="compact" nav>
        <v-list-item
          v-for="(property, index) in properties"
          :key="property.id"
          :active="isActive(`/owner/properties/${property.id}`)"
          class="property-nav-item"
          color="primary"
          prepend-icon="mdi-home"
          rounded="lg"
          :style="{ '--property-icon-color': propertyColor(property, index) }"
          :title="formatPropertyAddress(property, 'short')"
          :to="`/owner/properties/${property.id}`"
          @click="onNavItemClick()"
        />
      </v-list>
    </div>
    <v-divider class="mx-4 my-1" />

    <!-- Account section -->
    <v-list density="compact" nav>
      <v-list-subheader class="text-overline">Account</v-list-subheader>
      <v-list-item
        v-for="item in accountItems"
        :key="item.label"
        :active="isActive(item.to)"
        color="primary"
        :prepend-icon="item.icon"
        rounded="lg"
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
  import type { Property } from '@/types/property'
  import { useOwnerProperties } from '@composables/owner/useOwnerProperties'
  import { useAuthStore } from '@stores/auth'
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import { formatPropertyAddress } from '@/types/property'
  import { PROPERTY_COLORS } from '@/utils/constants'

  defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
  }>()

  const route = useRoute()
  const { mdAndUp } = useDisplay()
  const authStore = useAuthStore()
  // useOwnerProperties exports `myProperties` — alias it for clarity in this component
  const { myProperties: properties } = useOwnerProperties()

  // ── Nav items ──────────────────────────────────────────────────
  const navItems = [
    { label: 'Schedule', icon: 'mdi-calendar-month-outline', to: '/owner/dashboard' },
    { label: 'Check-ins & Turns', icon: 'mdi-clipboard-check-outline', to: '/owner/checkins', disabled: true, soon: true },
    { label: 'Bookings', icon: 'mdi-format-list-bulleted', to: '/owner/bookings' },
    { label: 'Properties', icon: 'mdi-home-outline', to: '/owner/properties' },
  ]

  const accountItems = [
    { label: 'Settings', icon: 'mdi-cog-outline', to: '/owner/settings' },
  ]

  // ── Active state ───────────────────────────────────────────────
  function isActive (itemPath: string): boolean {
    if (itemPath === route.path) return true
    return route.path.startsWith(itemPath + '/')
  }

  // ── Property colors ────────────────────────────────────────────
  function propertyColor (property: Property, index: number): string {
    return property.color ?? PROPERTY_COLORS[index % PROPERTY_COLORS.length]
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

<style scoped>
.property-nav-item :deep(.v-list-item__prepend) {
  width: 56px;
  padding-left: 8px;
}

.property-nav-item :deep(.v-list-item__prepend .v-icon) {
  color: var(--property-icon-color) !important;
  opacity: 0.8;
}
</style>

<!-- Non-scoped: temporary drawers are teleported to v-app root, so scoped CSS can't reach them.
     Scoped to .owner-layout to avoid affecting admin drawers. -->
<style>
.owner-layout .v-navigation-drawer--temporary {
  top: var(--app-bar-height, 64px) !important;
  height: calc(100% - var(--app-bar-height, 64px)) !important;
}
</style>
