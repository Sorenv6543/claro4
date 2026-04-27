<script setup lang="ts">
export interface UpcomingEventRow {
  propertyName: string
  propertyColor: string
  eventType: 'Check-out' | 'Check-in' | 'Turn'
  date: string
  status: string
}

defineProps<{
  events: UpcomingEventRow[]
  loading?: boolean
}>()

function statusColor(status: string): string {
  switch (status) {
    case 'confirmed':  return 'success'
    case 'pending':    return 'warning'
    case 'cleaning':   return 'primary'
    case 'completed':  return 'info'
    default:           return 'default'
  }
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <v-card class="out">
    <!-- Header -->
    <div class="out-header">
      <span class="out-title">Upcoming Events</span>
      <div class="out-search">
        <v-icon class="out-search-icon" size="14">mdi-magnify</v-icon>
        <span class="out-search-hint">Search...</span>
      </div>
    </div>

    <!-- Table header -->
    <div class="out-tbl-hdr">
      <div class="out-col out-col--prop">Property</div>
      <div class="out-col">Event</div>
      <div class="out-col">Date</div>
      <div class="out-col">Status</div>
    </div>

    <!-- Loading -->
    <v-skeleton-loader v-if="loading" type="list-item@4" />

    <!-- Empty -->
    <div v-else-if="!events.length" class="out-empty">
      <v-icon aria-hidden="true" size="28">mdi-calendar-blank-outline</v-icon>
      <span>No upcoming events</span>
    </div>

    <!-- Rows -->
    <template v-else>
      <div
        v-for="(ev, idx) in events"
        :key="idx"
        class="out-row"
        :class="{ 'out-row--last': idx === events.length - 1 }"
      >
        <!-- Property -->
        <div class="out-col out-col--prop out-prop-cell">
          <div class="out-dot" :style="{ background: ev.propertyColor }" />
          <span class="out-prop-name">{{ ev.propertyName }}</span>
        </div>
        <!-- Event type -->
        <div class="out-col out-ev-cell">
          <span class="out-ev-txt">{{ ev.eventType }}</span>
        </div>
        <!-- Date -->
        <div class="out-col out-date-cell">
          <span class="out-date-txt">{{ formatDate(ev.date) }}</span>
        </div>
        <!-- Status chip -->
        <div class="out-col out-status-cell">
          <v-chip
            :color="statusColor(ev.status)"
            density="comfortable"
            rounded="pill"
            size="small"
            variant="tonal"
          >
            {{ statusLabel(ev.status) }}
          </v-chip>
        </div>
      </div>
    </template>
  </v-card>
</template>

<style scoped>
.out {
  overflow: hidden;
}

/* ── Header ── */
.out-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

.out-title {
  font-size: var(--claro-text-md);
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
}

.out-search {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--claro-border);
  border-radius: var(--claro-radius-sm);
  padding: 6px 12px;
  min-width: 160px;
}

.out-search-icon {
  color: var(--claro-fg3);
}

.out-search-hint {
  font-size: 12px;
  color: var(--claro-fg3);
}

/* ── Table header ── */
.out-tbl-hdr {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 0;
  background: var(--claro-surface-variant);
  padding: 10px 20px;
  border-top: 1px solid var(--claro-border);
  border-bottom: 1px solid var(--claro-border);
}

.out-col {
  font-size: var(--claro-text-xs);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--claro-fg3);
}

/* ── Empty ── */
.out-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 32px 20px;
  color: var(--claro-fg3);
  font-size: var(--claro-text-sm);
}

/* ── Row ── */
.out-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--claro-border);
}

.out-row--last {
  border-bottom: none;
}

.out-prop-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.out-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.out-prop-name {
  font-size: var(--claro-text-sm);
  font-weight: var(--claro-font-weight-medium);
  color: var(--claro-fg1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.out-ev-cell,
.out-date-cell {
  display: flex;
  align-items: center;
}

.out-ev-txt,
.out-date-txt {
  font-size: var(--claro-text-sm);
  color: var(--claro-fg3);
}

.out-status-cell {
  display: flex;
  align-items: center;
}

/* Mobile: hide date/status, keep prop + event */
@media (max-width: 599px) {
  .out-tbl-hdr,
  .out-row {
    grid-template-columns: 1fr 1fr;
  }

  .out-col:nth-child(3),
  .out-col:nth-child(4),
  .out-date-cell,
  .out-status-cell {
    display: none;
  }
}
</style>
