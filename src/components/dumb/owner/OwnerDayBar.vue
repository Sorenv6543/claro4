<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export interface DayBarEvent {
  id: string
  propId: string
  propName: string
  propColor: string
  type: 'checkout' | 'checkin' | 'turn'
  time: string        // "HH:MM"
  guestCount?: number
  needsClean: boolean // no cleaner assigned — triggers amber "Action needed"
  cleanFrom?: string  // turn only
  cleanTo?: string    // turn only
  cleanMins?: number  // turn only
  bookingName?: string
}

defineOptions({ name: 'OwnerDayBar' })

const props = defineProps<{
  events: DayBarEvent[]
  userName: string
  dateLabel: string
  currentHour: number
  currentMin: number
  checkoutCount: number
  turnCount: number
  checkinCount: number
  needsActionCount: number
}>()

const emit = defineEmits<{
  'open-booking': [id: string]
  'assign-cleaner': [id: string]
}>()

// ── Day-bar math ─────────────────────────────────────────────────────────────
// Timeline spans 7am–9pm (14 hours)
const DAY_START = 7
const DAY_SPAN  = 14 // hours

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function barPct(time: string): number {
  const [h, m] = time.split(':').map(Number)
  const frac = ((h ?? 0) + (m ?? 0) / 60 - DAY_START) / DAY_SPAN
  return Math.max(0, Math.min(100, frac * 100))
}

const nowPct = computed(() => {
  const frac = (props.currentHour + props.currentMin / 60 - DAY_START) / DAY_SPAN
  return Math.max(0, Math.min(100, frac * 100))
})

function isPast(time: string): boolean {
  const eventMins = timeToMinutes(time)
  const nowMins   = props.currentHour * 60 + props.currentMin
  return eventMins < nowMins
}

const TICK_HOURS = [7, 10, 13, 16, 19]
const TIME_LABELS = ['7a', '10a', '1p', '4p', '7p', '9p']

// ── Bottom sheet ─────────────────────────────────────────────────────────────
const selectedEvent = ref<DayBarEvent | null>(null)
const sheetOpen = ref(false)

function openSheet(ev: DayBarEvent) {
  selectedEvent.value = ev
  sheetOpen.value = true
}

// Clear selection after the close animation finishes (~300ms)
watch(sheetOpen, (open) => {
  if (!open) setTimeout(() => { selectedEvent.value = null }, 300)
})

// ── Display helpers ──────────────────────────────────────────────────────────
function typeLabel(t: DayBarEvent['type']): string {
  return t === 'out' ? 'Check-out' : t === 'in' ? 'Check-in'
    : t === 'checkout' ? 'Check-out' : t === 'checkin' ? 'Check-in'
    : 'Same-day turn'
}

function typeIcon(t: DayBarEvent['type']): string {
  return t === 'checkout' ? 'mdi-logout' : t === 'checkin' ? 'mdi-login' : 'mdi-swap-horizontal'
}

