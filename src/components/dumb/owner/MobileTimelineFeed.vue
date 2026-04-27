<!-- Mobile day-grouped timeline feed (from screens-mobile-timeline.jsx handoff) -->
<script setup lang="ts">
import { computed, ref } from 'vue'

export interface MobileEvent {
  id: string
  propId: string
  propName: string
  propColor: string
  city: string
  day: number          // 0 = today, 1 = tomorrow, etc.
  time: string
  type: 'out' | 'in' | 'turn'
  guestName?: string
  guestCount?: number
  status: string
  cleanerName?: string
  urgent?: boolean
  cleanFrom?: string
  cleanTo?: string
  cleanMins?: number
  notes?: string
}

export interface PropChip {
  id: string
  name: string
  city: string
  color: string
}

const props = defineProps<{
  events: MobileEvent[]
  properties: PropChip[]
  totalCount?: number
}>()

const selectedPropId = ref('all')
const range          = ref(7)
const expandedId     = ref<string | null>(null)

const RANGES = [
  { label: '3d', value: 3  },
  { label: '7d', value: 7  },
  { label: '14d', value: 14 },
]

const filtered = computed(() =>
  props.events
    .filter(e => selectedPropId.value === 'all' || e.propId === selectedPropId.value)
    .filter(e => e.day < range.value),
)

const dayGroups = computed(() => {
  const map = new Map<number, MobileEvent[]>()
  for (const e of filtered.value) {
    const arr = map.get(e.day) ?? []
    arr.push(e)
    map.set(e.day, arr)
  }
  return [...map.entries()].sort(([a], [b]) => a - b)
})

