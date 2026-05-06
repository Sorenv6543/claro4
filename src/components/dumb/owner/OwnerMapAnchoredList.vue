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

<style scoped>
/* ── Mobile layout ─────────────────────────────────────────── */

.map-layout {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - var(--app-bar-height, 64px) - 56px); /* subtract bottom nav */
  overflow: hidden;
}

.map-zone {
  position: relative;
  flex: 0 0 42%;
  background: #e8edf0;
  overflow: hidden;
}

/* Subtle map grid lines */
.map-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px);
  background-size: 40px 40px;
}

.map-pin {
  position: absolute;
  transform: translate(-50%, -100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
}

.pin-label {
  font-size: 9px;
  font-weight: 600;
  font-family: Inter, sans-serif;
  background: #fff;
  border-radius: 9999px;
  padding: 1px 6px;
  margin-top: -2px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

.map-badge {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(255,255,255,0.92);
  border-radius: 9999px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  font-family: Inter, sans-serif;
  color: var(--claro-on-background);
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
}

/* Anchored bottom panel */
.anchored-panel {
  flex: 1;
  background: var(--claro-surface);
  border-radius: 12px 12px 0 0;
  margin-top: -12px;
  box-shadow: var(--claro-shadow-sm);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.drag-handle {
  width: 36px;
  height: 4px;
  border-radius: 9999px;
  background: var(--claro-divider);
  margin: 10px auto 4px;
  flex-shrink: 0;
}

.panel-list {
  padding: 0;
}

.panel-item {
  border-bottom: 1px solid var(--claro-divider);
  cursor: pointer;
}

.panel-item:last-child {
  border-bottom: none;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  margin-right: 4px;
  flex-shrink: 0;
}

.item-name {
  font-size: 14px !important;
  font-weight: 500 !important;
}

/* ── Desktop grid ──────────────────────────────────────────── */

.desktop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.grid-skeleton {
  grid-column: 1 / -1;
}

.property-card {
  cursor: pointer;
  overflow: hidden;
  transition: box-shadow 0.15s;
}

.property-card:hover {
  box-shadow: var(--claro-shadow-md) !important;
}

.card-color-bar {
  height: 4px;
  width: 100%;
}

.card-body {
  padding: 14px 16px 10px;
}

.card-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--claro-on-background);
  margin-bottom: 6px;
}

.card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.next-checkin {
  font-size: 12px;
  color: var(--claro-text-secondary);
}

.no-booking {
  font-size: 12px;
  color: var(--claro-text-secondary);
}

.card-stats {
  font-size: 11px;
  color: var(--claro-text-secondary);
  display: flex;
  gap: 4px;
}

.stat-dot {
  opacity: 0.4;
}

.card-actions {
  padding: 4px 8px;
}

/* ── Shared ─────────────────────────────────────────────────── */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-text {
  font-size: 14px;
  color: var(--claro-text-secondary);
}
</style>
