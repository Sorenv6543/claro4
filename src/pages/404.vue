<template>
  <v-container class="not-found-page fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col class="text-center" cols="12" md="5" sm="8">
        <div class="text-h1 font-weight-bold text-disabled mb-2">404</div>
        <div class="text-h5 font-weight-medium mb-2">Page not found</div>

        <p class="text-body-1 text-medium-emphasis mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <v-btn
          color="primary"
          rounded="pill"
          size="large"
          :to="dashboardRoute"
        >
          Go to dashboard
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { getDefaultRouteForRole } from '@/utils/authHelpers'

  const auth = useAuthStore()

  const dashboardRoute = computed(() =>
    auth.isAuthenticated ? getDefaultRouteForRole(auth.user?.role) : '/',
  )
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
}
</style>
