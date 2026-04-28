<script setup lang="ts">
  import type { Property } from '@/types/property'
  import { computed, ref } from 'vue'
  import { useDisplay } from 'vuetify'

  // ─── Exported types (used by smart parent to shape data) ─────────────────────

  export interface PropertyListEvent {
    type: 'checkout' | 'cleaning' | 'checkin'
    time: string // display string e.g. "11:00 AM" or "11:00 → 3:00 PM"
    time24?: string // 24h "HH:MM" for timebar math
    cleanerName?: string
    isUnassigned?: boolean
  }

  export interface PropertyTimelineEvent {
    dateLabel: string // e.g. "Thu, Apr 25 · 10:00 AM"
    title: string
    subtitle?: string
  }

  export interface PropertyStats {
    rating?: string // e.g. "4.92 / 128 reviews"
    turnsYtd?: number
    avgCleanMin?: number
    rate?: string // e.g. "$85 / turn"
    assignmentLabel: string // "Today" | "Next check-in"
    assignedCleanerName?: string
  }

  export interface PropertyListItem {
    property: Property
    nextCheckin?: {
      label: string // e.g. "Today · 3:00 PM"
      cleanerName?: string
      isTurnDay?: boolean
    }
    isTurnToday: boolean
    todayEvents?: PropertyListEvent[] // B2: turn day → timebar
    upcomingEvents?: PropertyTimelineEvent[] // B1: no turn → spine
    stats: PropertyStats
  }

  // ─── Props & Emits ────────────────────────────────────────────────────────────

  const _props = withDefaults(defineProps<{
    items: PropertyListItem[]
    loading?: boolean
  }>(), {
    loading: false,
  })

  const emit = defineEmits<{
    'assign-cleaner': [propertyId: string]
    'view-calendar': [propertyId: string]
    'edit': [propertyId: string]
    'more': [propertyId: string]
  }>()

  // ─── Accordion ────────────────────────────────────────────────────────────────

  const expandedId = ref<string | null>(null)
  const hasOpen = computed(() => expandedId.value !== null)

  function isExpanded (id: string): boolean {
    return expandedId.value === id
  }

  function toggleRow (id: string): void {
    expandedId.value = expandedId.value === id ? null : id
  }

  // ─── Timebar helpers ──────────────────────────────────────────────────────────

  // Axis: 08:00 → 18:00 (600 minutes)
  function timePct (time24: string): number {
    const [h, m] = time24.split(':').map(Number)
    return Math.max(0, Math.min(100, ((h * 60 + (m ?? 0) - 480) / 600) * 100))
  }

  function resolveBar (events: PropertyListEvent[]) {
    const outEv = events.find(e => e.type === 'checkout')
    const inEv = events.find(e => e.type === 'checkin')
    if (!outEv?.time24 || !inEv?.time24) return null
    const outPct = timePct(outEv.time24)
    const inPct = timePct(inEv.time24)
    if (inPct <= outPct) return null
    return { outPct, inPct, windowPct: inPct - outPct }
  }

  function outBlockStyle (events: PropertyListEvent[]) {
    const b = resolveBar(events)
    return b ? { left: `calc(${b.outPct}% - 22px)`, width: '44px' } : {}
  }

  function windowBlockStyle (events: PropertyListEvent[]) {
    const b = resolveBar(events)
    return b ? { left: `${b.outPct}%`, width: `${b.windowPct}%` } : {}
  }

  function inBlockStyle (events: PropertyListEvent[]) {
    const b = resolveBar(events)
    return b ? { left: `calc(${b.inPct}% - 18px)`, width: '36px' } : {}
  }

  function hasTimebar (events: PropertyListEvent[]): boolean {
    return resolveBar(events) !== null
  }

  // ─── Responsive ──────────────────────────────────────────────────────────────

  const { mobile } = useDisplay()

  const rowGrid = computed(() =>
    mobile.value ? '20px 1fr 28px' : '20px 1fr 160px 80px 28px',
  )

  // ─── Display helpers ──────────────────────────────────────────────────────────

  function bedbath (p: Property): string {
    const parts: string[] = []
    if (p.bedrooms) parts.push(`${p.bedrooms} bd`)
    if (p.bathrooms) parts.push(`${p.bathrooms} ba`)
    return parts.join(' · ')
  }

  function isUnassigned (item: PropertyListItem): boolean {
    return !item.stats.assignedCleanerName
  }
</script>

