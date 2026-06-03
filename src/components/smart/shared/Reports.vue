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
