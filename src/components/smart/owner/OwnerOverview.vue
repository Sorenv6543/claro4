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

    <!-- Welcome Banner (Aurora) -->
    <v-row class="mb-6">
      <v-col cols="12">
        <OwnerWelcomeBanner
          :greeting="timeGreeting"
          :stats="bannerStats"
          :subtitle="bannerSubtitle"
          :turns-today-count="myTodayTurns.length"
          :user-name="userName"
        />
      </v-col>
    </v-row>

    <!-- Tip card -->
    <v-row v-if="!tipDismissed" class="mb-4">
      <v-col cols="12">
        <v-alert
          closable
          icon="mdi-lightbulb-outline"
          text="Open any property to see its turns, calendar sync, and access notes."
          title="Tip: tap a property below"
          variant="tonal"
          @click:close="dismissTip"
        />
      </v-col>
    </v-row>

    <!-- Your properties preview -->
    <v-row v-if="myProperties.length > 0" class="mb-6">
      <v-col cols="12">
        <div class="section-head mb-3">
          <div>
            <div class="section-title">Your properties</div>
            <div class="section-sub">Tap a property to view details, sync calendars, and manage settings.</div>
          </div>
          <router-link class="section-action" to="/owner/properties">View all properties →</router-link>
        </div>

        <v-row>
          <v-col
            v-for="item in propertyPreviewItems"
            :key="item.id"
            cols="12"
            md="4"
          >
            <div
              class="prop-preview-card glass-card clickable"
              @click="router.push(`/owner/properties/${item.id}`)"
            >
              <div class="prop-preview-top">
                <v-icon :color="item.color" class="mr-2" size="32">{{ item.icon }}</v-icon>
                <span class="prop-name">{{ item.name }}</span>
                <v-chip
                  class="ml-auto"
                  :color="item.statusColor"
                  density="compact"
                  rounded="pill"
                  size="x-small"
                  :variant="item.statusVariant"
                >
                  {{ item.statusText }}
                </v-chip>
              </div>
              <div class="prop-meta">{{ item.cityBedBath }}</div>
              <div class="prop-event-label">{{ item.eventLabel }}</div>
            </div>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Page header: title + range toggle -->
    <v-row class="ov-row-header mb-4">
      <v-col cols="12">
        <div class="ov-header">
          <div class="ov-header-left">
            <span class="ov-title">My Schedule</span>
            <span class="ov-title-sep">·</span>
            <span class="ov-range-label">{{ RANGE_LABELS[range] }}</span>
          </div>

          <RangeToggle v-model="range" variant="light" />
        </div>
      </v-col>
    </v-row>


    <!-- Timeline & Upcoming as Large Bento blocks -->
    <v-row class="bento-grid">
      <!-- Timeline block -->
      <v-col cols="12" lg="8">
        <div class="tl-card glass-card">
          <div class="tl-card-hd">
            <span>Property Timeline</span>
            <span class="tl-card-hd-sep">·</span>
            <span>{{ RANGE_LABELS[range] }}</span>

            <div v-if="range === 0" class="tl-legend">
              <div class="tl-legend-item">
                <span class="tl-legend-mark tl-legend-mark--checkin" />
                In
              </div>
              <div class="tl-legend-item">
                <span class="tl-legend-mark tl-legend-mark--checkout" />
                Out
              </div>
              <div class="tl-legend-item">
                <span class="tl-legend-mark tl-legend-mark--turn" />
                Same-day stay
              </div>
            </div>
          </div>

          <!-- Unified view: vertical day sections for Today / Week / 2-Weeks -->
          <div v-if="deskUnifiedRows.length === 0" class="tl-empty">
            <v-icon aria-hidden="true" class="mr-1" size="16">mdi-calendar-check-outline</v-icon>
            Nothing scheduled in this period
          </div>

          <div v-else class="tl-timeline-wrap">
            <!-- Shared hour axis — shown once at top -->
            <div class="tl-axis-top">
              <div class="tl-axis-spacer-wide" />
              <div class="tl-axis-ticks-top">
                <span v-for="h in [8, 10, 12, 14, 16, 18, 20, 22]" :key="h">
                  {{ h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm` }}
                </span>
              </div>
            </div>

            <!-- One vertical section per day in the range -->
            <div v-for="(day, di) in deskDays" :key="day.date">
              <div class="tl-day-hd">
                <span class="tl-day-hd-label" :class="{ 'tl-day-hd-label--today': di === 0 }">
                  {{ day.displayLabel }}
                </span>
                <div class="tl-day-hd-line" />
              </div>

              <div class="tl-rows-wrap">
                <template v-for="row in deskUnifiedRows" :key="row.propId">
                  <div v-if="row.days[di]?.events.length" class="tl-prop-row">
                    <div class="tl-prop-info" :style="{ '--prop-color': row.propColor }">
                      <div class="tl-prop-name">{{ row.propName }}</div>
                      <div v-if="row.subtitle" class="tl-prop-sub">{{ row.subtitle }}</div>
                      <div v-if="di === 0" class="tl-status-pill" :class="`tl-status-pill--${row.status}`">
                        {{ deskStatusLabel(row.status) }}
                      </div>
                    </div>

                    <div class="tl-ribbon">
                      <div
                        v-if="di === 0"
                        class="tl-now-line-v"
                        :style="{ left: `${deskNowPct}%` }"
                      >
                        <div v-if="row.propId === firstTodayPropId" class="tl-now-bubble">NOW</div>
                      </div>

                      <button
                        v-for="ev in row.days[di].events"
                        :key="ev.id"
                        :aria-label="`${ev.propName} · ${fmt12(ev.time)} · ${ev.type}`"
                        class="tl-chip"
                        :class="{
                          'tl-chip--checkout': ev.type === 'checkout' && !ev.needsClean,
                          'tl-chip--checkin': ev.type === 'checkin',
                          'tl-chip--turn': ev.type === 'turn' || ev.needsClean,
                          'tl-chip--past': di === 0 && deskIsPast(ev.time),
                        }"
                        :style="{ left: `${deskBarPct(ev.time)}%` }"
                        @click="handleDayBarOpenBooking(ev.id)"
                      >
                        {{ fmtChipLabel(ev.time, ev.type) }}
                      </button>
                    </div>
                  </div>
                </template>
              </div>

              <div
                v-if="!deskUnifiedRows.some(r => r.days[di]?.events.length)"
                class="tl-day-empty"
              >
                Nothing scheduled
              </div>
            </div>
          </div>
        </div>
      </v-col>

      <!-- Upcoming block -->
      <v-col cols="12" lg="4">
        <div class="tl-card glass-card">
          <div class="tl-card-hd">Upcoming Activities</div>

          <div v-if="unifiedUpcomingEvents.length === 0" class="tl-empty">
            <v-icon aria-hidden="true" class="mr-1" size="16">mdi-calendar-check-outline</v-icon>
            Nothing scheduled
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
                  {{ ev.type === 'checkin' ? 'In' : ev.type === 'checkout' ? 'Out' : 'Same-day' }}
                </span>

                <v-icon class="bk-chevron" :class="{ 'bk-chevron--open': isUpcomingExpanded(ev.itemKey) }" size="14">
                  mdi-chevron-down
                </v-icon>
              </button>

              <v-expand-transition>
                <OwnerBookingInlay
                  v-if="isUpcomingExpanded(ev.itemKey) && bookingItemFor(ev.bookingId)"
                  :item="bookingItemFor(ev.bookingId)!"
                  @cancel="handleCancelBooking"
                  @contact-admin="showContactSnackbar"
                  @edit="handleEditBooking"
                />
              </v-expand-transition>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Property health rows -->
    <v-row class="mt-8">
      <v-col cols="12">
        <div class="section-head mb-4">
          <span class="section-title">Portfolio</span>
          <v-spacer />
          <router-link class="section-action" to="/owner/properties">View All Properties →</router-link>
        </div>

        <div class="glass-card pa-1">
          <PropertyList :items="overviewListItems" :loading="loading" />
        </div>
      </v-col>
    </v-row>

    <ConfirmationDialog
      confirm-text="Cancel Booking"
      :message="`Cancel this booking at ${bookingToDeleteName}? Your cleaning company will be notified.`"
      :open="cancelConfirmOpen"
      title="Cancel Booking"
      @cancel="cancelConfirmOpen = false"
      @confirm="confirmCancelBooking"
    />
  </v-container>

  <!-- ── Contact Admin coming-soon snackbar ── -->
  <v-snackbar v-model="contactSnackbarOpen" color="surface-variant" location="bottom" :timeout="3500">
    <v-icon class="mr-2" size="18">mdi-message-outline</v-icon>
    Direct messaging with your cleaning team is coming soon.
  </v-snackbar>

  <!-- ── Booking detail drawer ── -->
  <Teleport to="body">
    <Transition name="bdr-slide">
      <div v-if="drawerOpen" class="bdr-overlay" @click.self="drawerOpen = false">
        <div class="bdr-panel">
    <div v-if="drawerItem" class="bdr-wrap">
      <!-- Header -->
      <div class="bdr-header">
        <div>
          <div class="bdr-prop-name">{{ drawerItem.propertyName }}</div>
          <div class="bdr-meta-row">
            <span class="bdr-dot" :style="{ background: drawerItem.propertyColor }" />
            <span class="bdr-dates">{{ drawerFmtRange(drawerItem.checkinDate, drawerItem.checkoutDate) }}</span>
          </div>
        </div>
        <v-btn aria-label="Close" icon size="small" variant="text" @click="drawerOpen = false">
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Chips -->
      <div class="bdr-chips">
        <v-chip
          :color="drawerItem.bookingType === 'turn' ? 'warning' : 'primary'"
          size="small"
          variant="tonal"
        >
          {{ drawerItem.bookingType === 'turn' ? 'Same-day stay' : 'Standard' }}
        </v-chip>
        <v-chip :color="drawerStatusColor(drawerItem.status)" size="small" variant="tonal">
          {{ drawerFmtStatus(drawerItem.status) }}
        </v-chip>
      </div>

      <v-divider class="my-4" />

      <!-- B2: Turn today → timebar visualization -->
      <template v-if="drawerIsTurnToday && drawerHasTimebar">
        <div class="bdr-section-label">Today's events</div>

        <div class="bdr-timebar-axis">
          <div class="bdr-timebar-line" />
          <div class="bdr-tb-block bdr-tb-out" :style="drawerOutBlockStyle">OUT</div>
          <div class="bdr-tb-block bdr-tb-turn" :style="drawerWindowBlockStyle">
            <span class="bdr-tb-window-label">cleaning window</span>
          </div>
          <div class="bdr-tb-block bdr-tb-in" :style="drawerInBlockStyle">IN</div>
        </div>

        <div class="bdr-timebar-ticks">
          <span>8am</span><span>10am</span><span>12pm</span><span>2pm</span><span>4pm</span><span>6pm</span>
        </div>

        <div class="bdr-tb-events">
          <div v-for="ev in drawerTodayEvents" :key="ev.type" class="bdr-tb-event-row">
            <div class="bdr-tb-dot" :class="`bdr-tb-dot--${ev.type}`" />
            <div class="bdr-tb-event-text">
              <template v-if="ev.type === 'checkout'">Guest check-out</template>
              <template v-else-if="ev.type === 'checkin'">Guest check-in</template>
            </div>
            <div class="bdr-tb-event-time">{{ ev.time }}</div>
          </div>
        </div>
      </template>

      <!-- B1: Upcoming events spine -->
      <template v-else>
        <div class="bdr-section-label">Booking dates</div>

        <div class="bdr-tl-spine">
          <div v-for="(ev, idx) in drawerUpcomingEvents" :key="idx" class="bdr-tl-item">
            <div class="bdr-tl-dot-wrap">
              <div class="bdr-tl-dot" />
            </div>
            <div class="bdr-tl-content">
              <div class="bdr-tl-date">{{ ev.dateLabel }}</div>
              <div class="bdr-tl-title">{{ ev.title }}</div>
              <div v-if="ev.subtitle" class="bdr-tl-sub">{{ ev.subtitle }}</div>
            </div>
          </div>
        </div>
      </template>

      <v-divider class="my-4" />

      <!-- Notes -->
      <div class="bdr-section-label">Notes</div>
      <p class="bdr-notes">{{ drawerItem.notes || 'No notes for this booking.' }}</p>

      <!-- Actions -->
      <div class="bdr-actions">
        <v-btn
          block
          color="primary"
          prepend-icon="mdi-calendar-edit-outline"
          rounded="sm"
          variant="tonal"
          @click="handleEditBooking(drawerItem.id); drawerOpen = false"
        >
          Reschedule
        </v-btn>
        <v-btn
          block
          color="warning"
          prepend-icon="mdi-calendar-remove-outline"
          rounded="sm"
          variant="text"
          @click="handleCancelBooking(drawerItem.id); drawerOpen = false"
        >
          Cancel Booking
        </v-btn>
        <v-btn
          block
          color="secondary"
          prepend-icon="mdi-message-outline"
          rounded="sm"
          variant="text"
          @click="showContactSnackbar()"
        >
          Contact Admin
        </v-btn>
      </div>
    </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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
  import OwnerWelcomeBanner from '@/components/dumb/owner/OwnerWelcomeBanner.vue'
  import PropertyList from '@/components/dumb/owner/PropertyList.vue'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import RangeToggle from '@/components/dumb/shared/RangeToggle.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useAuthStore } from '@/stores/auth'
  import { useUIStore } from '@/stores/ui'
  import { formatPropertyAddress } from '@/types/property'
  import { getPropertyIcon, mapLegacyPropertyColor } from '@/utils/constants'
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

  // ── Property preview item shape ──────────────────────────────────────────
  interface PropertyPreviewItem {
    id: string
    name: string
    cityBedBath: string
    color: string
    icon: string
    statusText: string
    statusColor: string | undefined
    statusVariant: 'flat' | 'outlined'
    eventLabel: string
  }

  const { mobile } = useDisplay()
  const router = useRouter()
  const authStore = useAuthStore()
  const uiStore = useUIStore()
  const { myProperties, fetchMyProperties } = useOwnerProperties()
  const { myBookings, myTodayTurns, fetchMyBookings, changeMyBookingStatus } = useOwnerBookings()

  // ── Range toggle state ─────────────────────────────────────────────────────
  const RANGE_LABELS = ['Today', 'Week', '2 Weeks']
  const RANGE_DAYS = [1, 7, 14]
  const range = ref(0)

  const loading = ref(false)
  const loadError = ref<string | null>(null)

  // ── Tip card state ────────────────────────────────────────────────────────
  const tipDismissed = ref(localStorage.getItem('claro-owner-tip-dismissed') === 'true')

  function dismissTip (): void {
    tipDismissed.value = true
    localStorage.setItem('claro-owner-tip-dismissed', 'true')
  }

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
          id: b.id,
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

  // Day columns for the current range (used by unified header + rows)
  const deskDays = computed(() =>
    Array.from({ length: rangeDays.value }, (_, i) => {
      const d = new Date(todayStr.value + 'T00:00:00')
      d.setDate(d.getDate() + i)
      const date = d.toISOString().slice(0, 10)
      const label = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
      const displayLabel = i === 0 ? 'TODAY' : i === 1 ? 'TOMORROW' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
      return { date, label, displayLabel }
    }),
  )

  // Unified desktop rows — one per property, with per-day events; works for all range values
  const deskUnifiedRows = computed(() =>
    myProperties.value
      .map(p => {
        const name = formatPropertyAddress(p, 'short')
        const color = mapLegacyPropertyColor(p.color)

        const subtitleParts = [
          p.address_city || null,
          p.bedrooms ? `${p.bedrooms}bd` : null,
          p.property_type
            ? p.property_type.charAt(0).toUpperCase() + p.property_type.slice(1)
            : null,
        ].filter(Boolean)

        const days = deskDays.value.map(day => {
          const events: DayBarEvent[] = []
          for (const b of myBookings.value) {
            if (b.property_id !== p.id || b.status === 'cancelled') continue
            const noClean = !b.assigned_cleaner_id && !b.assigned_team_id
            if (b.booking_type === 'turn' && b.checkin_date === day.date) {
              events.push({
                id: b.id + '-t', propId: p.id, propName: name, propColor: color,
                type: 'turn', time: (b.checkout_time ?? '11:00').slice(0, 5),
                guestCount: b.guest_count ?? undefined, needsClean: noClean,
                cleanFrom: (b.turn_start_time ?? b.checkout_time ?? '11:00').slice(0, 5),
                cleanTo: (b.turn_checkin_time ?? b.checkin_time ?? '15:00').slice(0, 5),
                cleanMins: p.cleaning_duration ?? undefined,
                bookingName: undefined,
              })
            } else {
              if (b.checkout_date === day.date)
                events.push({ id: b.id + '-o', propId: p.id, propName: name, propColor: color, type: 'checkout', time: (b.checkout_time ?? '11:00').slice(0, 5), guestCount: b.guest_count ?? undefined, needsClean: noClean })
              if (b.checkin_date === day.date)
                events.push({ id: b.id + '-i', propId: p.id, propName: name, propColor: color, type: 'checkin', time: (b.checkin_time ?? '15:00').slice(0, 5), guestCount: b.guest_count ?? undefined, needsClean: false })
            }
          }
          events.sort((a, b) => a.time.localeCompare(b.time))
          return { date: day.date, events }
        })

        if (!days.some(d => d.events.length > 0)) return null

        const todayEvts = days[0]?.events ?? []
        const isOccupied = myBookings.value.some(
          b => b.property_id === p.id
            && b.status !== 'cancelled'
            && b.booking_type !== 'turn'
            && b.checkin_date <= todayStr.value
            && b.checkout_date > todayStr.value,
        )
        const hasUrgent = todayEvts.some(e => e.needsClean)
        const hasTurn = todayEvts.some(e => e.type === 'turn')
        const hasCheckout = todayEvts.some(e => e.type === 'checkout')
        const hasCheckin = todayEvts.some(e => e.type === 'checkin')
        let status: 'urgent' | 'turn' | 'checkout' | 'checkin' | 'occupied' | 'vacant'
        if (hasUrgent) status = 'urgent'
        else if (hasTurn) status = 'turn'
        else if (hasCheckout) status = 'checkout'
        else if (hasCheckin) status = 'checkin'
        else if (isOccupied) status = 'occupied'
        else status = 'vacant'

        return { propId: p.id, propName: name, propColor: color, subtitle: subtitleParts.join(' · '), status, days }
      })
      .filter(r => r !== null),
  )

  // First property with events today — used to anchor the NOW bubble to one row
  const firstTodayPropId = computed(() =>
    deskUnifiedRows.value.find(r => r.days[0]?.events.length)?.propId ?? null,
  )

  function deskStatusLabel (status: string): string {
    if (status === 'urgent' || status === 'turn') return 'Same-day stay'
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
            time: fmt12(b.checkout_time ?? '11:00'),
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
            time: fmt12(b.checkout_time ?? '11:00'),
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
            time: fmt12(b.checkin_time ?? '15:00'),
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

  const timeGreeting = computed(() => {
    if (currentHour.value < 12) return 'Good morning'
    if (currentHour.value <= 16) return 'Good afternoon'
    return 'Good evening'
  })

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

  // ── Booking detail drawer ─────────────────────────────────────────────────
  const drawerOpen = ref(false)
  const drawerBookingId = ref<string | null>(null)

  const drawerItem = computed((): BookingListItem | null => {
    if (!drawerBookingId.value) return null
    const b = myBookings.value.find(x => x.id === drawerBookingId.value)
    return b ? bookingToItem(b) : null
  })

  const drawerIsTurnToday = computed(() =>
    !!drawerItem.value
    && drawerItem.value.bookingType === 'turn'
    && drawerItem.value.checkinDate === todayStr.value,
  )

  const drawerTodayEvents = computed(() => {
    if (!drawerItem.value) return [] as Array<{ type: string; time: string; time24: string }>
    const checkoutTime = drawerItem.value.checkoutTime ?? '11:00'
    const checkinTime = drawerItem.value.checkinTime ?? '15:00'
    return [
      { type: 'checkout', time: fmt12(checkoutTime), time24: checkoutTime },
      { type: 'checkin', time: fmt12(checkinTime), time24: checkinTime },
    ]
  })

  const drawerResolvedBar = computed(() => {
    const [outEv, inEv] = drawerTodayEvents.value
    if (!outEv || !inEv) return null
    const pct = (t: string) => {
      const [h, m] = t.split(':').map(Number)
      return Math.max(0, Math.min(100, ((h * 60 + (m ?? 0) - 480) / 600) * 100))
    }
    const outPct = pct(outEv.time24)
    const inPct = pct(inEv.time24)
    return inPct > outPct ? { outPct, inPct, windowPct: inPct - outPct } : null
  })

  const drawerHasTimebar = computed(() => drawerResolvedBar.value !== null)

  const drawerOutBlockStyle = computed(() => {
    const b = drawerResolvedBar.value
    return b ? { left: `calc(${b.outPct}% - 22px)`, width: '44px' } : {}
  })

  const drawerWindowBlockStyle = computed(() => {
    const b = drawerResolvedBar.value
    return b ? { left: `${b.outPct}%`, width: `${b.windowPct}%` } : {}
  })

  const drawerInBlockStyle = computed(() => {
    const b = drawerResolvedBar.value
    return b ? { left: `calc(${b.inPct}% - 18px)`, width: '36px' } : {}
  })

  const drawerUpcomingEvents = computed(() => {
    const item = drawerItem.value
    if (!item) return [] as Array<{ dateLabel: string; title: string; subtitle?: string }>
    const guestSuffix = item.guestCount ? ` · ${item.guestCount} guests` : ''
    return [
      {
        dateLabel: drawerFmtDate(item.checkinDate),
        title: 'Guest check-in',
        subtitle: item.checkinTime ? fmt12(item.checkinTime) + guestSuffix : guestSuffix || undefined,
      },
      {
        dateLabel: drawerFmtDate(item.checkoutDate),
        title: 'Guest check-out',
        subtitle: item.checkoutTime ? fmt12(item.checkoutTime) : undefined,
      },
    ]
  })

  function drawerFmtDate (dateStr: string | undefined): string {
    if (!dateStr) return '—'
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function drawerFmtRange (checkin: string, checkout: string): string {
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    const a = new Date(checkin + 'T00:00:00').toLocaleDateString('en-US', opts)
    const b = new Date(checkout + 'T00:00:00').toLocaleDateString('en-US', opts)
    return checkin === checkout ? a : `${a} – ${b}`
  }

  function drawerStatusColor (status: string): string {
    if (status === 'confirmed') return 'success'
    if (status === 'pending') return 'warning'
    if (status === 'cancelled') return 'error'
    return 'default'
  }

  function drawerFmtStatus (status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  function handleDayBarOpenBooking (eventId: string): void {
    const bookingId = eventId.replace(/-[toi]$/, '')
    drawerBookingId.value = bookingId
    drawerOpen.value = true
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

  // ── Edit / cancel handlers ────────────────────────────────────────────────
  const cancelConfirmOpen = ref(false)
  const bookingToCancel = ref<Booking | null>(null)
  const contactSnackbarOpen = ref(false)

  const bookingToDeleteName = computed(() => {
    if (!bookingToCancel.value) return ''
    const p = myProperties.value.find(p => p.id === bookingToCancel.value!.property_id)
    return p ? formatPropertyAddress(p, 'short') : 'this property'
  })

  function handleEditBooking (id: string): void {
    const booking = myBookings.value.find(b => b.id === id)
    if (booking) uiStore.openModal('eventModal', 'edit', { booking: booking as unknown as ModalData })
  }

  function handleCancelBooking (id: string): void {
    const booking = myBookings.value.find(b => b.id === id)
    if (booking) {
      bookingToCancel.value = booking
      cancelConfirmOpen.value = true
    }
  }

  async function confirmCancelBooking (): Promise<void> {
    if (!bookingToCancel.value) return
    try {
      await changeMyBookingStatus(bookingToCancel.value.id, 'cancelled')
      uiStore.addNotification('success', 'Cancelled', 'Booking cancelled successfully')
      expandedItemKey.value = null
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      uiStore.addNotification('error', 'Cancel Failed', error instanceof Error ? error.message : 'Could not cancel booking')
    } finally {
      cancelConfirmOpen.value = false
      bookingToCancel.value = null
    }
  }

  function showContactSnackbar (): void {
    contactSnackbarOpen.value = true
  }

  // ── PropertyList items for overview accordion ────────────────────────────────
  const overviewListItems = computed((): PropertyListItem[] =>
    myProperties.value.map(p => {
      const bs = myBookings.value.filter(b => b.property_id === p.id && b.status !== 'cancelled')
      const isTurnToday = bs.some(b => b.checkin_date === todayStr.value && b.booking_type === 'turn')

      const todayEvts: PropertyListEvent[] = []
      for (const b of bs) {
        if (b.booking_type === 'turn' && b.checkin_date === todayStr.value) {
          todayEvts.push({ type: 'checkout', time: fmt12(b.checkout_time ?? '11:00'), time24: b.checkout_time ?? '11:00', isUnassigned: !b.assigned_cleaner_id }, { type: 'checkin', time: fmt12(b.checkin_time ?? '15:00'), time24: b.checkin_time ?? '15:00' })
        } else if (b.checkout_date === todayStr.value) {
          todayEvts.push({ type: 'checkout', time: fmt12(b.checkout_time ?? '11:00'), time24: b.checkout_time ?? '11:00', isUnassigned: !b.assigned_cleaner_id })
        } else if (b.checkin_date === todayStr.value) {
          todayEvts.push({ type: 'checkin', time: fmt12(b.checkin_time ?? '15:00'), time24: b.checkin_time ?? '15:00' })
        }
      }

      const nextBook = bs
        .filter(b => b.checkin_date >= todayStr.value)
        .toSorted((a, b) => a.checkin_date.localeCompare(b.checkin_date))[0]

      const nextCheckin = nextBook
        ? {
          label: nextBook.checkin_date === todayStr.value
            ? `Today · ${fmt12(nextBook.checkin_time ?? '15:00')}`
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

  // ── Welcome banner stats & subtitle ────────────────────────────────────────
  const todayEventsCount = computed(() => {
    let count = 0
    for (const b of myBookings.value) {
      if (b.status === 'cancelled') continue
      if (b.booking_type === 'turn') {
        if (b.checkin_date === todayStr.value) count++
      } else {
        if (b.checkout_date === todayStr.value) count++
        if (b.checkin_date === todayStr.value) count++
      }
    }
    return count
  })

  const weekEventsCount = computed(() => {
    const end = new Date(todayStr.value + 'T00:00:00')
    end.setDate(end.getDate() + 6)
    const endStr = end.toISOString().slice(0, 10)
    let count = 0
    for (const b of myBookings.value) {
      if (b.status === 'cancelled') continue
      if (b.booking_type === 'turn') {
        if (b.checkin_date >= todayStr.value && b.checkin_date <= endStr) count++
      } else {
        if (b.checkout_date >= todayStr.value && b.checkout_date <= endStr) count++
        if (b.checkin_date >= todayStr.value && b.checkin_date <= endStr) count++
      }
    }
    return count
  })

  const needsAttentionCount = computed(() => urgentTurns.value.length)

  const bannerSubtitle = computed(() => {
    const n = todayEventsCount.value
    return `${n} booking${n !== 1 ? 's' : ''} scheduled today`
  })

  const bannerStats = computed(() => [
    { icon: 'mdi-calendar-today', label: 'Today', value: todayEventsCount.value },
    { icon: 'mdi-calendar-week', label: 'Week', value: weekEventsCount.value },
  ])

  // ── Property preview strip ────────────────────────────────────────────────
  const propertyPreviewItems = computed((): PropertyPreviewItem[] =>
    overviewListItems.value.slice(0, 3).map(item => {
      const p = item.property
      const parts: string[] = []
      if (p.address_city) parts.push(p.address_city)
      if (p.bedrooms) parts.push(`${p.bedrooms} bd`)
      if (p.bathrooms) parts.push(`${p.bathrooms} ba`)
      const cityBedBath = parts.join(' · ')

      let statusText = 'Vacant'
      let statusColor: string | undefined = undefined
      let statusVariant: 'flat' | 'outlined' = 'outlined'

      const todayEvts = item.todayEvents ?? []
      if (item.isTurnToday) {
        statusText = 'Turn Today'; statusColor = 'warning'; statusVariant = 'flat'
      } else if (todayEvts.some(e => e.type === 'checkout')) {
        statusText = 'Check-out Today'; statusColor = 'primary'; statusVariant = 'flat'
      } else if (todayEvts.some(e => e.type === 'checkin')) {
        statusText = 'Check-in Today'; statusColor = 'success'; statusVariant = 'flat'
      } else {
        const isOccupied = myBookings.value.some(
          b => b.property_id === p.id
            && b.status !== 'cancelled'
            && b.booking_type !== 'turn'
            && b.checkin_date <= todayStr.value
            && b.checkout_date > todayStr.value,
        )
        if (isOccupied) {
          statusText = 'Occupied'; statusColor = 'info'; statusVariant = 'flat'
        }
      }

      let eventLabel = 'No events today'
      const firstEv = todayEvts[0]
      if (firstEv) {
        if (firstEv.type === 'checkout') eventLabel = `Check-out today at ${firstEv.time}`
        else if (firstEv.type === 'checkin') eventLabel = `Check-in today at ${firstEv.time}`
      } else if (item.nextCheckin) {
        eventLabel = `Next: ${item.nextCheckin.label}`
      }

      return {
        id: p.id,
        name: formatPropertyAddress(p, 'short'),
        cityBedBath,
        color: mapLegacyPropertyColor(p.color),
        icon: getPropertyIcon(p.property_type, p.id),
        statusText,
        statusColor,
        statusVariant,
        eventLabel,
      }
    }),
  )

</script>

<style scoped>
.owner-overview {
  max-width: 1280px;
  padding-bottom: var(--claro-space-2xl);
  position: relative;
  z-index: 1;
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
  background: var(--claro-card-bg);
  border: 1px solid var(--claro-border);
  border-radius: var(--claro-radius-card, 24px);
  padding: 24px;
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
  margin-bottom: 20px;
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

/* ── Day section headers (Today / Tomorrow / Weekday) ── */
.tl-day-hd {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0 8px;
}

.tl-day-hd-label {
  font-size: 10px;
  font-weight: 800;
  color: var(--claro-fg3);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
}

.tl-day-hd-label--today {
  color: var(--claro-primary);
}

.tl-day-hd-line {
  flex: 1;
  height: 1px;
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.tl-day-empty {
  font-size: 12px;
  color: var(--claro-fg3);
  padding: 6px 0 8px;
  opacity: 0.7;
}

/* ── Unified booking item list ── */
.bk-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bk-row-shell {
  border-radius: 16px;
  overflow: hidden;
  transition: all var(--claro-dur-slow) var(--claro-ease);
  border: 1px solid transparent;
}

.bk-row-shell--open {
  background: rgba(var(--v-theme-primary), 0.04);
  border-color: rgba(var(--v-theme-primary), 0.1);
}

.bk-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 16px;
  cursor: pointer;
  border: none;
  background: transparent;
  text-align: left;
  width: 100%;
  transition: background 0.12s;
}

.bk-item:hover { background: rgba(var(--v-theme-on-surface), 0.03); }

.bk-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.bk-body {
  flex: 1;
  min-width: 0;
}

.bk-prop {
  font-size: 15px;
  font-weight: 700;
  color: var(--claro-fg1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.bk-meta {
  font-size: 12px;
  color: var(--claro-fg3);
  margin-top: 2px;
}

.bk-type-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
}

.bk-type-chip--checkin  { background: var(--claro-success-tonal);  color: var(--claro-success); }
.bk-type-chip--checkout { background: var(--claro-primary-tonal); color: var(--claro-primary); }
.bk-type-chip--turn     { background: var(--claro-warning-tonal);  color: var(--claro-warning); }

.bk-chevron {
  opacity: 0.30;
  flex-shrink: 0;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bk-chevron--open {
  opacity: 1;
  color: var(--claro-primary);
  transform: rotate(180deg);
}

/* ── Urgent / OK banner ── */
.triage-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-radius: 24px;
  border: 1px solid transparent;
}

.triage-banner--urgent {
  background: var(--claro-error-tonal);
  border-color: rgba(var(--v-theme-error), 0.15);
}

.triage-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.triage-icon--urgent { background: rgba(var(--v-theme-error), 0.1); }

.triage-body {
  flex: 1;
  min-width: 0;
}

.triage-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--claro-fg1);
  letter-spacing: -0.01em;
}

.triage-sub {
  font-size: 0.9rem;
  color: var(--claro-fg3);
  margin-top: 4px;
}

/* ── Section headers ── */
.section-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--claro-fg1);
  letter-spacing: -0.02em;
}

.section-action {
  font-size: 0.85rem;
  color: var(--claro-primary);
  text-decoration: none;
  font-weight: 600;
}

.section-action:hover {
  text-decoration: underline;
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
  margin-bottom: 8px;
}

.tl-axis-spacer-wide {
  width: 200px;
  flex-shrink: 0;
}

.tl-axis-ticks-top {
  flex: 1;
  display: flex;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.tl-axis-ticks-top span {
  font-size: 10px;
  font-weight: 600;
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
  height: 4px;
  background: rgba(var(--v-theme-on-surface), 0.1);
}

/* Row wrapper — establishes stacking context for shared NOW line */
.tl-rows-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Per-property row */
.tl-prop-row {
  display: flex;
  align-items: stretch;
  min-height: 80px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-radius: 16px;
  overflow: hidden;
}

/* Left info column: tonal fill from property color */
.tl-prop-info {
  width: 200px;
  box-sizing: border-box;
  flex-shrink: 0;
  padding: 16px;
  background: color-mix(in srgb, var(--prop-color, rgb(var(--v-theme-primary))) 12%, transparent);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.tl-prop-name {
  font-size: 15px;
  font-weight: 800;
  color: var(--claro-fg1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.tl-prop-sub {
  font-size: 12px;
  font-weight: 500;
  color: var(--claro-fg3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

/* Status pill */
.tl-status-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-top: 4px;
  width: fit-content;
}

.tl-status-pill--urgent   { background: var(--claro-error); color: #fff; }
.tl-status-pill--turn     { background: var(--claro-warning); color: #fff; }
.tl-status-pill--checkout { background: var(--claro-primary); color: #fff; }
.tl-status-pill--checkin  { background: var(--claro-success); color: #fff; }
.tl-status-pill--occupied { background: var(--claro-info); color: #fff; }
.tl-status-pill--vacant   { background: rgba(var(--v-theme-on-surface), 0.1); color: var(--claro-fg2); }

/* Ribbon — event chip container */
.tl-ribbon {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

/* Labeled event chips */
.tl-chip {
  position: absolute;
  transform: translateX(-50%);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  white-space: nowrap;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.2);
  line-height: 1.2;
  z-index: 3;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tl-chip--checkout { background: var(--claro-primary); }
.tl-chip--checkin  { background: #28C76F; }
.tl-chip--turn     { background: #FF9F43; }
.tl-chip--urgent   { background: #EA5455; box-shadow: 0 0 0 2px rgba(234, 84, 85, 0.28); }
.tl-chip--past     { opacity: 0.35; filter: grayscale(0.5); }

.tl-chip:hover:not(.tl-chip--past) {
  transform: translateX(-50%) translateY(-2px) scale(1.05);
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}

/* NOW scrubber */
.tl-now-line-v {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  transform: translateX(-50%);
  background: var(--claro-primary);
  z-index: 10;
  pointer-events: none;
}

.tl-now-bubble {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--claro-primary-dark);
  color: #fff;
  font-size: 9px;
  font-weight: 900;
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: 0.08em;
  white-space: nowrap;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
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
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
  color: var(--claro-fg3);
  text-transform: uppercase;
}

.tl-legend-mark {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

/* ── Property preview cards ── */
.prop-preview-card {
  padding: 16px;
  border-radius: var(--claro-radius-card, 24px);
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
}

.prop-preview-card.clickable {
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, border-color 0.2s ease;
}

.prop-preview-card.clickable:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--claro-shadow-md);
  border-color: rgba(var(--v-theme-primary), 0.3);
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.prop-preview-card.clickable:active {
  transform: translateY(-2px) scale(1.01);
}

.prop-preview-top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
}

.prop-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.prop-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--claro-fg1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.prop-meta {
  font-size: 12px;
  color: var(--claro-fg3);
  padding-left: 20px;
}

.prop-event-label {
  font-size: 12px;
  color: var(--claro-fg3);
  padding-left: 20px;
  margin-top: 2px;
}

.section-sub {
  font-size: 12px;
  color: var(--claro-fg3);
  margin-top: 2px;
}

/* ── Booking detail drawer ── */
/* Note: .bdr-overlay and .bdr-panel are Teleported to body, so they are NOT scoped.
   They live here for co-location but are injected globally at runtime. */
.bdr-wrap {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
}

.bdr-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.bdr-prop-name {
  font-size: 26px;
  font-weight: 900;
  color: var(--claro-fg1);
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.bdr-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.bdr-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.bdr-dates {
  font-size: 16px;
  color: var(--claro-fg3);
  font-weight: 600;
}

.bdr-chips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.bdr-section-label {
  font-size: 13px;
  font-weight: 800;
  color: var(--claro-fg3);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

/* ── Timebar ── */
.bdr-timebar-axis {
  position: relative;
  height: 56px;
  margin: 0 0 12px;
}

.bdr-timebar-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 3px;
  background: var(--claro-border);
  border-radius: 3px;
  transform: translateY(-50%);
}

.bdr-tb-block {
  position: absolute;
  top: 50%;
  height: 20px;
  border-radius: 4px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  letter-spacing: 0.05em;
}

.bdr-tb-out { background: var(--claro-error); }
.bdr-tb-in  { background: var(--claro-success); z-index: 2; }

.bdr-tb-turn {
  background: transparent;
  border: 2px dashed var(--claro-warning);
  height: 28px;
}

.bdr-tb-window-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--claro-warning);
  padding: 0 10px;
}

.bdr-timebar-ticks {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 600;
  color: var(--claro-fg3);
  font-variant-numeric: tabular-nums;
}

.bdr-tb-events {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
  margin-bottom: 6px;
}

.bdr-tb-event-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bdr-tb-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.bdr-tb-dot--checkout { background: var(--claro-error); }
.bdr-tb-dot--checkin  { background: var(--claro-success); }

.bdr-tb-event-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--claro-fg1);
  flex: 1;
}

.bdr-tb-event-time {
  font-size: 13px;
  font-weight: 700;
  color: var(--claro-fg3);
  font-variant-numeric: tabular-nums;
}

/* ── Timeline spine ── */
.bdr-tl-spine {
  padding-left: 16px;
  margin-bottom: 6px;
}

.bdr-tl-item {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 12px;
  align-items: flex-start;
  position: relative;
  padding-bottom: 22px;
}

.bdr-tl-item:last-child {
  padding-bottom: 0;
}

.bdr-tl-item::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 20px;
  bottom: 0;
  width: 2px;
  background: var(--claro-border);
}

.bdr-tl-item:last-child::before {
  display: none;
}

.bdr-tl-dot-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.bdr-tl-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: transparent;
  box-shadow: 0 0 0 2px var(--claro-primary);
}

.bdr-tl-content {
  padding-top: 2px;
}

.bdr-tl-date {
  font-size: 12px;
  font-weight: 800;
  color: var(--claro-fg3);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.bdr-tl-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--claro-fg1);
  line-height: 1.2;
}

.bdr-tl-sub {
  font-size: 13px;
  font-weight: 500;
  color: var(--claro-fg3);
  margin-top: 4px;
}

.bdr-notes {
  font-size: 16px;
  color: var(--claro-fg2);
  line-height: 1.5;
  margin: 0 0 6px;
}

.bdr-actions {
  margin-top: auto;
  padding-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
