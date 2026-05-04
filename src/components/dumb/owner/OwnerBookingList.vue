<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useDisplay } from 'vuetify'

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
    if (!open) setTimeout(() => { sheetItem.value = null }, 300)
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
      case 'normal': { return 'info'
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
        <div v-if="isExpanded(item.id)" class="bl-inlay">
          <div class="bl-inlay-body" :class="{ 'bl-inlay-body--stacked': mobile }">
            <!-- Left: booking details -->
            <div class="bl-inlay-left">
              <div class="bl-col-label">Booking details</div>

              <table class="bl-stats-table">
                <tbody>
                  <tr>
                    <td><span class="bl-td-inner"><v-icon color="primary" size="14">mdi-login</v-icon> Check-in</span></td>
                    <td>{{ formatDate(item.checkinDate) }}<template v-if="item.checkinTime"> · {{ item.checkinTime }}</template></td>
                  </tr>

                  <tr>
                    <td><span class="bl-td-inner"><v-icon color="primary" size="14">mdi-logout</v-icon> Check-out</span></td>
                    <td>{{ formatDate(item.checkoutDate) }}<template v-if="item.checkoutTime"> · {{ item.checkoutTime }}</template></td>
                  </tr>

                  <tr v-if="item.guestCount">
                    <td><span class="bl-td-inner"><v-icon color="primary" size="14">mdi-account-group-outline</v-icon> Guests</span></td>
                    <td>{{ item.guestCount }}</td>
                  </tr>

                  <tr v-if="item.priority">
                    <td><span class="bl-td-inner"><v-icon color="primary" size="14">mdi-flag-outline</v-icon> Priority</span></td>

                    <td>
                      <v-chip :color="priorityColor(item.priority)" size="x-small" variant="tonal">
                        {{ item.priority }}
                      </v-chip>
                    </td>
                  </tr>

                  <tr v-if="item.createdAt">
                    <td><span class="bl-td-inner"><v-icon color="primary" size="14">mdi-clock-outline</v-icon> Created</span></td>
                    <td>{{ formatDate(item.createdAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Right: notes -->
            <div class="bl-inlay-right">
              <div class="bl-col-label">Notes</div>
              <p class="bl-notes">{{ item.notes || 'No notes for this booking.' }}</p>
            </div>
          </div>

          <!-- Action bar -->
          <div class="bl-actions" :class="{ 'bl-actions--mobile': mobile }" @click.stop>
            <div class="bl-actions-group">
              <v-btn
                color="primary"
                :prepend-icon="mobile ? undefined : 'mdi-pencil-outline'"
                size="small"
                variant="tonal"
                @click="emit('edit', item.id)"
              >
                <v-icon v-if="mobile" size="16" start>mdi-pencil-outline</v-icon>
                Edit
              </v-btn>
            </div>

            <div class="bl-actions-group">
              <v-btn
                color="error"
                size="small"
                variant="text"
                @click="emit('delete', item.id)"
              >
                <v-icon size="16" start>mdi-delete-outline</v-icon>
                Delete
              </v-btn>
            </div>
          </div>
        </div>
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

<style scoped>
/* ── Outer card ── */
.bl-card {
  background: var(--claro-surface);
  border: 1px solid var(--claro-border);
  border-radius: var(--claro-radius-sm);
  overflow: hidden;
  box-shadow: var(--claro-shadow-sm);
}

/* ── Header ── */
.bl-hdr {
  display: grid;
  gap: 12px;
  align-items: center;
  padding: 8px 24px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--claro-fg3);
  border-bottom: 1px solid var(--claro-border);
  background: var(--claro-surface-variant);
}

/* ── Row shell ── */
.bl-row-shell {
  position: relative;
  border-bottom: 1px solid var(--claro-border);
  transition: opacity var(--claro-dur-slow) var(--claro-ease);
}

.bl-row-shell::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--row-color, transparent);
  z-index: 1;
  pointer-events: none;
}

.bl-row-shell:last-child {
  border-bottom: none;
}

.bl-card--has-open .bl-row-shell:not(.bl-row-shell--open) {
  opacity: 0.35;
}

.bl-row-shell--open {
  position: relative;
  z-index: 2;
  box-shadow:
    0 0 0 1.5px rgba(115, 103, 240, 0.22),
    0 2px 8px rgba(46, 38, 61, 0.06);
}

/* ── Summary row ── */
.bl-row {
  display: grid;
  gap: 12px;
  align-items: center;
  padding: 12px 24px;
  cursor: pointer;
  transition: background var(--claro-dur-fast) var(--claro-ease);
}

.bl-row:hover {
  background: color-mix(in srgb, var(--row-color, rgb(115, 103, 240)) 6%, transparent);
}

/* ── Color dot ── */
.bl-dot {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  justify-self: center;
  flex-shrink: 0;
}

/* ── Info cell ── */
.bl-prop {
  font-size: 13px;
  font-weight: 500;
  color: var(--claro-fg1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bl-sub {
  font-size: 11px;
  color: var(--claro-fg3);
  margin-top: 2px;
}

.bl-mobile-chips {
  display: flex;
  gap: 6px;
  margin-top: 5px;
  flex-wrap: wrap;
}

/* ── Dates cell ── */
.bl-dates-cell {
  display: flex;
  align-items: center;
}

.bl-dates {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--claro-fg1);
  font-weight: 500;
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
  transition:
    transform var(--claro-dur-slow) var(--claro-ease),
    color var(--claro-dur-slow) var(--claro-ease);
}

.bl-chev--open {
  color: var(--claro-primary);
  transform: rotate(180deg);
}

/* ── Inlay ── */
.bl-inlay {
  border-top: 1px solid var(--claro-border);
  background: color-mix(in srgb, var(--row-color, rgb(115, 103, 240)) 3%, transparent);
  border-left: 3px solid var(--row-color, rgba(var(--v-theme-primary), 0.3));
}

.bl-inlay-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.bl-inlay-left {
  padding: 12px 20px 12px 20px;
}

.bl-inlay-right {
  padding: 12px 20px;
  border-left: 1px solid rgba(var(--v-theme-primary), 0.1);
  background: rgba(var(--v-theme-primary), 0.02);
}

.bl-col-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--row-color, rgb(var(--v-theme-primary)));
  opacity: 0.75;
  margin: 0 0 8px;
}