<template>
  <!-- Loading -->
  <v-skeleton-loader
    v-if="loading"
    type="list-item-two-line, list-item-two-line, list-item-two-line"
  />

  <!-- Empty -->
  <v-empty-state
    v-else-if="items.length === 0"
    icon="mdi-home-outline"
    text="Add a property to get started."
    title="No Properties"
  />

  <!-- List -->
  <div v-else class="pl-card" :class="{ 'pl-card--has-open': hasOpen }">
    <!-- Header row -->
    <div class="pl-hdr" :style="{ gridTemplateColumns: rowGrid }">
      <div />
      <div>Property</div>
      <div v-if="!mobile">Next check-in</div>
      <div v-if="!mobile">Status</div>
      <div />
    </div>

    <!-- Property rows -->
    <div
      v-for="item in items"
      :key="item.property.id"
      class="pl-row-shell"
      :class="{
        'pl-row-shell--open': isExpanded(item.property.id),
        'pl-row-shell--dimmed': hasOpen && !isExpanded(item.property.id),
      }"
      :style="isExpanded(item.property.id) ? { '--pl-prop-color': item.property.color } : {}"
    >
      <!-- Summary row (clickable) -->
      <div
        class="pl-row"
        :style="{ gridTemplateColumns: rowGrid }"
        @click="toggleRow(item.property.id)"
      >
        <!-- Property color dot -->
        <div class="pl-dot" :style="{ background: item.property.color }" />

        <!-- Address + bed/bath (+ mobile-inline status/checkin) -->
        <div class="pl-addr-cell">
          <div class="pl-addr">
            {{ item.property.address_street }}{{ item.property.address_unit ? `, ${item.property.address_unit}` : '' }}
          </div>

          <div v-if="bedbath(item.property)" class="pl-submeta">
            {{ bedbath(item.property) }}
          </div>
          <!-- Mobile only: status chip + next check-in shown inline under address -->
          <div v-if="mobile" class="pl-mobile-meta">
            <v-chip
              :color="item.property.active ? 'primary' : undefined"
              size="x-small"
              :variant="item.property.active ? 'tonal' : 'outlined'"
            >
              {{ item.property.active ? 'Active' : 'Inactive' }}
            </v-chip>

            <span v-if="item.nextCheckin" class="pl-mobile-checkin">
              {{ item.nextCheckin.label }}
            </span>
          </div>
        </div>

        <!-- Desktop only: Next check-in column -->
        <div v-if="!mobile" class="pl-checkin-cell">
          <template v-if="item.nextCheckin">
            <div class="pl-checkin-when">{{ item.nextCheckin.label }}</div>

            <div v-if="item.nextCheckin.cleanerName" class="pl-checkin-who">
              {{ item.nextCheckin.cleanerName }}{{ item.nextCheckin.isTurnDay ? ' · turn day' : '' }}
            </div>
          </template>

          <span v-else class="pl-checkin-empty">No upcoming</span>
        </div>

        <!-- Desktop only: Status chip column -->
        <div v-if="!mobile" class="pl-status-cell">
          <v-chip
            :color="item.property.active ? 'primary' : undefined"
            size="small"
            :variant="item.property.active ? 'tonal' : 'outlined'"
          >
            {{ item.property.active ? 'Active' : 'Inactive' }}
          </v-chip>
        </div>

        <!-- Expand chevron -->
        <div class="pl-chev" :class="{ 'pl-chev--open': isExpanded(item.property.id) }">
          <v-icon size="20">mdi-chevron-down</v-icon>
        </div>
      </div>

      <!-- Expandable inlay -->
      <v-expand-transition>
        <div v-if="isExpanded(item.property.id)" class="pl-inlay">
          <div class="pl-inlay-body" :class="{ 'pl-inlay-body--stacked': mobile }">
            <!-- ── Left panel ── -->
            <div class="pl-inlay-left">
              <!-- B2: Turn today → time bar visualization -->
              <template v-if="item.isTurnToday && item.todayEvents?.length && hasTimebar(item.todayEvents)">
                <div class="pl-col-label">Today's events</div>

                <div class="pl-timebar-axis">
                  <div class="pl-timebar-line" />
                  <div class="pl-tb-block pl-tb-out" :style="outBlockStyle(item.todayEvents)">OUT</div>

                  <div class="pl-tb-block pl-tb-turn" :style="windowBlockStyle(item.todayEvents)">
                    <span class="pl-tb-window-label">cleaning window</span>
                  </div>

                  <div class="pl-tb-block pl-tb-in" :style="inBlockStyle(item.todayEvents)">IN</div>
                </div>

                <div class="pl-timebar-ticks">
                  <span>8am</span><span>10am</span><span>12pm</span><span>2pm</span><span>4pm</span><span>6pm</span>
                </div>

                <div class="pl-tb-events">
                  <div v-for="ev in item.todayEvents" :key="ev.type" class="pl-tb-event-row">
                    <div class="pl-tb-dot" :class="`pl-tb-dot--${ev.type}`" />

                    <div class="pl-tb-event-text">
                      <template v-if="ev.type === 'checkout'">Guest check-out</template>
                      <template v-else-if="ev.type === 'checkin'">Guest check-in</template>

                      <template v-else>
                        Cleaning
                        <span v-if="ev.isUnassigned" class="pl-tb-badge pl-tb-badge--urgent">Unassigned</span>
                        <span v-else-if="ev.cleanerName"> · {{ ev.cleanerName }}</span>
                      </template>
                    </div>

                    <div class="pl-tb-event-time">{{ ev.time }}</div>
                  </div>
                </div>
              </template>

              <!-- B1: No turn today → upcoming event spine -->
              <template v-else-if="item.upcomingEvents?.length">
                <div class="pl-col-label">Upcoming events</div>

                <div class="pl-tl-spine">
                  <div
                    v-for="(ev, idx) in item.upcomingEvents"
                    :key="idx"
                    class="pl-tl-item"
                  >
                    <div class="pl-tl-dot-wrap">
                      <div class="pl-tl-dot" />
                    </div>

                    <div class="pl-tl-content">
                      <div class="pl-tl-date">{{ ev.dateLabel }}</div>
                      <div class="pl-tl-title">{{ ev.title }}</div>
                      <div v-if="ev.subtitle" class="pl-tl-sub">{{ ev.subtitle }}</div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- No events at all -->
              <template v-else>
                <div class="pl-col-label">Upcoming events</div>
                <div class="pl-no-events">No upcoming events</div>
              </template>
            </div>

            <!-- ── Right panel: property stats ── -->
            <div class="pl-inlay-right">
              <div class="pl-col-label">Property stats</div>

              <table class="pl-stats-table">
                <tbody>
                  <tr v-if="item.stats.rating">
                    <td>
                      <span class="pl-td-inner">
                        <v-icon color="primary" size="15">mdi-star-outline</v-icon>
                        Rating
                      </span>
                    </td>

                    <td>{{ item.stats.rating }}</td>
                  </tr>

                  <tr v-if="item.stats.turnsYtd !== undefined">
                    <td>
                      <span class="pl-td-inner">
                        <v-icon color="primary" size="15">mdi-autorenew</v-icon>
                        Turns YTD
                      </span>
                    </td>

                    <td>{{ item.stats.turnsYtd }}</td>
                  </tr>

                  <tr v-if="item.stats.avgCleanMin !== undefined">
                    <td>
                      <span class="pl-td-inner">
                        <v-icon color="primary" size="15">mdi-clock-outline</v-icon>
                        Avg clean
                      </span>
                    </td>

                    <td>{{ item.stats.avgCleanMin }} min</td>
                  </tr>

                  <tr v-if="item.stats.rate">
                    <td>
                      <span class="pl-td-inner">
                        <v-icon color="primary" size="15">mdi-cash</v-icon>
                        Rate
                      </span>
                    </td>

                    <td>{{ item.stats.rate }}</td>
                  </tr>

                  <tr>
                    <td>
                      <span class="pl-td-inner">
                        <v-icon color="primary" size="15">mdi-broom</v-icon>
                        {{ item.stats.assignmentLabel }}
                      </span>
                    </td>

                    <td :class="isUnassigned(item) ? 'pl-td--critical' : 'pl-td--ok'">
                      {{ item.stats.assignedCleanerName ?? 'Unassigned' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Action bar (click.stop prevents collapsing the row) -->
          <div class="pl-actions" :class="{ 'pl-actions--mobile': mobile }" @click.stop>
            <!-- Primary actions -->
            <div class="pl-actions-group">
              <v-btn
                v-if="isUnassigned(item) && item.isTurnToday"
                color="primary"
                :prepend-icon="mobile ? undefined : 'mdi-account-plus-outline'"
                size="small"
                @click="emit('assign-cleaner', item.property.id)"
              >
                <v-icon v-if="mobile" size="16" start>mdi-account-plus-outline</v-icon>
                Assign cleaner
              </v-btn>

              <v-btn
                color="primary"
                :prepend-icon="mobile ? undefined : 'mdi-calendar-month-outline'"
                size="small"
                variant="tonal"
                @click="emit('view-calendar', item.property.id)"
              >
                <v-icon v-if="mobile" size="16" start>mdi-calendar-month-outline</v-icon>
                View calendar
              </v-btn>
            </div>
            <!-- Secondary (ghost) actions -->
            <div class="pl-actions-group">
              <v-btn
                prepend-icon="mdi-pencil-outline"
                size="small"
                variant="text"
                @click="emit('edit', item.property.id)"
              >
                Edit
              </v-btn>

              <v-btn
                size="small"
                variant="text"
                @click="emit('more', item.property.id)"
              >
                <v-icon>mdi-dots-horizontal</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
      </v-expand-transition>
    </div>
  </div>
</template>

<style scoped>
/* ─── Outer card ─────────────────────────────────────────────────────────── */
.pl-card {
  background: var(--claro-surface);
  border: 1px solid var(--claro-border);
  border-radius: var(--claro-radius-sm);
  overflow: hidden;
  box-shadow: var(--claro-shadow-sm);
}

/* ─── Header ─────────────────────────────────────────────────────────────── */
.pl-hdr {
  display: grid;
  grid-template-columns: 20px 1fr 160px 80px 28px;
  gap: 12px;
  align-items: center;
  padding: 8px 24px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--claro-fg3);
  border-bottom: 1px solid var(--claro-border);
  background: var(--claro-surface-variant);
}

/* ─── Row shell ──────────────────────────────────────────────────────────── */
.pl-row-shell {
  border-bottom: 1px solid var(--claro-border);
  transition:
    filter var(--claro-dur-slow) var(--claro-ease),
    opacity var(--claro-dur-slow) var(--claro-ease);
}

.pl-row-shell:last-child {
  border-bottom: none;
}

/* Nearly monochrome ghost for non-active rows — much stronger than opacity alone */
.pl-card--has-open .pl-row-shell:not(.pl-row-shell--open) {
  filter: saturate(0.12) opacity(0.22);
}

/* Open row: property-color accent ring — stands out visually */
.pl-row-shell--open {
  position: relative;
  z-index: 2;
  filter: none !important;
  box-shadow:
    0 0 0 2px var(--pl-prop-color, var(--claro-primary)),
    0 4px 12px rgba(46, 38, 61, 0.10);
}

/* ─── Summary row ────────────────────────────────────────────────────────── */
.pl-row {
  display: grid;
  grid-template-columns: 20px 1fr 160px 80px 28px;
  gap: 12px;
  align-items: center;
  padding: 12px 24px;
  cursor: pointer;
  transition: background var(--claro-dur-fast) var(--claro-ease);
}

.pl-row:hover {
  background: rgba(115, 103, 240, 0.025);
}

/* ─── Color dot ──────────────────────────────────────────────────────────── */
.pl-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  justify-self: center;
}

