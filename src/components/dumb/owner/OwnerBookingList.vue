<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import OwnerBookingInlay from './OwnerBookingInlay.vue'

  export interface BookingListItem {
    id: string
    propertyName: string
    propertyColor: string
    checkinDate: string
    checkoutDate: string
    bookingType: 'standard' | 'turn'
    status: string
    guestCount?: number
    guestName?: string
    checkinTime?: string
    checkoutTime?: string
    notes?: string
    priority?: string
    createdAt?: string
  }

  const props = withDefaults(defineProps<{
    items: BookingListItem[]
    loading?: boolean
    expandMode?: 'inline' | 'sheet'
  }>(), {
    loading: false,
    expandMode: 'inline',
  })

  const emit = defineEmits<{
    edit: [id: string]
    delete: [id: string]
  }>()

  const { mobile } = useDisplay()

  // ── Inline expand ──────────────────────────────────────────────────────────
  const expandedId = ref<string | null>(null)
  const hasOpen = computed(() => props.expandMode === 'inline' && expandedId.value !== null)

  function isExpanded (id: string): boolean {
    return props.expandMode === 'inline' && expandedId.value === id
  }

  function toggleRow (id: string): void {
    if (props.expandMode === 'sheet') {
      const item = props.items.find(i => i.id === id)
      if (item) openSheet(item)
    } else {
      expandedId.value = expandedId.value === id ? null : id
    }
  }

  // ── Sheet expand ───────────────────────────────────────────────────────────
  const sheetOpen = ref(false)
  const sheetItem = ref<BookingListItem | null>(null)

  function openSheet (item: BookingListItem): void {
    sheetItem.value = item
    sheetOpen.value = true
  }

  watch(sheetOpen, open => {
    if (!open) setTimeout(() => {
      sheetItem.value = null
    }, 300)
  })

  function formatDateRange (checkin: string, checkout: string): string {
    const ci = new Date(checkin)
    const co = new Date(checkout)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const cM = months[ci.getUTCMonth()]
    const oM = months[co.getUTCMonth()]
    if (cM === oM) return `${cM} ${ci.getUTCDate()}–${co.getUTCDate()}`
    return `${cM} ${ci.getUTCDate()} – ${oM} ${co.getUTCDate()}`
  }

  function formatDate (dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  function statusColor (status: string): string {
    switch (status) {
      case 'confirmed': { return 'primary'
      }
      case 'pending': { return 'warning'
      }
      case 'in_progress': { return 'info'
      }
      case 'completed': { return 'success'
      }
      case 'cancelled': { return 'error'
      }
      case 'scheduled': { return 'primary'
      }
      default: { return 'default'
      }
    }
  }

  function priorityColor (priority: string): string {
    switch (priority) {
      case 'urgent': { return 'error'
      }
      case 'high': { return 'warning'
      }
      case 'normal': { return 'primary'
      }
      case 'low': { return 'info'
      }
      default: { return 'default'
      }
    }
  }

  function fmtStatus (status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  const rowGrid = computed(() =>
    mobile.value ? '10px 1fr 28px' : '10px 1fr 180px 80px 60px 28px',
  )
</script>

<template>
  <!-- Loading -->
  <v-skeleton-loader v-if="loading" type="list-item-two-line, list-item-two-line, list-item-two-line" />

  <!-- Empty -->
  <v-empty-state
    v-else-if="items.length === 0"
    icon="mdi-calendar-blank-outline"
    text="Create your first booking to get started."
    title="No Bookings"
  />

  <!-- List -->
  <div v-else class="bl-card" :class="{ 'bl-card--has-open': hasOpen }">
    <!-- Header row -->
    <div class="bl-hdr" :style="{ gridTemplateColumns: rowGrid }">
      <div />
      <div>Booking</div>
      <div v-if="!mobile">Dates</div>
      <div v-if="!mobile">Type</div>
      <div v-if="!mobile">Status</div>
      <div />
    </div>

    <!-- Booking rows -->
    <div
      v-for="item in items"
      :key="item.id"
      class="bl-row-shell"
      :class="{
        'bl-row-shell--open': isExpanded(item.id),
        'bl-row-shell--dimmed': hasOpen && !isExpanded(item.id),
      }"
      :style="{ '--row-color': item.propertyColor }"
    >
      <!-- Summary row -->
      <div
        class="bl-row"
        :style="{ gridTemplateColumns: rowGrid }"
        @click="toggleRow(item.id)"
      >
        <!-- Property color dot -->
        <div class="bl-dot" :style="{ background: item.propertyColor }" />

        <!-- Property + guest (mobile shows date inline) -->
        <div class="bl-info-cell">
          <div class="bl-prop">{{ item.propertyName }}</div>

          <div class="bl-sub">
            <template v-if="item.guestName">{{ item.guestName }} · </template>
            {{ item.guestCount ? `${item.guestCount}g` : '' }}
            <template v-if="mobile"> · {{ formatDateRange(item.checkinDate, item.checkoutDate) }}</template>
          </div>
          <!-- Mobile inline chips -->
          <div v-if="mobile" class="bl-mobile-chips">
            <v-chip
              :color="item.bookingType === 'turn' ? 'warning' : 'primary'"
              size="x-small"
              variant="tonal"
            >
              {{ item.bookingType === 'turn' ? 'Turn' : 'Standard' }}
            </v-chip>

            <v-chip :color="statusColor(item.status)" size="x-small" variant="tonal">
              {{ fmtStatus(item.status) }}
            </v-chip>
          </div>
        </div>

        <!-- Dates (desktop) -->
        <div v-if="!mobile" class="bl-dates-cell">
          <span class="bl-dates">{{ formatDateRange(item.checkinDate, item.checkoutDate) }}</span>
        </div>

        <!-- Type (desktop) -->
        <div v-if="!mobile" class="bl-type-cell">
          <v-chip
            :color="item.bookingType === 'turn' ? 'warning' : 'primary'"
            size="small"
            variant="tonal"
          >
            {{ item.bookingType === 'turn' ? 'Turn' : 'Standard' }}
          </v-chip>
        </div>

        <!-- Status (desktop) -->
        <div v-if="!mobile" class="bl-status-cell">
          <v-chip :color="statusColor(item.status)" size="small" variant="tonal">
            {{ fmtStatus(item.status) }}
          </v-chip>
        </div>

        <!-- Chevron -->
        <div class="bl-chev" :class="{ 'bl-chev--open': isExpanded(item.id) }">
          <v-icon size="20">{{ expandMode === 'sheet' ? 'mdi-chevron-right' : 'mdi-chevron-down' }}</v-icon>
        </div>
      </div>

      <!-- Expanded inlay -->
      <v-expand-transition>
        <OwnerBookingInlay
          v-if="isExpanded(item.id)"
          :item="item"
          @delete="emit('delete', $event)"
          @edit="emit('edit', $event)"
        />
      </v-expand-transition>
    </div>
  </div>

  <!-- ── Sheet expand (overview mode) ── -->
  <v-bottom-sheet v-model="sheetOpen" :inset="!mobile">
    <v-card v-if="sheetItem" class="sheet-card">
      <!-- Handle -->
      <div class="sheet-handle" />

      <!-- Property name -->
      <div class="sheet-prop-name">{{ sheetItem.propertyName }}</div>

      <!-- Meta row: dot + date range + chevron-down close -->
      <div class="sheet-meta-row">
        <div class="sheet-meta-dot" :style="{ background: sheetItem.propertyColor }" />
        <span class="sheet-meta-dates">{{ formatDateRange(sheetItem.checkinDate, sheetItem.checkoutDate) }}</span>
        <v-spacer />

        <v-btn
          aria-label="Close"
          icon
          size="small"
          style="min-width:44px;min-height:44px;"
          variant="text"
          @click="sheetOpen = false"
        >
          <v-icon size="22">mdi-chevron-down</v-icon>
        </v-btn>
      </div>

      <!-- Chips row -->
      <div class="sheet-chips-row">
        <v-chip
          :color="sheetItem.bookingType === 'turn' ? 'warning' : 'primary'"
          size="x-small"
          variant="tonal"
        >
          {{ sheetItem.bookingType === 'turn' ? 'Turn' : 'Standard' }}
        </v-chip>

        <v-chip :color="statusColor(sheetItem.status)" size="x-small" variant="tonal">
          {{ fmtStatus(sheetItem.status) }}
        </v-chip>
      </div>

      <v-divider />

      <!-- Booking details section -->
      <div class="sheet-section">
        <div class="sheet-section-label">Booking Details</div>

        <table class="sheet-table">
          <tbody>
            <tr>
              <td><span class="sheet-td-inner"><v-icon color="primary" size="14">mdi-login</v-icon> Check-in</span></td>
              <td>{{ formatDate(sheetItem.checkinDate) }}<template v-if="sheetItem.checkinTime"> · {{ sheetItem.checkinTime }}</template></td>
            </tr>

            <tr>
              <td><span class="sheet-td-inner"><v-icon color="primary" size="14">mdi-logout</v-icon> Check-out</span></td>
              <td>{{ formatDate(sheetItem.checkoutDate) }}<template v-if="sheetItem.checkoutTime"> · {{ sheetItem.checkoutTime }}</template></td>
            </tr>

            <tr v-if="sheetItem.guestCount">
              <td><span class="sheet-td-inner"><v-icon color="primary" size="14">mdi-account-group-outline</v-icon> Guests</span></td>
              <td>{{ sheetItem.guestCount }}</td>
            </tr>

            <tr v-if="sheetItem.priority">
              <td><span class="sheet-td-inner"><v-icon color="primary" size="14">mdi-flag-outline</v-icon> Priority</span></td>

              <td>
                <v-chip :color="priorityColor(sheetItem.priority)" size="x-small" variant="tonal">
                  {{ sheetItem.priority }}
                </v-chip>
              </td>
            </tr>

            <tr v-if="sheetItem.createdAt">
              <td><span class="sheet-td-inner"><v-icon color="primary" size="14">mdi-clock-outline</v-icon> Created</span></td>
              <td>{{ formatDate(sheetItem.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Notes section -->
      <div class="sheet-section sheet-section--notes">
        <div class="sheet-section-label">Notes</div>
        <p class="sheet-notes-text">{{ sheetItem.notes || 'No notes for this booking.' }}</p>
      </div>
    </v-card>
  </v-bottom-sheet>
</template>