// ── Display time ─────────────────────────────────────────────────────────────
const displayTime = computed(() => {
  const h  = props.currentHour
  const m  = props.currentMin.toString().padStart(2, '0')
  const ap = h >= 12 ? 'PM' : 'AM'
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${dh}:${m} ${ap}`
})

const statCounts = computed(() => [
  { n: props.checkoutCount,    label: 'Checkouts' },
  { n: props.turnCount,        label: 'Turns' },
  { n: props.checkinCount,     label: 'Check-ins' },
  { n: props.needsActionCount, label: 'Need cleaner', alert: true },
])
</script>

<template>
  <!-- ── A3 · Horizontal day-bar ── Mobile only ──────────────────────────── -->
  <div class="daybar-root">

    <!-- ── Hero gradient ─────────────────────────────────────────────────── -->
    <div class="daybar-hero">
      <div class="hero-glow" />

      <div class="hero-top">
        <div>
          <div class="hero-date">{{ dateLabel }}</div>
          <div class="hero-greeting">Good morning, {{ userName.split(' ')[0] }}</div>
        </div>
        <div class="hero-bell">
          <v-icon color="white" size="18">mdi-bell-outline</v-icon>
        </div>
      </div>

      <!-- Day timeline bar -->
      <div class="timeline-label-row">
        <span class="timeline-label">Today's timeline</span>
        <span class="timeline-now-time">{{ displayTime }}</span>
      </div>

      <div class="timeline-track">
        <!-- Hour ticks -->
        <div
          v-for="h in TICK_HOURS"
          :key="h"
          class="tick"
          :style="{ left: `${(h - DAY_START) / DAY_SPAN * 100}%` }"
        />

        <!-- Event markers -->
        <button
          v-for="ev in events"
          :key="ev.id"
          class="event-pip"
          :class="{
            'event-pip--amber':  ev.needsClean,
            'event-pip--past':   isPast(ev.time),
            'event-pip--active': selectedEvent?.id === ev.id,
          }"
          :style="{ left: `calc(${barPct(ev.time)}% - 5px)` }"
          :title="`${ev.propName} · ${ev.time}`"
          @click.stop="openSheet(ev)"
        />

        <!-- NOW line -->
        <div class="now-line" :style="{ left: `calc(${nowPct}% - 1px)` }">
          <span class="now-label">NOW</span>
        </div>
      </div>

      <!-- Time axis labels -->
      <div class="timeline-axis">
        <span v-for="t in TIME_LABELS" :key="t">{{ t }}</span>
      </div>

      <!-- Stat counts -->
      <div class="hero-stats">
        <template v-for="(s, i) in statCounts" :key="s.label">
          <div v-if="i > 0" class="stat-divider" />
          <div class="stat-item" :class="{ 'stat-item--alert': s.alert }">
            <span class="stat-n">{{ s.n }}</span>
            <span class="stat-lbl">{{ s.label }}</span>
          </div>
        </template>
      </div>
    </div><!-- /hero -->

    <!-- ── Section header ────────────────────────────────────────────────── -->
    <div class="section-head">
      <span class="section-title">Schedule</span>
      <div class="section-rule" />
      <span class="section-count">{{ events.length }} events</span>
    </div>

    <!-- ── Event cards ───────────────────────────────────────────────────── -->
    <div v-if="events.length === 0" class="empty-state">
      <v-icon color="primary" size="40" class="mb-2">mdi-calendar-check-outline</v-icon>
      <p>Nothing scheduled for today</p>
    </div>

    <div v-else class="event-list">
      <div
        v-for="ev in events"
        :key="ev.id"
        class="event-card"
        :class="{
          'event-card--active': selectedEvent?.id === ev.id,
          'event-card--amber':  ev.needsClean,
          'event-card--past':   isPast(ev.time),
        }"
        :style="{ '--card-accent': ev.propColor }"
        @click="openSheet(ev)"
      >
        <!-- Left color stripe -->
        <div class="card-stripe" :style="{ background: ev.propColor }" />

        <div class="card-body">
          <!-- Row 1: property + time -->
          <div class="card-row1">
            <span class="card-prop">{{ ev.propName }}</span>
            <span class="card-time">{{ ev.time }}</span>
          </div>

          <!-- Row 2: event type + guests + alert chip -->
          <div class="card-row2">
            <v-icon
              :color="ev.type === 'turn' ? 'warning' : ev.type === 'checkin' ? 'success' : 'error'"
              size="13"
              class="mr-1"
            >{{ typeIcon(ev.type) }}</v-icon>
            <span class="card-kind">{{ typeLabel(ev.type) }}</span>
            <span v-if="ev.guestCount" class="card-dot" />
            <span v-if="ev.guestCount" class="card-guests">{{ ev.guestCount }} guests</span>
            <span v-if="ev.needsClean" class="action-chip">Action needed</span>
            <v-icon size="14" class="card-chevron">mdi-chevron-right</v-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- bottom breathing room above nav -->
    <div class="bottom-spacer" />

    <!-- ── Detail bottom sheet ──────────────────────────────────────────── -->
    <v-bottom-sheet v-model="sheetOpen" max-width="600">
      <v-card v-if="selectedEvent" class="sheet-card" rounded="0" flat>
        <!-- Drag handle -->
        <div class="sheet-handle" />

        <!-- Header row -->
        <div class="sheet-header">
          <div class="sheet-color-dot" :style="{ background: selectedEvent.propColor }" />
          <div class="sheet-header-text">
            <div class="sheet-prop">{{ selectedEvent.propName }}</div>
            <div class="sheet-sub">
              <v-icon
                :color="selectedEvent.type === 'turn' ? 'warning' : selectedEvent.type === 'checkin' ? 'success' : 'error'"
                size="13"
                class="mr-1"
              >{{ typeIcon(selectedEvent.type) }}</v-icon>
              {{ typeLabel(selectedEvent.type) }} · {{ selectedEvent.time }}
              <template v-if="selectedEvent.guestCount">
                · {{ selectedEvent.guestCount }} guests
              </template>
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

        <!-- Action needed banner -->
        <div v-if="selectedEvent.needsClean" class="sheet-alert">
          <v-icon size="14" class="mr-1" color="warning">mdi-alert-circle-outline</v-icon>
          No cleaner assigned — action needed
        </div>

        <!-- Guest name -->
        <div v-if="selectedEvent.bookingName" class="sheet-guest">
          <v-icon size="13" class="mr-1" style="opacity:0.45">mdi-account-outline</v-icon>
          {{ selectedEvent.bookingName }}
        </div>

        <!-- Cleaning window (turn only) -->
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

        <!-- Action buttons -->
        <div class="sheet-actions">
          <v-btn
            block
            color="primary"
            rounded="sm"
            @click="emit('open-booking', selectedEvent.id); sheetOpen = false"
          >
            <v-icon start size="16">mdi-calendar-check-outline</v-icon>
            Open booking
          </v-btn>
          <v-btn
            v-if="selectedEvent.needsClean"
            block
            rounded="sm"
            variant="outlined"
            @click="emit('assign-cleaner', selectedEvent.id); sheetOpen = false"
          >
            <v-icon start size="16">mdi-account-plus-outline</v-icon>
            Assign cleaner
          </v-btn>
        </div>
      </v-card>
    </v-bottom-sheet>
  </div>
</template>

<style scoped>
/* ── Root ──────────────────────────────────────────────────────────────────── */
.daybar-root {
  display: flex;
  flex-direction: column;
  background: #FAFAFB;
  font-family: 'Inter', system-ui, sans-serif;
  min-height: 100%;
  overflow-y: auto;
}

/* ── Hero gradient ─────────────────────────────────────────────────────────── */
.daybar-hero {
  background: linear-gradient(170deg, #1F1840 0%, #3D348B 50%, #7367F0 100%);
  /* env() falls back to 20px on non-notched devices */
  padding: calc(env(safe-area-inset-top, 0px) + 20px) 20px 22px;
  position: relative;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  top: -40px;
  right: -50px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%);
  pointer-events: none;
}

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.hero-date {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.55);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-greeting {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
  margin-top: 2px;
}

.hero-bell {
  width: 38px;
  height: 38px;
  border-radius: 2px;
  background: rgba(255,255,255,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Timeline ──────────────────────────────────────────────────────────────── */
.timeline-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.timeline-label {
  font-size: 9px;
  font-weight: 700;
  color: rgba(255,255,255,0.45);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.timeline-now-time {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.timeline-track {
  position: relative;
  height: 36px;
  background: rgba(255,255,255,0.08);
  border-radius: 2px;
  border: 1px solid rgba(255,255,255,0.10);
}

.tick {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255,255,255,0.08);
}

.event-pip {
  position: absolute;
  top: 6px;
  bottom: 6px;
  width: 10px;
  border-radius: 1px;
  background: #fff;
  border: 1px solid rgba(255,255,255,0.4);
  cursor: pointer;
  padding: 0;
  touch-action: manipulation;
  transition: opacity 0.15s, box-shadow 0.15s;
}

/* Expand touch target to 44×44px without affecting visual pip size */
.event-pip::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
}

.event-pip--amber {
  background: #E8A33D;
  border-color: #E8A33D;
  box-shadow: 0 0 0 3px rgba(232,163,61,0.33);
}

.event-pip--past {
  opacity: 0.35;
}

.now-line {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  background: #fff;
  border-radius: 1px;
  box-shadow: 0 0 0 2px rgba(255,255,255,0.25);
}

.now-label {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 8px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.1em;
  white-space: nowrap;
}

.timeline-axis {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
}

.timeline-axis span {
  font-size: 9px;
  color: rgba(255,255,255,0.35);
  font-variant-numeric: tabular-nums;
}

/* ── Hero stats ────────────────────────────────────────────────────────────── */
.hero-stats {
  display: flex;
  gap: 14px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.10);
}

.stat-divider {
  width: 1px;
  background: rgba(255,255,255,0.10);
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.stat-n {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-lbl {
  font-size: 9px;
  font-weight: 600;
  color: rgba(255,255,255,0.55);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  line-height: 1.2;
}

.stat-item--alert .stat-n {
  color: #E8A33D;
}

.stat-item--alert .stat-lbl {
  color: #E8A33D;
}

/* ── Section header ────────────────────────────────────────────────────────── */
.section-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 10px;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  color: rgba(46,38,61,0.42);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  white-space: nowrap;
}

.section-rule {
  flex: 1;
  height: 1px;
  background: #E8E8E8;
}

.section-count {
  font-size: 11px;
  color: rgba(46,38,61,0.42);
  white-space: nowrap;
}

/* ── Event cards ───────────────────────────────────────────────────────────── */
.event-list {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-card {
  display: flex;
  background: #fff;
  border-radius: 2px;
  border: 1px solid #E8E8E8;
  overflow: hidden;
  cursor: pointer;
  touch-action: manipulation;
  transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s;
}

.event-card--active {
  border-color: var(--card-accent, #7367F0);
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}

.event-card--amber {
  border-color: rgba(232,163,61,0.35);
  box-shadow: 0 2px 12px rgba(232,163,61,0.14);
}

.event-card--past {
  opacity: 0.55;
}

.card-stripe {
  width: 3px;
  flex-shrink: 0;
}

.card-body {
  flex: 1;
  padding: 12px 14px;
  min-width: 0;
}

.card-row1 {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.card-prop {
  font-size: 13px;
  font-weight: 600;
  color: #2E263D;
  flex: 1;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-time {
  font-size: 12px;
  font-weight: 600;
  color: #2E263D;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.card-row2 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 5px;
  flex-wrap: wrap;
}

.card-kind {
  font-size: 11px;
  font-weight: 600;
  color: rgba(46,38,61,0.68);
  letter-spacing: -0.01em;
}

.card-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(46,38,61,0.42);
}

.card-guests {
  font-size: 11px;
  color: rgba(46,38,61,0.42);
}

.action-chip {
  padding: 3px 8px;
  border-radius: 2px;
  background: #E8A33D;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.4;
  flex-shrink: 0;
}

.card-chevron {
  margin-left: auto;
  opacity: 0.25;
  flex-shrink: 0;
}

/* ── Bottom sheet ──────────────────────────────────────────────────────────── */
.sheet-card {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 9999px;
  background: rgba(46,38,61,0.16);
  margin: 10px auto 4px;
}

.sheet-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px 8px;
}

.sheet-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sheet-header-text {
  flex: 1;
  min-width: 0;
}

.sheet-prop {
  font-size: 16px;
  font-weight: 600;
  color: #2E263D;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sheet-sub {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: rgba(46,38,61,0.60);
  margin-top: 2px;
}

.sheet-alert {
  display: flex;
  align-items: center;
  background: #FFF8EE;
  border-top: 1px solid rgba(232,163,61,0.22);
  border-bottom: 1px solid rgba(232,163,61,0.22);
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #B87714;
}

.sheet-guest {
  display: flex;
  align-items: center;
  padding: 10px 16px 0;
  font-size: 13px;
  color: rgba(46,38,61,0.68);
}

.sheet-clean-window {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #F5F3FF;
  border: 1px solid rgba(115,103,240,0.20);
  border-radius: 2px;
  padding: 10px 12px;
  margin: 12px 16px 0;
}

.clean-window-label {
  font-size: 9px;
  font-weight: 700;
  color: #7367F0;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}

.clean-window-dur {
  font-size: 11px;
  color: rgba(46,38,61,0.68);
  margin-top: 2px;
}

.clean-window-times {
  font-size: 15px;
  font-weight: 700;
  color: #7367F0;
  font-variant-numeric: tabular-nums;
}

.sheet-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}

/* ── Focus rings ───────────────────────────────────────────────────────────── */
.event-pip:focus-visible {
  outline: 2px solid rgba(255,255,255,0.9);
  outline-offset: 3px;
}

.event-card:focus-visible {
  outline: 2px solid #7367F0;
  outline-offset: 2px;
}

/* ── Empty state ───────────────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: rgba(46,38,61,0.42);
  font-size: 14px;
  text-align: center;
}

.bottom-spacer {
  height: 40px;
  /* account for iOS home indicator */
  padding-bottom: env(safe-area-inset-bottom, 0px);
  flex-shrink: 0;
}

/* ── Reduced motion ────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .event-pip,
  .event-card {
    transition: none;
  }
}
</style>
