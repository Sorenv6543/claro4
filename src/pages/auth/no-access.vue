<template>
  <v-container class="d-flex align-center justify-center" style="min-height: 80vh">
    <v-card max-width="480" class="text-center pa-8" elevation="2" rounded="lg">
      <v-icon color="info" size="64" class="mb-4">mdi-account-clock</v-icon>
      <v-card-title class="text-h5 mb-2">Access Coming Soon</v-card-title>
      <v-card-text class="text-body-1 text-medium-emphasis">
        The cleaner dashboard is not yet available. Please contact your admin for scheduling information.
      </v-card-text>
      <v-card-actions class="justify-center mt-4">
        <v-btn color="primary" variant="tonal" @click="handleLogout">
          Sign Out
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { useAuthStore } from '@stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

async function handleLogout () {
  try {
    await authStore.logout()
  } catch (error) {
    console.error('Logout failed:', error)
  }
  router.push('/')
}
</script>
