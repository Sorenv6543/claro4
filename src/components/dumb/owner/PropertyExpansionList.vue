<template>
  <v-skeleton-loader v-if="loading" type="list-item-two-line@4" />

  <v-empty-state
    v-else-if="properties.length === 0"
    icon="mdi-home-outline"
    title="No Properties Yet"
    text="Add your first property to start managing bookings and cleanings."
  />

  <v-expansion-panels v-else v-model="expandedPanel" variant="accordion">
    <v-expansion-panel
      v-for="p in properties"
      :key="p.id"
      :value="p.id"
      :class="{ 'panel-scrim': expandedPanel != null && expandedPanel !== p.id }"
    >
      <v-expansion-panel-title>
        <div class="d-flex align-center ga-3 w-100">
          <div
            class="prop-color-bar"
            :style="{ background: mapLegacyPropertyColor(p.color, 'var(--claro-secondary)') }"
          />
          <div class="flex-grow-1 min-width-0">
            <div class="text-body-2 font-weight-medium text-truncate">{{ p.display_name }}</div>
          </div>
          <v-chip :color="p.active ? 'success' : 'error'" size="x-small" variant="tonal">
            {{ p.active ? 'Active' : 'Inactive' }}
          </v-chip>
          <v-chip color="secondary" size="x-small" variant="tonal" class="d-none d-sm-flex">
            <v-icon size="12" start>{{ getPropertyIcon(p.property_type) }}</v-icon>
            {{ p.property_type || 'N/A' }}
          </v-chip>
        </div>
      </v-expansion-panel-title>

      <v-expansion-panel-text>
        <v-row>
          <v-col cols="12" sm="6">
            <div class="text-caption text-medium-emphasis mb-2">Upcoming Bookings</div>
            <v-empty-state
              v-if="!upcomingByProperty.get(p.id)?.length"
              icon="mdi-calendar-blank-outline"
              size="48"
              title="No upcoming bookings"
            />
            <v-timeline v-else density="compact" side="end" truncate-line="both">
              <v-timeline-item
                v-for="b in upcomingByProperty.get(p.id)"
                :key="b.id"
                dot-color="primary"
                size="x-small"
              >
                <div class="text-body-2 font-weight-medium">{{ formatDate(b.checkin_date) }}</div>
                <div class="text-caption text-medium-emphasis">→ {{ formatDate(b.checkout_date) }}</div>
                <v-chip class="mt-1" :color="getBookingStatusColor(b.status)" size="x-small" variant="tonal">
                  {{ formatStatus(b.status) }}
                </v-chip>
              </v-timeline-item>
            </v-timeline>
          </v-col>

          <v-col cols="12" sm="6">
            <div class="text-caption text-medium-emphasis mb-2">Turn Bookings</div>
            <v-empty-state
              v-if="!turnsByProperty.get(p.id)?.length"
              icon="mdi-swap-horizontal"
              size="48"
              title="No turns scheduled"
            />
            <v-timeline v-else density="compact" side="end" truncate-line="both">
              <v-timeline-item
                v-for="b in turnsByProperty.get(p.id)"
                :key="b.id"
                :dot-color="b.priority === 'urgent' ? 'error' : 'warning'"
                size="x-small"
              >
                <div class="text-body-2 font-weight-medium">Turn {{ formatDate(b.turn_date ?? b.checkout_date) }}</div>
                <TurnPriorityBadge :animated="false" class="mt-1" :priority="b.priority" size="x-small" />
              </v-timeline-item>
            </v-timeline>
          </v-col>
        </v-row>

        <div class="d-flex ga-2 mt-3 justify-end">
          <v-btn
            color="primary"
            prepend-icon="mdi-eye-outline"
            size="small"
            variant="text"
            @click.stop="emit('view', p.id)"
          >
            View
          </v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-pencil-outline"
            size="small"
            variant="text"
            @click.stop="emit('edit', p.id)"
          >
            Edit
          </v-btn>
          <v-tooltip
            content-class="claro-tooltip"
            location="start"
            :offset="6"
            :text="p.booking_count > 0 ? `Cannot delete — ${p.booking_count} booking${p.booking_count === 1 ? '' : 's'} exist` : 'Delete property'"
          >
            <template #activator="{ props: tooltipProps }">
              <div v-bind="tooltipProps">
                <v-btn
                  color="error"
                  :disabled="p.booking_count > 0"
                  prepend-icon="mdi-delete-outline"
                  size="small"
                  variant="text"
                  @click.stop="emit('delete', p.id)"
                >
                  Delete
                </v-btn>
              </div>
            </template>
          </v-tooltip>
        </div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup lang="ts">
  import type { Booking } from '@/types/booking'
  import type { Property } from '@/types/property'
  import { computed, ref } from 'vue'
  import { formatStatus, getBookingStatusColor, mapLegacyPropertyColor } from '@/utils/constants'
  import TurnPriorityBadge from '@/components/dumb/shared/TurnPriorityBadge.vue'

  type PropertyItem = Property & {
    display_name: string
    full_address: string
    booking_count: number
  }

  interface Props {
    properties: PropertyItem[]
    bookings: Booking[]
    loading?: boolean
  }

  interface Emits {
    (e: 'view' | 'edit' | 'delete', id: string): void
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
  })

  const emit = defineEmits<Emits>()

  defineOptions({ name: 'PropertyExpansionList' })

  const expandedPanel = ref<string | null | undefined>(null)

  const upcomingByProperty = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const map = new Map<string, Booking[]>()
    for (const b of props.bookings) {
      if (b.booking_type !== 'standard') continue
      if (new Date(b.checkin_date) < today) continue
      const list = map.get(b.property_id) ?? []
      list.push(b)
      map.set(b.property_id, list)
    }
    for (const [k, v] of map) {
      map.set(k, v.sort((a, b) => a.checkin_date.localeCompare(b.checkin_date)).slice(0, 5))
    }
    return map
  })

  const turnsByProperty = computed(() => {
    const map = new Map<string, Booking[]>()
    for (const b of props.bookings) {
      if (b.booking_type !== 'turn') continue
      const list = map.get(b.property_id) ?? []
      list.push(b)
      map.set(b.property_id, list)
    }
    for (const [k, v] of map) {
      map.set(
        k,
        v.sort((a, b) => (a.turn_date ?? a.checkout_date).localeCompare(b.turn_date ?? b.checkout_date)).slice(0, 5),
      )
    }
    return map
  })

  function formatDate (iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function getPropertyIcon (propertyType?: string): string {
    switch (propertyType) {
      case 'house': { return 'mdi-home'
      }
      case 'apartment': { return 'mdi-apartment'
      }
      case 'condo': { return 'mdi-office-building'
      }
      case 'townhouse': { return 'mdi-home-group'
      }
      default: { return 'mdi-home-outline'
      }
    }
  }
</script>

<style scoped>
.prop-color-bar {
  width: 3px;
  height: 28px;
  border-radius: var(--claro-radius-pill);
  flex-shrink: 0;
}

.panel-scrim {
  position: relative;
}

.panel-scrim::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.32);
  border-radius: inherit;
  pointer-events: none;
  z-index: 2;
}
</style>
