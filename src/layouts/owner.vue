<!-- src/layouts/owner.vue -->
<template>
  <v-app>
    <v-app-bar
      height="56"
      flat
      color="white"
      border="b"
    >
      <v-app-bar-nav-icon
        :icon="sidebarOpen ? 'mdi-menu-open' : 'mdi-menu'"

        @click="sidebarOpen = !sidebarOpen"
      />
      <v-app-bar-title>
        <span class="text-subtitle-1 font-weight-bold text-primary">Claro</span>
      </v-app-bar-title>

      <template #append>
        <!-- Notification bell (stub) -->
        <v-btn
          icon="mdi-bell-outline"
          variant="text"
          color="default"
          size="small"
          class="mr-1"
        />

        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-avatar
              v-bind="menuProps"
              color="primary"
              size="26"
              class="mr-2"
              style="cursor: pointer"
            >
              <span
                class="text-caption font-weight-bold"
                style="font-size:0.6rem"
              >{{ userInitials }}</span>
            </v-avatar>
          </template>
          <v-list
            density="compact"
            min-width="160"
          >
            <v-list-item
              prepend-icon="mdi-account-outline"
              title="Profile"
              :to="'/owner/profile'"
            />
            <v-divider />
            <v-list-item
              prepend-icon="mdi-logout"
              title="Sign Out"
              @click="handleSignOut"
            />
          </v-list>
        </v-menu>
      </template>
    </v-app-bar>

    <OwnerNavigationDrawer v-model="sidebarOpen" />

    <v-main>
      <router-view />
    </v-main>

    <OwnerBottomNav @open-drawer="sidebarOpen = true" />
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@stores/auth'
import OwnerNavigationDrawer from '@/components/smart/owner/OwnerNavigationDrawer.vue'
import OwnerBottomNav from '@/components/smart/owner/OwnerBottomNav.vue'

const { mdAndUp } = useDisplay()
const router = useRouter()
const authStore = useAuthStore()

// Desktop: open by default; mobile: closed by default
const sidebarOpen = ref(mdAndUp.value)

const userInitials = computed(() => {
  const name =
    authStore.user?.name ||
    authStore.user?.email?.split('@')[0] ||
    'U'
  return name
    .split(' ')
    .map((n: string) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

async function handleSignOut() {
  await authStore.logout()
  router.push('/')
}
</script>

<style scoped>
/* No brand-mark styles needed — text-only brand */
</style>
