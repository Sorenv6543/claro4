<script setup lang="ts">
  import type { PropertyListItem } from './PropertyList.vue'
  import type { CSSProperties } from 'vue'
  import { useDisplay } from 'vuetify'
  import { formatPropertyAddress } from '@/types/property'

  defineOptions({ name: 'OwnerMapAnchoredList' })

  withDefaults(defineProps<{
    items: PropertyListItem[]
    loading?: boolean
  }>(), {
    loading: false,
  })

  const emit = defineEmits<{
    'assign-cleaner': [propertyId: string]
    'view-calendar': [propertyId: string]
    'edit': [propertyId: string]
    'more': [propertyId: string]
  }>()

  const { mobile } = useDisplay()

  // Deterministic pin spread — golden-ratio-based so pins don't cluster
  function pinStyle (index: number): CSSProperties {
    const seed = index * 137.508
    const x = 8 + ((seed * 3.7) % 68)
    const y = 12 + ((seed * 2.3) % 58)
    return { left: `${x}%`, top: `${y}%` }
  }

</script>

<script lang="ts">
  export { type PropertyListEvent, type PropertyListItem, type PropertyStats, type PropertyTimelineEvent } from './PropertyList.vue'
</script>

<template>
  <!-- ── Mobile: B3 Map-anchored layout ── -->
  <div v-if="mobile" class="map-layout">

    <!-- Map zone -->
    <div class="map-zone">
      <div class="map-grid" />

      <template v-if="!loading">
        <button
          v-for="(item, i) in items"
          :key="item.property.id"
          class="map-pin"
          :style="pinStyle(i)"
          @click="emit('more', item.property.id)"
        >
          <v-icon :color="item.property.color" size="30">mdi-map-marker</v-icon>

          <span class="pin-label" :style="{ color: item.property.color }">
            {{ formatPropertyAddress(item.property, 'short') }}
          </span>
        </button>
      </template>

      <div class="map-badge">
        <v-icon class="mr-1" color="primary" size="12">mdi-home-group</v-icon>
        {{ items.length }} properties
      </div>
    </div>

    <!-- Anchored panel -->
    <div class="anchored-panel">
      <div class="drag-handle" />

      <v-skeleton-loader v-if="loading" class="px-3 pt-2" type="list-item-two-line@4" />

      <div v-else-if="items.length === 0" class="empty-state">
        <v-icon class="mb-2" color="primary" size="32">mdi-home-plus-outline</v-icon>
        <p class="empty-text">No properties yet</p>
      </div>

      <v-list v-else class="panel-list" lines="two">
        <v-list-item
          v-for="item in items"
          :key="item.property.id"
          class="panel-item"
          @click="emit('more', item.property.id)"
        >
          <template #prepend>
            <div class="color-dot" :style="{ background: item.property.color }" />
          </template>

          <v-list-item-title class="item-name">{{ formatPropertyAddress(item.property, 'short') }}</v-list-item-title>

          <v-list-item-subtitle>
            <template v-if="item.nextCheckin">{{ item.nextCheckin.label }}</template>
            <template v-else>No upcoming bookings</template>
          </v-list-item-subtitle>

          <template #append>
            <v-chip
              v-if="item.isTurnToday"
              class="mr-2"
              color="warning"
              label
              size="x-small"
            >Turn</v-chip>

            <v-btn
              density="compact"
              icon
              size="small"
              variant="text"
              @click.stop="emit('edit', item.property.id)"
            >
              <v-icon size="16">mdi-pencil-outline</v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </v-list>
    </div>
  </div>

  <!-- ── Desktop: responsive card grid ── -->
  <div v-else class="desktop-grid">
    <v-skeleton-loader v-if="loading" class="grid-skeleton" type="card@3" />

    <template v-else>
      <div v-if="items.length === 0" class="empty-state">
        <v-icon class="mb-3" color="primary" size="48">mdi-home-plus-outline</v-icon>
        <p class="empty-text">No properties yet</p>
      </div>

      <v-card
        v-for="item in items"
        :key="item.property.id"
        class="property-card"
        rounded="sm"
        style="box-shadow: var(--claro-shadow-sm);"
        @click="emit('more', item.property.id)"
      >
        <div class="card-color-bar" :style="{ background: item.property.color }" />

        <v-card-text class="card-body">
          <div class="card-name">{{ formatPropertyAddress(item.property, 'short') }}</div>

          <div class="card-meta">
            <v-chip
              v-if="item.isTurnToday"
              class="mr-1"
              color="warning"
              size="x-small"
            >Turn Today</v-chip>

            <span v-if="item.nextCheckin" class="next-checkin">{{ item.nextCheckin.label }}</span>
            <span v-else class="no-booking">No upcoming bookings</span>
          </div>

          <div class="card-stats">
            <span>{{ item.stats.turnsYtd ?? 0 }} turns YTD</span>

            <template v-if="item.stats.avgCleanMin">
              <span class="stat-dot">·</span>
              <span>{{ item.stats.avgCleanMin }}min clean</span>
            </template>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="card-actions">
          <v-btn
            size="small"
            variant="text"
            @click.stop="emit('view-calendar', item.property.id)"
          >
            <v-icon size="14" start>mdi-calendar</v-icon>
            Calendar
          </v-btn>

          <v-spacer />

          <v-btn
            density="compact"
            icon
            size="small"
            variant="text"
            @click.stop="emit('edit', item.property.id)"
          >
            <v-icon size="16">mdi-pencil-outline</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </div>
</template>
