<template>
  <v-container class="owner-overview" fluid>
    <v-progress-linear v-if="loading" class="mb-4" color="primary" indeterminate />

    <!-- Hero gradient banner (replaces OwnerPageHeader + old welcome banner) -->
    <v-row>
      <v-col cols="12">
        <OwnerWelcomeBanner
          :checkouts-today-count="checkoutsTodayCount"
          :turns-today-count="turnsTodayCount"
          :user-name="userName"
          :weekly-occupancy-pct="avgOccupancyPct"
        />
      </v-col>
    </v-row>

    <!-- Urgent / OK banner -->
    <v-row>
      <v-col cols="12">
        <div v-if="urgentTurns.length > 0" class="triage-banner triage-banner--urgent">
          <div class="triage-icon triage-icon--urgent">
            <v-icon aria-hidden="true" color="error" size="18">mdi-alert-circle-outline</v-icon>
          </div>
          <div class="triage-body">
            <div class="triage-title">Urgent turn · {{ urgentTurns[0].property }}</div>
            <div class="triage-sub">
              Guests out {{ urgentTurns[0].checkoutTime }} · new guests in {{ urgentTurns[0].checkinTime }} · same-day turn
            </div>
          </div>
          <v-btn color="error" size="small" variant="tonal" @click="uiStore.openModal('eventModal', 'view')">
            View details
          </v-btn>
        </div>

        <div v-else class="triage-banner triage-banner--ok">
          <div class="triage-icon triage-icon--ok">
            <v-icon aria-hidden="true" color="success" size="18">mdi-check</v-icon>
          </div>
          <div class="triage-body">
            <div class="triage-title">You're all set</div>
            <div class="triage-sub">
              Nothing urgent across your {{ myProperties.length }} properties right now.
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Today events strip -->
    <v-row v-if="todayEvents.length > 0">
      <v-col cols="12">
        <div class="section-head">
          <span class="section-title">Today · {{ todayFullLabel }}</span>
          <span class="section-count">{{ todayEvents.length }} event{{ todayEvents.length !== 1 ? 's' : '' }}</span>
        </div>
        <div class="today-strip">
          <div v-for="ev in todayEvents" :key="ev.id" class="event-pill">
            <div class="event-pill-time">{{ ev.time }}</div>
            <div class="event-pill-body">
              <div class="event-pill-prop">
                <div class="prop-dot" :style="{ background: ev.propColor }" />
                <span>{{ ev.propName }}</span>
              </div>
              <v-chip
                :color="ev.kind === 'checkin' ? 'success' : ev.kind === 'checkout' ? 'error' : 'warning'"
                density="comfortable"
                rounded="pill"
                size="x-small"
                variant="tonal"
              >
                {{ ev.kind === 'checkin' ? 'Check-in' : ev.kind === 'checkout' ? 'Check-out' : 'Turn' }}
                <template v-if="ev.guestCount"> · {{ ev.guestCount }}g</template>
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

    <!-- Bottom split: Yesterday + Upcoming -->
    <v-row>
      <!-- Upcoming bookings -->
      <v-col cols="12" md="7">
        <v-card class="up-card">
          <div class="up-head">
            <span class="section-title" style="margin: 0">Upcoming 14 days</span>
            <router-link class="section-action" to="/owner/calendar">View calendar →</router-link>
          </div>

          <div v-if="!upcoming14d.length" class="up-empty">
            <v-chip size="small" variant="tonal">No upcoming bookings</v-chip>
          </div>

          <div v-else class="up-list">
            <div v-for="item in upcoming14d" :key="item.id" class="up-row">
              <div class="up-date">
                <div class="up-date-m">{{ item.month }}</div>
                <div class="up-date-d">{{ item.day }}</div>
              </div>
              <div class="up-info">
                <div class="up-prop">
                  <div class="prop-dot" :style="{ background: item.propColor }" />
                  {{ item.propName }}
                </div>
                <div class="up-range">{{ item.range }}</div>
              </div>
              <v-chip
                :color="item.isTurn ? 'warning' : 'primary'"
                density="comfortable"
                rounded="pill"
                size="x-small"
                variant="tonal"
              >
                {{ item.isTurn ? 'Turn' : 'Standard' }}
              </v-chip>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Stat cards -->
      <v-col cols="12" md="5">
        <v-row>
          <v-col cols="6">
            <BookingStatsCard
              icon="mdi-home-outline"
              icon-color="var(--claro-primary)"
              title="Active Properties"
              :value="myProperties.length"
            />
          </v-col>
          <v-col cols="6">
            <BookingStatsCard
              icon="mdi-swap-horizontal"
              icon-color="var(--claro-warning)"
              title="Upcoming Turns"
              :value="turnsTodayCount"
            />
          </v-col>
          <v-col cols="6">
            <BookingStatsCard
              icon="mdi-login"
              icon-color="var(--claro-success)"
              title="Week Check-ins"
              :value="weekCheckinCount"
            />
          </v-col>
          <v-col cols="6">
            <BookingStatsCard
              icon="mdi-alert-outline"
              icon-color="var(--claro-error)"
              title="Unassigned"
              :value="unassignedCount"
            />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type { Property } from '@/types/property'
  import { computed, onMounted, ref } from 'vue'
  import type { PropertyListEvent, PropertyListItem } from '@/components/dumb/owner/PropertyList.vue'
  import BookingStatsCard from '@/components/dumb/owner/BookingStatsCard.vue'
  import PropertyList from '@/components/dumb/owner/PropertyList.vue'
  import OwnerWelcomeBanner from '@/components/dumb/owner/OwnerWelcomeBanner.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useAuthStore } from '@/stores/auth'
  import { useUIStore } from '@/stores/ui'
  import { formatPropertyAddress } from '@/types/property'
  import { mapLegacyPropertyColor } from '@/utils/constants'
  defineOptions({ name: 'OwnerOverview' })

  const authStore = useAuthStore()
  const uiStore   = useUIStore()
  const { myProperties, fetchMyProperties } = useOwnerProperties()
  const { myBookings, myTodayTurns, fetchMyBookings } = useOwnerBookings()

  const loading = ref(false)

  const propertyMap = computed(() => {
    const m = new Map<string, Property>()
    for (const p of myProperties.value) m.set(p.id, p)
    return m
  })

  onMounted(async () => {
    if (authStore.isAuthenticated && authStore.user?.role === 'owner') {
      loading.value = true
      try {
        await Promise.all([fetchMyProperties(), fetchMyBookings()])
      } catch (err: unknown) {
        console.error('Failed to load overview data:', err)
        uiStore.addNotification('error', 'Error', 'Failed to load dashboard data. Please refresh.')
      } finally {
        loading.value = false
      }
    }
  })

  const userName = computed(() =>
    authStore.user?.name || authStore.user?.email?.split('@')[0] || 'Owner',
  )

  const todayStr = new Date().toISOString().split('T')[0]
  const weekAhead = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0] })()
  const fortAhead = (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0] })()

  const todayFullLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // ── Today events strip ────────────────────────────────────────────────────────
  const todayEvents = computed(() => {
    const events: Array<{ id: string, propId: string, propName: string, propColor: string, time: string, kind: 'checkout' | 'checkin' | 'turn', guestCount?: number }> = []
    for (const b of myBookings.value) {
      if (b.status === 'cancelled') continue
      const p = propertyMap.value.get(b.property_id)
      if (!p) continue
      const name  = formatPropertyAddress(p, 'short')
      const color = mapLegacyPropertyColor(p.color)
      if (b.booking_type === 'turn' && b.checkin_date === todayStr) {
        events.push({ id: b.id + '-t', propId: p.id, propName: name, propColor: color, time: b.checkout_time ?? '11:00', kind: 'turn', guestCount: b.guest_count ?? undefined })
      } else {
        if (b.checkout_date === todayStr) events.push({ id: b.id + '-o', propId: p.id, propName: name, propColor: color, time: b.checkout_time ?? '11:00', kind: 'checkout', guestCount: b.guest_count ?? undefined })
        if (b.checkin_date  === todayStr) events.push({ id: b.id + '-i', propId: p.id, propName: name, propColor: color, time: b.checkin_time  ?? '15:00', kind: 'checkin',  guestCount: b.guest_count ?? undefined })
      }
    }
    return events.sort((a, b) => a.time.localeCompare(b.time))
  })

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

  // ── Counts ────────────────────────────────────────────────────────────────────
  const turnsTodayCount   = computed(() => myTodayTurns.value.length)
  const checkoutsTodayCount = computed(() => myBookings.value.filter(b => b.checkout_date === todayStr && b.status !== 'cancelled' && b.booking_type !== 'turn').length)
  const weekCheckinCount  = computed(() => myBookings.value.filter(b => b.checkin_date >= todayStr && b.checkin_date <= weekAhead && b.status !== 'cancelled' && b.booking_type !== 'turn').length)
  const unassignedCount   = computed(() => myBookings.value.filter(b => !b.assigned_cleaner_id && b.status !== 'cancelled' && b.status !== 'completed').length)

  // ── Occupancy ─────────────────────────────────────────────────────────────────
  const occupancyMap = computed(() => {
    const now  = new Date(); now.setHours(23, 59, 59, 999)
    const past = new Date(); past.setDate(past.getDate() - 30)
    const result = new Map<string, number>()
    for (const p of myProperties.value) {
      const days = new Set<string>()
      for (const b of myBookings.value) {
        if (b.property_id !== p.id || b.status === 'cancelled') continue
        const start = new Date(Math.max(new Date(b.checkin_date).getTime(), past.getTime()))
        const end   = new Date(Math.min(new Date(b.checkout_date).getTime(), now.getTime()))
        const cur = new Date(start)
        while (cur <= end) { days.add(cur.toISOString().slice(0, 10)); cur.setDate(cur.getDate() + 1) }
      }
      result.set(p.id, Math.min(Math.round((days.size / 30) * 100), 100))
    }
    return result
  })

  const avgOccupancyPct = computed(() => {
    if (!myProperties.value.length) return 0
    const total = [...occupancyMap.value.values()].reduce((a, b) => a + b, 0)
    return Math.round(total / myProperties.value.length)
  })

  // ── PropertyList items for overview accordion ────────────────────────────────
  const overviewListItems = computed((): PropertyListItem[] =>
    myProperties.value.map(p => {
      const bs = myBookings.value.filter(b => b.property_id === p.id && b.status !== 'cancelled')
      const isTurnToday = bs.some(b => b.checkin_date === todayStr && b.booking_type === 'turn')

      const todayEvts: PropertyListEvent[] = []
      for (const b of bs) {
        if (b.booking_type === 'turn' && b.checkin_date === todayStr) {
          todayEvts.push({ type: 'checkout', time: b.checkout_time ?? '11:00', time24: b.checkout_time ?? '11:00', isUnassigned: !b.assigned_cleaner_id })
          todayEvts.push({ type: 'checkin',  time: b.checkin_time  ?? '15:00', time24: b.checkin_time  ?? '15:00' })
        } else if (b.checkout_date === todayStr) {
          todayEvts.push({ type: 'checkout', time: b.checkout_time ?? '11:00', time24: b.checkout_time ?? '11:00', isUnassigned: !b.assigned_cleaner_id })
        } else if (b.checkin_date === todayStr) {
          todayEvts.push({ type: 'checkin',  time: b.checkin_time  ?? '15:00', time24: b.checkin_time  ?? '15:00' })
        }
      }

      const nextBook = bs
        .filter(b => b.checkin_date >= todayStr)
        .toSorted((a, b) => a.checkin_date.localeCompare(b.checkin_date))[0]

      const nextCheckin = nextBook ? {
        label: nextBook.checkin_date === todayStr
          ? `Today · ${nextBook.checkin_time ?? '15:00'}`
          : new Date(nextBook.checkin_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isTurnDay: nextBook.booking_type === 'turn',
      } : undefined

      return {
        property: p,
        nextCheckin,
        isTurnToday,
        todayEvents: todayEvts.length ? todayEvts : undefined,
        stats: {
          turnsYtd:       bs.filter(b => b.booking_type === 'turn').length,
          assignmentLabel: nextBook ? 'Next check-in' : 'No upcoming',
        },
      }
    }),
  )

  // ── Upcoming 14d ─────────────────────────────────────────────────────────────
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const upcoming14d = computed(() => {
    const items = myBookings.value
      .filter(b => b.status !== 'cancelled' && b.checkin_date >= todayStr && b.checkin_date <= fortAhead)
      .toSorted((a, b) => a.checkin_date.localeCompare(b.checkin_date))
      .slice(0, 6)
      .map(b => {
        const p = propertyMap.value.get(b.property_id)
        const ci = new Date(b.checkin_date)
        const co = new Date(b.checkout_date)
        return {
          id:        b.id,
          propName:  p ? formatPropertyAddress(p, 'short') : 'Unknown',
          propColor: mapLegacyPropertyColor(p?.color),
          month:     MONTHS[ci.getUTCMonth()].toUpperCase(),
          day:       ci.getUTCDate(),
          range:     `${MONTHS[ci.getUTCMonth()]} ${ci.getUTCDate()} – ${MONTHS[co.getUTCMonth()]} ${co.getUTCDate()}`,
          isTurn:    b.booking_type === 'turn',
        }
      })
    return items
  })
</script>

<style scoped>
.owner-overview {
  max-width: 1280px;
  padding-bottom: var(--claro-space-2xl);
}

.owner-overview :deep(.v-row + .v-row) {
  margin-top: var(--claro-section-gap);
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
  font-weight: 700;
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
  border-radius: var(--claro-radius-sm);
  flex-shrink: 0;
  min-width: 160px;
  box-shadow: var(--claro-shadow-sm);
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
  font-size: 10px;
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
  font-size: 10px;
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

/* ── Upcoming card ── */
.up-card {
  padding: 0;
  overflow: hidden;
}

.up-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--claro-border);
}

.up-empty {
  padding: 24px 20px;
}

.up-list {
  display: flex;
  flex-direction: column;
}

.up-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--claro-border);
  transition: background var(--claro-dur-fast) var(--claro-ease);
}

.up-row:last-child {
  border-bottom: none;
}

.up-row:hover {
  background: rgba(115, 103, 240, 0.025);
}

.up-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 36px;
  flex-shrink: 0;
}

.up-date-m {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--claro-fg3);
}

.up-date-d {
  font-size: 20px;
  font-weight: 700;
  color: var(--claro-fg1);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.up-info {
  flex: 1;
  min-width: 0;
}

.up-prop {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--claro-text-sm);
  font-weight: 500;
  color: var(--claro-fg1);
}

.up-range {
  font-size: var(--claro-text-xs);
  color: var(--claro-fg3);
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
}

/* ── Shared utils ── */
.prop-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}
</style>
