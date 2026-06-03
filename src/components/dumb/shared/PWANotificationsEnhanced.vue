<template>
  <div class="pwa-notifications-enhanced">
    <!-- Offline Status Banner -->
    <v-banner
      v-if="!isOnline"
      color="warning"
      icon="mdi-wifi-off"
      lines="two"
      sticky
    >
      <v-banner-text>
        <div class="text-subtitle-1 font-weight-medium mb-1">
          You're Offline
        </div>

        <div class="text-body-2">
          {{ offlineMessage }}
        </div>
      </v-banner-text>

      <template #actions>
        <v-btn
          size="small"
          variant="text"
          @click="checkConnection"
        >
          Retry
        </v-btn>
      </template>
    </v-banner>

    <!-- Background Sync Status -->
    <v-banner
      v-if="hasPendingSync && isOnline"
      color="info"
      icon="mdi-sync"
      lines="two"
      sticky
    >
      <v-banner-text>
        <div class="text-subtitle-1 font-weight-medium mb-1">
          Syncing {{ syncStatus.total }} Operations
        </div>

        <div class="text-body-2">
          {{ syncStatusMessage }}
        </div>
      </v-banner-text>

      <template #actions>
        <v-btn
          :loading="isProcessingSync"
          size="small"
          variant="text"
          @click="retrySync"
        >
          Retry
        </v-btn>
      </template>
    </v-banner>

    <!-- Push Notifications Permission -->
    <v-banner
      v-if="showNotificationPrompt"
      color="primary"
      icon="mdi-bell"
      lines="two"
      sticky
    >
      <v-banner-text>
        <div class="text-subtitle-1 font-weight-medium mb-1">
          Enable Notifications
        </div>

        <div class="text-body-2">
          {{ notificationPromptMessage }}
        </div>
      </v-banner-text>

      <template #actions>
        <v-btn
          size="small"
          variant="text"
          @click="dismissNotificationPrompt"
        >
          Not Now
        </v-btn>

        <v-btn
          color="white"
          :loading="requestingPermission"
          size="small"
          variant="elevated"
          @click="requestNotifications"
        >
          Enable
        </v-btn>
      </template>
    </v-banner>

    <!-- PWA Install Prompt -->
    <v-banner
      v-if="canInstall && !hideInstallPrompt"
      color="success"
      icon="mdi-download"
      lines="two"
      sticky
    >
      <v-banner-text>
        <div class="text-subtitle-1 font-weight-medium mb-1">
          Install {{ appName }} App
        </div>

        <div class="text-body-2">
          {{ installPromptMessage }}
        </div>
      </v-banner-text>

      <template #actions>
        <v-btn
          size="small"
          variant="text"
          @click="dismissInstallPrompt"
        >
          Not Now
        </v-btn>

        <v-btn
          color="white"
          :loading="installing"
          size="small"
          variant="elevated"
          @click="handleInstall"
        >
          Install
        </v-btn>
      </template>
    </v-banner>

    <!-- PWA Update Available -->
    <v-banner
      v-if="showUpdatePrompt"
      color="secondary"
      icon="mdi-update"
      lines="two"
      sticky
    >
      <v-banner-text>
        <div class="text-subtitle-1 font-weight-medium mb-1">
          App Update Available
        </div>

        <div class="text-body-2">
          A new version is ready with improvements and bug fixes.
        </div>
      </v-banner-text>

      <template #actions>
        <v-btn
          size="small"
          variant="text"
          @click="$emit('dismiss-update')"
        >
          Later
        </v-btn>

        <v-btn
          color="white"
          :loading="updating"
          size="small"
          variant="elevated"
          @click="handleUpdate"
        >
          Update Now
        </v-btn>
      </template>
    </v-banner>

    <!-- Success Notifications -->
    <v-snackbar
      v-model="showOfflineReadySnackbar"
      color="success"
      location="bottom"
      timeout="4000"
    >
      App is ready to work offline!
      <template #actions>
        <v-btn
          variant="text"
          @click="showOfflineReadySnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <v-snackbar
      v-model="showInstallSuccess"
      color="success"
      location="bottom"
      timeout="4000"
    >
      {{ appName }} installed successfully!
      <template #actions>
        <v-btn
          variant="text"
          @click="showInstallSuccess = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <v-snackbar
      v-model="showNotificationSuccess"
      color="success"
      location="bottom"
      timeout="4000"
    >
      Notifications enabled! You'll receive alerts for urgent turns.
      <template #actions>
        <v-btn
          variant="text"
          @click="showNotificationSuccess = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <v-snackbar
      v-model="showSyncSuccess"
      color="success"
      location="bottom"
      timeout="3000"
    >
      All changes synced successfully!
      <template #actions>
        <v-btn
          variant="text"
          @click="showSyncSuccess = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useAuth } from '@/composables/shared/useAuth'
  import { usePWA } from '@/composables/shared/usePWA'

  // Emits
  interface Emits {
    (e: 'dismiss-update'): void
  }

  defineEmits<Emits>()

  // Composables
  const {
    isOnline,
    canInstall,
    showUpdatePrompt,
    showOfflineReady,
    installPWA,
    updatePWA,
    pushNotifications,
  } = usePWA()

  const { user } = useAuth()

  // Local state
  const hideInstallPrompt = ref(false)
  const hideNotificationPrompt = ref(false)
  const installing = ref(false)
  const updating = ref(false)
  const requestingPermission = ref(false)
  const showOfflineReadySnackbar = ref(false)
  const showInstallSuccess = ref(false)
  const showNotificationSuccess = ref(false)
  const showSyncSuccess = ref(false)

  // Computed properties
  const appName = computed(() => {
    if (user.value?.role === 'owner') return 'CleanSync'
    if (user.value?.role === 'admin') return 'CleanSync Pro'
    return 'CleanSync'
  })

  const showNotificationPrompt = computed(() => {
    return pushNotifications?.canRequestPermission?.value
      && !hideNotificationPrompt.value
      && !pushNotifications?.hasPermission?.value
  })

  const notificationPromptMessage = computed(() => {
    if (user.value?.role === 'owner') {
      return 'Get instant alerts for urgent turn cleanings and booking confirmations.'
    }
    return 'Receive system alerts for urgent turns and business-critical notifications.'
  })

  const installPromptMessage = computed(() => {
    if (user.value?.role === 'owner') {
      return 'Get faster access and work offline for property management.'
    }
    return 'Enhanced mobile oversight with offline capabilities for business management.'
  })

  const offlineMessage = computed(() => {
    return 'Some features may be limited until connection returns.'
  })

  const hasPendingSync = computed(() => false)

  const isProcessingSync = computed(() => false)

  const syncStatus = computed(() => ({ operations: {} as Record<string, number>, total: 0 }))

  const syncStatusMessage = computed(() => {
    const status = syncStatus.value
    if (!status || !status.operations) {
      return 'Syncing changes...'
    }

    const operations = Object.entries(status.operations)
      .map(([op, count]) => `${count} ${op.replace('_', ' ')}`)
      .join(', ')

    return operations || 'Syncing changes...'
  })

  // Methods
  function checkConnection () {
    window.dispatchEvent(new Event('online'))
  }

  function dismissInstallPrompt () {
    hideInstallPrompt.value = true
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  function dismissNotificationPrompt () {
    hideNotificationPrompt.value = true
    localStorage.setItem('pwa-notification-dismissed', Date.now().toString())
  }

  async function handleInstall () {
    installing.value = true
    try {
      const success = await installPWA()
      if (success) {
        showInstallSuccess.value = true
      }
    } catch (error) {
      console.error('Installation failed:', error)
    } finally {
      installing.value = false
    }
  }

  async function handleUpdate () {
    updating.value = true
    try {
      await updatePWA()
    } catch (error) {
      console.error('Update failed:', error)
    } finally {
      updating.value = false
    }
  }

  async function requestNotifications () {
    requestingPermission.value = true
    try {
      const granted = await pushNotifications?.requestPermission?.()
      if (granted) {
        showNotificationSuccess.value = true
        hideNotificationPrompt.value = true
      }
    } catch (error) {
      console.error('Notification permission failed:', error)
    } finally {
      requestingPermission.value = false
    }
  }

  async function retrySync () {
    // Background sync has been removed; this is a no-op stub
  }

  // Watchers
  watch(showOfflineReady, newValue => {
    if (newValue) {
      showOfflineReadySnackbar.value = true
    }
  })

  // Background sync watcher removed (offline queue dropped)

  // Check dismissal preferences
  function checkDismissalPreferences () {
    const installDismissed = localStorage.getItem('pwa-install-dismissed')
    const notificationDismissed = localStorage.getItem('pwa-notification-dismissed')

    if (installDismissed) {
      const dismissedTime = Number.parseInt(installDismissed)
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      if (dismissedTime > oneWeekAgo) {
        hideInstallPrompt.value = true
      }
    }

    if (notificationDismissed) {
      const dismissedTime = Number.parseInt(notificationDismissed)
      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000)
      if (dismissedTime > threeDaysAgo) {
        hideNotificationPrompt.value = true
      }
    }
  }

  // Initialize
  onMounted(() => {
    checkDismissalPreferences()
  })
</script>
