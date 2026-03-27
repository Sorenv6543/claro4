<template>
  <v-card class="h-100">
    <v-card-text class="pa-5">
      <h3 class="text-h6 font-weight-bold mb-4">
        Upcoming Checkouts
      </h3>

      <div
        v-if="checkouts.length === 0"
        class="text-center text-medium-emphasis py-8"
      >
        <v-icon
          color="grey-lighten-1"
          size="40"
        >
          mdi-calendar-blank
        </v-icon>
        <p class="text-body-2 mt-2">
          No upcoming checkouts
        </p>
      </div>

      <v-list
        v-else
        class="pa-0"
        density="compact"
      >
        <v-list-item
          v-for="(item, index) in checkouts"
          :key="index"
          class="px-0"
        >
          <template #prepend>
            <v-avatar
              color="primary"
              size="36"
              variant="tonal"
            >
              <v-icon size="18">
                mdi-exit-to-app
              </v-icon>
            </v-avatar>
          </template>

          <v-list-item-title class="text-body-2 font-weight-medium">
            {{ item.property }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption">
            {{ item.date }}
          </v-list-item-subtitle>

          <template #append>
            <v-chip
              :color="statusColor(item.status)"
              size="x-small"
              variant="flat"
            >
              {{ item.status }}
            </v-chip>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { getBookingStatusColor as statusColor } from '@/utils/constants'

  defineProps<{
    checkouts: Array<{ property: string, date: string, status: string }>
  }>()
</script>
