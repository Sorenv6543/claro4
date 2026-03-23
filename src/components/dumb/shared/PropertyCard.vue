<template>
  <v-card
    class="property-card hover-elevate glass-card fade-in"
    :class="{
      'inactive-property': !property.active,
      'card-hover': isHovered
    }"
    :elevation="isHovered ? 8 : 2"
    @click="emit('view', property.id)"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Enhanced Header with Status and Quick Actions -->
    <v-card-title class="property-header pa-3">
      <div class="header-content">
        <div class="property-title-section">
          <div class="property-name text-truncate">
            {{ formatPropertyAddress(property, 'short') }}
          </div>
          <div class="property-address text-caption text-medium-emphasis">
            <v-icon
              class="mr-1"
              icon="mdi-map-marker"
              size="x-small"
            />
            {{ formatPropertyAddress(property) }}
          </div>
        </div>

        <div class="header-actions">
          <v-chip
            class="status-chip"
            :color="activeStatusColor"
            size="small"
            :variant="property.active ? 'flat' : 'outlined'"
          >
            <v-icon
              class="mr-1"
              :icon="property.active ? 'mdi-check-circle' : 'mdi-pause-circle'"
              size="x-small"
            />
            {{ property.active ? 'Active' : 'Inactive' }}
          </v-chip>
        </div>
      </div>
    </v-card-title>

    <!-- Enhanced Content with Better Information Architecture -->
    <v-card-text class="property-content pa-3 pt-1">
      <!-- Key Metrics Row -->
      <div class="metrics-grid mb-3">
        <div class="metric-item">
          <v-icon
            class="metric-icon"
            :color="property.active ? 'primary' : 'disabled'"
            icon="mdi-clock-outline"
            size="small"
          />
          <div class="metric-content">
            <div class="metric-label">
              Duration
            </div>
            <div class="metric-value">
              {{ formattedCleaningDuration }}
            </div>
          </div>
        </div>

        <div class="metric-item">
          <v-icon
            class="metric-icon"
            :color="pricingTierColor"
            icon="mdi-star-outline"
            size="small"
          />
          <div class="metric-content">
            <div class="metric-label">
              Tier
            </div>
            <div class="metric-value text-capitalize">
              {{ property.pricing_tier }}
            </div>
          </div>
        </div>
      </div>

      <!-- Special Instructions with Enhanced Display -->
      <div
        v-if="property.special_instructions"
        class="special-instructions"
      >
        <v-expansion-panels
          class="instructions-panel"
          variant="accordion"
        >
          <v-expansion-panel
            elevation="0"
            :title="`Special Instructions (${property.special_instructions.length} chars)`"
          >
            <v-expansion-panel-text class="pt-2">
              <div class="instructions-content">
                <v-icon
                  class="mr-2 instructions-icon"
                  color="info"
                  icon="mdi-information-outline"
                  size="small"
                />
                {{ property.special_instructions }}
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

      <!-- Property Stats (if available) -->
      <div class="property-stats mt-3">
        <v-row dense>
          <v-col cols="6">
            <div class="stat-item">
              <v-icon
                class="mr-1"
                color="success"
                icon="mdi-calendar-check"
                size="x-small"
              />
              <span class="text-caption">Recent bookings: {{ recentBookingsCount }}</span>
            </div>
          </v-col>
          <v-col cols="6">
            <div class="stat-item">
              <v-icon
                class="mr-1"
                color="info"
                icon="mdi-trending-up"
                size="x-small"
              />
              <span class="text-caption">Last cleaned: {{ lastCleanedText }}</span>
            </div>
          </v-col>
        </v-row>
      </div>
    </v-card-text>

    <!-- Enhanced Action Bar with Quick Actions -->
    <v-card-actions
      v-if="displayActions"
      class="action-bar pa-2"
      :class="{ 'actions-visible': isHovered || $vuetify.display.smAndDown }"
    >
      <v-spacer />

      <!-- Quick Action Buttons -->
      <v-btn
        class="action-btn"
        color="primary"
        prepend-icon="mdi-calendar-plus"
        size="small"
        variant="text"
        @click.stop="handleQuickBooking"
      >
        Book
      </v-btn>

      <v-btn
        class="action-btn"
        color="secondary"
        prepend-icon="mdi-pencil"
        size="small"
        variant="text"
        @click.stop="emit('edit', property.id)"
      >
        Edit
      </v-btn>

    </v-card-actions>

    <!-- Hover Overlay for Enhanced Interactivity -->
    <v-overlay
      v-model="isHovered"
      class="property-overlay"
      contained
      opacity="0.05"
    >
      <div class="overlay-content">
        <v-icon
          color="primary"
          icon="mdi-cursor-pointer"
          size="small"
        />
        <span class="text-caption">Click to view</span>
      </div>
    </v-overlay>
  </v-card>