function dayLabel(d: number): string {
  if (d === 0) return 'Today'
  if (d === 1) return 'Tomorrow'
  const date = new Date()
  date.setDate(date.getDate() + d)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const EVENT_COLORS = {
  out:  'var(--claro-error)',
  in:   'var(--claro-success)',
  turn: 'var(--claro-warning)',
} as const

const EVENT_LABELS = {
  out:  'Check-out',
  in:   'Check-in',
  turn: 'Same-day turn',
} as const

function statusTone(status: string): 'ok' | 'warn' | 'info' {
  if (status.toLowerCase().includes('confirmed')) return 'ok'
  if (status.toLowerCase().includes('pending')) return 'warn'
  return 'info'
}

function subtitle(): string {
  const prop = props.properties.find(p => p.id === selectedPropId.value)
  if (selectedPropId.value === 'all') {
    return `${filtered.value.length} events · next ${range.value}d`
  }
  return `${prop?.name ?? ''} · ${filtered.value.length} events`
}

function toggle(id: string): void {
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<template>
  <div class="mtf">
    <!-- Screen header -->
    <div class="mtf-screen-hdr">
      <div class="mtf-title-row">
        <h1 class="mtf-title">Timeline</h1>
        <span class="mtf-subtitle">{{ subtitle() }}</span>
      </div>
    </div>

    <!-- House filter rail -->
    <div class="mtf-rail">
      <!-- All chip -->
      <button
        class="mtf-chip"
        :class="{ 'mtf-chip--active': selectedPropId === 'all' }"
        :style="selectedPropId === 'all' ? { borderColor: 'var(--claro-primary)', boxShadow: `inset 0 0 0 1px var(--claro-primary)` } : {}"
        @click="selectedPropId = 'all'"
      >
        <div class="mtf-chip-dot" style="background: var(--claro-primary)" />
        <div class="mtf-chip-info">
          <span class="mtf-chip-name" :class="{ 'mtf-chip-name--active': selectedPropId === 'all' }">All</span>
          <span class="mtf-chip-city">{{ properties.length }} properties</span>
        </div>
      </button>

      <button
        v-for="p in properties"
        :key="p.id"
        class="mtf-chip"
        :class="{ 'mtf-chip--active': selectedPropId === p.id }"
        :style="selectedPropId === p.id ? { borderColor: p.color, boxShadow: `inset 0 0 0 1px ${p.color}` } : {}"
        @click="selectedPropId = p.id"
      >
        <div class="mtf-chip-dot" :style="{ background: p.color }" />
        <div class="mtf-chip-info">
          <span class="mtf-chip-name" :class="{ 'mtf-chip-name--active': selectedPropId === p.id }">
            {{ p.name }}
          </span>
          <span class="mtf-chip-city">{{ p.city }}</span>
        </div>
      </button>
    </div>

    <!-- Range + filter row -->
    <div class="mtf-controls">
      <div class="mtf-range">
        <button
          v-for="r in RANGES"
          :key="r.value"
          class="mtf-range-btn"
          :class="{ 'mtf-range-btn--active': range === r.value }"
          @click="range = r.value"
        >
          {{ r.label }}
        </button>
      </div>
      <span class="mtf-filter-label">Filter</span>
    </div>

    <!-- Scrollable feed -->
    <div class="mtf-feed">
      <!-- Empty state -->
      <div v-if="dayGroups.length === 0" class="mtf-empty">
        <v-icon aria-hidden="true" class="mtf-empty-icon" size="40">mdi-home-outline</v-icon>
        <div class="mtf-empty-title">No activity in this window</div>
        <div class="mtf-empty-sub">No events scheduled in the next {{ range }}d.</div>
      </div>

      <!-- Day groups -->
      <template v-else>
        <div v-for="[day, evs] in dayGroups" :key="day" class="mtf-day-group">
          <!-- Day header -->
          <div class="mtf-day-hdr">
            <span class="mtf-day-label" :class="{ 'mtf-day-label--today': day === 0 }">
              {{ dayLabel(day) }}
            </span>
            <div class="mtf-day-rule" />
            <span class="mtf-day-count">{{ evs.length }} event{{ evs.length === 1 ? '' : 's' }}</span>
          </div>

          <!-- Event cards -->
          <div
            v-for="ev in evs"
            :key="ev.id"
            class="mtf-event-card"
            :class="{ 'mtf-event-card--expanded': expandedId === ev.id }"
            @click="toggle(ev.id)"
          >
            <!-- Left color bars: 4px event color + 3px property color -->
            <div class="mtf-bar mtf-bar--event" :style="{
              background: ev.type === 'turn'
                ? `linear-gradient(180deg, ${EVENT_COLORS.out} 50%, ${EVENT_COLORS.in} 50%)`
                : EVENT_COLORS[ev.type]
            }" />
            <div class="mtf-bar mtf-bar--prop" :style="{ background: ev.propColor }" />

            <!-- Card body -->
            <div class="mtf-card-body">
              <!-- Row 1: type + time + urgent -->
              <div class="mtf-card-row1">
                <span class="mtf-event-type-label" :style="{ color: EVENT_COLORS[ev.type] }">
                  {{ EVENT_LABELS[ev.type] }}
                </span>
                <span class="mtf-card-dot">·</span>
                <span class="mtf-event-time">{{ ev.time }}</span>
                <div class="mtf-card-spacer" />
                <span v-if="ev.urgent" class="mtf-urgent-badge">Urgent</span>
              </div>

              <!-- Row 2: property name -->
              <div class="mtf-card-prop">{{ ev.propName }}</div>
              <div class="mtf-card-sub">
                {{ ev.city }}<template v-if="ev.guestCount"> · {{ ev.guestCount }} guests</template>
              </div>

              <!-- Row 3: status + cleaner chips -->
              <div class="mtf-card-chips">
                <span
                  class="mtf-chip-status"
                  :class="`mtf-chip-status--${statusTone(ev.status)}`"
                >{{ ev.status }}</span>
                <span
                  v-if="ev.cleanerName"
                  class="mtf-chip-status mtf-chip-status--ok"
                >✓ {{ ev.cleanerName }}</span>
                <span v-else class="mtf-chip-status mtf-chip-status--warn">⚠ No cleaner</span>
              </div>

              <!-- Expanded content -->
              <v-expand-transition>
                <div v-if="expandedId === ev.id" class="mtf-card-expanded">
                  <!-- Cleaning window (turns only) -->
                  <div v-if="ev.type === 'turn' && ev.cleanFrom" class="mtf-clean-win">
                    <div class="mtf-clean-win-left">
                      <div class="mtf-clean-win-label">Cleaning window</div>
                      <div class="mtf-clean-win-sub">{{ ev.cleanMins }} min estimated</div>
                    </div>
                    <div class="mtf-clean-win-time">{{ ev.cleanFrom }} → {{ ev.cleanTo }}</div>
                  </div>

                  <!-- Meta rows -->
                  <div v-if="ev.guestName" class="mtf-meta-row">
                    <span class="mtf-meta-label">Guest</span>
                    <span class="mtf-meta-val">{{ ev.guestName }}</span>
                  </div>
                  <div v-if="ev.notes" class="mtf-meta-row mtf-meta-row--wrap">
                    <span class="mtf-meta-label">Notes</span>
                    <span class="mtf-meta-val">{{ ev.notes }}</span>
                  </div>

                  <!-- Actions -->
                  <div class="mtf-card-actions">
                    <v-btn block color="primary" size="small">Open booking</v-btn>
                  </div>
                </div>
              </v-expand-transition>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.mtf {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--claro-background);
  font-family: var(--claro-font-family);
}

