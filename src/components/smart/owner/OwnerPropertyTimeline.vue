<template>
  <div class="opt-page">
    <!-- Hero banner replaces OwnerPageHeader -->
    <v-container fluid class="pt-0">
      <OwnerWelcomeBanner
        page-title="Timeline"
        subtitle="Your portfolio schedule at a glance"
        :stats="[
          { icon: 'mdi-home-outline',    label: 'Properties',  value: myProperties.length    },
          { icon: 'mdi-calendar-today',  label: 'Events Today', value: todayEvents.length    },
          { icon: 'mdi-calendar-week',   label: 'Window',      value: '14 days'              },
        ]"
      />
    </v-container>

    <!-- Mobile: day-grouped card feed -->
    <div v-if="mobile" class="opt-mobile">
      <v-skeleton-loader v-if="loading" type="card, list-item-three-line@3" />
      <MobileTimelineFeed
        v-else
        :events="mobileEvents"
        :properties="propChips"
      />
    </div>

    <!-- Desktop: 14-day band grid -->
    <v-container v-else fluid class="pt-0">
      <v-skeleton-loader v-if="loading" type="table-row@5" />
      <OwnerBandGrid
        v-else
        :bookings="bandBookings"
        :days="14"
        :properties="bandProperties"
        :recent-activity="recentActivity"
        :today-events="todayEvents"
      />
    </v-container>
  </div>
</template>

