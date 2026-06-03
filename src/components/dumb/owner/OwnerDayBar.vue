<script setup lang="ts">
  import { fmt12, TIMELINE_DAY_SPAN, TIMELINE_DAY_START, timelineIsPast, timelinePct } from '@utils/timelineMath'
  import { computed, ref, watch } from 'vue'
  import RangeToggle from '@/components/dumb/shared/RangeToggle.vue'

  export interface DayBarEvent {
    id: string
    propId: string
    propName: string
    propColor: string
    type: 'checkout' | 'checkin' | 'turn'
    time: string // "HH:MM"
    guestCount?: number
    needsClean: boolean
    cleanFrom?: string
    cleanTo?: string
    cleanMins?: number
    bookingName?: string
  }

  export interface DayBarPropertyRow {
    propId: string
    propName: string
    propColor: string
    events: DayBarEvent[]
  }

  export interface RangeDayBlock {
    date: string
    label: string
    isToday: boolean
    events: Array<{
      bookingId: string
      propId: string
      propName: string
      propColor: string
      type: 'checkin' | 'checkout' | 'turn'
      time: string
      needsClean?: boolean
    }>
  }

  defineOptions({ name: 'OwnerDayBar' })

  const props = defineProps<{
    currentHour: number
    currentMin: number
    userName: string
    dateLabel: string
    range: number // 0=today, 1=3-day, 2=7-day
    propertyRows: DayBarPropertyRow[]
    dayBlocks: RangeDayBlock[]
    hasUrgent: boolean
    urgentSummary?: { property: string, checkoutTime: string, checkinTime: string }
  }>()

  const emit = defineEmits<{
    'update:range': [value: number]
    'open-booking': [id: string]
    'assign-cleaner': [id: string]
  }>()

  // ── Day-bar math: 8 AM–10 PM (14 hours) ─────────────────────────────────────
  // Constants and pure helpers come from @utils/timelineMath; only the
  // reactive NOW percentage is kept here because it depends on live props.
  const nowPct = computed(() => {
    const frac = (props.currentHour + props.currentMin / 60 - TIMELINE_DAY_START) / TIMELINE_DAY_SPAN
    return Math.max(0, Math.min(100, frac * 100))
  })

  const RANGE_LABELS = ['Today', '3 days', '7 days']

  const totalEventCount = computed(() => {
    if (props.range === 0) {
      return props.propertyRows.reduce((n, r) => n + r.events.length, 0)
    }
    return props.dayBlocks.reduce((n, d) => n + d.events.length, 0)
  })

  const firstName = computed(() => props.userName.split(' ')[0])

  // ── Bottom sheet ─────────────────────────────────────────────────────────────
  const selectedEvent = ref<DayBarEvent | null>(null)
  const sheetOpen = ref(false)

  function openSheet (ev: DayBarEvent) {
    selectedEvent.value = ev
    sheetOpen.value = true
  }

  watch(sheetOpen, open => {
    if (!open) {
      // Clear selection after the close animation finishes (~300ms)
      setTimeout(() => {
        selectedEvent.value = null
      }, 300)
    }
  })

  // ── Display helpers ──────────────────────────────────────────────────────────
  function typeLabel (t: DayBarEvent['type']): string {
    return { checkout: 'Check-out', checkin: 'Check-in', turn: 'Same-day turn' }[t] ?? t
  }

  function typeIcon (t: DayBarEvent['type']): string {
    return { checkout: 'mdi-logout', checkin: 'mdi-login', turn: 'mdi-swap-horizontal' }[t] ?? 'mdi-swap-horizontal'
  }

  function typeDotClass (t: string): string {
    return { checkout: 'dot--checkout', checkin: 'dot--checkin', turn: 'dot--turn' }[t] ?? ''
  }

  const displayTime = computed(() => {
    const h = props.currentHour
    const m = String(props.currentMin).padStart(2, '0')
    const ap = h >= 12 ? 'PM' : 'AM'
    const dh = h > 12 ? h - 12 : (h === 0 ? 12 : h)
    return `${dh}:${m} ${ap}`
  })
</script>

