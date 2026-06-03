<template>
  <!-- Error alert — visible on both mobile and desktop -->
  <v-alert
    v-if="loadError"
    class="mb-4"
    :text="loadError"
    title="Couldn't load your overview"
    type="error"
    variant="tonal"
  >
    <template #append>
      <v-btn
        aria-label="Retry loading overview data"
        color="error"
        size="small"
        variant="text"
        @click="loadData"
      >
        Retry
      </v-btn>
    </template>
  </v-alert>

  <!-- ── Day-bar range: mobile layout ── -->
  <OwnerDayBar
    v-if="mobile"
    :current-hour="currentHour"
    :current-min="currentMin"
    :date-label="todayDateLabel"
    :day-blocks="dayBlocks"
    :has-urgent="urgentTurns.length > 0"
    :property-rows="propertyRows"
    :range="range"
    :urgent-summary="urgentSummary"
    :user-name="userName"
    @assign-cleaner="handleDayBarAssignCleaner"
    @open-booking="handleDayBarOpenBooking"
    @update:range="range = $event"
  />

  <!-- ── Desktop layout ── -->
  <v-container v-else class="owner-overview" fluid>
    <v-progress-linear v-if="loading" class="mb-4" color="primary" indeterminate />

    <!-- Page header: title + range toggle -->
    <v-row class="ov-row-header">
      <v-col cols="12">
        <div class="ov-header">
          <div class="ov-header-left">
            <span class="ov-title">Overview</span>
            <span class="ov-title-sep">·</span>
            <span class="ov-range-label">{{ RANGE_LABELS[range] }}</span>
          </div>

          <RangeToggle v-model="range" variant="light" />
        </div>
      </v-col>
    </v-row>

    <!-- Stat row -->
    <v-row class="ov-row-stats">
      <v-col cols="12">
        <div class="stat-row">
          <div
            v-for="stat in rangeStats"
            :key="stat.label"
            class="stat-chip"
            :class="{ 'stat-chip--urgent': stat.urgent }"
          >
            <span class="stat-chip-n">{{ stat.n }}</span>
            <span class="stat-chip-lbl">{{ stat.label }}</span>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Urgent banner (today only) -->
    <v-row v-if="urgentTurns.length > 0" class="ov-row-urgent">
      <v-col cols="12">
        <div class="triage-banner triage-banner--urgent">
          <div class="triage-icon triage-icon--urgent">
            <v-icon aria-hidden="true" color="error" size="18">mdi-alert-circle-outline</v-icon>
          </div>

          <div class="triage-body">
            <div class="triage-title">Urgent turn · {{ urgentTurns[0].property }}</div>

            <div class="triage-sub">
              Guests out {{ fmt12(urgentTurns[0].checkoutTime) }} · new guests in {{ fmt12(urgentTurns[0].checkinTime) }} · same-day turn
            </div>
          </div>

          <v-btn color="error" size="small" variant="tonal" @click="uiStore.openModal('eventModal', 'view')">
            View details
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Timeline card -->
    <v-row class="ov-row-timeline">
      <v-col cols="12">
        <div class="tl-card">
          <div class="tl-card-hd">
            <span>Schedule</span>
            <span class="tl-card-hd-sep">·</span>
            <span>{{ RANGE_LABELS[range] }}</span>

            <div v-if="range === 0" class="tl-legend">
              <div class="tl-legend-item">
                <span class="tl-legend-mark tl-legend-mark--checkin" />
                Check-in
              </div>

              <div class="tl-legend-item">
                <span class="tl-legend-mark tl-legend-mark--checkout" />
                Check-out
              </div>

              <div class="tl-legend-item">
                <span class="tl-legend-mark tl-legend-mark--turn" />
                Turn
              </div>

              <div class="tl-legend-item">
                <span class="tl-legend-mark tl-legend-mark--urgent" />
                Urgent
              </div>
            </div>
          </div>

          <!-- Single-day: full-width labeled chips, shared NOW scrubber -->
          <template v-if="range === 0">
            <div v-if="deskPropertyRows.length === 0" class="tl-empty">
              <v-icon aria-hidden="true" class="mr-1" size="16">mdi-calendar-check-outline</v-icon>
              Nothing scheduled for today
            </div>

            <div v-else class="tl-timeline-wrap">
              <!-- Hour axis at top -->
              <div class="tl-axis-top">
                <div class="tl-axis-spacer-wide" />

                <div class="tl-axis-ticks-top">
                  <span v-for="h in [8, 10, 12, 14, 16, 18, 20, 22]" :key="h">
                    {{ h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm` }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Property rows + per-ribbon NOW line (same coordinate space as chips) -->
            <div class="tl-rows-wrap">
              <div
                v-for="(row, rowIdx) in deskPropertyRows"
                :key="row.propId"
                class="tl-prop-row"
              >
                <div
                  class="tl-prop-info"
                  :style="{ '--prop-color': row.propColor }"
                >
                  <div class="tl-prop-name">{{ row.propName }}</div>
                  <div v-if="row.subtitle" class="tl-prop-sub">{{ row.subtitle }}</div>

                  <div class="tl-status-pill" :class="`tl-status-pill--${row.status}`">
                    {{ deskStatusLabel(row.status) }}
                  </div>
                </div>

                <div class="tl-ribbon">
                  <!-- NOW line inside ribbon — same % coordinate space as chips -->
                  <div
                    class="tl-now-line-v"
                    :style="{ left: `${deskNowPct}%` }"
                  >
                    <div v-if="rowIdx === 0" class="tl-now-bubble">NOW</div>
                  </div>

                  <button
                    v-for="ev in row.events"
                    :key="ev.id"
                    :aria-label="`${ev.propName} · ${fmt12(ev.time)} · ${ev.type}`"
                    class="tl-chip"
                    :class="{
                      'tl-chip--checkout': ev.type === 'checkout' && !ev.needsClean,
                      'tl-chip--checkin': ev.type === 'checkin',
                      'tl-chip--turn': ev.type === 'turn' && !ev.needsClean,
                      'tl-chip--urgent': ev.needsClean,
                      'tl-chip--past': deskIsPast(ev.time),
                    }"
                    :style="{ left: `${deskBarPct(ev.time)}%` }"
                    @click="handleDayBarOpenBooking(ev.id)"
                  >
                    {{ fmtChipLabel(ev.time, ev.type) }}
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- Multi-day: per-property swimlane grid -->
          <template v-else>
            <div v-if="desktopMultiRows.length === 0" class="tl-empty">
              Nothing scheduled in this period
            </div>

            <div v-else class="tl-multi-wrap">
              <!-- Column day headers -->
              <div class="tl-col-headers">
                <div class="tl-row-lbl tl-row-lbl--ghost" />

                <div class="tl-col-hd-row">
                  <span
                    v-for="(day, i) in rangeColumnDays"
                    :key="i"
                    class="tl-col-hd"
                    :class="{ 'tl-col-hd--today': i === 0 }"
                    :style="{ width: (100 / rangeDays) + '%' }"
                  >
                    {{ day }}
                  </span>
                </div>
              </div>

              <!-- Per-property swimlane rows -->
              <div
                v-for="row in desktopMultiRows"
                :key="row.propId"
                class="tl-multi-row"
              >
                <div class="tl-row-lbl">
                  <div class="tl-row-dot" :style="{ background: row.propColor }" />
                  <span>{{ row.propName }}</span>
                </div>

                <div class="tl-multi-grid">
                  <!-- Day dividers -->
                  <div
                    v-for="i in rangeDays - 1"
                    :key="i"
                    class="tl-day-div"
                    :style="{ left: (i / rangeDays) * 100 + '%' }"
                  />

                  <!-- Stay span bars -->
                  <div
                    v-for="(span, si) in row.spans"
                    :key="'span-' + si"
                    class="tl-span-bar"
                    :style="{
                      left: (span.startDay / rangeDays) * 100 + '%',
                      width: ((span.endDay - span.startDay) / rangeDays) * 100 + '%',
                      background: span.color,
                    }"
                  />

                  <!-- Event day markers -->
                  <div
                    v-for="(marker, mi) in row.markers"
                    :key="'mk-' + mi"
                    class="tl-day-marker"
                    :class="'tl-day-marker--' + marker.type"
                    :style="{ left: ((marker.day + 0.5) / rangeDays) * 100 + '%' }"
                  >
                    {{ marker.type === 'checkin' ? 'In' : marker.type === 'checkout' ? 'Out' : 'Trn' }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </v-col>
    </v-row>

    <!-- Unified Upcoming list -->
    <v-row class="ov-row-details">
      <v-col cols="12">
        <div class="tl-card">
          <div class="tl-card-hd">Upcoming</div>

          <div v-if="unifiedUpcomingEvents.length === 0" class="tl-empty">
            <v-icon aria-hidden="true" class="mr-1" size="16">mdi-calendar-check-outline</v-icon>
            Nothing scheduled in this window
          </div>

          <div v-else class="bk-list">
            <div
              v-for="ev in unifiedUpcomingEvents"
              :key="ev.itemKey"
              class="bk-row-shell"
              :class="{ 'bk-row-shell--open': isUpcomingExpanded(ev.itemKey) }"
            >
              <button
                :aria-expanded="isUpcomingExpanded(ev.itemKey)"
                class="bk-item"
                @click="toggleUpcoming(ev.itemKey)"
              >
                <div class="bk-dot" :style="{ background: ev.propColor }" />

                <div class="bk-body">
                  <div class="bk-prop">{{ ev.propName }}</div>
                  <div class="bk-meta">{{ ev.dateLabel }} · {{ fmt12(ev.time) }}</div>
                </div>

                <span :class="`bk-type-chip bk-type-chip--${ev.type}`">
                  {{ ev.type === 'checkin' ? 'Check-in' : ev.type === 'checkout' ? 'Check-out' : 'Turn' }}
                </span>

                <span v-if="ev.needsCleaner" class="bk-unassigned-chip">Unassigned</span>

                <v-icon class="bk-chevron" :class="{ 'bk-chevron--open': isUpcomingExpanded(ev.itemKey) }" size="14">
                  mdi-chevron-down
                </v-icon>
              </button>

              <v-expand-transition>
                <OwnerBookingInlay
                  v-if="isUpcomingExpanded(ev.itemKey) && bookingItemFor(ev.bookingId)"
                  :item="bookingItemFor(ev.bookingId)!"
                  @delete="handleDeleteBooking"
                  @edit="handleEditBooking"
                />
              </v-expand-transition>
            </div>
          </div>

          <ConfirmationDialog
            confirm-text="Delete"
            dangerous
            :message="`Delete this booking at ${bookingToDeleteName}?`"
            :open="deleteConfirmOpen"
            title="Delete Booking"
            @cancel="deleteConfirmOpen = false"
            @confirm="confirmDeleteBooking"
          />
        </div>
      </v-col>
    </v-row>

    <!-- Property health rows -->
    <v-row>
      <v-col cols="12">
        <div class="section-head">
          <span class="section-title">Your properties</span>
          <span class="section-count">{{ myProperties.length }}</span>
          <router-link class="section-action" to="/owner/properties">Manage →</router-link>
        </div>

        <PropertyList :items="overviewListItems" :loading="loading" />
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup lang="ts">
  import type { BookingListItem } from '@/components/dumb/owner/OwnerBookingList.vue'
  import type { DayBarEvent, DayBarPropertyRow, RangeDayBlock } from '@/components/dumb/owner/OwnerDayBar.vue'
  import type { PropertyListEvent, PropertyListItem } from '@/components/dumb/owner/PropertyList.vue'
  import type { Booking, ModalData } from '@/types'
  import type { Property } from '@/types/property'
  import { useToday } from '@composables/shared/useToday'
  import { fmt12, fmtChipLabel, formatDateLabel, timelineIsPast, timelinePct } from '@utils/timelineMath'
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { isNavigationFailure, NavigationFailureType, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import OwnerBookingInlay from '@/components/dumb/owner/OwnerBookingInlay.vue'
  import OwnerDayBar from '@/components/dumb/owner/OwnerDayBar.vue'
  import PropertyList from '@/components/dumb/owner/PropertyList.vue'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import RangeToggle from '@/components/dumb/shared/RangeToggle.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useAuthStore } from '@/stores/auth'
  import { useUIStore } from '@/stores/ui'
  import { formatPropertyAddress } from '@/types/property'
  import { mapLegacyPropertyColor } from '@/utils/constants'
  defineOptions({ name: 'OwnerOverview' })

  // ── Unified event shape ────────────────────────────────────────────────────
  interface UnifiedEvent {
    bookingId: string
    itemKey: string
    propName: string
    propColor: string
    type: 'checkin' | 'checkout' | 'turn'
    time: string
    dateLabel: string
    sortDate: string
    needsCleaner: boolean
  }

  const { mobile } = useDisplay()
  const router = useRouter()
  const authStore = useAuthStore()
  const uiStore = useUIStore()
  const { myProperties, fetchMyProperties } = useOwnerProperties()
  const { myBookings, myTodayTurns, fetchMyBookings, deleteMyBooking } = useOwnerBookings()

  // ── Range toggle state ─────────────────────────────────────────────────────
  const RANGE_LABELS = ['Today', '3 days', '7 days']
  const RANGE_DAYS = [1, 3, 7]
  const range = ref(0)

  const loading = ref(false)
  const loadError = ref<string | null>(null)

  const propertyMap = computed(() => {
    const m = new Map<string, Property>()
    for (const p of myProperties.value) m.set(p.id, p)
    return m
  })

  async function loadData (): Promise<void> {
    if (!authStore.isAuthenticated || authStore.user?.role !== 'owner') return
    loading.value = true
    loadError.value = null
    try {
      const [propResult, bookResult] = await Promise.allSettled([
        fetchMyProperties(),
        fetchMyBookings(),
      ])
      if (propResult.status === 'rejected' || bookResult.status === 'rejected') {
        const failed = [
          propResult.status === 'rejected' ? 'properties' : null,
          bookResult.status === 'rejected' ? 'bookings' : null,
        ].filter(Boolean).join(' and ')
        const reason = propResult.status === 'rejected' ? propResult.reason : (bookResult as PromiseRejectedResult).reason
        console.warn('[OwnerOverview] Failed to load overview data', { failed, reason, userId: authStore.user?.id })
        loadError.value = `Failed to load ${failed}.`
      }
    } finally {
      loading.value = false
    }
  }

  onMounted(loadData)

  const userName = computed(() =>
    authStore.user?.name || authStore.user?.email?.split('@')[0] || 'Owner',
  )

  const { todayStr } = useToday()

  // ── Urgent turns ──────────────────────────────────────────────────────────────
  const urgentTurns = computed(() =>
    myTodayTurns.value
      .filter(b => b.priority === 'urgent')
      .map(b => {
        const p = propertyMap.value.get(b.property_id)
        return {
          property: p ? formatPropertyAddress(p, 'short') : 'Unknown',
          checkinTime: b.checkin_time ?? '15:00',
          checkoutTime: b.checkout_time ?? '11:00',
        }
      }),
  )

  const urgentSummary = computed(() => {
    const turn = urgentTurns.value[0]
    if (!turn) return undefined
    return { property: turn.property, checkoutTime: turn.checkoutTime, checkinTime: turn.checkinTime }
  })

  // ── Range window helpers ───────────────────────────────────────────────────
  const rangeDays = computed(() => RANGE_DAYS[range.value])

  const rangeEndDate = computed(() => {
    const d = new Date(todayStr.value + 'T00:00:00')
    d.setDate(d.getDate() + rangeDays.value - 1)
    return d.toISOString().slice(0, 10)
  })

  function daysDiff (from: string, to: string): number {
    const a = new Date(from + 'T00:00:00')
    const b = new Date(to + 'T00:00:00')
    return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
  }

  // ── Day-bar events (today's events, used by propertyRows) ─────────────────
  const dayBarEvents = computed((): DayBarEvent[] => {
    const events: DayBarEvent[] = []
    for (const b of myBookings.value) {
      if (b.status === 'cancelled') continue
      const p = propertyMap.value.get(b.property_id)
      if (!p) continue
      const name = formatPropertyAddress(p, 'short')
      const color = mapLegacyPropertyColor(p.color)
      const noClean = !b.assigned_cleaner_id && !b.assigned_team_id

      if (b.booking_type === 'turn' && b.checkin_date === todayStr.value) {
        const cleanFrom = b.turn_start_time ?? b.checkout_time ?? '11:00'
        const cleanTo = b.turn_checkin_time ?? b.checkin_time ?? '15:00'
        events.push({
          id: b.id + '-t',
          propId: p.id,
          propName: name,
          propColor: color,
          type: 'turn',
          time: (b.checkout_time ?? '11:00').slice(0, 5),
          guestCount: b.guest_count ?? undefined,
          needsClean: noClean,
          cleanFrom: cleanFrom.slice(0, 5),
          cleanTo: cleanTo.slice(0, 5),
          cleanMins: p.cleaning_duration ?? undefined,
          bookingName: undefined,
        })
      } else {
        if (b.checkout_date === todayStr.value) {
          events.push({ id: b.id + '-o', propId: p.id, propName: name, propColor: color, type: 'checkout', time: (b.checkout_time ?? '11:00').slice(0, 5), guestCount: b.guest_count ?? undefined, needsClean: noClean })
        }
        if (b.checkin_date === todayStr.value) {
          events.push({ id: b.id + '-i', propId: p.id, propName: name, propColor: color, type: 'checkin', time: (b.checkin_time ?? '15:00').slice(0, 5), guestCount: b.guest_count ?? undefined, needsClean: false })
        }
      }
    }
    return events.toSorted((a, b) => a.time.localeCompare(b.time))
  })

  // Per-property dbar rows for today mode (mobile + desktop single-day)
  const propertyRows = computed((): DayBarPropertyRow[] =>
    myProperties.value
      .map(p => ({
        propId: p.id,
        propName: formatPropertyAddress(p, 'short'),
        propColor: mapLegacyPropertyColor(p.color),
        events: dayBarEvents.value.filter(e => e.propId === p.id),
      }))
      .filter(r => r.events.length > 0),
  )

  // Desktop single-day rows: rich property info + labeled chips
  const deskPropertyRows = computed(() =>
    myProperties.value
      .map(p => {
        const name = formatPropertyAddress(p, 'short')
        const color = mapLegacyPropertyColor(p.color)
        const events = dayBarEvents.value.filter(e => e.propId === p.id)

        const subtitleParts = [
          p.address_city || null,
          p.bedrooms ? `${p.bedrooms}bd` : null,
          p.property_type
            ? p.property_type.charAt(0).toUpperCase() + p.property_type.slice(1)
            : null,
        ].filter(Boolean)

        const isOccupied = myBookings.value.some(
          b => b.property_id === p.id
            && b.status !== 'cancelled'
            && b.booking_type !== 'turn'
            && b.checkin_date <= todayStr.value
            && b.checkout_date > todayStr.value,
        )

        const hasUrgent = events.some(e => e.needsClean)
        const hasTurn = events.some(e => e.type === 'turn')
        const hasCheckout = events.some(e => e.type === 'checkout')
        const hasCheckin = events.some(e => e.type === 'checkin')

        let status: 'urgent' | 'turn' | 'checkout' | 'checkin' | 'occupied' | 'vacant'
        if (hasUrgent) status = 'urgent'
        else if (hasTurn) status = 'turn'
        else if (hasCheckout) status = 'checkout'
        else if (hasCheckin) status = 'checkin'
        else if (isOccupied) status = 'occupied'
        else status = 'vacant'

        return {
          propId: p.id,
          propName: name,
          propColor: color,
          subtitle: subtitleParts.join(' · '),
          status,
          events,
        }
      })
      .filter(r => r.events.length > 0),
  )

  function deskStatusLabel (status: string): string {
    if (status === 'urgent') return 'Urgent turn'
    if (status === 'turn') return 'Turn'
    if (status === 'checkout') return 'Check-out'
    if (status === 'checkin') return 'Check-in'
    if (status === 'occupied') return 'Occupied'
    return 'Vacant'
  }

  // Per-day event blocks for mobile multi-day view
  const dayBlocks = computed((): RangeDayBlock[] => {
    const days = rangeDays.value
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(todayStr.value + 'T00:00:00')
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      const label = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })

      const events: RangeDayBlock['events'] = []
      for (const b of myBookings.value) {
        if (b.status === 'cancelled') continue
        const p = propertyMap.value.get(b.property_id)
        if (!p) continue
        const noClean = !b.assigned_cleaner_id && !b.assigned_team_id

        if (b.booking_type === 'turn' && b.checkin_date === dateStr) {
          events.push({ bookingId: b.id, propId: p.id, propName: formatPropertyAddress(p, 'short'), propColor: mapLegacyPropertyColor(p.color), type: 'turn', time: b.checkout_time?.slice(0, 5) ?? '11:00', needsClean: noClean })
        } else {
          if (b.checkout_date === dateStr) events.push({ bookingId: b.id, propId: p.id, propName: formatPropertyAddress(p, 'short'), propColor: mapLegacyPropertyColor(p.color), type: 'checkout', time: b.checkout_time?.slice(0, 5) ?? '11:00', needsClean: noClean })
          if (b.checkin_date === dateStr) events.push({ bookingId: b.id, propId: p.id, propName: formatPropertyAddress(p, 'short'), propColor: mapLegacyPropertyColor(p.color), type: 'checkin', time: b.checkin_time?.slice(0, 5) ?? '15:00', needsClean: false })
        }
      }
      events.sort((a, b) => a.time.localeCompare(b.time))
      return { date: dateStr, label, isToday: i === 0, events }
    })
  })

  const unassignedBookingCount = computed(() => {
    const end = rangeEndDate.value
    return myBookings.value.filter(b => {
      if (b.status === 'cancelled' || b.assigned_cleaner_id || b.assigned_team_id) return false
      if (b.booking_type === 'turn') return b.checkin_date >= todayStr.value && b.checkin_date <= end
      return b.checkout_date >= todayStr.value && b.checkout_date <= end
    }).length
  })

  // Desktop stat chips
  const rangeStats = computed(() => {
    const end = rangeEndDate.value
    let checkouts = 0, checkins = 0, turns = 0
    for (const b of myBookings.value) {
      if (b.status === 'cancelled') continue
      if (b.booking_type === 'turn') {
        if (b.checkin_date >= todayStr.value && b.checkin_date <= end) turns++
      } else {
        if (b.checkout_date >= todayStr.value && b.checkout_date <= end) checkouts++
        if (b.checkin_date >= todayStr.value && b.checkin_date <= end) checkins++
      }
    }
    return [
      { n: unassignedBookingCount.value, label: 'Unassigned', urgent: unassignedBookingCount.value > 0 },
      { n: checkouts, label: 'Check-outs', urgent: false },
      { n: checkins, label: 'Check-ins', urgent: false },
      { n: turns, label: 'Turns', urgent: urgentTurns.value.length > 0 },
    ]
  })

  // Desktop multi-day swimlane rows (span bars + event markers)
  const desktopMultiRows = computed(() => {
    const days = rangeDays.value
    const end = rangeEndDate.value

    return myProperties.value
      .map(p => {
        const name = formatPropertyAddress(p, 'short')
        const color = mapLegacyPropertyColor(p.color)
        const spans: Array<{ startDay: number, endDay: number, color: string }> = []
        const markers: Array<{ day: number, type: 'checkin' | 'checkout' | 'turn', bookingId: string }> = []

        for (const b of myBookings.value) {
          if (b.property_id !== p.id || b.status === 'cancelled') continue
          if (b.checkout_date < todayStr.value || b.checkin_date > end) continue

          const spanStart = Math.max(0, daysDiff(todayStr.value, b.checkin_date))
          const spanEnd = Math.min(days, daysDiff(todayStr.value, b.checkout_date) + 1)
          if (spanEnd > spanStart) spans.push({ startDay: spanStart, endDay: spanEnd, color })

          if (b.booking_type === 'turn') {
            const day = daysDiff(todayStr.value, b.checkin_date)
            if (day >= 0 && day < days) markers.push({ day, type: 'turn', bookingId: b.id })
          } else {
            const outDay = daysDiff(todayStr.value, b.checkout_date)
            if (outDay >= 0 && outDay < days) markers.push({ day: outDay, type: 'checkout', bookingId: b.id })
            const inDay = daysDiff(todayStr.value, b.checkin_date)
            if (inDay >= 0 && inDay < days) markers.push({ day: inDay, type: 'checkin', bookingId: b.id })
          }
        }

        return { propId: p.id, propName: name, propColor: color, spans, markers }
      })
      .filter(r => r.spans.length > 0 || r.markers.length > 0)
  })

  // Day column labels for desktop multi-day header
  const rangeColumnDays = computed(() =>
    Array.from({ length: rangeDays.value }, (_, i) => {
      if (i === 0) return 'Today'
      const d = new Date(todayStr.value + 'T00:00:00')
      d.setDate(d.getDate() + i)
      return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
    }),
  )

  // ── Unified upcoming events (all types, full range window) ──────────────────
  const unifiedUpcomingEvents = computed((): UnifiedEvent[] => {
    const end = rangeEndDate.value
    const events: UnifiedEvent[] = []

    for (const b of myBookings.value) {
      if (b.status === 'cancelled') continue
      const p = propertyMap.value.get(b.property_id)
      if (!p) continue
      const propName = formatPropertyAddress(p, 'short')
      const propColor = mapLegacyPropertyColor(p.color)
      const needsCleaner = !b.assigned_cleaner_id && !b.assigned_team_id

      if (b.booking_type === 'turn') {
        if (b.checkin_date >= todayStr.value && b.checkin_date <= end) {
          events.push({
            bookingId: b.id,
            itemKey: `${b.id}-turn`,
            propName,
            propColor,
            type: 'turn',
            time: (b.checkout_time ?? '11:00').slice(0, 5),
            dateLabel: formatDateLabel(b.checkin_date, todayStr.value),
            sortDate: b.checkin_date,
            needsCleaner,
          })
        }
      } else {
        if (b.checkout_date >= todayStr.value && b.checkout_date <= end) {
          events.push({
            bookingId: b.id,
            itemKey: `${b.id}-checkout`,
            propName,
            propColor,
            type: 'checkout',
            time: (b.checkout_time ?? '11:00').slice(0, 5),
            dateLabel: formatDateLabel(b.checkout_date, todayStr.value),
            sortDate: b.checkout_date,
            needsCleaner,
          })
        }
        if (b.checkin_date >= todayStr.value && b.checkin_date <= end) {
          events.push({
            bookingId: b.id,
            itemKey: `${b.id}-checkin`,
            propName,
            propColor,
            type: 'checkin',
            time: (b.checkin_time ?? '15:00').slice(0, 5),
            dateLabel: formatDateLabel(b.checkin_date, todayStr.value),
            sortDate: b.checkin_date,
            needsCleaner: false, // cleaners are needed before checkout, not before checkin
          })
        }
      }
    }

    return events.toSorted((a, b) => a.sortDate.localeCompare(b.sortDate) || a.time.localeCompare(b.time))
  })

  // ── Current time (for dbar NOW line) ─────────────────────────────────────
  const currentHour = ref(new Date().getHours())
  const currentMin = ref(new Date().getMinutes())

  // Desktop dbar position helpers — thin reactive wrappers around timelineMath utilities
  const deskNowPct = computed(() =>
    timelinePct(`${currentHour.value}:${String(currentMin.value).padStart(2, '0')}`),
  )
  const deskBarPct = (time: string) => timelinePct(time)
  const deskIsPast = (time: string) => timelineIsPast(time, currentHour.value, currentMin.value)
  let nowTimer: ReturnType<typeof setInterval> | null = null
  onMounted(() => {
    nowTimer = setInterval(() => {
      const n = new Date()
      currentHour.value = n.getHours()
      currentMin.value = n.getMinutes()
    }, 60_000)
  })
  onUnmounted(() => {
    if (nowTimer) clearInterval(nowTimer)
  })

  const todayDateLabel = computed(() => {
    const d = new Date()
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  })

  function handleDayBarOpenBooking (eventId: string): void {
    const bookingId = eventId.replace(/-[toi]$/, '')
    router.push({ path: '/owner/bookings', query: { id: bookingId } })
      .catch((error: unknown) => {
        if (!isNavigationFailure(error, NavigationFailureType.duplicated)) {
          console.warn('[OwnerOverview] navigation failed', error)
        }
      })
  }

  function handleDayBarAssignCleaner (_eventId: string): void {
    uiStore.addNotification('info', 'Cleaner Assignment', 'Contact your admin to assign a cleaner for this turn.')
  }

  // ── Upcoming list inline expand ──────────────────────────────────────────
  const expandedItemKey = ref<string | null>(null)

  function isUpcomingExpanded (itemKey: string): boolean {
    return expandedItemKey.value === itemKey
  }

  function toggleUpcoming (itemKey: string): void {
    expandedItemKey.value = expandedItemKey.value === itemKey ? null : itemKey
  }

  function bookingToItem (b: Booking): BookingListItem {
    const property = myProperties.value.find(p => p.id === b.property_id)
    return {
      id: b.id,
      propertyName: property ? formatPropertyAddress(property, 'short') : 'Unknown',
      propertyColor: mapLegacyPropertyColor(property?.color),
      checkinDate: b.checkin_date,
      checkoutDate: b.checkout_date,
      bookingType: b.booking_type as 'standard' | 'turn',
      status: b.status,
      guestCount: b.guest_count ?? undefined,
      checkinTime: b.checkin_time ?? undefined,
      checkoutTime: b.checkout_time ?? undefined,
      notes: b.notes ?? undefined,
      priority: b.priority ?? undefined,
      createdAt: b.created_at ?? undefined,
    }
  }

  function bookingItemFor (bookingId: string): BookingListItem | null {
    const b = myBookings.value.find(x => x.id === bookingId)
    return b ? bookingToItem(b) : null
  }

  // ── Edit / delete handlers (mirror OwnerBookings) ────────────────────────
  const deleteConfirmOpen = ref(false)
  const bookingToDelete = ref<Booking | null>(null)

  const bookingToDeleteName = computed(() => {
    if (!bookingToDelete.value) return ''
    const p = myProperties.value.find(p => p.id === bookingToDelete.value!.property_id)
    return p ? formatPropertyAddress(p, 'short') : 'this property'
  })

  function handleEditBooking (id: string): void {
    const booking = myBookings.value.find(b => b.id === id)
    if (booking) uiStore.openModal('eventModal', 'edit', { booking: booking as unknown as ModalData })
  }

  function handleDeleteBooking (id: string): void {
    const booking = myBookings.value.find(b => b.id === id)
    if (booking) {
      bookingToDelete.value = booking
      deleteConfirmOpen.value = true
    }
  }

  async function confirmDeleteBooking (): Promise<void> {
    if (!bookingToDelete.value) return
    try {
      await deleteMyBooking(bookingToDelete.value.id)
      uiStore.addNotification('success', 'Deleted', 'Booking deleted successfully')
      expandedItemKey.value = null
    } catch (error) {
      console.error('Failed to delete booking:', error)
      uiStore.addNotification('error', 'Delete Failed', error instanceof Error ? error.message : 'Could not delete booking')
    } finally {
      deleteConfirmOpen.value = false
      bookingToDelete.value = null
    }
  }

  // ── PropertyList items for overview accordion ────────────────────────────────
  const overviewListItems = computed((): PropertyListItem[] =>
    myProperties.value.map(p => {
      const bs = myBookings.value.filter(b => b.property_id === p.id && b.status !== 'cancelled')
      const isTurnToday = bs.some(b => b.checkin_date === todayStr.value && b.booking_type === 'turn')

      const todayEvts: PropertyListEvent[] = []
      for (const b of bs) {
        if (b.booking_type === 'turn' && b.checkin_date === todayStr.value) {
          todayEvts.push({ type: 'checkout', time: b.checkout_time ?? '11:00', time24: b.checkout_time ?? '11:00', isUnassigned: !b.assigned_cleaner_id }, { type: 'checkin', time: b.checkin_time ?? '15:00', time24: b.checkin_time ?? '15:00' })
        } else if (b.checkout_date === todayStr.value) {
          todayEvts.push({ type: 'checkout', time: b.checkout_time ?? '11:00', time24: b.checkout_time ?? '11:00', isUnassigned: !b.assigned_cleaner_id })
        } else if (b.checkin_date === todayStr.value) {
          todayEvts.push({ type: 'checkin', time: b.checkin_time ?? '15:00', time24: b.checkin_time ?? '15:00' })
        }
      }

      const nextBook = bs
        .filter(b => b.checkin_date >= todayStr.value)
        .toSorted((a, b) => a.checkin_date.localeCompare(b.checkin_date))[0]

      const nextCheckin = nextBook
        ? {
          label: nextBook.checkin_date === todayStr.value
            ? `Today · ${nextBook.checkin_time ?? '15:00'}`
            : new Date(nextBook.checkin_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          isTurnDay: nextBook.booking_type === 'turn',
        }
        : undefined

      return {
        property: p,
        nextCheckin,
        isTurnToday,
        todayEvents: todayEvts.length > 0 ? todayEvts : undefined,
        stats: {
          turnsYtd: bs.filter(b => b.booking_type === 'turn').length,
          assignmentLabel: nextBook ? 'Next check-in' : 'No upcoming',
        },
      }
    }),
  )

</script>