/* ─── Address cell ───────────────────────────────────────────────────────── */
.pl-addr {
  font-size: 13px;
  font-weight: 500;
  color: var(--claro-fg1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pl-submeta {
  font-size: 10px;
  color: var(--claro-fg3);
  margin-top: 2px;
}

/* ─── Next check-in cell ─────────────────────────────────────────────────── */
.pl-checkin-when {
  font-size: 12px;
  font-weight: 500;
  color: var(--claro-fg1);
}

.pl-checkin-who {
  font-size: 10px;
  color: var(--claro-fg3);
}

.pl-checkin-empty {
  font-size: 12px;
  color: var(--claro-fg3);
}

/* ─── Status cell ────────────────────────────────────────────────────────── */
.pl-status-cell {
  display: flex;
  align-items: center;
}

/* ─── Chevron ────────────────────────────────────────────────────────────── */
.pl-chev {
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
  color: var(--claro-fg3);
  transition:
    transform var(--claro-dur-slow) var(--claro-ease),
    color var(--claro-dur-slow) var(--claro-ease);
}

.pl-chev--open {
  color: var(--claro-primary);
  transform: rotate(180deg);
}

/* ─── Inlay ──────────────────────────────────────────────────────────────── */
.pl-inlay {
  border-top: 1px solid var(--claro-border);
  background: var(--claro-surface);
}

.pl-inlay-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.pl-inlay-left {
  padding: 16px 20px 16px 24px;
}

.pl-inlay-right {
  padding: 16px 20px;
  border-left: 1px solid var(--claro-surface-variant);
}

/* ─── Section label ──────────────────────────────────────────────────────── */
.pl-col-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--claro-fg3);
  margin: 0 0 14px;
}

