<template>
  <!-- ── A3 Day-bar: mobile layout ── -->
  <OwnerDayBar
    v-if="mobile"
    :checkin-count="checkinsTodayCount"
    :checkout-count="checkoutsTodayOnlyCount"
    :current-hour="currentHour"
    :current-min="currentMin"
    :date-label="todayDateLabel"
    :events="dayBarEvents"
    :needs-action-count="needsActionTodayCount"
    :turn-count="turnsTodayCount"
    :user-name="userName"
    @assign-cleaner="handleDayBarAssignCleaner"
    @open-booking="handleDayBarOpenBooking"
  />

  <!-- ── Desktop layout ── -->
  <v-container v-else class="owner-overview" fluid>
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
              Guests out {{ fmt12(urgentTurns[0].checkoutTime) }} · new guests in {{ fmt12(urgentTurns[0].checkinTime) }} · same-day turn
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
          <div v-for="ev in todayEvents" :key="ev.id" class="event-pill" :style="{ '--pill-color': ev.propColor }">
            <div class="event-pill-time">{{ fmt12(ev.time) }}</div>

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

    <!-- Bookings section -->
    <v-row>
      <v-col cols="12">
        <div class="section-head">
          <span class="section-title">Bookings</span>
        </div>

        <!-- Segment tabs + filters -->
        <div class="bookings-toolbar">
          <div class="bookings-segments">
            <button
              v-for="seg in segments"
              :key="seg.value"
              class="seg-btn"
              :class="{ 'seg-btn--active': selectedSegment === seg.value }"
              @click="selectedSegment = seg.value"
            >
              {{ seg.title }}
            </button>
          </div>

          <div class="bookings-filters">
            <v-select
              v-model="selectedProperty"
              clearable
              density="compact"
              hide-details
              :items="propertyOptions"
              label="Property"
              prepend-inner-icon="mdi-home-outline"
              style="max-width: 200px"
              variant="outlined"
            />

            <v-select
              v-model="selectedType"
              clearable
              density="compact"
              hide-details
              :items="typeOptions"
              label="Type"
              prepend-inner-icon="mdi-tag-outline"
              style="max-width: 150px"
              variant="outlined"
            />
          </div>
        </div>

        <OwnerBookingList
          expand-mode="sheet"
          :items="allBookingsItems"
          :loading="loading"
          @delete="handleDeleteBooking"
          @edit="handleEditBooking"
        />

        <ConfirmationDialog
          confirm-text="Delete"
          dangerous
          :message="`Delete this booking at ${bookingToDeleteName}?`"
          :open="deleteConfirmOpen"
          title="Delete Booking"
          @cancel="deleteConfirmOpen = false"
          @confirm="confirmDeleteBooking"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type { BookingListItem } from '@/components/dumb/owner/OwnerBookingList.vue'
  import type { DayBarEvent } from '@/components/dumb/owner/OwnerDayBar.vue'
  import type { PropertyListEvent, PropertyListItem } from '@/components/dumb/owner/PropertyList.vue'
  import type { Booking, ModalData } from '@/types'
  import type { Property } from '@/types/property'
  import { useToday } from '@composables/shared/useToday'
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import OwnerBookingList from '@/components/dumb/owner/OwnerBookingList.vue'
  import OwnerDayBar from '@/components/dumb/owner/OwnerDayBar.vue'
  import OwnerWelcomeBanner from '@/components/dumb/owner/OwnerWelcomeBanner.vue'
  import PropertyList from '@/components/dumb/owner/PropertyList.vue'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
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
  const { myBookings, myTodayTurns, fetchMyBookings, deleteMyBooking } = useOwnerBookings()

  const loading = ref(false)
  const deleteConfirmOpen = ref(false)
  const bookingToDelete = ref<Booking | null>(null)

  const propertyMap = computed(() => {
    const m = new Map<string, Property>()
    for (const p of myProperties.value) m.set(p.id, p)
    return m
  })

  onMounted(async () => {
    if (!authStore.isAuthenticated || authStore.user?.role !== 'owner') return
    loading.value = true
    const [propResult, bookResult] = await Promise.allSettled([
      fetchMyProperties(),
      fetchMyBookings(),
    ])
    loading.value = false
    if (propResult.status === 'rejected' || bookResult.status === 'rejected') {
      const failed = [
        propResult.status === 'rejected' ? 'properties' : null,
        bookResult.status === 'rejected' ? 'bookings' : null,
      ].filter(Boolean).join(' and ')
      const reason = propResult.status === 'rejected' ? propResult.reason : (bookResult as PromiseRejectedResult).reason
      console.error('Failed to load overview data:', reason)
      uiStore.addNotification('error', 'Load Error', `Failed to load ${failed}. Please refresh.`)
    }
  })

  const userName = computed(() =>
    authStore.user?.name || authStore.user?.email?.split('@')[0] || 'Owner',
  )

  const { todayStr, todayLabel: todayFullLabel } = useToday()

  // ── Today events strip ────────────────────────────────────────────────────────
  const todayEvents = computed(() => {
    const events: Array<{ id: string, propId: string, propName: string, propColor: string, time: string, kind: 'checkout' | 'checkin' | 'turn', guestCount?: number }> = []
    for (const b of myBookings.value) {
      if (b.status === 'cancelled') continue
      const p = propertyMap.value.get(b.property_id)
      if (!p) continue
      const name = formatPropertyAddress(p, 'short')
      const color = mapLegacyPropertyColor(p.color)
      if (b.booking_type === 'turn' && b.checkin_date === todayStr.value) {
        events.push({ id: b.id + '-t', propId: p.id, propName: name, propColor: color, time: b.checkout_time ?? '11:00', kind: 'turn', guestCount: b.guest_count ?? undefined })
      } else {
        if (b.checkout_date === todayStr.value) events.push({ id: b.id + '-o', propId: p.id, propName: name, propColor: color, time: b.checkout_time ?? '11:00', kind: 'checkout', guestCount: b.guest_count ?? undefined })
        if (b.checkin_date === todayStr.value) events.push({ id: b.id + '-i', propId: p.id, propName: name, propColor: color, time: b.checkin_time ?? '15:00', kind: 'checkin', guestCount: b.guest_count ?? undefined })
      }
    }
    return events.toSorted((a, b) => a.time.localeCompare(b.time))
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
  const turnsTodayCount = computed(() => myTodayTurns.value.length)
  const checkoutsTodayCount = computed(() => myBookings.value.filter(b => b.checkout_date === todayStr.value && b.status !== 'cancelled' && b.booking_type !== 'turn').length)

  // ── Bookings section state ─────────────────────────────────────────────────
  const selectedSegment = ref('upcoming')
  const selectedProperty = ref<string | null>(null)
  const selectedType = ref<string | null>(null)

  const segments = [
    { title: 'Upcoming', value: 'upcoming' },
    { title: 'All', value: 'all' },
    { title: 'Turns', value: 'turns' },
    { title: 'Past', value: 'past' },
  ]

  const typeOptions = [
    { title: 'Standard', value: 'standard' },
    { title: 'Turn', value: 'turn' },
  ]

  const propertyOptions = computed(() =>
    myProperties.value.map(p => ({
      title: formatPropertyAddress(p, 'short'),
      value: p.id,
    })),
  )

  // ── A3 Day-bar data (mobile only) ──────────────────────────────────────────
  const now = new Date()
  const currentHour = ref(now.getHours())
  const currentMin = ref(now.getMinutes())

  const todayDateLabel = computed(() => {
    const d = new Date()
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  })

  const checkoutsTodayOnlyCount = computed(() =>
    myBookings.value.filter(b => b.checkout_date === todayStr.value && b.status !== 'cancelled' && b.booking_type !== 'turn').length,
  )

  const checkinsTodayCount = computed(() =>
    myBookings.value.filter(b => b.checkin_date === todayStr.value && b.status !== 'cancelled' && b.booking_type !== 'turn').length,
  )

  const needsActionTodayCount = computed(() =>
    myBookings.value.filter(b =>
      b.status !== 'cancelled'
      && (b.checkout_date === todayStr.value || b.checkin_date === todayStr.value)
      && !b.assigned_cleaner_id
      && !b.assigned_team_id,
    ).length,
  )

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

  function handleDayBarOpenBooking (eventId: string): void {
    const bookingId = eventId.replace(/-[toi]$/, '')
    router.push({ path: '/owner/bookings', query: { id: bookingId } })
  }

  function handleDayBarAssignCleaner (_eventId: string): void {
    uiStore.addNotification('info', 'Cleaner Assignment', 'Contact your admin to assign a cleaner for this turn.')
  }

  // ── Occupancy ─────────────────────────────────────────────────────────────────
  const occupancyMap = computed(() => {
    const now = new Date()
    now.setHours(23, 59, 59, 999)
    const past = new Date()
    past.setDate(past.getDate() - 30)
    const result = new Map<string, number>()
    for (const p of myProperties.value) {
      const days = new Set<string>()
      for (const b of myBookings.value) {
        if (b.property_id !== p.id || b.status === 'cancelled') continue
        const start = new Date(Math.max(new Date(b.checkin_date).getTime(), past.getTime()))
        const end = new Date(Math.min(new Date(b.checkout_date).getTime(), now.getTime()))
        const cur = new Date(start)
        while (cur <= end) {
          days.add(cur.toISOString().slice(0, 10))
          cur.setDate(cur.getDate() + 1)
        }
      }
      result.set(p.id, Math.min(Math.round((days.size / 30) * 100), 100))
    }
    return result
  })

  const avgOccupancyPct = computed(() => {
    if (myProperties.value.length === 0) return 0
    const total = [...occupancyMap.value.values()].reduce((a, b) => a + b, 0)
    return Math.round(total / myProperties.value.length)
  })

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

  // ── All bookings (with segment + filter) ─────────────────────────────────────
  const allBookingsItems = computed((): BookingListItem[] => {
    let bookings = myBookings.value.filter(b => b.status !== 'cancelled')

    switch (selectedSegment.value) {
      case 'upcoming': {
        bookings = bookings.filter(b => b.checkout_date >= todayStr.value)
        break
      }
      case 'turns': {
        bookings = bookings.filter(b => b.booking_type === 'turn')
        break
      }
      case 'past': {
        bookings = bookings.filter(b => b.checkout_date < todayStr.value)
        break
      }
    }

    if (selectedProperty.value) bookings = bookings.filter(b => b.property_id === selectedProperty.value)
    if (selectedType.value) bookings = bookings.filter(b => b.booking_type === selectedType.value)

    return bookings
      .toSorted((a, b) => a.checkin_date.localeCompare(b.checkin_date))
      .map(b => {
        const p = propertyMap.value.get(b.property_id)
        return {
          id: b.id,
          propertyName: p ? formatPropertyAddress(p, 'short') : 'Unknown',
          propertyColor: mapLegacyPropertyColor(p?.color),
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
      })
  })

  function fmt12 (time24: string): string {
    const [h, m] = time24.split(':').map(Number)
    if (Number.isNaN(h)) return time24
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${String(m ?? 0).padStart(2, '0')} ${period}`
  }

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
    } catch (error) {
      console.error('Failed to delete booking:', error)
      uiStore.addNotification('error', 'Delete Failed', error instanceof Error ? error.message : 'Could not delete booking')
    } finally {
      deleteConfirmOpen.value = false
      bookingToDelete.value = null
    }
  }
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

/* ── Bookings toolbar ── */
.bookings-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.bookings-segments {
  display: flex;
  gap: 2px;
  background: var(--claro-surface-variant);
  border-radius: var(--claro-radius-sm);
  padding: 3px;
  flex-shrink: 0;
}

.seg-btn {
  padding: 5px 14px;
  border: none;
  background: transparent;
  border-radius: calc(var(--claro-radius-sm) - 1px);
  font-size: var(--claro-text-xs);
  font-weight: 500;
  color: var(--claro-fg3);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  white-space: nowrap;
}

.seg-btn:hover {
  color: var(--claro-fg1);
  background: rgba(var(--v-theme-surface), 0.6);
}

.seg-btn--active {
  background: var(--claro-surface);
  color: var(--claro-fg1);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.bookings-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: auto;
}

/* ── Shared utils ── */
.prop-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}
</style>
