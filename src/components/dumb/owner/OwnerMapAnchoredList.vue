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
    'delete': [propertyId: string]
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
              aria-label="Edit property"
              density="compact"
              icon
              size="small"
              variant="text"
              @click.stop="emit('edit', item.property.id)"
            >
              <v-icon size="16">mdi-pencil-outline</v-icon>
            </v-btn>

            <v-btn
              aria-label="Delete property"
              color="error"
              density="compact"
              icon
              size="small"
              variant="text"
              @click.stop="emit('delete', item.property.id)"
            >
              <v-icon size="16">mdi-delete-outline</v-icon>
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
        class="property-card glass-card"
        @click="emit('more', item.property.id)"
      >
        <div class="card-color-strip" :style="{ background: item.property.color }" />

        <v-card-text class="card-body">
          <div class="card-name">{{ formatPropertyAddress(item.property, 'short') }}</div>

          <div class="card-meta">
            <v-chip
              v-if="item.isTurnToday"
              class="mr-1"
              color="warning"
              size="x-small"
              variant="tonal"
            >Turn Today</v-chip>

            <span v-if="item.nextCheckin" class="next-checkin">{{ item.nextCheckin.label }}</span>
            <span v-else class="no-booking">No upcoming bookings</span>
          </div>

          <div class="card-stats">
            <div class="stat-item">
              <v-icon size="14">mdi-swap-horizontal</v-icon>
              <span>{{ item.stats.turnsYtd ?? 0 }} turns YTD</span>
            </div>

            <div v-if="item.stats.avgCleanMin" class="stat-item">
              <v-icon size="14">mdi-clock-outline</v-icon>
              <span>{{ item.stats.avgCleanMin }}m clean</span>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="card-actions">
          <v-btn
            color="primary"
            rounded="pill"
            size="small"
            variant="tonal"
            @click.stop="emit('view-calendar', item.property.id)"
          >
            <v-icon size="14" start>mdi-calendar</v-icon>
            Calendar
          </v-btn>

          <v-spacer />

          <v-btn
            aria-label="Edit property"
            color="secondary"
            density="compact"
            icon
            size="small"
            variant="text"
            @click.stop="emit('edit', item.property.id)"
          >
            <v-icon size="18">mdi-pencil-outline</v-icon>
          </v-btn>

          <v-btn
            aria-label="Delete property"
            color="error"
            density="compact"
            icon
            size="small"
            variant="text"
            @click.stop="emit('delete', item.property.id)"
          >
            <v-icon size="18">mdi-delete-outline</v-icon>
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
  background: var(--claro-background);
  overflow: hidden;
}

/* Subtle map grid lines */
.map-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(var(--v-theme-on-surface), 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--v-theme-on-surface), 0.04) 1px, transparent 1px);
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
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.map-pin:hover {
  transform: translate(-50%, -110%) scale(1.1);
}

.pin-label {
  font-size: 10px;
  font-weight: 700;
  font-family: Inter, sans-serif;
  background: var(--claro-glass-bg);
  backdrop-filter: var(--claro-glass-blur);
  border: 1px solid var(--claro-glass-border);
  border-radius: 9999px;
  padding: 2px 10px;
  margin-top: -4px;
  white-space: nowrap;
  box-shadow: var(--claro-shadow-sm);
}

.map-badge {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: var(--claro-glass-bg);
  backdrop-filter: var(--claro-glass-blur);
  border: 1px solid var(--claro-glass-border);
  border-radius: 9999px;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 700;
  font-family: Inter, sans-serif;
  color: var(--claro-fg1);
  display: flex;
  align-items: center;
  box-shadow: var(--claro-shadow-md);
}

/* Anchored bottom panel */
.anchored-panel {
  flex: 1;
  background: var(--claro-glass-bg);
  backdrop-filter: var(--claro-glass-blur);
  border: 1px solid var(--claro-glass-border);
  border-radius: 24px 24px 0 0;
  margin-top: -12px;
  box-shadow: var(--claro-shadow-lg);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.drag-handle {
  width: 40px;
  height: 5px;
  border-radius: 9999px;
  background: var(--claro-divider);
  margin: 12px auto 8px;
  flex-shrink: 0;
}

.panel-list {
  padding: 0;
  background: transparent;
}

.panel-item {
  border-bottom: 1px solid var(--claro-divider);
  cursor: pointer;
  padding: 12px 16px;
}

.panel-item:last-child {
  border-bottom: none;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}

.item-name {
  font-size: 15px !important;
  font-weight: 700 !important;
  color: var(--claro-fg1) !important;
}

/* ── Desktop grid ──────────────────────────────────────────── */

.desktop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.grid-skeleton {
  grid-column: 1 / -1;
}

.property-card {
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 24px !important;
}

.property-card:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: rgba(var(--v-theme-primary), 0.3) !important;
}

.card-color-strip {
  height: 6px;
  width: 100%;
}

.card-body {
  padding: 20px 24px 12px;
}

.card-name {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--claro-fg1);
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.next-checkin {
  font-size: 13px;
  font-weight: 600;
  color: var(--claro-fg2);
}

.no-booking {
  font-size: 13px;
  color: var(--claro-fg3);
}

.card-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--claro-fg3);
}

.card-actions {
  padding: 12px 16px 16px;
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
