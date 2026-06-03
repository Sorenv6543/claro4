<!-- layouts/auth.vue -->
<template>
  <v-app>
    <!-- Simple app bar for auth pages -->
    <v-app-bar
      color="primary"
      elevation="1"
      height="64"
      theme="dark"
    >
      <v-toolbar-title>
        Claro Scheduler
      </v-toolbar-title>

      <v-spacer />

      <!-- Optional help or contact link -->
      <v-btn
        color="white"
        href="mailto:support@example.com"
        variant="text"
      >
        <v-icon start>
          mdi-help-circle
        </v-icon>
        Help
      </v-btn>

    </v-app-bar>

    <!-- Main content area for auth forms -->
    <v-main class="auth-main">
      <v-container
        class="pa-0 d-flex align-center justify-center"
        fluid
        style="min-height: 100%"
      >
        <v-row
          align="center"
          justify="center"
        >
          <v-col
            class="pa-4"
            cols="12"
            lg="4"
            md="6"
            sm="8"
            xl="4"
          >
            <!-- Auth forms will be rendered here -->
            <router-view />
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Footer with basic info -->
    <v-footer
      class="justify-center"
      color="transparent"
      height="auto"
    >
      <div class="text-center">
        <div class="text-caption text-medium-emphasis">
          © {{ currentYear }} Property Cleaning Scheduler
        </div>

        <div class="text-caption text-medium-emphasis mt-1">
          Streamline your cleaning operations
        </div>
      </div>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  // Get current year for footer
  const currentYear = computed(() => new Date().getFullYear())
</script>
