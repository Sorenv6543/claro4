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
      :style="{ '--row-color': item.property.color, '--pl-prop-color': item.property.color }"
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
              :variant="item.property.active ? 'flat' : 'outlined'"
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
            :style="item.property.active ? { background: 'var(--claro-primary-dark)', color: '#fff' } : undefined"
            :variant="item.property.active ? 'flat' : 'outlined'"
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
