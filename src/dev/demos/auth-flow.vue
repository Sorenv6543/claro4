<template>
  <v-container class="pa-6">
    <v-row>
      <v-col cols="12">
        <v-card
          class="pa-6"
          elevation="2"
        >
          <v-card-title class="text-h4 mb-4">
            <v-icon
              class="mr-3"
              color="primary"
            >
              mdi-account-check
            </v-icon>
            Authentication Flow Demo
          </v-card-title>

          <v-card-subtitle class="mb-6">
            Test role-based authentication and navigation
          </v-card-subtitle>

          <!-- Current Auth State -->
          <v-alert
            class="mb-6"
            :type="authStore.isAuthenticated ? 'success' : 'info'"
            variant="tonal"
          >
            <div class="text-h6 mb-2">
              Current Authentication State
            </div>
            <div v-if="authStore.isAuthenticated">
              <strong>User:</strong> {{ authStore.user?.name }} ({{ authStore.user?.email }})<br>
              <strong>Role:</strong> {{ authStore.user?.role }}<br>
              <strong>Is Admin:</strong> {{ authStore.isAdmin ? 'Yes' : 'No' }}<br>
              <strong>Is Owner:</strong> {{ authStore.isOwner ? 'Yes' : 'No' }}
            </div>
            <div v-else>
              <strong>Status:</strong> Not authenticated
            </div>
          </v-alert>

          <!-- Error Display -->
          <v-alert
            v-if="authStore.error"
            class="mb-4"
            closable
            type="error"
            variant="tonal"
            @click:close="authStore.clearError"
          >
            {{ authStore.error }}
          </v-alert>

          <!-- Success Display -->
          <v-alert
            v-if="successMessage"
            class="mb-4"
            closable
            type="success"
            variant="tonal"
            @click:close="successMessage = ''"
          >
            {{ successMessage }}
          </v-alert>

          <!-- Authentication Actions -->
          <div class="mb-6">
            <v-card
              class="pa-4"
              variant="outlined"
            >
              <v-card-title class="text-h6 mb-4">
                Authentication Actions
              </v-card-title>

              <v-row class="mb-4">
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-btn
                    block
                    color="primary"
                    :disabled="authStore.isAuthenticated"
                    :loading="authStore.loading"
                    @click="loginAsOwner"
                  >
                    <v-icon class="mr-2">
                      mdi-home-account
                    </v-icon>
                    Login as Owner
                  </v-btn>
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-btn
                    block
                    color="secondary"
                    :disabled="authStore.isAuthenticated"
                    :loading="authStore.loading"
                    @click="loginAsAdmin"
                  >
                    <v-icon class="mr-2">
                      mdi-shield-account
                    </v-icon>
                    Login as Admin
                  </v-btn>
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-btn
                    block
                    color="warning"
                    :disabled="authStore.isAuthenticated"
                    :loading="authStore.loading"
                    @click="loginAsCleaner"
                  >
                    <v-icon class="mr-2">
                      mdi-account-hard-hat
                    </v-icon>
                    Login as Cleaner
                  </v-btn>
                </v-col>
              </v-row>

              <v-btn
                v-if="authStore.isAuthenticated"
                block
                color="error"
                :loading="authStore.loading"
                @click="handleLogout"
              >
                <v-icon class="mr-2">
                  mdi-logout
                </v-icon>
                Logout
              </v-btn>
            </v-card>
          </div>

          <!-- Admin Features -->
          <div
            v-if="authStore.isAdmin"
            class="mb-6"
          >
            <v-card
              class="pa-4"
              variant="outlined"
            >
              <v-card-title class="text-h6 mb-4">
                Admin Features
              </v-card-title>

              <v-alert
                type="info"
                variant="tonal"
              >
                Admin users have access to system-wide management features
              </v-alert>
            </v-card>
          </div>

          <!-- Navigation Testing -->
          <div class="mb-6">
            <v-card
              class="pa-4"
              variant="outlined"
            >
              <v-card-title class="text-h6 mb-4">
                Navigation Testing
              </v-card-title>

              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-btn
                    block
                    color="info"
                    :disabled="!authStore.isAuthenticated"
                    @click="navigateToHome"
                  >
                    <v-icon class="mr-2">
                      mdi-home
                    </v-icon>
                    Go to Home
                  </v-btn>
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-btn
                    block
                    color="info"
                    variant="outlined"
                    @click="goToLogin"
                  >
                    <v-icon class="mr-2">
                      mdi-login
                    </v-icon>
                    Go to Login Page
                  </v-btn>
                </v-col>
              </v-row>
            </v-card>
          </div>

          <!-- Registration Testing -->
          <div class="mb-6">
            <v-card
              class="pa-4"
              variant="outlined"
            >
              <v-card-title class="text-h6 mb-4">
                Registration Testing
              </v-card-title>

              <v-btn
                block
                color="success"
                @click="goToSignup"
              >
                <v-icon class="mr-2">
                  mdi-account-plus
                </v-icon>
                Go to Registration Page
              </v-btn>
            </v-card>
          </div>

          <!-- Auth Helpers Testing -->
          <div class="mb-6">
            <v-card
              class="pa-4"
              variant="outlined"
            >
              <v-card-title class="text-h6 mb-4">
                Auth Helpers Testing
              </v-card-title>

              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <div class="text-body-2 mb-2">
                    <strong>Role Display Names:</strong>
                  </div>
                  <v-chip
                    class="mr-2 mb-2"
                    color="primary"
                    size="small"
                  >
                    Owner: {{ getRoleDisplayName('owner') }}
                  </v-chip>
                  <v-chip
                    class="mr-2 mb-2"
                    color="secondary"
                    size="small"
                  >
                    Admin: {{ getRoleDisplayName('admin') }}
                  </v-chip>
                  <v-chip
                    class="mr-2 mb-2"
                    color="warning"
                    size="small"
                  >
                    Cleaner: {{ getRoleDisplayName('cleaner') }}
                  </v-chip>
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <div class="text-body-2 mb-2">
                    <strong>Default Routes:</strong>
                  </div>
                  <div class="text-caption">
                    Owner: {{ getDefaultRouteForRole('owner') }}<br>
                    Admin: {{ getDefaultRouteForRole('admin') }}<br>
                    Cleaner: {{ getDefaultRouteForRole('cleaner') }}
                  </div>
                </v-col>
              </v-row>
            </v-card>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import {
    getDefaultRouteForRole,
    getRoleDisplayName,
  } from '@/utils/authHelpers'

  // Router and stores
  const router = useRouter()
  const authStore = useAuthStore()

  // Local state
  const successMessage = ref('')

  // Authentication actions
  async function loginAsOwner () {
    try {
      const success = await authStore.login('owner@example.com', 'password')
      if (success) {
        successMessage.value = 'Successfully logged in as Owner'
      }
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  async function loginAsAdmin () {
    try {
      const success = await authStore.login('admin@example.com', 'password')
      if (success) {
        successMessage.value = 'Successfully logged in as Admin'
      }
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  async function loginAsCleaner () {
    try {
      const success = await authStore.login('cleaner@example.com', 'password')
      if (success) {
        successMessage.value = 'Successfully logged in as Cleaner'
      }
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  async function handleLogout () {
    try {
      const success = await authStore.logout()
      if (success) {
        successMessage.value = 'Successfully logged out'
      }
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Navigation actions
  function navigateToHome () {
    const role = authStore.user?.role
    if (role) {
      const defaultRoute = getDefaultRouteForRole(role)
      router.push(defaultRoute)
    } else {
      router.push('/')
    }
  }

  function goToLogin () {
    router.push('/auth/login')
  }

  function goToSignup () {
    router.push('/auth/register')
  }

  // Clear any existing errors when component mounts
  authStore.clearError()
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-btn {
  text-transform: none;
}

.v-alert {
  transition: all 0.3s ease;
}
</style>
