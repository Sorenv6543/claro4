<!-- src/components/smart/owner/OwnerSettings.vue -->
<template>
  <v-container class="pa-4 pa-md-6" fluid>
    <!-- Loading State -->
    <v-fade-transition mode="out-in">
      <div v-if="!user" key="loading" class="d-flex justify-center align-center" style="min-height: 400px">
        <v-progress-circular color="primary" indeterminate size="48" />
      </div>

      <div v-else key="content">
        <!-- Tabs -->
        <v-tabs v-model="activeTab" class="mb-6" color="primary">
          <v-tab value="account">
            <v-icon size="18" start>mdi-account-outline</v-icon>
            Account
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

        <v-tabs-window v-model="activeTab">
          <!-- ===== Account Tab ===== -->
          <v-tabs-window-item value="account">
            <v-card class="mb-6">
              <v-card-text>
                <!-- Avatar Section -->
                <div class="d-flex align-center ga-4 mb-6">
                  <v-avatar color="primary" size="80">
                    <v-icon color="white" size="40">mdi-account</v-icon>
                  </v-avatar>

                  <div>
                    <div class="d-flex ga-3 mb-2">
                      <v-btn color="primary" prepend-icon="mdi-cloud-upload-outline" size="small" @click="showNotification('Photo upload is not yet available', 'info')">
                        Upload New Photo
                      </v-btn>

                      <v-btn color="error" size="small" variant="outlined" @click="showNotification('Photo reset is not yet available', 'info')">
                        Reset
                      </v-btn>
                    </div>

                    <div class="text-caption text-medium-emphasis">
                      Allowed JPG, GIF or PNG. Max size of 800K
                    </div>
                  </div>
                </div>

                <v-divider class="mb-6" />

                <!-- Account Form -->
                <v-form ref="accountFormRef" v-model="accountFormValid" @submit.prevent="saveAccountSettings">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.name"
                        label="Full Name"
                        :rules="[rules.required]"
                      />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.email"
                        disabled
                        hint="Email cannot be changed"
                        label="E-mail"
                        persistent-hint
                      />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.company_name"
                        label="Company / Organization"
                      />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-select
                        v-model="form.language"
                        :items="languageOptions"
                        label="Language"
                      />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-select
                        v-model="form.timezone"
                        :items="timezoneOptions"
                        label="Timezone"
                      />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-select
                        v-model="form.theme"
                        :items="themeOptions"
                        label="Theme"
                      />
                    </v-col>
                  </v-row>

                  <div class="d-flex ga-3 mt-2">
                    <v-btn
                      color="primary"
                      :disabled="!accountFormValid"
                      :loading="saving"
                      type="submit"
                    >
                      Save Changes
                    </v-btn>

                    <v-btn variant="outlined" @click="resetAccountForm">
                      Reset
                    </v-btn>
                  </div>
                </v-form>
              </v-card-text>
            </v-card>

            <!-- Deactivate Account -->
            <v-card>
              <v-card-text>
                <h6 class="text-h6 text-error mb-4">Deactivate Account</h6>

                <v-alert class="mb-4" color="warning" icon="mdi-alert-circle-outline">
                  Once you deactivate your account, there is no going back. Please be certain.
                </v-alert>

                <v-btn
                  color="error"
                  @click="showDeactivateDialog = true"
                >
                  Deactivate Account
                </v-btn>

                <ConfirmationDialog
                  confirm-color="error"
                  confirm-text="Deactivate"
                  dangerous
                  message="This action is irreversible. All your data, properties, and bookings will be permanently removed. Are you sure?"
                  :open="showDeactivateDialog"
                  title="Deactivate Account"
                  @cancel="showDeactivateDialog = false"
                  @close="showDeactivateDialog = false"
                  @confirm="handleDeactivate"
                />
              </v-card-text>
            </v-card>
          </v-tabs-window-item>

          <!-- ===== Security Tab ===== -->
          <v-tabs-window-item value="security">
            <v-card>
              <v-card-text>
                <h6 class="text-h6 mb-4">Change Password</h6>

                <v-alert class="mb-4" density="compact" type="warning" variant="tonal">
                  Password change is not yet available. This will be enabled in a future update.
                </v-alert>

                <v-form ref="passwordFormRef" v-model="passwordFormValid" @submit.prevent="savePassword">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="passwordForm.newPassword"
                        disabled
                        label="New Password"
                        type="password"
                      />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="passwordForm.confirm"
                        disabled
                        label="Confirm New Password"
                        type="password"
                      />
                    </v-col>
                  </v-row>

                  <h6 class="text-body-2 font-weight-medium mt-2 mb-2">Password Requirements:</h6>

                  <ul class="text-caption text-medium-emphasis ps-4 mb-4">
                    <li>Minimum 8 characters</li>
                    <li>At least one uppercase letter</li>
                    <li>At least one number</li>
                  </ul>

                  <div class="d-flex ga-3">
                    <v-btn
                      color="primary"
                      disabled
                      type="submit"
                    >
                      Change Password
                    </v-btn>

                    <v-btn disabled variant="outlined">
                      Reset
                    </v-btn>
                  </div>
                </v-form>
              </v-card-text>
            </v-card>

            <!-- Recent Sessions -->
            <v-card class="mt-6">
              <v-card-text>
                <h6 class="text-h6 mb-4">Recent Sessions</h6>

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
            </v-card>
          </v-tabs-window-item>

          <!-- ===== Notifications Tab ===== -->
          <v-tabs-window-item value="notifications">
            <v-card>
              <v-card-text>
                <h6 class="text-h6 mb-4">Notification Preferences</h6>

                <div class="d-flex align-center justify-space-between mb-4 pa-4 rounded-lg bg-surface-variant">
                  <div>
                    <div class="text-body-1 font-weight-medium">Push Notifications</div>

                    <div class="text-body-2 text-medium-emphasis">
                      Receive push notifications for booking updates and cleaning status changes
                    </div>
                  </div>

                  <v-switch
                    v-model="notificationsForm.notifications_enabled"
                    aria-label="Push Notifications"
                    color="primary"
                    hide-details
                    inset
                    @update:model-value="saveNotificationSettings"
                  />
                </div>

                <v-divider class="my-4" />

                <h6 class="text-overline text-medium-emphasis mb-3">Email Notifications</h6>

                <v-alert class="mb-4" density="compact" type="info" variant="tonal">
                  Email notification preferences coming soon.
                </v-alert>

                <div class="d-flex align-center justify-space-between mb-3">
                  <div>
                    <div class="text-body-2 font-weight-medium text-medium-emphasis">Booking Confirmations</div>
                    <div class="text-caption text-medium-emphasis">Get notified when bookings are confirmed</div>
                  </div>

                  <v-switch
                    v-model="notificationsForm.emailBookings"
                    aria-label="Booking Confirmations"
                    color="primary"
                    disabled
                    hide-details
                    inset
                  />
                </div>

                <div class="d-flex align-center justify-space-between mb-3">
                  <div>
                    <div class="text-body-2 font-weight-medium text-medium-emphasis">Cleaning Updates</div>

                    <div class="text-caption text-medium-emphasis">
                      Receive updates when cleaning tasks are completed
                    </div>
                  </div>

                  <v-switch
                    v-model="notificationsForm.emailCleaning"
                    aria-label="Cleaning Updates"
                    color="primary"
                    disabled
                    hide-details
                    inset
                  />
                </div>

                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-body-2 font-weight-medium text-medium-emphasis">Weekly Summary</div>

                    <div class="text-caption text-medium-emphasis">
                      Get a weekly summary of your properties and bookings
                    </div>
                  </div>

                  <v-switch
                    v-model="notificationsForm.emailWeekly"
                    aria-label="Weekly Summary"
                    color="primary"
                    disabled
                    hide-details
                    inset
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>
        </v-tabs-window>
      </div>
    </v-fade-transition>

    <!-- Feedback snackbar -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      location="bottom end"
      :timeout="4000"
    >
      {{ snackbarMessage }}
      <template #actions>
        <v-btn icon="mdi-close" size="small" variant="text" @click="showSnackbar = false" />
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
  import type { VForm } from 'vuetify/components'
  import { computed, reactive, ref, watch } from 'vue'
  import { useTheme } from 'vuetify'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import { useAuthStore } from '@/stores/auth'

  defineOptions({ name: 'OwnerSettings' })

  const authStore = useAuthStore()
  const user = computed(() => authStore.user)
  const vuetifyTheme = useTheme()

  function applyTheme (preference: 'light' | 'dark' | 'system'): void {
    const resolved = preference === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preference
    vuetifyTheme.global.name.value = resolved
  }

  // --- Tab state ---
  const activeTab = ref('account')

  // --- Account form ---
  const accountFormRef = ref<VForm | null>(null)
  const accountFormValid = ref(false)
  const saving = ref(false)
  const showDeactivateDialog = ref(false)

  const form = reactive({
    name: '',
    email: '',
    company_name: '',
    language: '',
    timezone: '',
    theme: 'system' as 'light' | 'dark' | 'system',
  })

  function populateAccountForm () {
    if (!user.value) return
    form.name = user.value.name || ''
    form.email = user.value.email || ''
    form.company_name = user.value.company_name || ''
    form.language = user.value.language || 'en'
    form.timezone = user.value.timezone || 'UTC'
    form.theme = user.value.theme || 'system'
  }

  watch(user, populateAccountForm, { immediate: true })

  function resetAccountForm () {
    populateAccountForm()
    accountFormRef.value?.resetValidation()
  }

  async function saveAccountSettings () {
    const { valid } = await accountFormRef.value!.validate()
    if (!valid) return

    saving.value = true
    try {
      const success = await authStore.updateUserProfile({
        name: form.name,
        company_name: form.company_name,
        language: form.language,
        timezone: form.timezone,
        theme: form.theme,
      })
      if (success) {
        applyTheme(form.theme)
        showNotification('Account settings saved successfully', 'success')
      } else {
        showNotification(authStore.error || 'Failed to save settings', 'error')
      }
    } catch (error) {
      console.error('Failed to save account settings:', error)
      showNotification('Failed to save settings', 'error')
    } finally {
      saving.value = false
    }
  }

  // --- Password form ---
  // Password form is disabled — Supabase auth.updateUser requires session-based
  // re-authentication before password change. Will be implemented when the
  // re-auth flow (signInWithPassword verification) is added.
  const passwordFormValid = ref(false)

  const passwordForm = reactive({
    newPassword: '',
    confirm: '',
  })

  async function savePassword () {
    // Placeholder — password change is disabled
  }

  // --- Notification form ---
  const notificationsForm = reactive({
    notifications_enabled: false,
    emailBookings: true,
    emailCleaning: true,
    emailWeekly: false,
  })

  watch(user, () => {
    if (!user.value) return
    notificationsForm.notifications_enabled = user.value.notifications_enabled
  }, { immediate: true })

  async function saveNotificationSettings () {
    const previousValue = !notificationsForm.notifications_enabled
    try {
      const success = await authStore.updateUserProfile({
        notifications_enabled: notificationsForm.notifications_enabled,
      })
      if (success) {
        showNotification('Notification preferences updated', 'success')
      } else {
        notificationsForm.notifications_enabled = previousValue
        showNotification('Failed to update notification preferences', 'error')
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error)
      notificationsForm.notifications_enabled = previousValue
      showNotification('Failed to update notification preferences', 'error')
    }
  }

  // --- Deactivate ---
  function handleDeactivate () {
    showDeactivateDialog.value = false
    showNotification('Account deactivation is not yet available. Please contact support.', 'info')
  }

  // --- Snackbar ---
  const showSnackbar = ref(false)
  const snackbarMessage = ref('')
  const snackbarColor = ref('success')

  function showNotification (message: string, color: string) {
    snackbarMessage.value = message
    snackbarColor.value = color
    showSnackbar.value = true
  }

  // --- Validation rules ---
  const rules = {
    required: (v: string) => !!v || 'Required',
  }

  // --- Select options ---
  const languageOptions = [
    { title: 'English', value: 'en' },
    { title: 'Spanish', value: 'es' },
    { title: 'French', value: 'fr' },
    { title: 'German', value: 'de' },
    { title: 'Portuguese', value: 'pt' },
  ]

  const timezoneOptions = [
    { title: 'UTC', value: 'UTC' },
    { title: 'US/Eastern', value: 'US/Eastern' },
    { title: 'US/Central', value: 'US/Central' },
    { title: 'US/Mountain', value: 'US/Mountain' },
    { title: 'US/Pacific', value: 'US/Pacific' },
    { title: 'Europe/London', value: 'Europe/London' },
    { title: 'Europe/Paris', value: 'Europe/Paris' },
    { title: 'Europe/Berlin', value: 'Europe/Berlin' },
    { title: 'Asia/Tokyo', value: 'Asia/Tokyo' },
    { title: 'Australia/Sydney', value: 'Australia/Sydney' },
  ]

  const themeOptions = [
    { title: 'Light', value: 'light' },
    { title: 'Dark', value: 'dark' },
    { title: 'System', value: 'system' },
  ]

  // --- Helpers ---
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
