<template>
  <v-card class="welcome-banner">
    <v-card-text class="pa-5">
      <v-row align="center">
        <!-- Left: Greeting + Stats -->
        <v-col
          cols="12"
          md="8"
        >
          <div class="mb-4">
            <h4 class="text-h6 font-weight-bold">
              Welcome back, {{ userName }}
            </h4>

            <p class="text-body-2 text-medium-emphasis mt-1">
              Here's your business overview
            </p>
          </div>

          <div class="d-flex flex-wrap gap-4">
            <!-- Properties Pill -->
            <div class="stat-pill d-flex align-center">
              <div class="stat-icon stat-icon--blue">
                <v-icon
                  color="primary"
                  size="24"
                >
                  mdi-home-city
                </v-icon>
              </div>

              <div class="ms-3">
                <div class="text-caption text-medium-emphasis">
                  Properties
                </div>

                <div class="text-h6 font-weight-bold text-primary">
                  {{ propertyCount }}
                </div>
              </div>
            </div>

            <!-- Bookings Pill -->
            <div class="stat-pill d-flex align-center">
              <div class="stat-icon stat-icon--green">
                <v-icon
                  color="success"
                  size="24"
                >
                  mdi-calendar-check
                </v-icon>
              </div>

              <div class="ms-3">
                <div class="text-caption text-medium-emphasis">
                  Bookings
                </div>

                <div class="text-h6 font-weight-bold text-success">
                  {{ bookingCount }}
                </div>
              </div>
            </div>

            <!-- Turns Pill -->
            <div class="stat-pill d-flex align-center">
              <div class="stat-icon stat-icon--orange">
                <v-icon
                  color="warning"
                  size="24"
                >
                  mdi-fire
                </v-icon>
              </div>

              <div class="ms-3">
                <div class="text-caption text-medium-emphasis">
                  Turns
                </div>

                <div class="text-h6 font-weight-bold text-warning">
                  {{ turnCount }}
                </div>
              </div>
            </div>
          </div>
        </v-col>

        <!-- Right: Donut Chart -->
        <v-col
          class="d-flex flex-column align-center justify-center"
          cols="12"
          md="4"
        >
          <div class="text-caption text-medium-emphasis mb-2">
            Cleaning Workload
          </div>

          <div class="donut-wrapper">
            <v-progress-circular
              color="primary"
              :model-value="completionPercent"
              :size="120"
              :width="12"
            >
              <div class="text-center">
                <div class="text-h5 font-weight-bold">
                  {{ completionPercent }}%
                </div>

                <div class="text-caption text-medium-emphasis">
                  Complete
                </div>
              </div>
            </v-progress-circular>
          </div>

          <div class="text-caption text-medium-emphasis mt-2">
            {{ cleaningsCompleted }} / {{ cleaningsTotal }} cleanings
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{
    userName: string
    propertyCount: number
    bookingCount: number
    turnCount: number
    cleaningsCompleted: number
    cleaningsTotal: number
  }>()

  const completionPercent = computed(() => {
    if (props.cleaningsTotal === 0) return 0
    return Math.round((props.cleaningsCompleted / props.cleaningsTotal) * 100)
  })
</script>

<style scoped>
.welcome-banner {
  background: linear-gradient(135deg, rgb(var(--v-theme-surface)) 0%, rgba(var(--v-theme-primary), 0.04) 100%);
}

.stat-pill {
  min-width: 140px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon--blue {
  background: rgba(var(--v-theme-primary), 0.12);
}

.stat-icon--green {
  background: rgba(var(--v-theme-success), 0.12);
}

.stat-icon--orange {
  background: rgba(var(--v-theme-warning), 0.12);
}

.donut-wrapper {
  position: relative;
}
</style>