/* ─── Timebar axis ───────────────────────────────────────────────────────── */
.pl-timebar-axis {
  position: relative;
  height: 48px;
  margin: 0 0 8px;
}

.pl-timebar-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  background: var(--claro-border);
  border-radius: 2px;
  transform: translateY(-50%);
}

.pl-tb-block {
  position: absolute;
  top: 50%;
  height: 16px;
  border-radius: 3px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  letter-spacing: 0.03em;
}

.pl-tb-out { background: var(--claro-error); }
.pl-tb-in  { background: var(--claro-success); z-index: 2; }

.pl-tb-turn {
  background: transparent;
  border: 1.5px dashed var(--claro-warning);
  height: 22px;
}

.pl-tb-window-label {
  font-size: 10px;
  color: var(--claro-warning);
  padding: 0 8px;
}

.pl-timebar-ticks {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: var(--claro-fg3);
  font-variant-numeric: tabular-nums;
}

/* ─── Timebar event rows ─────────────────────────────────────────────────── */
.pl-tb-events {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.pl-tb-event-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pl-tb-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pl-tb-dot--checkout { background: var(--claro-error); }
.pl-tb-dot--cleaning  { background: var(--claro-warning); }
.pl-tb-dot--checkin  { background: var(--claro-success); }

.pl-tb-event-text {
  font-size: 12px;
  color: var(--claro-fg1);
  flex: 1;
}

.pl-tb-event-time {
  font-size: 11px;
  color: var(--claro-fg3);
  font-variant-numeric: tabular-nums;
}

.pl-tb-badge {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--claro-radius-pill);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pl-tb-badge--urgent {
  background: var(--claro-error-tonal);
  color: var(--claro-error);
}

/* ─── Timeline spine (B1) ────────────────────────────────────────────────── */
.pl-tl-spine {
  padding-left: 14px;
}

.pl-tl-item {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 10px;
  align-items: flex-start;
  position: relative;
  padding-bottom: 18px;
}

.pl-tl-item:last-child {
  padding-bottom: 0;
}

/* Connecting vertical line between spine dots */
.pl-tl-item::before {
  content: '';
  position: absolute;
  left: 9px;
  top: 18px;
  bottom: 0;
  width: 1.5px;
  background: var(--claro-border);
}

.pl-tl-item:last-child::before {
  display: none;
}

.pl-tl-dot-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.pl-tl-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: transparent;
  box-shadow: 0 0 0 1.5px var(--claro-primary);
}