</template>

<script setup lang="ts">
  import type { PricingTier, Property } from '@/types'
  import { computed, ref } from 'vue'
  import { formatPropertyAddress } from '@/types/property'

  interface Props {
    property: Property
    displayActions?: boolean
    recentBookingsCount?: number
    lastCleaned?: Date | string | null
  }

  interface Emits {
    (e: 'edit' | 'delete' | 'view' | 'quick-booking', id: string): void
  }

  const props = withDefaults(defineProps<Props>(), {
    displayActions: true,
    recentBookingsCount: 0,
    lastCleaned: null,
  })

  const emit = defineEmits<Emits>()

  // Reactive hover state for enhanced interactions
  const isHovered = ref(false)

  // Format cleaning duration from minutes to hours and minutes
  const formattedCleaningDuration = computed((): string => {
    const { cleaning_duration } = props.property

    if (cleaning_duration < 60) {
      return `${cleaning_duration}m`
    }

    const hours = Math.floor(cleaning_duration / 60)
    const minutes = cleaning_duration % 60

    if (minutes === 0) {
      return `${hours}h`
    }

    return `${hours}h ${minutes}m`
  })

  // Format last cleaned date
  const lastCleanedText = computed((): string => {
    if (!props.lastCleaned) return 'Never'

    const date = new Date(props.lastCleaned)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`

    return date.toLocaleDateString()
  })

  // Determine pricing tier color with enhanced palette
  const pricingTierColor = computed((): string => {
    const tierColors: Record<PricingTier, string> = {
      basic: 'blue-grey',
      standard: 'primary',
      premium: 'deep-purple',
      luxury: 'amber',
    }

    return tierColors[props.property.pricing_tier]
  })

  // Determine active status color
  const activeStatusColor = computed((): string => {
    return props.property.active ? 'success' : 'warning'
  })

  // Quick action handlers
  function handleQuickBooking () {
    emit('quick-booking', props.property.id)
  }

</script>

<style scoped>
/* Enhanced card theming with better visual hierarchy */
.property-card {
  position: relative;
  background: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  border: 1px solid rgba(var(--v-theme-outline), 0.12) !important;
  border-top: 3px solid rgb(var(--v-theme-primary)) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
}

.property-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-shadow), 0.15) !important;
  border-color: rgba(var(--v-theme-primary), 0.4) !important;
}

.property-card.card-hover {
  background: rgb(var(--v-theme-surface-variant)) !important;
}

.property-card.inactive-property {
  opacity: 0.8;
  border-top-color: rgb(var(--v-theme-warning)) !important;
}

/* Enhanced header layout */
.property-header {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, transparent 100%);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.08);
}

.header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.property-title-section {
  flex: 1;
  min-width: 0;
}

.property-name {
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 4px;
}

.property-address {
  opacity: 0.8;
  display: flex;
  align-items: center;
}

.header-actions {
  flex-shrink: 0;
}

.status-chip {
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* Enhanced content layout */
.property-content {
  position: relative;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.metric-item:hover {
  background: rgba(var(--v-theme-surface-variant), 0.5);
}

.metric-icon {
  flex-shrink: 0;
}

.metric-content {
  flex: 1;
  min-width: 0;
}

.metric-label {
  font-size: 0.75rem;
  opacity: 0.7;
  line-height: 1;
  margin-bottom: 2px;
}

.metric-value {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
}

/* Special instructions enhancement */
.special-instructions {
  margin-top: 12px;
}

.instructions-panel {
  box-shadow: none !important;
}

.instructions-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(var(--v-theme-info), 0.05);
  border-radius: 6px;
  border-left: 3px solid rgb(var(--v-theme-info));
}

.instructions-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

/* Property stats */
.property-stats {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.08);
  padding-top: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  opacity: 0.8;
}

/* Enhanced action bar */
.action-bar {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-top: 1px solid rgba(var(--v-theme-outline), 0.08);
  transition: all 0.3s ease;
  opacity: 0.7;
}

.action-bar.actions-visible {
  opacity: 1;
  background: rgba(var(--v-theme-surface-variant), 0.5);
}

.action-btn {
  transition: all 0.2s ease;
  border-radius: 8px !important;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(var(--v-theme-shadow), 0.15);
}

/* Overlay for enhanced interactivity */
.property-overlay {
  pointer-events: none;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: rgb(var(--v-theme-primary));
  opacity: 0.6;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .header-content {
    flex-direction: column;
    gap: 8px;
  }

  .header-actions {
    align-self: flex-end;
  }

  .action-bar {
    opacity: 1;
  }
}

/* Animation classes */
.fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hover-elevate {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Glass card effect enhancement */
.glass-card {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
</style>