<script setup lang="ts">
  import type { Property } from '@/types/property'
  import { computed, onMounted, ref } from 'vue'
  import { useDisplay } from 'vuetify'
  import OwnerBandGrid from '@/components/dumb/owner/OwnerBandGrid.vue'
  import type { BandGridBooking, BandGridProperty, TodayEvent, ActivityItem } from '@/components/dumb/owner/OwnerBandGrid.vue'
  import MobileTimelineFeed from '@/components/dumb/owner/MobileTimelineFeed.vue'
  import type { MobileEvent, PropChip } from '@/components/dumb/owner/MobileTimelineFeed.vue'
  import OwnerWelcomeBanner from '@/components/dumb/owner/OwnerWelcomeBanner.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useAuthStore } from '@/stores/auth'
  import { useUIStore } from '@/stores/ui'
  import { formatPropertyAddress } from '@/types/property'
  import { mapLegacyPropertyColor } from '@/utils/constants'
  import { propStatus } from '@utils/propertyStatus'
  import { useToday } from '@composables/shared/useToday'

  defineOptions({ name: 'OwnerPropertyTimeline' })

  const { mobile } = useDisplay()
  const authStore  = useAuthStore()
  const uiStore    = useUIStore()
  const { myProperties, fetchMyProperties } = useOwnerProperties()
  const { myBookings, fetchMyBookings } = useOwnerBookings()

  const loading = ref(false)

  onMounted(async () => {
    if (!authStore.isAuthenticated) return
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
      console.error('Timeline load failed:', reason)
      uiStore.addNotification('error', 'Load Error', `Failed to load ${failed}. Please refresh.`)
    }
  })

  const { todayStr } = useToday()
  const msDay = 86400000

  function daysFromToday(dateStr: string): number {
    const today = new Date(); today.setHours(0,0,0,0)
    const d = new Date(dateStr); d.setHours(0,0,0,0)
    return Math.round((d.getTime() - today.getTime()) / msDay)
  }

  function propColor(p: Property): string {
    return mapLegacyPropertyColor(p.color)
  }

  function propInitial(p: Property): string {
    return (formatPropertyAddress(p, 'short')[0] ?? 'P').toUpperCase()
  }

  function propName(p: Property): string {
    return formatPropertyAddress(p, 'short')
  }

  function propMeta(p: Property): string {
    const parts: string[] = []
    if (p.bedrooms) parts.push(`${p.bedrooms}bd`)
    if (p.address_city) parts.push(p.address_city)
    return parts.join(' · ')
  }

  // ── Desktop band grid data ────────────────────────────────────────────────────
  const bandProperties = computed((): BandGridProperty[] =>
    myProperties.value.map(p => ({
      id:      p.id,
      name:    propName(p),
      color:   propColor(p),
      initial: propInitial(p),
      meta:    propMeta(p),
      status:  propStatus(p.id, myBookings.value, todayStr.value),
    })),
  )

  const bandBookings = computed((): BandGridBooking[] =>
    myBookings.value
      .filter(b => b.status !== 'cancelled')
      .map(b => ({
        id:         b.id,
        propertyId: b.property_id,
        guestName:  b.notes?.split('\n')[0] ?? 'Guest',
        guestCount: b.guest_count ?? undefined,
        startDay:   daysFromToday(b.checkin_date),
        endDay:     daysFromToday(b.checkout_date),
        type:       b.booking_type as 'standard' | 'turn',
        priority:   b.priority as BandGridBooking['priority'],
      })),
  )

  const todayEvents = computed((): TodayEvent[] => {
    const events: TodayEvent[] = []
    for (const b of myBookings.value) {
      if (b.status === 'cancelled') continue
      const p = myProperties.value.find(pr => pr.id === b.property_id)
      if (!p) continue
      const name  = propName(p)
      const color = propColor(p)
      if (b.booking_type === 'turn' && b.checkin_date === todayStr.value) {
        events.push({ propId: p.id, propName: name, propColor: color, time: b.checkout_time ?? '11:00', kind: 'turn' })
      } else {
        if (b.checkout_date === todayStr.value) events.push({ propId: p.id, propName: name, propColor: color, time: b.checkout_time ?? '11:00', kind: 'checkout' })
        if (b.checkin_date  === todayStr.value) events.push({ propId: p.id, propName: name, propColor: color, time: b.checkin_time  ?? '15:00', kind: 'checkin'  })
      }
    }
    return events.sort((a, b) => a.time.localeCompare(b.time))
  })

  const recentActivity = computed((): ActivityItem[] => {
    const yesterdayStr = (() => {
      const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]
    })()
    const items: ActivityItem[] = []
    for (const b of myBookings.value) {
      const p = myProperties.value.find(pr => pr.id === b.property_id)
      if (!p) continue
      if (b.updated_at) {
        const dayOf = b.updated_at.slice(0, 10)
        if (dayOf === todayStr.value || dayOf === yesterdayStr) {
          items.push({
            type: 'modified',
            text: `Updated booking at ${propName(p)}`,
            timeAgo: dayOf === todayStr.value ? 'Today' : 'Yesterday',
            propName: propName(p),
          })
        }
      }
    }
    return items.slice(0, 4)
  })

  // ── Mobile card feed data ────────────────────────────────────────────────────
  const propChips = computed((): PropChip[] =>
    myProperties.value.map(p => ({
      id:    p.id,
      name:  propName(p),
      city:  p.address_city ?? '',
      color: propColor(p),
    })),
  )

  const mobileEvents = computed((): MobileEvent[] => {
    const events: MobileEvent[] = []
    for (const b of myBookings.value) {
      if (b.status === 'cancelled') continue
      const p = myProperties.value.find(pr => pr.id === b.property_id)
      if (!p) continue
      const day = daysFromToday(b.booking_type === 'turn' ? b.checkin_date : b.checkout_date)
      if (day < 0 || day > 13) continue

      if (b.booking_type === 'turn') {
        events.push({
          id:         b.id,
          propId:     p.id,
          propName:   propName(p),
          propColor:  propColor(p),
          city:       p.address_city ?? '',
          day,
          time:       `${b.checkout_time ?? '11:00'}→${b.checkin_time ?? '15:00'}`,
          type:       'turn',
          guestCount: b.guest_count ?? undefined,
          status:     b.status,
          urgent:     b.priority === 'urgent',
          cleanFrom:  b.checkout_time ?? '11:00',
          cleanTo:    b.checkin_time  ?? '15:00',
          notes:      b.notes ?? undefined,
        })
      } else {
        const coDays = daysFromToday(b.checkout_date)
        const ciDays = daysFromToday(b.checkin_date)
        if (coDays >= 0 && coDays <= 13) {
          events.push({
            id:        `${b.id}-out`,
            propId:    p.id,
            propName:  propName(p),
            propColor: propColor(p),
            city:      p.address_city ?? '',
            day:       coDays,
            time:      b.checkout_time ?? '11:00',
            type:      'out',
            guestCount:b.guest_count ?? undefined,
            status:    b.status,
            notes:     b.notes ?? undefined,
          })
        }
        if (ciDays >= 0 && ciDays <= 13) {
          events.push({
            id:        `${b.id}-in`,
            propId:    p.id,
            propName:  propName(p),
            propColor: propColor(p),
            city:      p.address_city ?? '',
            day:       ciDays,
            time:      b.checkin_time ?? '15:00',
            type:      'in',
            guestCount:b.guest_count ?? undefined,
            status:    b.status,
            notes:     b.notes ?? undefined,
          })
        }
      }
    }
    return events.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time))
  })
</script>

<style scoped>
.opt-page {
  min-height: calc(100vh - var(--claro-app-bar-height, 64px));
  background: var(--claro-background);
}

.opt-mobile {
  height: calc(100vh - var(--claro-app-bar-height, 64px) - 72px);
}
</style>