.pl-tl-content {
  padding-top: 2px;
}

.pl-tl-date {
  font-size: 10px;
  font-weight: 700;
  color: var(--claro-fg3);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.pl-tl-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--claro-fg1);
  line-height: 1.3;
}

.pl-tl-sub {
  font-size: 11px;
  color: var(--claro-fg3);
  margin-top: 2px;
}

/* ─── No events fallback ─────────────────────────────────────────────────── */
.pl-no-events {
  font-size: 12px;
  color: var(--claro-fg3);
}

/* ─── Property stats table ───────────────────────────────────────────────── */
.pl-stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.pl-stats-table tr {
  border-bottom: 1px solid var(--claro-surface-variant);
}

.pl-stats-table tr:last-child {
  border-bottom: none;
}

.pl-stats-table tr:nth-child(even) td {
  background: var(--claro-surface-variant);
}

.pl-stats-table td {
  padding: 8px 10px;
  vertical-align: middle;
}

.pl-stats-table td:first-child {
  color: var(--claro-fg3);
  font-weight: 500;
  width: 45%;
  white-space: nowrap;
}

.pl-td-inner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  vertical-align: middle;
}

.pl-stats-table td:last-child {
  color: var(--claro-fg1);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.pl-td--critical { color: var(--claro-error) !important; }
.pl-td--ok       { color: var(--claro-success) !important; }

/* ─── Mobile meta (status chip + checkin shown inside addr cell) ─────────── */
.pl-mobile-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 5px;
}

.pl-mobile-checkin {
  font-size: 11px;
  color: var(--claro-fg3);
}

/* ─── Stacked inlay (mobile) ─────────────────────────────────────────────── */
.pl-inlay-body--stacked {
  grid-template-columns: 1fr;
}

.pl-inlay-body--stacked .pl-inlay-right {
  border-left: none;
  border-top: 1px solid var(--claro-surface-variant);
  padding: 14px 16px;
}

.pl-inlay-body--stacked .pl-inlay-left {
  padding: 14px 16px;
}

/* ─── Action bar ─────────────────────────────────────────────────────────── */
.pl-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 16px 12px;
  border-top: 1px solid var(--claro-surface-variant);
  background: var(--claro-surface-variant);
}

.pl-actions-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Mobile: stack primary group on its own line, secondary right-aligned below */
.pl-actions--mobile {
  flex-wrap: wrap;
  row-gap: 6px;
}

.pl-actions--mobile .pl-actions-group:first-child {
  flex: 1 1 100%;
}

.pl-actions--mobile .pl-actions-group:last-child {
  margin-left: auto;
}
</style>