/* ── Screen header ── */
.mtf-screen-hdr {
  padding: 12px 16px 4px;
  background: var(--claro-background);
  flex-shrink: 0;
}

.mtf-title-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.mtf-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--claro-fg1);
  letter-spacing: -0.02em;
}

.mtf-subtitle {
  font-size: 13px;
  color: var(--claro-fg3);
  font-weight: 500;
}

/* ── House rail ── */
.mtf-rail {
  display: flex;
  gap: 8px;
  padding: 8px 16px 14px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  flex-shrink: 0;
}

.mtf-rail::-webkit-scrollbar {
  display: none;
}

.mtf-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px 8px 10px;
  border-radius: var(--claro-radius-sm);
  border: 1px solid var(--claro-border);
  background: var(--claro-surface);
  flex-shrink: 0;
  cursor: pointer;
  transition: border-color var(--claro-dur-fast) var(--claro-ease), box-shadow var(--claro-dur-fast) var(--claro-ease);
  font-family: var(--claro-font-family);
}

.mtf-chip--active {
  background: var(--claro-surface);
}

.mtf-chip-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.mtf-chip-info {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.mtf-chip-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--claro-fg2);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.mtf-chip-name--active {
  font-weight: 600;
  color: var(--claro-fg1);
}

.mtf-chip-city {
  font-size: 10px;
  color: var(--claro-fg3);
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ── Controls row ── */
.mtf-controls {
  display: flex;
  align-items: center;
  padding: 0 16px 12px;
  flex-shrink: 0;
}

.mtf-range {
  display: inline-flex;
  background: var(--claro-surface-variant);
  border-radius: var(--claro-radius-sm);
  padding: 2px;
  gap: 2px;
}

.mtf-range-btn {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--claro-fg2);
  background: transparent;
  border: none;
  border-radius: var(--claro-radius-sm);
  cursor: pointer;
  letter-spacing: 0.02em;
  font-family: var(--claro-font-family);
  transition: background var(--claro-dur-fast) var(--claro-ease), color var(--claro-dur-fast) var(--claro-ease);
}

.mtf-range-btn--active {
  background: var(--claro-primary);
  color: #fff;
}

.mtf-filter-label {
  margin-left: auto;
  font-size: 11px;
  color: var(--claro-fg3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}

/* ── Feed ── */
.mtf-feed {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 24px;
}

/* Empty */
.mtf-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 32px;
  text-align: center;
  gap: 8px;
}

