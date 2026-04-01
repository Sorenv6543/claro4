<script setup lang="ts">
  import { ref } from 'vue'

  export interface CleanerAvailabilityItem {
    id: string
    name: string
    assigned: number
    total: number
    isTeam?: boolean
    todayBookings?: Array<{ id: string, propertyName: string, time: string }>
  }

  defineProps<{
    cleaners: CleanerAvailabilityItem[]
  }>()

  const expandedId = ref<string | null>(null)

  function toggleExpand (id: string) {
    expandedId.value = expandedId.value === id ? null : id
  }

  function utilizationPercent (item: CleanerAvailabilityItem): number {
    if (item.total === 0) return 0
    return Math.round((item.assigned / item.total) * 100)
  }

  function utilizationColor (item: CleanerAvailabilityItem): string {
    const pct = utilizationPercent(item)
    if (pct >= 75) return 'error'
    if (pct >= 50) return 'warning'
    return 'success'
  }

  function initials (name: string): string {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
  }
</script>

<template>
  <v-card class="mb-3" rounded="lg" variant="outlined">
    <v-card-text>
      <div class="text-subtitle-2 font-weight-bold mb-3">
        <v-icon class="mr-1" icon="mdi-account-group-outline" size="18" />
        Cleaner Availability
      </div>

      <div v-for="item in cleaners" :key="item.id" class="mb-2">
        <div
          class="d-flex align-center ga-2 cursor-pointer"
          @click="toggleExpand(item.id)"
        >
          <v-avatar :color="item.isTeam ? 'blue-grey' : 'primary'" size="22" variant="tonal">
            <span class="text-caption">{{ item.isTeam ? 'T' : initials(item.name) }}</span>
          </v-avatar>
          <span class="text-body-2 flex-grow-1 text-truncate">{{ item.name }}</span>
          <v-progress-linear
            :color="utilizationColor(item)"
            height="6"
            :model-value="utilizationPercent(item)"
            rounded
            style="max-width: 80px;"
          />
          <span class="text-caption text-medium-emphasis" style="min-width: 28px; text-align: right;">
            {{ item.assigned }}/{{ item.total }}
          </span>
        </div>

        <v-expand-transition>
          <div v-if="expandedId === item.id && item.todayBookings?.length" class="ml-8 mt-1">
            <div
              v-for="booking in item.todayBookings"
              :key="booking.id"
              class="text-caption text-medium-emphasis"
            >
              {{ booking.time }} — {{ booking.propertyName }}
            </div>
          </div>
        </v-expand-transition>
      </div>
    </v-card-text>
  </v-card>
</template>
