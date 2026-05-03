<script setup lang="ts">
  import { computed, ref } from 'vue'
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

  const _props = withDefaults(defineProps<{
    items: BookingListItem[]
    loading?: boolean
  }>(), {
    loading: false,
  })

  const emit = defineEmits<{
    edit: [id: string]
    delete: [id: string]
  }>()

  const { mobile } = useDisplay()

  const expandedId = ref<string | null>(null)
  const hasOpen = computed(() => expandedId.value !== null)

  function isExpanded (id: string): boolean {
    return expandedId.value === id
  }

  function toggleRow (id: string): void {
    expandedId.value = expandedId.value === id ? null : id
  }

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
          <v-icon size="20">mdi-chevron-down</v-icon>
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
  border-bottom: 1px solid var(--claro-border);
  transition: opacity var(--claro-dur-slow) var(--claro-ease);
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
  background: rgba(115, 103, 240, 0.025);
}

/* ── Color dot ── */
.bl-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  justify-self: center;
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
  background: var(--claro-surface);
}

.bl-inlay-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.bl-inlay-left {
  padding: 16px 20px 16px 24px;
}

.bl-inlay-right {
  padding: 16px 20px;
  border-left: 1px solid var(--claro-surface-variant);
}

.bl-col-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--claro-fg3);
  margin: 0 0 14px;
}

/* ── Stats table ── */
.bl-stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.bl-stats-table tr {
  border-bottom: 1px solid var(--claro-surface-variant);
}

.bl-stats-table tr:last-child {
  border-bottom: none;
}

.bl-stats-table td {
  padding: 8px 10px;
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
  padding: 10px 16px 12px;
  border-top: 1px solid var(--claro-surface-variant);
  background: var(--claro-surface-variant);
}

.bl-actions-group {
  display: flex;
  align-items: center;
  gap: 4px;
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
