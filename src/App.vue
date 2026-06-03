<!-- App.vue -->
<template>
  <component :is="layout">
    <router-view v-slot="{ Component }">
      <transition mode="out-in" name="page-transition">
        <component :is="Component" v-if="Component" />

        <LoadingSpinner
          v-else
          message="Loading..."
          min-height="60vh"
          variant="page"
        />
      </transition>
    </router-view>
  </component>

  <!-- PWA Notifications Enhanced (global) -->
  <PWANotificationsEnhanced />
</template>

<script setup lang="ts">
  import { computed, defineAsyncComponent } from 'vue'
  import { useRoute } from 'vue-router'

  import LoadingSpinner from '@/components/dumb/shared/LoadingSpinner.vue'
  import PWANotificationsEnhanced from '@/components/dumb/shared/PWANotificationsEnhanced.vue'
  import { usePreviewTheme } from '@/composables/shared/usePreviewTheme'

  usePreviewTheme()

  function lazyLayout (loader: () => Promise<any>) {
    return defineAsyncComponent({
      loader,
      loadingComponent: LoadingSpinner,
      delay: 0,
      onError (error, _retry, fail) {
        // Stale Vite chunk after a dev-server restart — the import URL no longer
        // exists. Reload once so the browser fetches the fresh chunk manifest.
        if (error?.message?.includes('Failed to fetch dynamically imported module')) {
          window.location.reload()
        } else {
          fail()
        }
      },
    })
  }

  const layouts = {
    default: lazyLayout(() => import('@/layouts/default.vue')),
    auth: lazyLayout(() => import('@/layouts/auth.vue')),
    admin: lazyLayout(() => import('@/layouts/admin.vue')),
    owner: lazyLayout(() => import('@/layouts/owner.vue')),
    bare: lazyLayout(() => import('@/layouts/bare.vue')),
  }

  const route = useRoute()

  // Determine the current layout based on route meta
  const layout = computed(() => {
    const name = (route.meta.layout as keyof typeof layouts) || 'default'
    return layouts[name] || layouts.default
  })
</script>
