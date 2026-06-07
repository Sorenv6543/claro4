<script setup lang="ts">
  import { fmt12, fmtTick, TIMELINE_TICKS, timelineIsPast, timelinePct } from '@utils/timelineMath'
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
  const nowPct = computed(() => timelinePct(props.currentHour, props.currentMin))

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

  const displayTime = computed(() => fmt12(`${props.currentHour}:${props.currentMin}`))
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
        <span v-for="h in TIMELINE_TICKS" :key="h">
          {{ fmtTick(h, true) }}
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
            class="day-evt glass-card"
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
      <v-card v-if="selectedEvent" class="sheet-card" flat rounded="xl">
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
            rounded="pill"
            @click="emit('open-booking', selectedEvent.id); sheetOpen = false"
          >
            <v-icon size="16" start>mdi-calendar-check-outline</v-icon>
            Open booking
          </v-btn>

          <v-btn
            v-if="selectedEvent.needsClean"
            block
            rounded="pill"
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

<style scoped>
/* ── Root ──────────────────────────────────────────────────────────────────── */
.daybar-root {
  display: flex;
  flex-direction: column;
  background: #F5F4FB;
  font-family: var(--claro-font-family, 'Inter'), system-ui, sans-serif;
  min-height: 100%;
  overflow-y: auto;
}

/* ── Hero ──────────────────────────────────────────────────────────────────── */
.daybar-hero {
  background: linear-gradient(160deg, #221B36 0%, #2F2558 60%, #3E3478 100%);
  padding: calc(env(safe-area-inset-top, 0px) + 20px) 16px 16px;
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
  background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
  pointer-events: none;
}

.hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.hero-text {
  min-width: 0;
}

.hero-date {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-greeting {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
  margin-top: 2px;
}

.hero-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex-shrink: 0;
  padding-top: 2px;
}

.hero-range-chip {
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.09em;
}

.hero-count {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
}

.hero-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.hero-now-time {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.55);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

/* ── Urgent banner ─────────────────────────────────────────────────────────── */
.hero-urgent {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: linear-gradient(90deg, rgba(234, 84, 85, 0.25) 0%, rgba(234, 84, 85, 0.08) 100%);
  border: 1px solid rgba(234, 84, 85, 0.35);
  border-radius: 12px;
  padding: 10px 12px;
  margin-top: 8px;
}

.urgent-bolt {
  color: #EA5455;
  flex-shrink: 0;
  margin-top: 1px;
}

.urgent-body {
  min-width: 0;
}

.urgent-title {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.urgent-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
  margin-top: 2px;
}

/* ── Per-property dbar rows ────────────────────────────────────────────────── */
.prop-rows {
  padding: 14px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.prop-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.prop-row-lbl {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(46, 38, 61, 0.60);
  letter-spacing: -0.01em;
}

.prop-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* The dbar track */
.dbar-track {
  position: relative;
  height: 34px;
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.12);
  border-radius: 8px;
  overflow: hidden;
}

/* Event pip markers */
.dbar-pip {
  position: absolute;
  top: 6px;
  bottom: 6px;
  width: 10px;
  border-radius: 3px;
  background: var(--claro-primary);
  border: none;
  cursor: pointer;
  padding: 0;
  touch-action: manipulation;
  transition: opacity 0.15s, box-shadow 0.15s;
  z-index: 3;
}

.dbar-pip::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
}

