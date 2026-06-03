<template>
  <v-card class="h-100">
    <v-card-text class="pa-5">
      <h3 class="text-h6 font-weight-bold mb-4">
        Top Properties
      </h3>

      <div
        v-if="properties.length === 0"
        class="text-center text-medium-emphasis py-8"
      >
        No property data available
      </div>

      <v-list
        v-else
        class="pa-0"
        density="compact"
      >
        <v-list-item
          v-for="(prop, index) in properties"
          :key="index"
          class="px-0"
        >
          <template #prepend>
            <div
              class="property-dot me-3"
              :style="{ backgroundColor: prop.color }"
            />
          </template>

          <v-list-item-title class="text-body-2 font-weight-medium">
            {{ prop.name }}
          </v-list-item-title>

          <template #append>
            <v-chip
              color="primary"
              size="small"
              variant="tonal"
            >
              {{ prop.bookingCount }}
            </v-chip>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  defineProps<{
    properties: Array<{ name: string, color: string, bookingCount: number }>
  }>()
</script>
