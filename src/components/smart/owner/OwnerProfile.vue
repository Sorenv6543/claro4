<template>
  <div class="profile-page">
    <v-container fluid>
      <!-- Loading State -->
      <div v-if="!user" class="d-flex justify-center align-center" style="min-height: 400px">
        <v-progress-circular color="primary" indeterminate size="48" />
      </div>

      <v-row v-else>
        <!-- Left Column — Profile Card -->
        <v-col cols="12" md="4">
          <v-card class="profile-card text-center">
            <!-- Avatar -->
            <v-card-text class="pt-6 pb-2">
              <v-avatar color="primary" size="100">
                <v-icon color="white" size="50">mdi-account</v-icon>
              </v-avatar>

              <h5 class="text-h5 font-weight-bold mt-4">{{ user.name || 'User' }}</h5>

              <v-chip class="mt-2" color="primary" size="small" variant="tonal">
                <v-icon size="14" start>mdi-shield-account</v-icon>
                {{ user.role }}
              </v-chip>

              <!-- Stats Row -->
              <div class="d-flex justify-center ga-4 mt-5">
                <div class="profile-stat">
                  <v-avatar color="primary" rounded size="38" variant="tonal">
                    <v-icon size="22">mdi-home-group</v-icon>
                  </v-avatar>
                  <div class="mt-1">
                    <span class="text-h6 font-weight-bold">{{ propertyCount }}</span>
                    <div class="text-caption text-medium-emphasis">Properties</div>
                  </div>
                </div>

                <div class="profile-stat">
                  <v-avatar color="success" rounded size="38" variant="tonal">
                    <v-icon size="22">mdi-calendar-check</v-icon>
                  </v-avatar>
                  <div class="mt-1">
                    <span class="text-h6 font-weight-bold">{{ bookingCount }}</span>
                    <div class="text-caption text-medium-emphasis">Bookings</div>
                  </div>
                </div>
              </div>
            </v-card-text>

            <v-divider />

            <!-- Details -->
            <v-card-text class="text-start">
              <h6 class="text-overline text-medium-emphasis mb-3">Details</h6>

              <div class="detail-row">
                <span class="detail-label">
                  <v-icon class="me-2" size="18">mdi-account-outline</v-icon>
                  Username:
                </span>
                <span class="detail-value">{{ user.name || 'Not set' }}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">
                  <v-icon class="me-2" size="18">mdi-email-outline</v-icon>
                  Email:
                </span>
                <span class="detail-value">{{ user.email }}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">
                  <v-icon class="me-2" size="18">mdi-check-circle-outline</v-icon>
                  Status:
                </span>
                <v-chip color="success" size="x-small" variant="tonal">Active</v-chip>
              </div>

              <div class="detail-row">
                <span class="detail-label">
                  <v-icon class="me-2" size="18">mdi-shield-outline</v-icon>
                  Role:
                </span>
                <span class="detail-value text-capitalize">{{ user.role }}</span>
              </div>

              <div v-if="user.company_name" class="detail-row">
                <span class="detail-label">
                  <v-icon class="me-2" size="18">mdi-office-building-outline</v-icon>
                  Company:
                </span>
                <span class="detail-value">{{ user.company_name }}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">
                  <v-icon class="me-2" size="18">mdi-translate</v-icon>
                  Language:
                </span>
                <span class="detail-value">{{ user.language || 'English' }}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">
                  <v-icon class="me-2" size="18">mdi-earth</v-icon>
                  Timezone:
                </span>
                <span class="detail-value">{{ user.timezone || 'Not set' }}</span>
              </div>

              <div v-if="user.created_at" class="detail-row">
                <span class="detail-label">
                  <v-icon class="me-2" size="18">mdi-calendar-blank-outline</v-icon>
                  Member Since:
                </span>
                <span class="detail-value">{{ formatDate(user.created_at) }}</span>
              </div>
            </v-card-text>

            <!-- Action Buttons -->
            <v-card-text class="pt-0 d-flex ga-3 justify-center">
              <v-btn
                color="primary"
                prepend-icon="mdi-pencil-outline"
                @click="handleEditProfile"
              >
                Edit
              </v-btn>
              <v-btn
                color="info"
                prepend-icon="mdi-cog-outline"
                variant="tonal"
                @click="handleSettings"
              >
                Settings
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Right Column — Tabs + Content -->
        <v-col cols="12" md="8">
          <v-card>
            <v-tabs v-model="activeTab" color="primary">
              <v-tab value="overview">
                <v-icon size="18" start>mdi-account-outline</v-icon>
                Overview
              </v-tab>
              <v-tab value="security">
                <v-icon size="18" start>mdi-lock-outline</v-icon>
                Security
              </v-tab>
              <v-tab value="notifications">
                <v-icon size="18" start>mdi-bell-outline</v-icon>
                Notifications
              </v-tab>
            </v-tabs>

            <v-divider />

            <v-tabs-window v-model="activeTab">
              <!-- Overview Tab -->
              <v-tabs-window-item value="overview">
                <v-card-text>
                  <h6 class="text-overline text-medium-emphasis mb-4">Account Activity</h6>

                  <v-timeline align="start" density="compact" side="end">
                    <v-timeline-item
                      v-if="user.last_sign_in_at"
                      color="primary"
                      dot-color="primary"
                      size="x-small"
                    >
                      <div>
                        <div class="text-body-2 font-weight-medium">Last Sign In</div>
                        <div class="text-caption text-medium-emphasis">{{ formatDateTime(user.last_sign_in_at) }}</div>
                      </div>
                    </v-timeline-item>

                    <v-timeline-item
                      color="success"
                      dot-color="success"
                      size="x-small"
                    >
                      <div>
                        <div class="text-body-2 font-weight-medium">Email Verified</div>
                        <div class="text-caption text-medium-emphasis">Account email has been verified</div>
                      </div>
                    </v-timeline-item>

                    <v-timeline-item
                      v-if="user.created_at"
                      color="info"
                      dot-color="info"
                      size="x-small"
                    >
                      <div>
                        <div class="text-body-2 font-weight-medium">Account Created</div>
                        <div class="text-caption text-medium-emphasis">{{ formatDateTime(user.created_at) }}</div>
                      </div>
                    </v-timeline-item>
                  </v-timeline>
                </v-card-text>

                <!-- Property Summary -->
                <v-divider />
                <v-card-text>
                  <h6 class="text-overline text-medium-emphasis mb-4">Property Overview</h6>

                  <v-row>
                    <v-col cols="6" sm="3">
                      <div class="text-center">
                        <div class="text-h5 font-weight-bold text-primary">{{ propertyCount }}</div>
                        <div class="text-caption text-medium-emphasis">Total</div>
                      </div>
                    </v-col>
                    <v-col cols="6" sm="3">
                      <div class="text-center">
                        <div class="text-h5 font-weight-bold text-success">{{ activePropertyCount }}</div>
                        <div class="text-caption text-medium-emphasis">Active</div>
                      </div>
                    </v-col>
                    <v-col cols="6" sm="3">
                      <div class="text-center">
                        <div class="text-h5 font-weight-bold text-info">{{ bookingCount }}</div>
                        <div class="text-caption text-medium-emphasis">Bookings</div>
                      </div>
                    </v-col>
                    <v-col cols="6" sm="3">
                      <div class="text-center">
                        <div class="text-h5 font-weight-bold text-warning">{{ upcomingCount }}</div>
                        <div class="text-caption text-medium-emphasis">Upcoming</div>
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-tabs-window-item>

              <!-- Security Tab -->
              <v-tabs-window-item value="security">
                <v-card-text>
                  <h6 class="text-overline text-medium-emphasis mb-4">Password</h6>

                  <v-alert class="mb-4" color="info" variant="tonal">
                    <v-alert-title class="text-body-2 font-weight-medium">Manage your password</v-alert-title>
                    Update your password to keep your account secure.
                  </v-alert>

                  <v-btn
                    color="primary"
                    prepend-icon="mdi-key-outline"
                    variant="tonal"
                    @click="handleChangePassword"
                  >
                    Change Password
                  </v-btn>
                </v-card-text>

                <v-divider />

                <v-card-text>
                  <h6 class="text-overline text-medium-emphasis mb-4">Recent Sessions</h6>

                  <div class="d-flex align-center ga-3 mb-3">
                    <v-avatar color="success" rounded size="38" variant="tonal">
                      <v-icon size="20">mdi-monitor</v-icon>
                    </v-avatar>
                    <div class="flex-grow-1">
                      <div class="text-body-2 font-weight-medium">Current Session</div>
                      <div class="text-caption text-medium-emphasis">Active now</div>
                    </div>
                    <v-chip color="success" size="x-small" variant="tonal">Active</v-chip>
                  </div>

                  <div v-if="user.last_sign_in_at" class="d-flex align-center ga-3">
                    <v-avatar color="grey" rounded size="38" variant="tonal">
                      <v-icon size="20">mdi-monitor</v-icon>
                    </v-avatar>
                    <div class="flex-grow-1">
                      <div class="text-body-2 font-weight-medium">Previous Session</div>
                      <div class="text-caption text-medium-emphasis">{{ formatDateTime(user.last_sign_in_at) }}</div>
                    </div>
                  </div>
                </v-card-text>
              </v-tabs-window-item>

              <!-- Notifications Tab -->
              <v-tabs-window-item value="notifications">
                <v-card-text>
                  <h6 class="text-overline text-medium-emphasis mb-4">Notification Preferences</h6>

                  <div class="d-flex align-center justify-space-between mb-4">
                    <div>
                      <div class="text-body-2 font-weight-medium">Push Notifications</div>
                      <div class="text-caption text-medium-emphasis">Receive push notifications for booking updates</div>
                    </div>
                    <v-chip
                      :color="user.notifications_enabled ? 'success' : 'grey'"
                      size="small"
                      variant="tonal"
                    >
                      {{ user.notifications_enabled ? 'Enabled' : 'Disabled' }}
                    </v-chip>
                  </div>

                  <v-divider class="mb-4" />

                  <div class="d-flex align-center justify-space-between mb-4">
                    <div>
                      <div class="text-body-2 font-weight-medium">Theme</div>
                      <div class="text-caption text-medium-emphasis">Current display theme preference</div>
                    </div>
                    <v-chip color="secondary" size="small" variant="tonal">
                      {{ user.theme || 'System' }}
                    </v-chip>
                  </div>

                  <v-divider class="mb-4" />

                  <v-btn
                    color="primary"
                    prepend-icon="mdi-cog-outline"
                    variant="tonal"
                    @click="handleSettings"
                  >
                    Manage Preferences
                  </v-btn>
                </v-card-text>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'

  defineOptions({
    name: 'OwnerProfileComponent',
  })

  const router = useRouter()
  const authStore = useAuthStore()
  const { myProperties, myActiveProperties } = useOwnerProperties()
  const { myBookings, myUpcomingCleanings } = useOwnerBookings()

  const user = computed(() => authStore.user)
  const activeTab = ref('overview')

  const propertyCount = computed(() => myProperties.value.length)
  const activePropertyCount = computed(() => myActiveProperties.value.length)
  const bookingCount = computed(() => myBookings.value.length)
  const upcomingCount = computed(() => myUpcomingCleanings.value.length)

  function handleEditProfile () {
    // TODO: Implement profile editing
  }

  function handleChangePassword () {
    // TODO: Implement password change flow
  }

  function handleSettings () {
    router.push('/owner/settings')
  }

  function formatDate (dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  function formatDateTime (dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }
</script>

<style scoped>
.profile-page {
  padding: 1rem;
  min-height: calc(100vh - var(--app-bar-height, 64px));
}

/* Profile card */
.profile-card {
  border-radius: var(--claro-radius-md, 2px) !important;
}

.profile-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Detail rows */
.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.detail-row:not(:last-child) {
  border-bottom: thin solid rgba(var(--v-theme-on-surface), 0.06);
}

.detail-label {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
