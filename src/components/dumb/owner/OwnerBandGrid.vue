<!-- Desktop 14-day portfolio band grid (Variant B from owner-overview handoff) -->
<script setup lang="ts">
  import type { PropertyStatus } from '@utils/propertyStatus'

  export interface BandGridProperty {
    id: string
    name: string
    color: string
    initial: string
    meta: string // e.g. "3bd · House"
    status: PropertyStatus
    occupantName?: string
  }

  export interface BandGridBooking {
    id: string
    propertyId: string
    guestName: string
    guestCount?: number
    startDay: number // days from today (0 = today), can be negative
    endDay: number // exclusive end
    type: 'standard' | 'turn'
    priority: 'low' | 'normal' | 'high' | 'urgent'
  }

  export interface TodayEvent {
    propId: string
    propName: string
    propColor: string
    time: string
    kind: 'checkout' | 'checkin' | 'turn'
  }

  export interface ActivityItem {
    type: string
    text: string
    timeAgo: string
    propName: string
  }

  const props = defineProps<{
    properties: BandGridProperty[]
    bookings: BandGridBooking[]
    days?: number
    todayEvents?: TodayEvent[]
    recentActivity?: ActivityItem[]
  }>()

  const DAYS = props.days ?? 14

  // Pre-compute bookings per property for the grid
  function bookingsForProp (propId: string): BandGridBooking[] {
    return props.bookings.filter(b => b.propertyId === propId && b.endDay > 0 && b.startDay < DAYS)
  }

  function dayDate (offset: number): Date {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return d
  }

  function isToday (offset: number): boolean {
    return offset === 0
  }
  function isWeekend (offset: number): boolean {
    const d = dayDate(offset)
    return d.getDay() === 0 || d.getDay() === 6
  }

  function dayInitial (offset: number): string {
    return dayDate(offset).toLocaleDateString('en-US', { weekday: 'narrow' })
  }

  function dayNum (offset: number): number {
    return dayDate(offset).getDate()
  }

  function bandStyle (b: BandGridBooking): Record<string, string> {
    const start = Math.max(0, b.startDay)
    const end = Math.min(DAYS, b.endDay)
    const span = Math.max(1, end - start)
    return {
      gridColumn: `${start + 1} / span ${span}`,
      gridRow: '1',
      zIndex: '2',
      alignSelf: 'center',
    }
  }

  function bandClass (b: BandGridBooking): string[] {
    const classes: string[] = ['bgrid-band']
    if (b.priority === 'urgent') classes.push('bgrid-band--urgent')
    if (b.type === 'turn') classes.push('bgrid-band--turn')
    if (b.priority === 'normal' || b.priority === 'low') classes.push('bgrid-band--normal')
    return classes
  }

  const STATUS_CHIP: Record<BandGridProperty['status'], { label: string, color: string }> = {
    urgent_turn: { label: 'Urgent turn', color: 'error' },
    turn_today: { label: 'Turn today', color: 'warning' },
    checkin_today: { label: 'Check-in', color: 'success' },
    checkout_today: { label: 'Check-out', color: 'error' },
    occupied: { label: 'Occupied', color: 'primary' },
    vacant: { label: 'Vacant', color: 'default' },
  }

  function todayStr (): string {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  const EVENT_LABELS = { checkout: 'Check-out', checkin: 'Check-in', turn: 'Turn' }
</script>

<template>
  <div class="bgrid">
    <!-- Main timeline card -->
    <v-card class="bgrid-card">
      <!-- Toolbar -->
      <div class="bgrid-toolbar">
        <span class="bgrid-toolbar-title">Portfolio timeline</span>

        <div class="bgrid-legend">
          <span class="bgrid-legend-item">
            <span class="bgrid-legend-cap" style="background: var(--claro-success)" />
            Check-in
          </span>

          <span class="bgrid-legend-item">
            <span class="bgrid-legend-cap" style="background: var(--claro-error)" />
            Check-out
          </span>

          <span class="bgrid-legend-item">
            <span class="bgrid-legend-cap" style="background: var(--claro-warning)" />
            Turn
          </span>
        </div>

        <span class="bgrid-today-tag">Today · {{ todayStr() }}</span>
      </div>

      <!-- Day headers row -->
      <div class="bgrid-hdr-row">
        <div class="bgrid-hdr-spacer" />

        <div class="bgrid-hdr-days">
          <div
            v-for="i in DAYS"
            :key="i"
            class="bgrid-hdr-day"
            :class="{
              'bgrid-hdr-day--today': isToday(i - 1),
              'bgrid-hdr-day--weekend': isWeekend(i - 1),
            }"
          >
            <div class="bgrid-day-dow">{{ dayInitial(i - 1) }}</div>
            <div class="bgrid-day-num">{{ dayNum(i - 1) }}</div>
          </div>
        </div>
      </div>

      <!-- Property rows -->
      <div class="bgrid-body">
        <div
          v-for="p in properties"
          :key="p.id"
          class="bgrid-row"
        >
          <!-- Left: property info -->
          <div class="bgrid-row-head">
            <div class="bgrid-swatch" :style="{ background: p.color + '22', color: p.color }">
              {{ p.initial }}
            </div>

            <div class="bgrid-row-info">
              <div class="bgrid-row-addr">{{ p.name }}</div>
              <div class="bgrid-row-sub">{{ p.meta }}</div>
            </div>

            <v-chip
              :color="STATUS_CHIP[p.status].color"
              density="comfortable"
              size="x-small"
              variant="tonal"
            >
              {{ STATUS_CHIP[p.status].label }}
            </v-chip>
          </div>

          <!-- Right: band grid -->
          <div
            class="bgrid-row-grid"
            :style="{ gridTemplateColumns: `repeat(${DAYS}, 1fr)` }"
          >
            <!-- Background day cells -->
            <div
              v-for="i in DAYS"
              :key="`cell-${i}`"
              class="bgrid-cell"
              :class="{
                'bgrid-cell--today': isToday(i - 1),
                'bgrid-cell--weekend': isWeekend(i - 1),
              }"
            />

            <!-- Booking bands -->
            <div
              v-for="b in bookingsForProp(p.id)"
              :key="b.id"
              :class="bandClass(b)"
              :style="bandStyle(b)"
              :title="`${b.guestName}${b.guestCount ? ` · ${b.guestCount}g` : ''}`"
            >
              <span class="bgrid-band-label">
                {{ b.guestName }}<template v-if="b.guestCount"> · {{ b.guestCount }}g</template>
              </span>
            </div>
          </div>
        </div>
      </div>
    </v-card>

    <!-- Secondary: today events + recent activity -->
    <div v-if="(todayEvents?.length ?? 0) > 0 || (recentActivity?.length ?? 0) > 0" class="bgrid-secondary">
      <!-- Today's events -->
      <v-card v-if="todayEvents?.length" class="bgrid-sec-card">
        <div class="bgrid-sec-title">Today's events</div>

        <div class="bgrid-today-list">
          <div v-for="ev in todayEvents" :key="`${ev.propId}-${ev.kind}`" class="bgrid-today-row">
            <span class="bgrid-today-time">{{ ev.time }}</span>
            <div class="bgrid-today-dot" :style="{ background: ev.propColor }" />
            <span class="bgrid-today-addr">{{ ev.propName }}</span>

            <v-chip
              :color="ev.kind === 'turn' ? 'warning' : ev.kind === 'checkin' ? 'success' : 'error'"
              density="comfortable"
              size="x-small"
              variant="tonal"
            >
              {{ EVENT_LABELS[ev.kind] }}
            </v-chip>
          </div>
        </div>
      </v-card>

      <!-- Recent activity -->
      <v-card v-if="recentActivity?.length" class="bgrid-sec-card">
        <div class="bgrid-sec-title">Recent activity</div>

        <div class="bgrid-activity-list">
          <div v-for="(a, i) in recentActivity" :key="i" class="bgrid-activity-row">
            <div
              class="bgrid-activity-dot"
              :style="{
                background: a.type === 'created' ? 'var(--claro-success)' :
                  a.type === 'modified' ? 'var(--claro-info)' : 'var(--claro-fg3)'
              }"
            />

            <div class="bgrid-activity-body">
              <div class="bgrid-activity-text">{{ a.text }}</div>
              <div class="bgrid-activity-sub">{{ a.timeAgo }} · {{ a.propName }}</div>
            </div>
          </div>
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.bgrid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Main card ── */
.bgrid-card {
  overflow: hidden;
}

