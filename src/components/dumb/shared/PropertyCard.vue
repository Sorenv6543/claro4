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
        <v-row density="comfortable">
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
