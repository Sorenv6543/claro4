<template>
  <v-container class="pwa-demo">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h4 text-center py-4">
            PWA Demo & Testing
          </v-card-title>

          <v-divider />

          <v-card-text>
            <v-row>
              <!-- PWA Status -->
              <v-col
                cols="12"
                md="6"
              >
                <v-card variant="outlined">
                  <v-card-title class="text-h6">
                    <v-icon class="mr-2">
                      mdi-application
                    </v-icon>
                    PWA Status
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>Running as PWA</v-list-item-title>
                        <template #append>
                          <v-chip
                            :color="isPWA ? 'success' : 'default'"
                            size="small"
                          >
                            {{ isPWA ? 'Yes' : 'No' }}
                          </v-chip>
                        </template>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Can Install</v-list-item-title>
                        <template #append>
                          <v-chip
                            :color="canInstall ? 'primary' : 'default'"
                            size="small"
                          >
                            {{ canInstall ? 'Yes' : 'No' }}
                          </v-chip>
                        </template>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Service Worker</v-list-item-title>
                        <template #append>
                          <v-chip
                            :color="isServiceWorkerRegistered ? 'success' : 'warning'"
                            size="small"
                          >
                            {{ isServiceWorkerRegistered ? 'Active' : 'Inactive' }}
                          </v-chip>
                        </template>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Online Status</v-list-item-title>
                        <template #append>
                          <v-chip
                            :color="isOnline ? 'success' : 'error'"
                            size="small"
                          >
                            {{ isOnline ? 'Online' : 'Offline' }}
                          </v-chip>
                        </template>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- PWA Actions -->
              <v-col
                cols="12"
                md="6"
              >
                <v-card variant="outlined">
                  <v-card-title class="text-h6">
                    <v-icon class="mr-2">
                      mdi-cog
                    </v-icon>
                    PWA Actions
                  </v-card-title>
                  <v-card-text>
                    <v-btn
                      v-if="canInstall"
                      block
                      class="mb-3"
                      color="primary"
                      :loading="installing"
                      variant="elevated"
                      @click="handleInstall"
                    >
                      <v-icon class="mr-2">
                        mdi-download
                      </v-icon>
                      Install App
                    </v-btn>

                    <v-btn
                      v-if="showUpdatePrompt"
                      block
                      class="mb-3"
                      color="info"
                      :loading="updating"
                      variant="elevated"
                      @click="handleUpdate"
                    >
                      <v-icon class="mr-2">
                        mdi-update
                      </v-icon>
                      Update App
                    </v-btn>

                    <v-btn
                      block
                      class="mb-3"
                      color="success"
                      :loading="requestingNotifications"
                      variant="outlined"
                      @click="testNotifications"
                    >
                      <v-icon class="mr-2">
                        mdi-bell
                      </v-icon>
                      Test Notifications
                    </v-btn>

                    <v-btn
                      block
                      class="mb-3"
                      color="warning"
                      variant="outlined"
                      @click="toggleOfflineMode"
                    >
                      <v-icon class="mr-2">
                        mdi-wifi-off
                      </v-icon>
                      {{ isOnline ? 'Go Offline' : 'Go Online' }}
                    </v-btn>

                    <v-btn
                      block
                      color="secondary"
                      variant="outlined"
                      @click="refreshPage"
                    >
                      <v-icon class="mr-2">
                        mdi-refresh
                      </v-icon>
                      Refresh Page
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Phase 2: Push Notifications & Background Sync -->
            <v-row class="mt-4">
              <v-col
                cols="12"
                md="6"
              >
                <v-card variant="outlined">
                  <v-card-title class="text-h6">
                    <v-icon class="mr-2">
                      mdi-bell
                    </v-icon>
                    Push Notifications
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>Support</v-list-item-title>
                        <template #append>
                          <v-chip
                            :color="pushNotifications.isSupported.value ? 'success' : 'error'"
                            size="small"
                          >
                            {{ pushNotifications.isSupported.value ? 'Supported' : 'Not Supported' }}
                          </v-chip>
                        </template>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Permission</v-list-item-title>
                        <template #append>
                          <v-chip
                            :color="getPermissionColor(pushNotifications.permission.value)"
                            size="small"
                          >
                            {{ pushNotifications.permission.value.charAt(0).toUpperCase() + pushNotifications.permission.value.slice(1) }}
                          </v-chip>
                        </template>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Subscription</v-list-item-title>
                        <template #append>
                          <v-chip
                            :color="pushNotifications.subscriptionActive.value ? 'success' : 'grey'"
                            size="small"
                          >
                            {{ pushNotifications.subscriptionActive.value ? 'Active' : 'Inactive' }}
                          </v-chip>
                        </template>
                      </v-list-item>
                    </v-list>

                    <v-divider class="my-3" />

                    <v-btn
                      v-if="pushNotifications.canRequestPermission.value"
                      block
                      class="mb-2"
                      color="primary"
                      :loading="requestingNotifications"
                      size="small"
                      variant="outlined"
                      @click="requestNotificationPermission"
                    >
                      Request Permission
                    </v-btn>

                    <v-btn
                      v-if="pushNotifications.hasPermission.value"
                      block
                      class="mb-2"
                      color="success"
                      size="small"
                      variant="outlined"
                      @click="sendTestNotification"
                    >
                      Send Test Notification
                    </v-btn>

                    <v-btn
                      block
                      color="info"
                      size="small"
                      variant="outlined"
                      @click="testRoleBasedNotifications"
                    >
                      Test Role-Based Notifications
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-card variant="outlined">
                  <v-card-title class="text-h6">
                    <v-icon class="mr-2">
                      mdi-sync
                    </v-icon>
                    Background Sync
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>Queue Length</v-list-item-title>
                        <template #append>
                          <v-chip
                            :color="backgroundSync.queueLength.value > 0 ? 'warning' : 'success'"
                            size="small"
                          >
                            {{ backgroundSync.queueLength.value }}
                          </v-chip>
                        </template>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Processing</v-list-item-title>
                        <template #append>
                          <v-chip
                            :color="backgroundSync.isProcessing.value ? 'info' : 'grey'"
                            size="small"
                          >
                            {{ backgroundSync.isProcessing.value ? 'Active' : 'Idle' }}
                          </v-chip>
                        </template>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Last Sync</v-list-item-title>
                        <template #append>
                          <v-chip
                            color="grey"
                            size="small"
                          >
                            {{ formatLastSync(backgroundSync.lastSyncTime.value) }}
                          </v-chip>
                        </template>
                      </v-list-item>
                    </v-list>

                    <v-divider class="my-3" />

                    <v-btn
                      block
                      class="mb-2"
                      color="primary"
                      size="small"
                      variant="outlined"
                      @click="testBackgroundSync"
                    >
                      Test Sync Operation
                    </v-btn>

                    <v-btn
                      block
                      class="mb-2"
                      color="warning"
                      :disabled="!backgroundSync.hasPendingOperations.value"
                      size="small"
                      variant="outlined"
                      @click="backgroundSync.processQueue()"
                    >
                      Process Queue Now
                    </v-btn>

                    <v-btn
                      block
                      color="error"
                      size="small"
                      variant="outlined"
                      @click="backgroundSync.clearQueue()"
                    >
                      Clear Queue
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- PWA Features Test -->
            <v-row class="mt-4">
              <v-col cols="12">
                <v-card variant="outlined">
                  <v-card-title class="text-h6">
                    <v-icon class="mr-2">
                      mdi-test-tube
                    </v-icon>
                    PWA Features Test
                  </v-card-title>
                  <v-card-text>
                    <v-row>
                      <!-- Offline Storage Test -->
                      <v-col
                        cols="12"
                        md="6"
                      >
                        <v-text-field
                          v-model="testData"
                          hint="Data persists offline"
                          label="Test Data"
                          persistent-hint
                          variant="outlined"
                        />
                        <v-btn
                          class="mt-2 mr-2"
                          color="primary"
                          @click="saveTestData"
                        >
                          Save to Cache
                        </v-btn>
                        <v-btn
                          class="mt-2"
                          color="secondary"
                          @click="loadTestData"
                        >
                          Load from Cache
                        </v-btn>
                      </v-col>

                      <!-- Network Test -->
                      <v-col
                        cols="12"
                        md="6"
                      >
                        <v-text-field
                          v-model="apiResponse"
                          hint="Tests network caching"
                          label="API Response"
                          persistent-hint
                          readonly
                          variant="outlined"
                        />
                        <v-btn
                          class="mt-2"
                          color="primary"
                          :loading="testingApi"
                          @click="testApiCall"
                        >
                          Test API Call
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- PWA Information -->
            <v-row class="mt-4">
              <v-col cols="12">
                <v-card variant="outlined">
                  <v-card-title class="text-h6">
                    <v-icon class="mr-2">
                      mdi-information
                    </v-icon>
                    PWA Information
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>User Agent</v-list-item-title>
                        <v-list-item-subtitle class="text-wrap">
                          {{ navigator.userAgent }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Display Mode</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ displayMode }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Platform</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ navigator.platform }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Storage Estimate</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ storageInfo }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { usePWA } from '@/composables/shared/usePWA'

  // PWA Composable with Phase 2 features
  const {
    isOnline,
    isPWA,
    canInstall,
    showUpdatePrompt,
    installPWA,
    updatePWA,
    pushNotifications,
  } = usePWA()

  // Stub for removed background sync
  const backgroundSync = {
    queueLength: ref(0),
    isProcessing: ref(false),
    lastSyncTime: ref<Date | null>(null),
    hasPendingOperations: ref(false),
    processQueue: () => console.log('Background sync removed'),
    clearQueue: () => console.log('Background sync removed'),
    queueOperation: (..._args: unknown[]) => console.log('Background sync removed'),
  }

  // Local state
  const installing = ref(false)
  const updating = ref(false)
  const requestingNotifications = ref(false)
  const testData = ref('')
  const apiResponse = ref('')
  const testingApi = ref(false)
  const storageInfo = ref('Calculating...')

  // Computed
  const isServiceWorkerRegistered = computed(() => {
    return 'serviceWorker' in navigator && !!navigator.serviceWorker.controller
  })

  const displayMode = computed(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'Standalone'
    }
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return 'Fullscreen'
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'Minimal UI'
    }
    return 'Browser'
  })

  // Methods
  async function handleInstall () {
    installing.value = true
    try {
      await installPWA()
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

  function toggleOfflineMode () {
    // Simulate offline mode by dispatching events
    if (isOnline.value) {
      window.dispatchEvent(new Event('offline'))
    } else {
      window.dispatchEvent(new Event('online'))
    }
  }

  function refreshPage () {
    window.location.reload()
  }

  function saveTestData () {
    localStorage.setItem('pwa-test-data', testData.value)
    console.log('Test data saved:', testData.value)
  }

  function loadTestData () {
    const saved = localStorage.getItem('pwa-test-data')
    if (saved) {
      testData.value = saved
      console.log('Test data loaded:', saved)
    }
  }

  async function testApiCall () {
    testingApi.value = true
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      apiResponse.value = `Success at ${new Date().toLocaleTimeString()}`
    } catch (error) {
      apiResponse.value = `Error: ${error}`
    } finally {
      testingApi.value = false
    }
  }

  async function getStorageEstimate () {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        const used = estimate.usage ? (estimate.usage / 1024 / 1024).toFixed(2) : 'Unknown'
        const quota = estimate.quota ? (estimate.quota / 1024 / 1024).toFixed(2) : 'Unknown'
        storageInfo.value = `${used}MB / ${quota}MB`
      } catch {
        storageInfo.value = 'Not available'
      }
    } else {
      storageInfo.value = 'Not supported'
    }
  }

  // Phase 2 PWA Methods
  async function testNotifications () {
    requestingNotifications.value = true
    try {
      if (!pushNotifications.hasPermission.value) {
        await pushNotifications.requestPermission()
      }

      if (pushNotifications.hasPermission.value) {
        // Send test notification
        pushNotifications.sendLocalNotification({
          type: 'system_alert',
          title: 'PWA Test Notification',
          body: 'This is a test notification from your Property Cleaning Scheduler PWA!',
          tag: 'pwa-test',
          actions: [
            { action: 'view', title: 'View App' },
          ],
        })
      }
    } catch (error) {
      console.error('Notification test failed:', error)
    } finally {
      requestingNotifications.value = false
    }
  }

  async function requestNotificationPermission () {
    requestingNotifications.value = true
    try {
      await pushNotifications.requestPermission()
    } catch (error) {
      console.error('Permission request failed:', error)
    } finally {
      requestingNotifications.value = false
    }
  }

  function sendTestNotification () {
    pushNotifications.sendLocalNotification({
      type: 'system_alert',
      title: 'Test Notification',
      body: 'PWA notifications are working correctly!',
      tag: 'test',
    })
  }

  function testRoleBasedNotifications () {
    // Test owner notification
    pushNotifications.sendOwnerNotification('turn_alert', {
      propertyName: 'Sunset Villa',
      bookingId: 'test-123',
      time: '3:00 PM',
    })

    // Test admin notification
    pushNotifications.sendAdminNotification('turn_alert', {
      count: 5,
    })
  }

  function testBackgroundSync () {
    // Queue a test operation
    backgroundSync.queueOperation(
      'create_booking',
      {
        property_id: 'test-property',
        start_datetime: new Date().toISOString(),
        end_datetime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        booking_type: 'standard',
      },
      'test-user',
      'owner',
    )

    console.log('Test sync operation queued')
  }

  function getPermissionColor (permission: NotificationPermission) {
    switch (permission) {
      case 'granted': { return 'success'
      }
      case 'denied': { return 'error'
      }
      default: { return 'warning'
      }
    }
  }

  function formatLastSync (lastSync: Date | null) {
    if (!lastSync) return 'Never'
    return lastSync.toLocaleTimeString()
  }

  // Initialize
  onMounted(() => {
    getStorageEstimate()
    loadTestData()
  })
</script>

<style scoped>
.pwa-demo {
  max-width: 1200px;
  margin: 0 auto;
}

.text-wrap {
  white-space: normal !important;
  word-break: break-word;
}
</style>