.dbar-pip--turn    { background: #FF9F43; }
.dbar-pip--checkin { background: #28C76F; }
.dbar-pip--urgent  { background: #EA5455; box-shadow: 0 0 0 2px rgba(234, 84, 85, 0.28); }
.dbar-pip--past    { opacity: 0.35; }
.dbar-pip--active  { box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.25); }

/* NOW line */
.dbar-now {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  background: var(--claro-primary);
  border-radius: 1px;
  z-index: 5;
}

.now-label {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 7px;
  font-weight: 700;
  color: var(--claro-primary);
  letter-spacing: 0.08em;
  white-space: nowrap;
}

/* Shared time axis */
.dbar-axis {
  display: flex;
  justify-content: space-between;
  padding: 5px 16px 14px;
}

.dbar-axis span {
  font-size: 9px;
  color: rgba(46, 38, 61, 0.35);
  font-variant-numeric: tabular-nums;
}

/* ── Pip legend ────────────────────────────────────────────────────────────── */
.dbar-legend {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 6px 16px 12px;
}

.dbar-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
  font-weight: 500;
  color: rgba(46, 38, 61, 0.40);
  letter-spacing: 0.02em;
}

.dbar-legend-pip {
  display: inline-block;
  width: 10px;
  height: 16px;
  border-radius: 3px;
  flex-shrink: 0;
}

.dbar-legend-pip--checkin  { background: #28C76F; }
.dbar-legend-pip--checkout { background: var(--claro-primary); }
.dbar-legend-pip--turn     { background: #FF9F43; }
.dbar-legend-pip--urgent   { background: #EA5455; }

/* ── Multi-day blocks ──────────────────────────────────────────────────────── */
.day-blocks {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.day-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.day-block-hd {
  font-size: 11px;
  font-weight: 700;
  color: rgba(46, 38, 61, 0.45);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(46, 38, 61, 0.08);
  margin-bottom: 4px;
}

.day-block-hd--today {
  color: var(--claro-primary);
  border-bottom-color: rgba(var(--v-theme-primary), 0.22);
}

.day-empty {
  font-size: 12px;
  color: rgba(46, 38, 61, 0.35);
  padding: 6px 0;
}

.day-evt {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 16px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
}

.day-evt:active {
  transform: scale(0.97);
}

.day-evt-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot--checkout { background: var(--claro-primary); }
.dot--checkin  { background: #28C76F; }
.dot--turn     { background: #FF9F43; }

.day-evt-body {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.day-evt-prop {
  font-weight: 700;
  color: #2E263D;
  flex-shrink: 0;
}

.day-evt-sep {
  color: rgba(46, 38, 61, 0.30);
  flex-shrink: 0;
}

.day-evt-time {
  color: rgba(46, 38, 61, 0.60);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  font-weight: 600;
}

.day-evt-kind {
  color: rgba(46, 38, 61, 0.50);
  overflow: hidden;
  text-overflow: ellipsis;
}

.day-evt-action {
  padding: 2px 7px;
  border-radius: 9999px;
  background: #EF4444;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.day-evt-chevron {
  opacity: 0.25;
  flex-shrink: 0;
}

/* ── Focus rings ───────────────────────────────────────────────────────────── */
.dbar-pip:focus-visible {
  outline: 2px solid rgba(var(--v-theme-primary), 0.8);
  outline-offset: 3px;
}

.day-evt:focus-visible {
  outline: 2px solid var(--claro-primary);
  outline-offset: 2px;
}

/* ── Empty state ───────────────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: rgba(46, 38, 61, 0.42);
  font-size: 14px;
  text-align: center;
}

/* ── Bottom spacer ─────────────────────────────────────────────────────────── */
.bottom-spacer {
  height: 40px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
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
  background: rgba(46, 38, 61, 0.16);
  margin: 12px auto 6px;
}

.sheet-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px 12px;
}

.sheet-color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sheet-header-text {
  flex: 1;
  min-width: 0;
}

.sheet-prop {
  font-size: 18px;
  font-weight: 700;
  color: #2E263D;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sheet-sub {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: rgba(46, 38, 61, 0.60);
  margin-top: 2px;
}

.sheet-alert {
  display: flex;
  align-items: center;
  background: #FEF2F2;
  border-top: 1px solid rgba(239, 68, 68, 0.1);
  border-bottom: 1px solid rgba(239, 68, 68, 0.1);
  padding: 12px 20px;
  font-size: 13px;
  font-weight: 600;
  color: #EF4444;
}

.sheet-guest {
  display: flex;
  align-items: center;
  padding: 12px 20px 0;
  font-size: 14px;
  color: rgba(46, 38, 61, 0.68);
}

.sheet-clean-window {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--claro-primary-whisper, rgba(115, 103, 240, 0.08));
  border: 1px solid rgba(115, 103, 240, 0.15);
  border-radius: 12px;
  padding: 12px 16px;
  margin: 16px 20px 0;
}

.clean-window-label {
  font-size: 9px;
  font-weight: 800;
  color: #7367F0;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}

.clean-window-dur {
  font-size: 12px;
  color: rgba(46, 38, 61, 0.68);
  margin-top: 2px;
}

.clean-window-times {
  font-size: 17px;
  font-weight: 800;
  color: #7367F0;
  font-variant-numeric: tabular-nums;
}

.sheet-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
}

@media (prefers-reduced-motion: reduce) {
  .dbar-pip,
  .day-evt {
    transition: none;
  }
}
</style>
