<!-- src/components/smart/owner/OwnerBottomNav.vue -->
<template>
  <v-bottom-navigation
    v-if="smAndDown"
    :model-value="activeTab"
    color="primary"
    grow
    elevation="8"
  >
    <v-btn value="/owner/dashboard" :to="'/owner/dashboard'">
      <v-icon>mdi-calendar-month-outline</v-icon>
      <span>Schedule</span>
    </v-btn>
    <v-btn value="/owner/bookings" :to="'/owner/bookings'">
      <v-icon>mdi-format-list-bulleted</v-icon>
      <span>Bookings</span>
    </v-btn>
    <v-btn value="/owner/properties" :to="'/owner/properties'">
      <v-icon>mdi-home-outline</v-icon>
      <span>Properties</span>
    </v-btn>
    <v-btn value="more" @click="emit('open-drawer')">
      <v-icon>mdi-menu</v-icon>
      <span>More</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'

const emit = defineEmits<{ 'open-drawer': [] }>()

const route = useRoute()
const { smAndDown } = useDisplay()

const activeTab = computed(() => {
  const path = route.path
  if (path.startsWith('/owner/bookings')) return '/owner/bookings'
  if (path.startsWith('/owner/properties')) return '/owner/properties'
  if (path === '/owner/dashboard') return '/owner/dashboard'
  return undefined
})
</script>