/* Toolbar */
.bgrid-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--claro-border);
  flex-wrap: wrap;
}

.bgrid-toolbar-title {
  font-size: var(--claro-text-md);
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
}

.bgrid-legend {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.bgrid-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--claro-text-xs);
  color: var(--claro-fg3);
}

.bgrid-legend-cap {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.bgrid-today-tag {
  font-size: var(--claro-text-xs);
  color: var(--claro-fg3);
  white-space: nowrap;
}

/* Day headers */
.bgrid-hdr-row {
  display: flex;
  border-bottom: 1px solid var(--claro-border);
}

.bgrid-hdr-spacer {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid var(--claro-border);
}

.bgrid-hdr-days {
  flex: 1;
  display: flex;
}

.bgrid-hdr-day {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 0;
  font-size: 10px;
  color: var(--claro-fg3);
  border-right: 1px solid var(--claro-border);
  min-width: 0;
}

.bgrid-hdr-day:last-child {
  border-right: none;
}

.bgrid-hdr-day--today {
  color: var(--claro-primary);
  background: rgba(var(--v-theme-primary), 0.06);
}

.bgrid-hdr-day--weekend {
  background: var(--claro-surface-variant);
}

.bgrid-day-dow {
  font-weight: 600;
  letter-spacing: 0.04em;
}

.bgrid-day-num {
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* Property rows */
.bgrid-body {
  display: flex;
  flex-direction: column;
}

.bgrid-row {
  display: flex;
  border-bottom: 1px solid var(--claro-border);
  min-height: 56px;
  align-items: stretch;
}

.bgrid-row:last-child {
  border-bottom: none;
}

/* Left: property info */
.bgrid-row-head {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-right: 1px solid var(--claro-border);
}

.bgrid-swatch {
  width: 32px;
  height: 32px;
  border-radius: var(--claro-radius-sm);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.bgrid-row-info {
  flex: 1;
  min-width: 0;
}

.bgrid-row-addr {
  font-size: 12px;
  font-weight: 600;
  color: var(--claro-fg1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bgrid-row-sub {
  font-size: 10px;
  color: var(--claro-fg3);
}

/* Right: band grid */
.bgrid-row-grid {
  flex: 1;
  display: grid;
  position: relative;
  align-items: center;
}

/* Day background cells */
.bgrid-cell {
  grid-row: 1;
  height: 56px;
  border-right: 1px solid var(--claro-border);
}

.bgrid-cell:last-of-type {
  border-right: none;
}

.bgrid-cell--today {
  background: rgba(var(--v-theme-primary), 0.06);
}

.bgrid-cell--weekend {
  background: var(--claro-surface-variant);
}

/* Booking bands */
.bgrid-band {
  height: 26px;
  border-radius: var(--claro-radius-sm);
  background: rgba(var(--v-theme-primary), 0.16);
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-size: 10px;
  font-weight: 600;
  color: var(--claro-primary-dark);
  overflow: hidden;
  cursor: pointer;
  position: relative;
  min-width: 0;
  transition: transform var(--claro-dur-fast) var(--claro-ease);
}

.bgrid-band:hover {
  transform: scaleY(1.05);
  box-shadow: var(--claro-shadow-sm);
}

/* Check-in cap (left) */
.bgrid-band::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 4px;
  background: var(--claro-success);
  border-radius: var(--claro-radius-sm) 0 0 var(--claro-radius-sm);
}

/* Check-out cap (right) */
.bgrid-band::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 4px;
  background: var(--claro-error);
  border-radius: 0 var(--claro-radius-sm) var(--claro-radius-sm) 0;
}

.bgrid-band--urgent {
  background: var(--claro-error-tonal);
  color: var(--claro-error);
}

.bgrid-band--turn::before,
.bgrid-band--turn::after {
  background: var(--claro-warning);
}

.bgrid-band--normal {
  background: var(--claro-surface-variant);
  color: var(--claro-fg3);
  border: 1px dashed var(--claro-border-strong);
}

.bgrid-band-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 4px;
  font-variant-numeric: tabular-nums;
}

/* ── Secondary cards ── */
.bgrid-secondary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.bgrid-sec-card {
  padding: 20px;
}

.bgrid-sec-title {
  font-size: var(--claro-text-md);
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
  margin-bottom: 14px;
}

/* Today list */
.bgrid-today-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bgrid-today-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bgrid-today-time {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--claro-fg3);
  font-weight: 500;
  min-width: 36px;
}

.bgrid-today-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.bgrid-today-addr {
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  color: var(--claro-fg1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Activity list */
.bgrid-activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bgrid-activity-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.bgrid-activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 3px;
  flex-shrink: 0;
}

.bgrid-activity-text {
  font-size: 12px;
  font-weight: 500;
  color: var(--claro-fg1);
  line-height: 1.3;
}

.bgrid-activity-sub {
  font-size: 11px;
  color: var(--claro-fg3);
}
</style>