<template>
  <!-- ── Variant 1b · Day-bar with range toggle ── Mobile ────────────────────── -->
  <div class="daybar-root">

    <!-- ── Hero (dark gradient) ──────────────────────────────────────────────── -->
    <div class="daybar-hero">
      <div class="hero-glow" />

      <!-- Greeting row -->
      <div class="hero-top">
        <div class="hero-text">
          <div class="hero-date">{{ dateLabel }}</div>
          <div class="hero-greeting">Hi {{ firstName }}</div>
        </div>

        <div class="hero-meta">
          <span class="hero-range-chip">{{ RANGE_LABELS[range] }}</span>
          <span class="hero-count">{{ totalEventCount }} event{{ totalEventCount !== 1 ? 's' : '' }}</span>
        </div>
      </div>

      <!-- Now time + range toggle row -->
      <div class="hero-controls">
        <span class="hero-now-time">{{ displayTime }}</span>

        <RangeToggle
          :model-value="range"
          variant="dark"
          @update:model-value="emit('update:range', $event)"
        />
      </div>

      <!-- Urgent banner (today mode only) -->
      <div v-if="hasUrgent && urgentSummary && range === 0" class="hero-urgent">
        <v-icon class="urgent-bolt" size="14">mdi-lightning-bolt</v-icon>

        <div class="urgent-body">
          <div class="urgent-title">Urgent turn · {{ urgentSummary.property }}</div>

          <div class="urgent-sub">
            Guests out {{ fmt12(urgentSummary.checkoutTime) }} · new guests in {{ fmt12(urgentSummary.checkinTime) }}
          </div>
        </div>
      </div>
    </div><!-- /hero -->

    <!-- ── Single-day: per-property dbar rows ─────────────────────────────────── -->
    <template v-if="range === 0">
      <div v-if="propertyRows.length === 0" class="empty-state">
        <v-icon class="mb-2" color="primary" size="36">mdi-calendar-check-outline</v-icon>
        <p>Nothing scheduled for today</p>
      </div>

      <div v-else class="prop-rows">
        <div v-for="row in propertyRows" :key="row.propId" class="prop-row">
          <div class="prop-row-lbl">
            <div class="prop-dot" :style="{ background: row.propColor }" />
            <span>{{ row.propName }}</span>
          </div>

          <!-- Dbar track -->
          <div class="dbar-track">
            <!-- Event pips -->
            <button
              v-for="ev in row.events"
              :key="ev.id"
              class="dbar-pip"
              :class="{
                'dbar-pip--turn': ev.type === 'turn',
                'dbar-pip--checkin': ev.type === 'checkin',
                'dbar-pip--urgent': ev.needsClean,
                'dbar-pip--past': timelineIsPast(ev.time, currentHour, currentMin),
                'dbar-pip--active': selectedEvent?.id === ev.id,
              }"
              :style="{ left: `calc(${timelinePct(ev.time)}% - 5px)` }"
              :title="`${ev.propName} · ${fmt12(ev.time)}`"
              @click.stop="openSheet(ev)"
            />

            <!-- NOW line -->
            <div class="dbar-now" :style="{ left: `calc(${nowPct}% - 1px)` }">
              <span class="now-label">NOW</span>
            </div>
          </div>

        </div>
      </div>

      <!-- Shared axis for all rows -->
      <div v-if="propertyRows.length > 0" class="dbar-axis">
        <span v-for="h in [8, 10, 12, 14, 16, 18, 20, 22]" :key="h">
          {{ h <= 12 ? `${h}a` : `${h - 12}p` }}
        </span>
      </div>

      <!-- Pip legend -->
      <div v-if="propertyRows.length > 0" class="dbar-legend">
        <div class="dbar-legend-item">
          <span class="dbar-legend-pip dbar-legend-pip--checkin" />
          <span>Check-in</span>
        </div>

        <div class="dbar-legend-item">
          <span class="dbar-legend-pip dbar-legend-pip--checkout" />
          <span>Check-out</span>
        </div>

        <div class="dbar-legend-item">
          <span class="dbar-legend-pip dbar-legend-pip--turn" />
          <span>Turn</span>
        </div>

        <div class="dbar-legend-item">
          <span class="dbar-legend-pip dbar-legend-pip--urgent" />
          <span>Unassigned</span>
        </div>
      </div>
    </template>

    <!-- ── Multi-day: per-day event blocks ───────────────────────────────────── -->
    <template v-else>
      <div class="day-blocks">
        <div v-for="block in dayBlocks" :key="block.date" class="day-block">
          <div class="day-block-hd" :class="{ 'day-block-hd--today': block.isToday }">
            {{ block.label }}
          </div>

          <div v-if="block.events.length === 0" class="day-empty">
            Nothing scheduled
          </div>

          <button
            v-for="ev in block.events"
            :key="ev.bookingId + ev.type"
            class="day-evt"
            @click="emit('open-booking', ev.bookingId)"
          >
            <div class="day-evt-dot" :class="typeDotClass(ev.type)" />

            <div class="day-evt-body">
              <span class="day-evt-prop">{{ ev.propName }}</span>
              <span class="day-evt-sep">·</span>
              <span class="day-evt-time">{{ fmt12(ev.time) }}</span>
              <span class="day-evt-sep">·</span>
              <span class="day-evt-kind">{{ typeLabel(ev.type) }}</span>
            </div>

            <span v-if="ev.needsClean" class="day-evt-action">Action needed</span>
            <v-icon class="day-evt-chevron" size="13">mdi-chevron-right</v-icon>
          </button>
        </div>
      </div>
    </template>

    <!-- Bottom breathing room -->
    <div class="bottom-spacer" />

    <!-- ── Detail bottom sheet ──────────────────────────────────────────────── -->
    <v-bottom-sheet v-model="sheetOpen" max-width="600">
      <v-card v-if="selectedEvent" class="sheet-card" flat rounded="0">
        <div class="sheet-handle" />

        <div class="sheet-header">
          <div class="sheet-color-dot" :style="{ background: selectedEvent.propColor }" />

          <div class="sheet-header-text">
            <div class="sheet-prop">{{ selectedEvent.propName }}</div>

            <div class="sheet-sub">
              <v-icon
                class="mr-1"
                :color="selectedEvent.type === 'turn' ? 'warning' : selectedEvent.type === 'checkin' ? 'success' : 'error'"
                size="13"
              >{{ typeIcon(selectedEvent.type) }}</v-icon>
              {{ typeLabel(selectedEvent.type) }} · {{ fmt12(selectedEvent.time) }}
              <template v-if="selectedEvent.guestCount"> · {{ selectedEvent.guestCount }} guests</template>
            </div>
          </div>

          <v-btn
            aria-label="Close"
            density="compact"
            icon
            variant="text"
            @click="sheetOpen = false"
          >
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>

        <div v-if="selectedEvent.needsClean" class="sheet-alert">
          <v-icon class="mr-1" color="warning" size="14">mdi-alert-circle-outline</v-icon>
          No cleaner assigned — action needed
        </div>

        <div v-if="selectedEvent.bookingName" class="sheet-guest">
          <v-icon class="mr-1" size="13" style="opacity:0.45">mdi-account-outline</v-icon>
          {{ selectedEvent.bookingName }}
        </div>

        <div
          v-if="selectedEvent.type === 'turn' && selectedEvent.cleanFrom && selectedEvent.cleanTo"
          class="sheet-clean-window"
        >
          <div>
            <div class="clean-window-label">Cleaning window</div>
            <div class="clean-window-dur">{{ selectedEvent.cleanMins }} min est.</div>
          </div>

          <span class="clean-window-times">{{ selectedEvent.cleanFrom }} → {{ selectedEvent.cleanTo }}</span>
        </div>

        <div class="sheet-actions">
          <v-btn
            block
            color="primary"
            rounded="sm"
            @click="emit('open-booking', selectedEvent.id); sheetOpen = false"
          >
            <v-icon size="16" start>mdi-calendar-check-outline</v-icon>
            Open booking
          </v-btn>

          <v-btn
            v-if="selectedEvent.needsClean"
            block
            rounded="sm"
            variant="outlined"
            @click="emit('assign-cleaner', selectedEvent.id); sheetOpen = false"
          >
            <v-icon size="16" start>mdi-account-plus-outline</v-icon>
            Assign cleaner
          </v-btn>
        </div>
      </v-card>
    </v-bottom-sheet>
  </div>
</template>
