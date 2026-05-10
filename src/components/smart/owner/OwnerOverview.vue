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
      <v-btn aria-label="Retry loading overview data" color="error" size="small" variant="text" @click="loadData">
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
                <span class="tl-legend-dot" style="background: #28C76F" />
                Check-in
              </div>

              <div class="tl-legend-item">
                <span class="tl-legend-sq" style="background: #7367F0" />
                Check-out
              </div>

              <div class="tl-legend-item">
                <span class="tl-legend-dot" style="background: #FF9F43" />
                Turn
              </div>

              <div class="tl-legend-item">
                <span class="tl-legend-dot" style="background: #EA5455" />
                Urgent
              </div>
            </div>
          </div>

          <!-- Single-day: full-width labeled chips, shared NOW scrubber -->
          <template v-if="range === 0">
            <div v-if="deskPropertyRows.length === 0" class="tl-empty">
              <v-icon class="mr-1" size="16">mdi-calendar-check-outline</v-icon>
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
                      class="tl-chip"
                      :class="{
                        'tl-chip--checkout': ev.type === 'checkout' && !ev.needsClean,
                        'tl-chip--checkin': ev.type === 'checkin',
                        'tl-chip--turn': ev.type === 'turn' && !ev.needsClean,
                        'tl-chip--urgent': ev.needsClean,
                        'tl-chip--past': deskIsPast(ev.time),
                      }"
                      :style="{ left: `${deskBarPct(ev.time)}%` }"
                      :title="`${ev.propName} · ${fmt12(ev.time)} · ${ev.type}`"
                      @click="handleDayBarOpenBooking(ev.id)"
                    >
                      {{ fmtChipLabel(ev.time, ev.type) }}
                    </button>
                  </div>
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

    <!-- 2-col: Upcoming events + Action queue -->
    <v-row class="ov-row-details">
      <v-col cols="12" md="6">
        <div class="tl-card">
          <div class="tl-card-hd">Upcoming</div>

          <div v-if="upcomingEvents.length === 0" class="tl-empty">
            No upcoming check-ins in this window
          </div>

          <div v-else class="upcoming-list">
            <button
              v-for="ev in upcomingEvents"
              :key="ev.bookingId"
              class="upcoming-item"
              @click="handleDayBarOpenBooking(ev.bookingId)"
            >
              <div class="upcoming-dot" :style="{ background: ev.propColor }" />

              <div class="upcoming-body">
                <div class="upcoming-prop">{{ ev.propName }}</div>
                <div class="upcoming-meta">{{ ev.dateLabel }} · {{ fmt12(ev.time) }} · {{ ev.type === 'turn' ? 'Turn' : 'Check-in' }}</div>
              </div>

              <v-icon class="upcoming-chevron" size="14">mdi-chevron-right</v-icon>
            </button>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <div class="tl-card">
          <div class="tl-card-hd">Action Queue</div>

          <div v-if="actionQueue.length === 0" class="tl-empty tl-empty--ok">
            <v-icon class="mr-1" color="success" size="15">mdi-check-circle-outline</v-icon>
            All cleaners assigned
          </div>

          <div v-else class="action-list">
            <div
              v-for="item in actionQueue"
              :key="item.itemKey"
              class="action-item"
            >
              <div class="action-dot" :style="{ background: item.propColor }" />

              <div class="action-body">
                <div class="action-prop">{{ item.propName }}</div>
                <div class="action-meta">{{ item.dateLabel }} · No cleaner assigned</div>
              </div>

              <v-chip
                color="primary"
                rounded="pill"
                size="x-small"
                variant="flat"
                @click="handleDayBarAssignCleaner(item.bookingId)"
              >
                Request
              </v-chip>
            </div>
          </div>
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
  import type { DayBarEvent, DayBarPropertyRow, RangeDayBlock } from '@/components/dumb/owner/OwnerDayBar.vue'
  import type { PropertyListEvent, PropertyListItem } from '@/components/dumb/owner/PropertyList.vue'
  import type { Property } from '@/types/property'
  import { useToday } from '@composables/shared/useToday'
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { isNavigationFailure, NavigationFailureType, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import OwnerDayBar from '@/components/dumb/owner/OwnerDayBar.vue'
  import PropertyList from '@/components/dumb/owner/PropertyList.vue'
  import RangeToggle from '@/components/dumb/shared/RangeToggle.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useAuthStore } from '@/stores/auth'
  import { useUIStore } from '@/stores/ui'
  import { formatPropertyAddress } from '@/types/property'
  import { mapLegacyPropertyColor } from '@/utils/constants'
  defineOptions({ name: 'OwnerOverview' })

  const { mobile } = useDisplay()
  const router = useRouter()
  const authStore = useAuthStore()
  const uiStore = useUIStore()
  const { myProperties, fetchMyProperties } = useOwnerProperties()
  const { myBookings, myTodayTurns, fetchMyBookings } = useOwnerBookings()

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

  function formatDateLabel (date: string): string {
    if (date === todayStr.value) return 'Today'
    const d = new Date(date + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
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

  function fmtChipLabel (time: string, type: 'checkout' | 'checkin' | 'turn'): string {
    const [h, m] = time.split(':').map(Number)
    if (Number.isNaN(h)) return time
    const period = (h ?? 0) >= 12 ? 'pm' : 'am'
    const h12 = (h ?? 0) % 12 || 12
    const minStr = (m ?? 0) > 0 ? `:${String(m ?? 0).padStart(2, '0')}` : ''
    const timeStr = `${h12}${minStr}${period}`
    if (type === 'checkout') return `${timeStr} Out`
    if (type === 'checkin') return `${timeStr} In`
    return `${timeStr} Turn!`
  }

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
      { n: checkouts + checkins + turns, label: 'Total events', urgent: false },
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

  // Upcoming check-ins in the range window (for 2-col bottom)
  const upcomingEvents = computed(() => {
    const end = rangeEndDate.value
    const events: Array<{ bookingId: string, propName: string, propColor: string, type: 'checkin' | 'turn', time: string, dateLabel: string }> = []

    for (const b of myBookings.value) {
      if (b.status === 'cancelled') continue
      const p = propertyMap.value.get(b.property_id)
      if (!p) continue

      if (b.booking_type === 'turn' && b.checkin_date >= todayStr.value && b.checkin_date <= end) {
        events.push({ bookingId: b.id, propName: formatPropertyAddress(p, 'short'), propColor: mapLegacyPropertyColor(p.color), type: 'turn', time: b.checkin_time?.slice(0, 5) ?? '15:00', dateLabel: formatDateLabel(b.checkin_date) })
      } else if (b.booking_type !== 'turn' && b.checkin_date >= todayStr.value && b.checkin_date <= end) {
        events.push({ bookingId: b.id, propName: formatPropertyAddress(p, 'short'), propColor: mapLegacyPropertyColor(p.color), type: 'checkin', time: b.checkin_time?.slice(0, 5) ?? '15:00', dateLabel: formatDateLabel(b.checkin_date) })
      }
    }

    return events.toSorted((a, b) => a.dateLabel.localeCompare(b.dateLabel) || a.time.localeCompare(b.time))
  })

  // Bookings without cleaners in the range window
  const actionQueue = computed(() => {
    const end = rangeEndDate.value
    const items: Array<{ bookingId: string, itemKey: string, propName: string, propColor: string, type: 'checkout' | 'checkin' | 'turn', dateLabel: string }> = []

    for (const b of myBookings.value) {
      if (b.status === 'cancelled' || b.assigned_cleaner_id || b.assigned_team_id) continue
      const p = propertyMap.value.get(b.property_id)
      if (!p) {
        console.warn('[OwnerOverview] booking references unknown property', { bookingId: b.id, propertyId: b.property_id })
      }
      const propName = p ? formatPropertyAddress(p, 'short') : 'Unknown'
      const propColor = p ? mapLegacyPropertyColor(p.color) : '#7367F0'

      if (b.booking_type === 'turn') {
        if (b.checkin_date >= todayStr.value && b.checkin_date <= end) {
          items.push({ bookingId: b.id, itemKey: `${b.id}-turn`, propName, propColor, type: 'turn', dateLabel: formatDateLabel(b.checkin_date) })
        }
      } else {
        if (b.checkout_date >= todayStr.value && b.checkout_date <= end) {
          items.push({ bookingId: b.id, itemKey: `${b.id}-checkout`, propName, propColor, type: 'checkout', dateLabel: formatDateLabel(b.checkout_date) })
        }
        if (b.checkin_date >= todayStr.value && b.checkin_date <= end) {
          items.push({ bookingId: b.id, itemKey: `${b.id}-checkin`, propName, propColor, type: 'checkin', dateLabel: formatDateLabel(b.checkin_date) })
        }
      }
    }

    return items.toSorted((a, b) => a.dateLabel.localeCompare(b.dateLabel))
  })

  // Desktop dbar position helpers (8 AM – 10 PM = 14 hours)
  const DESK_DAY_START = 8
  const DESK_DAY_SPAN = 14

  function deskBarPct (time: string): number {
    const [h, m] = time.split(':').map(Number)
    const frac = ((h ?? 0) + (m ?? 0) / 60 - DESK_DAY_START) / DESK_DAY_SPAN
    return Math.max(0, Math.min(100, frac * 100))
  }

  const deskNowPct = computed(() => {
    const frac = (currentHour.value + currentMin.value / 60 - DESK_DAY_START) / DESK_DAY_SPAN
    return Math.max(0, Math.min(100, frac * 100))
  })

  function deskIsPast (time: string): boolean {
    const [h, m] = time.split(':').map(Number)
    return (h ?? 0) * 60 + (m ?? 0) < currentHour.value * 60 + currentMin.value
  }

  // ── Current time (for dbar NOW line) ─────────────────────────────────────
  const currentHour = ref(new Date().getHours())
  const currentMin = ref(new Date().getMinutes())
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
      .catch((err: unknown) => {
        if (!isNavigationFailure(err, NavigationFailureType.duplicated)) {
          console.warn('[OwnerOverview] navigation failed', err)
        }
      })
  }

  function handleDayBarAssignCleaner (_eventId: string): void {
    uiStore.addNotification('info', 'Cleaner Assignment', 'Contact your admin to assign a cleaner for this turn.')
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

  function fmt12 (time24: string): string {
    const [h, m] = time24.split(':').map(Number)
    if (Number.isNaN(h)) return time24
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${String(m ?? 0).padStart(2, '0')} ${period}`
  }

</script>

<style scoped>
.owner-overview {
  max-width: 1280px;
  padding-bottom: var(--claro-space-2xl);
}

/* Tiered section rhythm: tight within header group, mid between operational sections, generous before portfolio */
.owner-overview :deep(.v-row + .v-row)             { margin-top: 20px; }
.owner-overview :deep(.ov-row-header + .v-row)     { margin-top: 10px; }
.owner-overview :deep(.ov-row-stats + .v-row)      { margin-top: 10px; }
.owner-overview :deep(.ov-row-urgent + .v-row)     { margin-top: 14px; }
.owner-overview :deep(.ov-row-details + .v-row)    { margin-top: 48px; }

/* ── Page header ── */
.ov-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.ov-header-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.ov-title {
  font-size: var(--claro-text-xl);
  font-weight: 700;
  color: var(--claro-fg1);
  letter-spacing: -0.02em;
}

.ov-title-sep {
  color: var(--claro-fg3);
  font-weight: 400;
}

.ov-range-label {
  font-size: var(--claro-text-sm);
  font-weight: 500;
  color: var(--claro-primary);
}

/* ── Stat row ── */
.stat-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--claro-surface);
  border: 1px solid var(--claro-border);
  border-radius: var(--claro-radius-sm);
  flex: 1;
  min-width: 100px;
}

.stat-chip--urgent {
  border-color: rgba(234, 84, 85, 0.30);
  background: var(--claro-error-tonal);
}

.stat-chip-n {
  font-size: var(--claro-text-xl);
  font-weight: 700;
  color: var(--claro-fg1);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.stat-chip--urgent .stat-chip-n {
  color: var(--claro-error);
}

.stat-chip-lbl {
  font-size: 11px;
  font-weight: 600;
  color: var(--claro-fg3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  line-height: 1.3;
}

/* ── Timeline card ── */
.tl-card {
  background: #ffffff;
  border: 1px solid var(--claro-border);
  border-radius: var(--claro-radius-sm);
  padding: 16px 20px;
  box-shadow: var(--claro-shadow-sm);
}

.tl-card-hd {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--claro-fg3);
  text-transform: uppercase;
  letter-spacing: 0.09em;
  margin-bottom: 14px;
}

.tl-card-hd-sep {
  opacity: 0.45;
}

.tl-empty {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--claro-fg3);
  padding: 8px 0;
}

.tl-empty--ok {
  color: var(--claro-success);
  font-weight: 500;
}

/* ── Single-day per-property rows ── */
.tl-single-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tl-single-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tl-row-lbl {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 130px;
  flex-shrink: 0;
  font-size: var(--claro-text-sm);
  font-weight: 500;
  color: var(--claro-fg2);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.tl-row-lbl--ghost {
  visibility: hidden;
}

.tl-row-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Dbar track (light) */
.tl-dbar {
  position: relative;
  flex: 1;
  height: 30px;
  background: rgba(115, 103, 240, 0.06);
  border: 1px solid rgba(115, 103, 240, 0.12);
  border-radius: 2px;
  overflow: hidden;
}

/* Event pips on desktop */
.tl-pip {
  position: absolute;
  top: 5px;
  bottom: 5px;
  width: 10px;
  border-radius: 1px;
  background: var(--claro-primary);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.15s, box-shadow 0.15s;
  z-index: 3;
}

.tl-pip--turn    { background: #FF9F43; }
.tl-pip--checkin { background: #28C76F; }
.tl-pip--urgent  { background: #EA5455; box-shadow: 0 0 0 2px rgba(234,84,85,0.25); }
.tl-pip--past    { opacity: 0.35; }

.tl-pip:hover {
  box-shadow: 0 0 0 3px rgba(115, 103, 240, 0.25);
  opacity: 1;
}

.tl-pip:focus-visible {
  outline: 2px solid var(--claro-primary);
  outline-offset: 2px;
}

/* NOW line on desktop dbar */
.tl-now-line {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  background: var(--claro-primary);
  border-radius: 1px;
  z-index: 5;
}

/* Shared axis for desktop single-day */
.tl-axis {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 6px;
}

.tl-axis-spacer {
  width: 130px;
  flex-shrink: 0;
}

.tl-axis-ticks {
  flex: 1;
  display: flex;
  justify-content: space-between;
}

.tl-axis-ticks span {
  font-size: 9px;
  color: var(--claro-fg3);
  font-variant-numeric: tabular-nums;
}

/* ── Multi-day swimlane ── */
.tl-multi-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tl-col-headers {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tl-col-hd-row {
  flex: 1;
  display: flex;
}

.tl-col-hd {
  font-size: 9px;
  font-weight: 700;
  color: var(--claro-fg3);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  text-align: center;
}

.tl-col-hd--today {
  color: var(--claro-primary);
}

.tl-multi-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tl-multi-grid {
  position: relative;
  flex: 1;
  height: 30px;
  background: rgba(115, 103, 240, 0.04);
  border: 1px solid rgba(115, 103, 240, 0.10);
  border-radius: 2px;
  overflow: hidden;
}

/* Day column dividers */
.tl-day-div {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(115, 103, 240, 0.12);
}

/* Stay span bars */
.tl-span-bar {
  position: absolute;
  top: 4px;
  bottom: 4px;
  opacity: 0.22;
  border-radius: 2px;
  border-left: 3px solid currentColor;
}

/* Event day markers */
.tl-day-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 4;
  font-size: 8px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 2px;
  color: #fff;
  white-space: nowrap;
}

.tl-day-marker--checkin  { background: #28C76F; }
.tl-day-marker--checkout { background: var(--claro-primary); }
.tl-day-marker--turn     { background: #FF9F43; }

/* ── Upcoming list ── */
.upcoming-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.upcoming-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--claro-radius-sm);
  cursor: pointer;
  border: none;
  background: transparent;
  text-align: left;
  width: 100%;
  transition: background 0.12s;
}

.upcoming-item:hover {
  background: var(--claro-background);
}

.upcoming-item:focus-visible {
  outline: 2px solid var(--claro-primary);
  outline-offset: 2px;
}

.upcoming-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.upcoming-body {
  flex: 1;
  min-width: 0;
}

.upcoming-prop {
  font-size: 13px;
  font-weight: 600;
  color: var(--claro-fg1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upcoming-meta {
  font-size: 11px;
  color: var(--claro-fg3);
  margin-top: 1px;
}

.upcoming-chevron {
  opacity: 0.30;
  flex-shrink: 0;
}

/* ── Action queue ── */
.action-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--claro-radius-sm);
}

.action-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.action-body {
  flex: 1;
  min-width: 0;
}

.action-prop {
  font-size: 13px;
  font-weight: 600;
  color: var(--claro-fg1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-meta {
  font-size: 11px;
  color: var(--claro-fg3);
  margin-top: 1px;
}

/* ── Urgent / OK banner ── */
.triage-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-radius: var(--claro-radius-sm);
  border: 1px solid transparent;
}

.triage-banner--ok {
  background: var(--claro-success-tonal);
  border-color: rgba(40, 199, 111, 0.25);
}

.triage-banner--urgent {
  background: var(--claro-error-tonal);
  border-color: rgba(234, 84, 85, 0.25);
}

.triage-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--claro-radius-sm);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.triage-icon--ok     { background: rgba(40, 199, 111, 0.18); }
.triage-icon--urgent { background: rgba(234, 84, 85, 0.18); }

.triage-body {
  flex: 1;
  min-width: 0;
}

.triage-title {
  font-size: var(--claro-text-sm);
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
}

.triage-sub {
  font-size: var(--claro-text-xs);
  color: var(--claro-fg3);
  margin-top: 2px;
}

/* ── Section headers ── */
.section-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}

.section-title {
  font-size: var(--claro-text-sm);
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.section-count {
  font-size: var(--claro-text-xs);
  color: var(--claro-fg3);
  font-variant-numeric: tabular-nums;
}

.section-action {
  margin-left: auto;
  font-size: var(--claro-text-xs);
  color: var(--claro-primary);
  text-decoration: none;
  font-weight: 500;
}

.section-action:hover {
  text-decoration: underline;
}

/* ── Today strip ── */
.today-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 4px;
}

.today-strip::-webkit-scrollbar { display: none; }

.event-pill {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  background: var(--claro-surface);
  border: 1px solid var(--claro-border);
  border-left: 3px solid var(--pill-color, var(--claro-border));
  border-radius: var(--claro-radius-sm);
  flex-shrink: 0;
  min-width: 160px;
}

.event-pill-time {
  font-size: var(--claro-text-xs);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--claro-fg3);
  letter-spacing: 0.04em;
}

.event-pill-prop {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--claro-text-sm);
  font-weight: 500;
  color: var(--claro-fg1);
}

/* ── Property health rows ── */
.health-list {
  overflow: hidden;
}

.health-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--claro-border);
}

.health-row:last-child {
  border-bottom: none;
}

.health-swatch {
  width: 36px;
  height: 36px;
  border-radius: var(--claro-radius-sm);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.health-info {
  flex: 1;
  min-width: 0;
}

.health-addr {
  font-size: var(--claro-text-sm);
  font-weight: 600;
  color: var(--claro-fg1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.health-sub {
  font-size: var(--claro-text-xs);
  color: var(--claro-fg3);
  margin-top: 2px;
}

.health-state {
  flex-shrink: 0;
}

.health-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}

.health-next {
  min-width: 140px;
}

.health-next-label {
  font-size: var(--claro-text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--claro-fg3);
}

.health-next-val {
  font-size: var(--claro-text-xs);
  color: var(--claro-fg1);
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
}

.health-occ {
  min-width: 80px;
}

.health-occ-label {
  font-size: var(--claro-text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--claro-fg3);
}

.health-occ-val {
  font-size: var(--claro-text-sm);
  font-weight: 700;
  color: var(--claro-fg1);
  font-variant-numeric: tabular-nums;
  margin-top: 2px;
}

.health-occ-bar {
  height: 4px;
  background: var(--claro-border);
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
}

.health-occ-fill {
  height: 100%;
  border-radius: 2px;
  transition: width var(--claro-dur-slow) var(--claro-ease);
}

/* ── Shared utils ── */
.prop-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

/* ── Desktop timeline redesign (labeled chips, shared NOW) ── */
.tl-timeline-wrap {
  display: flex;
  flex-direction: column;
}

/* Hour axis at top */
.tl-axis-top {
  display: flex;
  align-items: flex-end;
  margin-bottom: 2px;
}

.tl-axis-spacer-wide {
  width: 200px;
  flex-shrink: 0;
}

.tl-axis-ticks-top {
  flex: 1;
  display: flex;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(115, 113, 143, 0.31);
}

.tl-axis-ticks-top span {
  font-size: 9px;
  color: var(--claro-fg3);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  position: relative;
  padding-bottom: 8px;
}

.tl-axis-ticks-top span:nth-child(even) {
  color: transparent;
}

.tl-axis-ticks-top span::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 3px;
  background: rgba(115, 103, 240, 0.2);
}

.tl-axis-ticks-top span:nth-child(odd)::after {
  height: 7px;
  background: rgba(115, 103, 240, 0.5);
}

/* Row wrapper — establishes stacking context for shared NOW line */
.tl-rows-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Per-property row */
.tl-prop-row {
  display: flex;
  align-items: stretch;
  min-height: 56px;
  border-bottom: 1px solid rgba(131, 131, 131, 0.21);
}

.tl-prop-row:last-child {
  border-bottom: none;
}

/* Left info column: tonal fill from property color */
.tl-prop-info {
  width: 200px;
  box-sizing: border-box;
  flex-shrink: 0;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--prop-color, #7367F0) 10%, transparent);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.tl-prop-name {
  font-size: var(--claro-text-sm);
  font-weight: 700;
  color: var(--claro-fg1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.tl-prop-sub {
  font-size: var(--claro-text-xs);
  color: var(--claro-fg3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

/* Status pill */
.tl-status-pill {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 9999px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-top: 3px;
  width: fit-content;
}

.tl-status-pill--urgent   { background: rgba(234, 84, 85, 0.14);   color: #EA5455; }
.tl-status-pill--turn     { background: rgba(255, 159, 67, 0.14);  color: #FF9F43; }
.tl-status-pill--checkout { background: rgba(115, 103, 240, 0.12); color: var(--claro-primary); }
.tl-status-pill--checkin  { background: rgba(40, 199, 111, 0.14);  color: #28C76F; }
.tl-status-pill--occupied { background: rgba(30, 200, 222, 0.12);  color: #1EC8DE; }
.tl-status-pill--vacant   { background: rgba(0, 0, 0, 0.06);       color: var(--claro-fg3); }

/* Ribbon — event chip container */
.tl-ribbon {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  background: rgba(195, 185, 185, 0.21);
}

/* Labeled event chips */
.tl-chip {
  position: absolute;
  transform: translateX(-50%);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  cursor: pointer;
  border: none;
  line-height: 1.4;
  z-index: 3;
  transition: opacity 0.15s, box-shadow 0.15s;
  font-family: var(--claro-font-family, 'Inter', sans-serif);
}

.tl-chip--checkout { background: var(--claro-primary, #7367F0); }
.tl-chip--checkin  { background: #28C76F; }
.tl-chip--turn     { background: #FF9F43; }
.tl-chip--urgent   { background: #EA5455; animation: urgentPulse 1.5s ease-in-out infinite; }
.tl-chip--past     { opacity: 0.42; }

.tl-chip:hover:not(.tl-chip--past) {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
}

.tl-chip:focus-visible {
  outline: 2px solid var(--claro-primary);
  outline-offset: 2px;
}

@keyframes urgentPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(234, 84, 85, 0.55); }
  50%       { box-shadow: 0 0 0 8px rgba(234, 84, 85, 0); }
}

/* NOW scrubber: one per ribbon row, all sharing the same % coordinate space as chips */
.tl-now-line-v {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  transform: translateX(-50%);
  background: var(--claro-primary, #7367F0);
  z-index: 10;
  pointer-events: none;
}

.tl-now-bubble {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--claro-primary, #7367F0);
  color: #fff;
  font-size: 8px;
  font-weight: 800;
  padding: 2px 5px;
  border-radius: 3px;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

/* Legend in card header */
.tl-legend {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  flex-wrap: wrap;
}

.tl-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--claro-text-xs);
  color: var(--claro-fg3);
  font-weight: 400;
  white-space: nowrap;
}

.tl-legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tl-legend-sq {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 1px;
  flex-shrink: 0;
}
</style>