/* ── Stats table ── */
.bl-stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.bl-stats-table tr {
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.07);
}

.bl-stats-table tr:last-child {
  border-bottom: none;
}

.bl-stats-table td {
  padding: 4px 6px;
  vertical-align: middle;
}

.bl-stats-table td:first-child {
  color: var(--claro-fg3);
  font-weight: 500;
  width: 40%;
  white-space: nowrap;
}

.bl-td-inner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  vertical-align: middle;
}

.bl-stats-table td:last-child {
  color: var(--claro-fg1);
  font-weight: 500;
}

/* ── Notes ── */
.bl-notes {
  font-size: 12px;
  color: var(--claro-fg2);
  line-height: var(--claro-lh-normal);
}

/* ── Action bar ── */
.bl-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 16px 10px;
  border-top: 1px solid rgba(var(--v-theme-primary), 0.1);
  background: rgba(var(--v-theme-primary), 0.05);
}

.bl-actions-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ── Sheet ── */
.sheet-card {
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  padding-bottom: 24px;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 9999px;
  background: var(--claro-divider);
  margin: 10px auto 10px;
}

.sheet-prop-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--claro-fg1);
  padding: 0 20px 6px;
  line-height: 1.3;
}

.sheet-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px 4px 20px;
}

.sheet-meta-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sheet-meta-dates {
  font-size: 13px;
  font-weight: 500;
  color: var(--claro-fg2);
}

.sheet-chips-row {
  display: flex;
  gap: 8px;
  padding: 4px 20px 12px;
}

.sheet-section {
  padding: 14px 20px 8px;
}

.sheet-section--notes {
  padding-top: 10px;
}

.sheet-section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 10px;
}

.sheet-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.sheet-table tr {
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.07);
}

.sheet-table tr:last-child {
  border-bottom: none;
}

.sheet-table td {
  padding: 7px 4px;
  vertical-align: middle;
}

.sheet-table td:first-child {
  color: var(--claro-fg3);
  font-weight: 500;
  width: 45%;
  white-space: nowrap;
}

.sheet-table td:last-child {
  color: var(--claro-fg1);
  font-weight: 500;
}

.sheet-td-inner {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  vertical-align: middle;
}

.sheet-notes-text {
  font-size: 13px;
  color: var(--claro-fg2);
  line-height: 1.6;
  margin: 0;
}

/* ── Stacked (mobile) ── */
.bl-inlay-body--stacked {
  grid-template-columns: 1fr;
}

.bl-inlay-body--stacked .bl-inlay-right {
  border-left: none;
  border-top: 1px solid var(--claro-surface-variant);
  padding: 14px 16px;
}

.bl-inlay-body--stacked .bl-inlay-left {
  padding: 14px 16px;
}

.bl-actions--mobile {
  flex-wrap: wrap;
  row-gap: 6px;
}

.bl-actions--mobile .bl-actions-group:first-child {
  flex: 1 1 100%;
}

.bl-actions--mobile .bl-actions-group:last-child {
  margin-left: auto;
}
</style>
