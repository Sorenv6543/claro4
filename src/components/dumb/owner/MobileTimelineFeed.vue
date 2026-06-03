<!-- Mobile day-grouped timeline feed (from screens-mobile-timeline.jsx handoff) -->
<script setup lang="ts">
  import { computed, ref } from 'vue'

  export interface MobileEvent {
    id: string
    propId: string
    propName: string
    propColor: string
    city: string
    day: number // 0 = today, 1 = tomorrow, etc.
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
  const range = ref(7)
  const expandedId = ref<string | null>(null)

  const RANGES = [
    { label: '3d', value: 3 },
    { label: '7d', value: 7 },
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
    return [...map.entries()].toSorted(([a], [b]) => a - b)
  })

  function dayLabel (d: number): string {
    if (d === 0) return 'Today'
    if (d === 1) return 'Tomorrow'
    const date = new Date()
    date.setDate(date.getDate() + d)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const EVENT_COLORS = {
    out: 'var(--claro-error)',
    in: 'var(--claro-success)',
    turn: 'var(--claro-warning)',
  } as const

  const EVENT_LABELS = {
    out: 'Check-out',
    in: 'Check-in',
    turn: 'Same-day turn',
  } as const

  function statusTone (status: string): 'ok' | 'warn' | 'info' {
    if (status.toLowerCase().includes('confirmed')) return 'ok'
    if (status.toLowerCase().includes('pending')) return 'warn'
    return 'info'
  }

  function subtitle (): string {
    const prop = props.properties.find(p => p.id === selectedPropId.value)
    if (selectedPropId.value === 'all') {
      return `${filtered.value.length} events · next ${range.value}d`
    }
    return `${prop?.name ?? ''} · ${filtered.value.length} events`
  }

  function toggle (id: string): void {
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
            <div
              class="mtf-bar mtf-bar--event"
              :style="{
                background: ev.type === 'turn'
                  ? `linear-gradient(180deg, ${EVENT_COLORS.out} 50%, ${EVENT_COLORS.in} 50%)`
                  : EVENT_COLORS[ev.type]
              }"
            />

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
