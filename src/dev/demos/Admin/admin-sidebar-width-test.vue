<template>
  <div class="admin-sidebar-width-test">
    <v-app-bar
      color="primary"
      title="Admin Sidebar Width Test"
    />

    <v-main>
      <v-container
        class="pa-0"
        fluid
      >
        <div class="test-info mb-4 pa-4">
          <h2>AdminSidebar Width Test</h2>
          <p>This page tests the AdminSidebar width behavior:</p>
          <ul>
            <li><strong>Desktop (lg):</strong> Sidebar should be ~25% width (3/12 columns)</li>
            <li><strong>Large Desktop (xl):</strong> Sidebar should be ~16.7% width (2/12 columns)</li>
            <li><strong>Mobile:</strong> Sidebar should be hidden by default</li>
          </ul>

          <v-chip
            class="mr-2"
            :color="$vuetify.display.xl ? 'success' : 'default'"
          >
            XL: {{ $vuetify.display.xl }}
          </v-chip>
          <v-chip
            class="mr-2"
            :color="$vuetify.display.lg ? 'success' : 'default'"
          >
            LG: {{ $vuetify.display.lg }}
          </v-chip>
          <v-chip
            class="mr-2"
            :color="$vuetify.display.md ? 'success' : 'default'"
          >
            MD: {{ $vuetify.display.md }}
          </v-chip>
          <v-chip
            class="mr-2"
            :color="$vuetify.display.sm ? 'success' : 'default'"
          >
            SM: {{ $vuetify.display.sm }}
          </v-chip>
          <v-chip
            :color="$vuetify.display.xs ? 'warning' : 'default'"
          >
            XS: {{ $vuetify.display.xs }}
          </v-chip>
        </div>

        <!-- Replica of HomeAdmin layout structure -->
        <v-row
          class="fill-height test-layout"
          density="compact"
        >
          <!-- Sidebar Column - Same structure as HomeAdmin -->
          <v-col
            class="sidebar-column test-sidebar"
            :class="{ 'mobile-hidden': !sidebarOpen }"
            cols="12"
            lg="3"
            xl="2"
          >
            <div class="pa-2">
              <v-btn
                v-if="$vuetify.display.lgAndDown"
                class="mb-2"
                icon="mdi-menu"
                variant="outlined"
                @click="toggleSidebar"
              >
                <v-icon>mdi-menu</v-icon>
              </v-btn>

              <!-- AdminSidebar Component -->
              <AdminSidebar
                :loading="false"
                :properties="mockProperties"
                :today-turns="mockTodayTurns"
                :upcoming-cleanings="mockUpcomingCleanings"
                @create-booking="handleEvent"
                @create-property="handleEvent"
                @filter-by-property="handleEvent"
                @navigate-to-booking="handleEvent"
                @navigate-to-date="handleEvent"
              />
            </div>
          </v-col>

          <!-- Main Calendar Column - Same structure as HomeAdmin -->
          <v-col
            class="calendar-column test-main"
            cols="12"
            lg="9"
            xl="10"
          >
            <div class="test-content pa-4">
              <h3>Main Content Area</h3>
              <p>This area simulates the calendar content.</p>
              <p>
                <strong>Current breakpoint:</strong>
                <span v-if="$vuetify.display.xl">XL (≥1904px) - Sidebar should be 2/12 = ~16.7%</span>
                <span v-else-if="$vuetify.display.lg">LG (≥1264px) - Sidebar should be 3/12 = 25%</span>
                <span v-else-if="$vuetify.display.md">MD (≥960px) - Mobile layout</span>
                <span v-else>Mobile - Sidebar hidden/overlay</span>
              </p>

              <v-btn
                v-if="$vuetify.display.lgAndDown"
                prepend-icon="mdi-menu"
                variant="outlined"
                @click="toggleSidebar"
              >
                Toggle Sidebar
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useDisplay } from 'vuetify'
  import AdminSidebar from '@/components/smart/admin/AdminSidebar.vue'

  const { xs } = useDisplay()
  const sidebarOpen = ref(!xs.value)

  // Mock data for AdminSidebar
  const mockTodayTurns = new Map()
  const mockUpcomingCleanings = new Map()
  const mockProperties = new Map()

  // Event handlers
  function handleEvent (data: unknown) {
    console.log('Event received:', data)
  }

  function toggleSidebar () {
    sidebarOpen.value = !sidebarOpen.value
  }
</script>

<style scoped>
.admin-sidebar-width-test {
  height: 100vh;
  overflow: hidden;
}

.test-layout {
  min-height: calc(100vh - 200px);
}

.test-info {
  background-color: rgb(var(--v-theme-surface-variant));
  border-radius: 8px;
}

.sidebar-column {
  min-height: calc(100vh - 200px);
  overflow-y: auto;
  border-right: 2px solid rgb(var(--v-theme-primary));
  background-color: rgb(var(--v-theme-surface));
}

.calendar-column {
  min-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.test-sidebar {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1), rgba(var(--v-theme-secondary), 0.1));
}

.test-main {
  background: linear-gradient(135deg, rgba(var(--v-theme-info), 0.05), rgba(var(--v-theme-success), 0.05));
}

.test-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.mobile-hidden {
  display: none;
}

/* Responsive design - Same as HomeAdmin */
@media (max-width: 1024px) {
  .sidebar-column {
    position: fixed;
    top: 64px;
    left: 0;
    z-index: 1000;
    width: 100% !important;
    max-width: 400px;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    height: calc(100vh - 64px);
  }

  .mobile-hidden {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar-column:not(.mobile-hidden) {
    transform: translateX(0);
  }
}
</style>
