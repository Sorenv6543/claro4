<template>
  <v-container class="pa-4">
    <v-row>
      <v-col cols="12">
        <v-card
          class="pa-4"
          elevation="4"
        >
          <v-card-title class="text-h4 text-center mb-4">
            <v-icon
              class="mr-2"
              color="primary"
            >
              mdi-account-switch
            </v-icon>
            Role-Based Routing Demo
          </v-card-title>

          <v-card-text>
            <v-alert
              class="mb-4"
              type="info"
              variant="tonal"
            >
              <strong>TASK-039R Implementation Demo</strong><br>
              This page demonstrates the role-based routing system implemented in pages/index.vue.
              The main application now dynamically renders different components based on user role.
            </v-alert>

            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-card
                  class="pa-3"
                  variant="outlined"
                >
                  <v-card-title class="text-h6">
                    <v-icon
                      class="mr-2"
                      color="success"
                    >
                      mdi-check-circle
                    </v-icon>
                    Current Implementation
                  </v-card-title>
                  <v-card-text>
                    <ul class="text-body-2">
                      <li>✅ Dynamic component rendering based on user role</li>
                      <li>✅ Loading state during authentication check</li>
                      <li>✅ AuthPrompt for unauthenticated users</li>
                      <li>✅ HomeAdmin.vue for admin users</li>
                      <li>✅ HomeOwner.vue for property owner users</li>
                      <li>✅ Role-specific computed properties in auth store</li>
                      <li>✅ Smooth transitions between components</li>
                      <li>✅ Mock login buttons for testing</li>
                    </ul>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-card
                  class="pa-3"
                  variant="outlined"
                >
                  <v-card-title class="text-h6">
                    <v-icon
                      class="mr-2"
                      color="primary"
                    >
                      mdi-information
                    </v-icon>
                    Current User State
                  </v-card-title>
                  <v-card-text>
                    <v-chip
                      class="mb-2"
                      :color="authStore.isAuthenticated ? 'success' : 'error'"
                    >
                      <v-icon start>
                        {{ authStore.isAuthenticated ? 'mdi-check' : 'mdi-close' }}
                      </v-icon>
                      {{ authStore.isAuthenticated ? 'Authenticated' : 'Not Authenticated' }}
                    </v-chip>

                    <div
                      v-if="authStore.user"
                      class="mt-2"
                    >
                      <p><strong>Name:</strong> {{ authStore.user.name }}</p>
                      <p><strong>Email:</strong> {{ authStore.user.email }}</p>
                      <p>
                        <strong>Role:</strong>
                        <v-chip
                          :color="getRoleColor(authStore.user.role)"
                          size="small"
                        >
                          {{ authStore.user.role }}
                        </v-chip>
                      </p>
                    </div>

                    <div
                      v-else
                      class="mt-2"
                    >
                      <p class="text-medium-emphasis">
                        No user logged in
                      </p>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-row class="mt-4">
              <v-col cols="12">
                <v-card
                  class="pa-3"
                  variant="outlined"
                >
                  <v-card-title class="text-h6">
                    <v-icon
                      class="mr-2"
                      color="warning"
                    >
                      mdi-test-tube
                    </v-icon>
                    Test Role Switching
                  </v-card-title>
                  <v-card-text>
                    <p class="text-body-2 mb-3">
                      Use these buttons to test different user roles. The main application (/) will
                      automatically render the appropriate interface for each role.
                    </p>

                    <v-row>
                      <v-col
                        cols="12"
                        sm="4"
                      >
                        <v-btn
                          block
                          color="error"
                          :loading="authStore.loading"
                          variant="outlined"
                          @click="logout"
                        >
                          <v-icon class="mr-2">
                            mdi-logout
                          </v-icon>
                          Logout (Test Auth Prompt)
                        </v-btn>
                      </v-col>

                      <v-col
                        cols="12"
                        sm="4"
                      >
                        <v-btn
                          block
                          color="primary"
                          :loading="authStore.loading"
                          variant="elevated"
                          @click="loginAsAdmin"
                        >
                          <v-icon class="mr-2">
                            mdi-account-tie
                          </v-icon>
                          Login as Admin
                        </v-btn>
                      </v-col>

                      <v-col
                        cols="12"
                        sm="4"
                      >
                        <v-btn
                          block
                          color="secondary"
                          :loading="authStore.loading"
                          variant="elevated"
                          @click="loginAsOwner"
                        >
                          <v-icon class="mr-2">
                            mdi-home-account
                          </v-icon>
                          Login as Owner
                        </v-btn>
                      </v-col>
                    </v-row>

                    <v-alert
                      class="mt-3"
                      type="success"
                      variant="tonal"
                    >
                      <strong>After switching roles:</strong> Navigate to the home page (/) to see the role-specific interface.
                    </v-alert>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-row class="mt-4">
              <v-col cols="12">
                <v-card
                  class="pa-3"
                  variant="outlined"
                >
                  <v-card-title class="text-h6">
                    <v-icon
                      class="mr-2"
                      color="info"
                    >
                      mdi-code-tags
                    </v-icon>
                    Implementation Details
                  </v-card-title>
                  <v-card-text>
                    <v-expansion-panels>
                      <v-expansion-panel>
                        <v-expansion-panel-title>
                          <v-icon class="mr-2">
                            mdi-file-code
                          </v-icon>
                          Code Structure
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <pre class="text-caption"><code>// pages/index.vue
const homeComponent = computed(() => {
  if (!authStore.isAuthenticated) return AuthPrompt;
  if (authStore.isAdmin) return HomeAdmin;
  if (authStore.isOwner) return HomeOwner;
  return AuthPrompt; // fallback
});

