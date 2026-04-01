<template>
  <div class="profile-page">
    <v-container fluid>
      <!-- Loading State -->
      <div v-if="!user" class="d-flex justify-center align-center" style="min-height: 400px">
        <v-progress-circular color="primary" indeterminate size="48" />
      </div>

      <template v-else>
        <!-- Profile Header Card -->
        <v-card class="mb-5 pa-5" rounded="lg" :style="{ border: 'thin solid rgba(var(--v-theme-on-surface), 0.08)' }" variant="flat">
          <div class="d-flex align-center ga-4 flex-wrap">
            <v-avatar color="primary" size="80">
              <v-icon color="white" size="40">mdi-account</v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <h1 class="text-h5 font-weight-bold">{{ user.name || 'User' }}</h1>
              <p class="text-body-2 text-medium-emphasis mt-1">{{ user.email }}</p>
              <div class="d-flex align-center ga-2 mt-2">
                <v-chip color="primary" size="small" variant="tonal">
                  <v-icon size="14" start>mdi-shield-account</v-icon>
                  {{ user.role }}
                </v-chip>
                <v-chip v-if="user.created_at" color="grey" size="small" variant="tonal">
                  <v-icon size="14" start>mdi-calendar</v-icon>
                  Member since {{ formatDate(user.created_at) }}
                </v-chip>
              </div>
            </div>
            <v-btn
              color="primary"
              prepend-icon="mdi-pencil-outline"
              variant="outlined"
              @click="handleEditProfile"
            >
              Edit Profile
            </v-btn>
          </div>
        </v-card>

        <v-row>
          <!-- Info Card -->
          <v-col cols="12" md="8">
            <v-card class="mb-5 pa-5" rounded="lg" :style="{ border: 'thin solid rgba(var(--v-theme-on-surface), 0.08)' }" variant="flat">
              <h3 class="text-h6 font-weight-medium mb-4">Personal Information</h3>
              <v-row density="comfortable">
                <v-col cols="12" sm="6">
                  <div class="info-row">
                    <div class="text-caption text-medium-emphasis">Full Name</div>
                    <div class="text-body-1 font-weight-medium mt-1">{{ user.name || 'Not specified' }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="info-row">
                    <div class="text-caption text-medium-emphasis">Email</div>
                    <div class="text-body-1 font-weight-medium mt-1">{{ user.email }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="info-row">
                    <div class="text-caption text-medium-emphasis">Role</div>
                    <div class="text-body-1 font-weight-medium mt-1 text-capitalize">{{ user.role }}</div>
                  </div>
                </v-col>
                <v-col v-if="user.company_name" cols="12" sm="6">
                  <div class="info-row">
                    <div class="text-caption text-medium-emphasis">Company</div>
                    <div class="text-body-1 font-weight-medium mt-1">{{ user.company_name }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="info-row">
                    <div class="text-caption text-medium-emphasis">Timezone</div>
                    <div class="text-body-1 font-weight-medium mt-1">{{ user.timezone || 'Not specified' }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="info-row">
                    <div class="text-caption text-medium-emphasis">Language</div>
                    <div class="text-body-1 font-weight-medium mt-1">{{ user.language || 'English' }}</div>
                  </div>
                </v-col>
              </v-row>
            </v-card>

            <!-- Account Settings Card -->
            <v-card class="pa-5" rounded="lg" :style="{ border: 'thin solid rgba(var(--v-theme-on-surface), 0.08)' }" variant="flat">
              <h3 class="text-h6 font-weight-medium mb-4">Account Settings</h3>
              <v-row density="comfortable">
                <v-col cols="12" sm="6">
                  <div class="info-row">
                    <div class="text-caption text-medium-emphasis">Theme</div>
                    <div class="text-body-1 font-weight-medium mt-1 text-capitalize">{{ user.theme || 'System' }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="info-row">
                    <div class="text-caption text-medium-emphasis">Notifications</div>
                    <div class="text-body-1 font-weight-medium mt-1">{{ user.notifications_enabled ? 'Enabled' : 'Disabled' }}</div>
                  </div>
                </v-col>
              </v-row>
            </v-card>
          </v-col>

          <!-- Stats Card -->
          <v-col cols="12" md="4">
            <v-card class="pa-5" rounded="lg" :style="{ border: 'thin solid rgba(var(--v-theme-on-surface), 0.08)' }" variant="flat">
              <h3 class="text-h6 font-weight-medium mb-4">Account Stats</h3>

              <div class="stat-item d-flex align-center ga-3 mb-4">
                <div class="stat-item__icon stat-item__icon--primary">
                  <v-icon color="primary" size="20">mdi-calendar-check</v-icon>
                </div>
                <div>
                  <div class="text-caption text-medium-emphasis">Member Since</div>
                  <div class="text-body-1 font-weight-medium">{{ user.created_at ? formatDate(user.created_at) : 'N/A' }}</div>
                </div>
              </div>

              <div class="stat-item d-flex align-center ga-3 mb-4">
                <div class="stat-item__icon stat-item__icon--info">
                  <v-icon color="info" size="20">mdi-login</v-icon>
                </div>
                <div>
                  <div class="text-caption text-medium-emphasis">Last Sign In</div>
                  <div class="text-body-1 font-weight-medium">{{ user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'N/A' }}</div>
                </div>
              </div>

              <div class="stat-item d-flex align-center ga-3">
                <div class="stat-item__icon stat-item__icon--success">
                  <v-icon color="success" size="20">mdi-email-check</v-icon>
                </div>
                <div>
                  <div class="text-caption text-medium-emphasis">Email Status</div>
                  <div class="text-body-1 font-weight-medium">Verified</div>
                </div>
              </div>
            </v-card>

            <!-- Actions Card -->
            <v-card class="pa-5 mt-5" rounded="lg" :style="{ border: 'thin solid rgba(var(--v-theme-on-surface), 0.08)' }" variant="flat">
              <h3 class="text-h6 font-weight-medium mb-4">Quick Actions</h3>
              <div class="d-flex flex-column ga-2">
                <v-btn
                  block
                  color="primary"
                  prepend-icon="mdi-pencil-outline"
                  variant="tonal"
                  @click="handleEditProfile"
                >
                  Edit Profile
                </v-btn>
                <v-btn
                  block
                  color="secondary"
                  prepend-icon="mdi-key-outline"
                  variant="tonal"
                  @click="handleChangePassword"
                >
                  Change Password
                </v-btn>
                <v-btn
                  block
                  color="info"
                  prepend-icon="mdi-cog-outline"
                  variant="tonal"
                  @click="handleSettings"
                >
                  Settings
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </v-container>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  defineOptions({
    name: 'OwnerProfileComponent',
  })

  const router = useRouter()
  const authStore = useAuthStore()

  const user = computed(() => authStore.user)

  function handleEditProfile () {
    console.log('Edit profile clicked')
  }

  function handleChangePassword () {
    console.log('Change password clicked')
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
</script>

<style scoped>
.profile-page {
  padding: 1rem;
  min-height: calc(100vh - var(--app-bar-height, 64px));
}

/* Info rows */
.info-row {
  padding: 12px 0;
  border-bottom: thin solid rgba(var(--v-theme-on-surface), 0.06);
}

.info-row:last-child {
  border-bottom: none;
}

/* Stat items */
.stat-item__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-item__icon--primary {
  background: rgba(var(--v-theme-primary), 0.12);
}

.stat-item__icon--info {
  background: rgba(var(--v-theme-info), 0.12);
}

.stat-item__icon--success {
  background: rgba(var(--v-theme-success), 0.12);
}
</style>
