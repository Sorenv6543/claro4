<template>
  <v-card class="welcome-banner overflow-hidden">
    <v-row density="compact" no-gutters>
      <!-- Left side: greeting + stat pills -->
      <v-col class="pa-5 d-flex flex-column justify-center" cols="12" md="8">
        <div class="text-h5 font-weight-bold mb-1 text-white">
          Welcome back, {{ userName }}
        </div>
        <div class="text-body-2 mb-4" style="color: rgba(255,255,255,0.8)">
          Here is what is happening with your properties today.
        </div>

        <div class="d-flex flex-wrap ga-4">
          <!-- Properties pill -->
          <div class="stat-pill d-flex align-center ga-3">
            <div class="stat-icon-wrap">
              <v-icon color="white" size="24">mdi-home</v-icon>
            </div>
            <div>
              <div class="text-caption" style="color: rgba(255,255,255,0.75)">Properties</div>
              <div class="text-h6 font-weight-bold text-white">{{ propertyCount }}</div>
            </div>
          </div>

          <!-- Bookings pill -->
          <div class="stat-pill d-flex align-center ga-3">
            <div class="stat-icon-wrap">
              <v-icon color="white" size="24">mdi-calendar-check</v-icon>
            </div>
            <div>
              <div class="text-caption" style="color: rgba(255,255,255,0.75)">Bookings</div>
              <div class="text-h6 font-weight-bold text-white">{{ bookingCount }}</div>
            </div>
          </div>

          <!-- Turns pill -->
          <div class="stat-pill d-flex align-center ga-3">
            <div class="stat-icon-wrap">
              <v-icon color="white" size="24">mdi-swap-horizontal</v-icon>
            </div>
            <div>
              <div class="text-caption" style="color: rgba(255,255,255,0.75)">Turns</div>
              <div class="text-h6 font-weight-bold text-white">{{ turnCount }}</div>
            </div>
          </div>
        </div>
      </v-col>

      <!-- Right side: donut chart -->
      <v-col class="d-flex align-center justify-center pa-5" cols="12" md="4">
        <div class="text-center">
          <div class="text-body-2 font-weight-medium mb-2 text-white">Booking Activity</div>
          <v-progress-circular
            :color="donutColor"
            :model-value="donutPercentage"
            :size="120"
            :width="10"
          >
            <div class="text-center">
              <div class="text-h5 font-weight-bold text-white">{{ activeBookings }}</div>
              <div class="text-caption" style="color: rgba(255,255,255,0.75)">active</div>
            </div>
          </v-progress-circular>
          <div class="text-caption mt-2" style="color: rgba(255,255,255,0.75)">
            {{ activeBookings }} of {{ totalBookings }} active
          </div>
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    userName: string
    propertyCount: number
    bookingCount: number
    turnCount: number
    activeBookings: number
    totalBookings: number
  }

  const props = defineProps<Props>()

  const donutPercentage = computed(() => {
    if (props.totalBookings === 0) return 0
    return Math.round((props.activeBookings / props.totalBookings) * 100)
  })

  const donutColor = computed(() => {
    if (donutPercentage.value >= 75) return 'success'
    if (donutPercentage.value >= 40) return 'primary'
    return 'warning'
  })
</script>

<style scoped>
.welcome-banner {
  background: var(--claro-gradient-primary) !important;
}

.stat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-pill {
  min-width: 130px;
}
</style>
