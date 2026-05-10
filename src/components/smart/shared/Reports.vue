<template>
  <v-container fluid>
    <div class="reports-empty">
      <div class="reports-empty-icon">
        <v-icon color="primary" opacity="0.6" size="48">mdi-chart-areaspline</v-icon>
      </div>

      <h2 class="reports-empty-title">Reporting coming soon</h2>

      <p class="reports-empty-body">
        Booking trends, occupancy rates, and revenue summaries will appear here
        once reporting is connected to your live data.
      </p>

      <v-btn
        color="primary"
        prepend-icon="mdi-calendar-month-outline"
        rounded="pill"
        to="/owner/bookings"
        variant="tonal"
      >
        View bookings instead
      </v-btn>
    </div>
  </v-container>
</template>

<script setup lang="ts">
  defineOptions({ name: 'Reports' })
</script>

<style scoped>
.reports-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 400px;
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
  padding: 48px 24px;
}

.reports-empty-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--claro-radius-sm);
  background: rgba(115, 103, 240, 0.08);
  display: grid;
  place-items: center;
}

.reports-empty-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--claro-fg1);
  letter-spacing: -0.02em;
}

.reports-empty-body {
  font-size: 14px;
  color: var(--claro-fg3);
  line-height: 1.6;
  max-width: 360px;
  margin: 0;
}
</style>