// stores/auth.ts
const isOwner = computed(() => user.value?.role === 'owner');
const isAdmin = computed(() => user.value?.role === 'admin');</code></pre>
                        </v-expansion-panel-text>
                      </v-expansion-panel>

                      <v-expansion-panel>
                        <v-expansion-panel-title>
                          <v-icon class="mr-2">
                            mdi-security
                          </v-icon>
                          Security Notes
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <v-alert
                            class="mb-2"
                            type="warning"
                            variant="tonal"
                          >
                            <strong>Frontend Filtering Only:</strong> This implementation provides role-based UI filtering for user experience only, not security.
                          </v-alert>
                          <p class="text-body-2">
                            Real security will be implemented in Phase 2 with backend Row Level Security (RLS) policies.
                            Users could potentially access other roles' data through browser dev tools.
                          </p>
                        </v-expansion-panel-text>
                      </v-expansion-panel>

                      <v-expansion-panel>
                        <v-expansion-panel-title>
                          <v-icon class="mr-2">
                            mdi-architecture
                          </v-icon>
                          Architecture Pattern
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <p class="text-body-2">
                            This follows the multi-tenant role-based architecture pattern:
                          </p>
                          <ul class="text-body-2">
                            <li><strong>Property Owners:</strong> See only their data through HomeOwner.vue</li>
                            <li><strong>Business Admin:</strong> See all data through HomeAdmin.vue</li>
                            <li><strong>Data Scoping:</strong> Implemented at composable level</li>
                            <li><strong>Component Separation:</strong> owner/, admin/, shared/ folder structure</li>
                          </ul>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-row class="mt-4">
              <v-col
                class="text-center"
                cols="12"
              >
                <v-btn
                  color="primary"
                  prepend-icon="mdi-home"
                  size="large"
                  to="/"
                >
                  Go to Main Application
                </v-btn>

                <v-btn
                  class="ml-2"
                  color="secondary"
                  prepend-icon="mdi-arrow-left"
                  size="large"
                  to="/demos"
                  variant="outlined"
                >
                  Back to Demos
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()

  function getRoleColor (role: string) {
    switch (role) {
      case 'admin': { return 'primary'
      }
      case 'owner': { return 'secondary'
      }
      case 'cleaner': { return 'success'
      }
      default: { return 'grey'
      }
    }
  }

  async function logout () {
    await authStore.logout()
  }

  async function loginAsAdmin () {
    await authStore.login('admin@example.com', 'password')
    if (authStore.user) {
      authStore.user.role = 'admin'
      authStore.user.name = 'Business Admin'
    }
  }

  async function loginAsOwner () {
    await authStore.login('owner@example.com', 'password')
    if (authStore.user) {
      authStore.user.role = 'owner'
      authStore.user.name = 'Property Owner'
    }
  }
</script>

<style scoped>
pre {
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

code {
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
}
</style>