.mtf-empty-icon {
  opacity: 0.25;
  color: var(--claro-fg1);
  margin-bottom: 4px;
}

.mtf-empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--claro-fg2);
}

.mtf-empty-sub {
  font-size: 12px;
  color: var(--claro-fg3);
}

/* Day group */
.mtf-day-group {
  padding: 18px 16px 0;
}

.mtf-day-hdr {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}

.mtf-day-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--claro-fg3);
  text-transform: uppercase;
  letter-spacing: 0.10em;
  white-space: nowrap;
}

.mtf-day-label--today {
  color: var(--claro-primary);
}

.mtf-day-rule {
  flex: 1;
  height: 1px;
  background: var(--claro-border);
}

.mtf-day-count {
  font-size: 11px;
  color: var(--claro-fg3);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Event card */
.mtf-event-card {
  display: flex;
  background: var(--claro-surface);
  border-radius: var(--claro-radius-sm);
  border: 1px solid var(--claro-border);
  margin-bottom: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow var(--claro-dur-base) var(--claro-ease);
}

.mtf-event-card:hover {
  box-shadow: var(--claro-shadow-sm);
}

/* Left bars */
.mtf-bar {
  flex-shrink: 0;
}

.mtf-bar--event {
  width: 4px;
}

.mtf-bar--prop {
  width: 3px;
  opacity: 0.55;
}

/* Card body */
.mtf-card-body {
  flex: 1;
  padding: 12px 14px;
  min-width: 0;
}

.mtf-card-row1 {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mtf-event-type-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.mtf-card-dot {
  font-size: 11px;
  color: var(--claro-fg3);
}

.mtf-event-time {
  font-size: 12px;
  color: var(--claro-fg2);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.mtf-card-spacer {
  flex: 1;
}

.mtf-urgent-badge {
  font-size: 9px;
  font-weight: 700;
  color: var(--claro-error);
  background: var(--claro-error-tonal);
  padding: 2px 6px;
  border-radius: var(--claro-radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.mtf-card-prop {
  font-size: 14px;
  font-weight: 600;
  color: var(--claro-fg1);
  margin-top: 4px;
  letter-spacing: -0.01em;
}

.mtf-card-sub {
  font-size: 11px;
  color: var(--claro-fg3);
  margin-top: 1px;
}

/* Status chips */
.mtf-card-chips {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.mtf-chip-status {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--claro-radius-sm);
  letter-spacing: 0.02em;
}

.mtf-chip-status--ok   { background: var(--claro-success-tonal); color: var(--claro-success); }
.mtf-chip-status--warn { background: var(--claro-warning-tonal); color: var(--claro-warning); }
.mtf-chip-status--info { background: var(--claro-info-tonal);    color: var(--claro-info);    }

/* Expanded section */
.mtf-card-expanded {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--claro-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Cleaning window */
.mtf-clean-win {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--claro-warning-tonal);
  border: 1px solid rgba(255, 159, 67, 0.25);
  border-radius: var(--claro-radius-sm);
  padding: 10px 12px;
}

.mtf-clean-win-label {
  font-size: 10px;
  color: var(--claro-warning);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.mtf-clean-win-sub {
  font-size: 11px;
  color: var(--claro-fg2);
  margin-top: 2px;
}

.mtf-clean-win-time {
  font-size: 14px;
  font-weight: 700;
  color: var(--claro-warning);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

/* Meta rows */
.mtf-meta-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.mtf-meta-row--wrap {
  align-items: flex-start;
}

.mtf-meta-label {
  font-size: 10px;
  color: var(--claro-fg3);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  min-width: 52px;
  flex-shrink: 0;
}

.mtf-meta-val {
  font-size: 13px;
  color: var(--claro-fg1);
  line-height: 1.4;
  font-weight: 500;
}

.mtf-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
</style>
