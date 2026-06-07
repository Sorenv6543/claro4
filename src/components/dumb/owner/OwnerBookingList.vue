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
    'edit': [id: string]
    'cancel': [id: string]
    'contact-admin': [id: string]
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
  <div v-else class="bl-container" :class="{ 'bl-card--has-open': hasOpen }">
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
    <div class="bl-list">
      <div
        v-for="item in items"
        :key="item.id"
        class="bl-row-shell glass-card"
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
                {{ item.bookingType === 'turn' ? 'Same-day stay' : 'Standard' }}
              </v-chip>

              <v-chip :color="statusColor(item.status)" size="x-small" variant="tonal">
                {{ fmtStatus(item.status) }}
              </v-chip>
            </div>
          </div>

          <!-- Dates (desktop) -->
          <div v-if="!mobile" class="bl-dates-cell">
            <span class="bl-dates claro-numeric">{{ formatDateRange(item.checkinDate, item.checkoutDate) }}</span>
          </div>

          <!-- Type (desktop) -->
          <div v-if="!mobile" class="bl-type-cell">
            <v-chip
              :color="item.bookingType === 'turn' ? 'warning' : 'primary'"
              size="small"
              variant="tonal"
            >
              {{ item.bookingType === 'turn' ? 'Same-day stay' : 'Standard' }}
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
            @cancel="emit('cancel', $event)"
            @contact-admin="emit('contact-admin', $event)"
            @edit="emit('edit', $event)"
          />
        </v-expand-transition>
      </div>
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

<style scoped>
/* ── Container ── */
.bl-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Header ── */
.bl-hdr {
  display: grid;
  gap: 12px;
  align-items: center;
  padding: 0 24px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--claro-fg3);
}

/* ── List ── */
.bl-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Row shell ── */
.bl-row-shell {
  position: relative;
  overflow: hidden;
  transition: all var(--claro-dur-slow) var(--claro-ease);
  background: var(--claro-glass-bg);
  backdrop-filter: var(--claro-glass-blur);
  border: 1px solid var(--claro-glass-border) !important;
  border-radius: 16px !important;
}

.bl-row-shell::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--row-color, transparent);
  z-index: 1;
  pointer-events: none;
}

.bl-container--has-open .bl-row-shell:not(.bl-row-shell--open) {
  opacity: 0.4;
  filter: blur(1px);
}

.bl-row-shell--open {
  position: relative;
  z-index: 2;
  border-color: rgba(var(--v-theme-primary), 0.3) !important;
  box-shadow: var(--claro-shadow-lg) !important;
  transform: scale(1.01);
}

/* ── Summary row ── */
.bl-row {
  display: grid;
  gap: 12px;
  align-items: center;
  padding: 16px 24px;
  cursor: pointer;
  transition: background var(--claro-dur-fast) var(--claro-ease);
}

.bl-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.03);
}

/* ── Color dot ── */
.bl-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  justify-self: center;
  flex-shrink: 0;
}

/* ── Info cell ── */
.bl-prop {
  font-size: 15px;
  font-weight: 700;
  color: var(--claro-fg1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.bl-sub {
  font-size: 12px;
  font-weight: 500;
  color: var(--claro-fg3);
  margin-top: 2px;
}

.bl-mobile-chips {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

/* ── Dates cell ── */
.bl-dates-cell {
  display: flex;
  align-items: center;
}

.bl-dates {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--claro-fg1);
  font-weight: 600;
}

/* ── Type / Status ── */
.bl-type-cell,
.bl-status-cell {
  display: flex;
  align-items: center;
}

/* ── Chevron ── */
.bl-chev {
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
  color: var(--claro-fg3);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bl-chev--open {
  color: var(--claro-primary);
  transform: rotate(180deg);
}

/* ── Sheet ── */
.sheet-card {
  border-radius: 32px 32px 0 0 !important;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom, 24px);
  background: var(--claro-surface) !important;
}

.sheet-handle {
  width: 40px;
  height: 5px;
  border-radius: 9999px;
  background: var(--claro-divider);
  margin: 12px auto 16px;
}

.sheet-prop-name {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--claro-fg1);
  padding: 0 24px 8px;
  letter-spacing: -0.02em;
}

.sheet-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px 4px 24px;
}

.sheet-meta-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sheet-meta-dates {
  font-size: 14px;
  font-weight: 600;
  color: var(--claro-fg2);
}

.sheet-chips-row {
  display: flex;
  gap: 10px;
  padding: 8px 24px 16px;
}

.sheet-section {
  padding: 20px 24px 12px;
}

.sheet-section--notes {
  padding-top: 12px;
}

.sheet-section-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--claro-primary);
  margin-bottom: 12px;
}

.sheet-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.sheet-table tr {
  border-bottom: 1px solid var(--claro-divider);
}

.sheet-table tr:last-child {
  border-bottom: none;
}

.sheet-table td {
  padding: 10px 4px;
  vertical-align: middle;
}

.sheet-table td:first-child {
  color: var(--claro-fg3);
  font-weight: 600;
  width: 40%;
}

.sheet-table td:last-child {
  color: var(--claro-fg1);
  font-weight: 700;
}

.sheet-td-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.sheet-notes-text {
  font-size: 14px;
  color: var(--claro-fg2);
  line-height: 1.6;
  margin: 0;
  background: var(--claro-background);
  padding: 16px;
  border-radius: 12px;
}
</style>
