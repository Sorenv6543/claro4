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
    <v-list nav density="compact" class="pt-2">
      <v-list-subheader class="text-overline">Navigation</v-list-subheader>

      <template v-for="item in navItems" :key="item.label">
        <v-list-item
          :prepend-icon="item.icon"
          :title="item.label"
          :to="item.disabled ? undefined : item.to"
          :active="isActive(item.to)"
          :disabled="item.disabled"
          active-color="primary"
          rounded="lg"
          @click="item.disabled ? undefined : onNavItemClick()"
        >
          <template v-if="item.soon" #append>
            <v-chip size="x-small" color="success" variant="tonal" class="text-uppercase font-weight-bold">
              Soon
            </v-chip>
          </template>
        </v-list-item>
      </template>
    </v-list>

    <v-divider class="mx-4 my-1" />

    <!-- Account section -->
    <v-list nav density="compact">
      <v-list-subheader class="text-overline">Account</v-list-subheader>
      <v-list-item
        v-for="item in accountItems"
        :key="item.label"
        :prepend-icon="item.icon"
        :title="item.label"
        :to="item.to"
        :active="isActive(item.to)"
        active-color="primary"
        rounded="lg"
        @click="onNavItemClick()"
      />
    </v-list>

    <!-- Bottom: user profile + My Properties -->
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

        <!-- My Properties list -->
        <div v-if="properties.length" class="mt-1">
          <div class="text-overline text-medium-emphasis px-1 mb-1" style="font-size:0.67rem">My Properties</div>
          <v-list nav density="compact" class="pa-0">
            <v-list-item
              v-for="(property, index) in properties"
              :key="property.id"
              :to="`/owner/properties/${property.id}`"
              :active="isActive(`/owner/properties/${property.id}`)"
              active-color="primary"
              rounded="lg"
              class="property-nav-item"
              @click="onNavItemClick()"
            >
              <template #prepend>
                <v-icon
                  icon="mdi-home"
                  :style="{ color: propertyColor(index), opacity: 0.6 }"
                  size="20"
                />
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">
                {{ property.name }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
      </div>
      <div class="pb-2" />
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@stores/auth'
import { useOwnerProperties } from '@composables/owner/useOwnerProperties'

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
  { label: 'Schedule',          icon: 'mdi-calendar-month-outline',  to: '/owner/dashboard' },
  { label: 'Check-ins & Turns', icon: 'mdi-clipboard-check-outline', to: '/owner/checkins', disabled: true, soon: true },
  { label: 'Bookings',          icon: 'mdi-format-list-bulleted',     to: '/owner/bookings' },
  { label: 'Properties',        icon: 'mdi-home-outline',             to: '/owner/properties' },
]

const accountItems = [
  { label: 'Settings', icon: 'mdi-cog-outline', to: '/owner/settings' },
]

// ── Active state ───────────────────────────────────────────────
function isActive(itemPath: string): boolean {
  if (itemPath === route.path) return true
  return route.path.startsWith(itemPath + '/')
}

// ── Property colors ────────────────────────────────────────────
const PROPERTY_COLORS = ['#5c6bc0', '#43a047', '#8e24aa', '#f57c00']
function propertyColor(index: number): string {
  return PROPERTY_COLORS[index % PROPERTY_COLORS.length]
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
function onNavItemClick() {
  if (!mdAndUp.value) {
    emit('update:modelValue', false)
  }
}
</script>

<style scoped>
.property-nav-item :deep(.v-list-item__prepend) {
  width: 36px;
}
</style>
