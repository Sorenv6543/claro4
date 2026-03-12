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

        <!-- DEV: theme picker (dev builds only) -->
        <template v-if="import.meta.env.DEV">
        <!-- Note: global VChip default is rounded="pill"; rounded="0" overrides it for the label look -->
        <v-chip
          size="x-small"
          color="warning"
          rounded="0"
          class="mr-1"
          style="font-size:9px;height:16px;padding:0 4px"
        >DEV</v-chip>
        <!-- Use slot-based activator (idiomatic Vuetify 4 — ID-string activator is unreliable) -->
        <v-menu location="bottom end" :close-on-content-click="false">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon="mdi-palette"
              variant="text"
              size="small"
              class="mr-1"
            />
          </template>
          <v-card elevation="4" rounded="lg" style="padding:12px;width:296px">
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
              <div
                v-for="t in THEMES"
                :key="t.id"
                style="position:relative;border-radius:8px;overflow:hidden;cursor:pointer;border:2px solid transparent"
                :style="theme.name.value === t.id ? { borderColor: t.primary } : {}"
                @click="applyTheme(t.id)"
              >
                <!-- Three colour bands -->
                <div style="display:flex;height:36px">
                  <div :style="{ flex:1, background: t.primary }" />
                  <div :style="{ flex:1, background: t.background }" />
                  <div :style="{ flex:1, background: t.surface }" />
                </div>
                <!-- Label -->
                <div style="padding:3px 6px;font-size:11px;background:#fff;color:#333">{{ t.label }}</div>
                <!-- Active checkmark -->
                <v-icon
                  v-if="theme.name.value === t.id"
                  size="14"
                  color="white"
                  style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.45);border-radius:50%;padding:2px"
                >mdi-check</v-icon>
              </div>
            </div>
          </v-card>
        </v-menu>
        </template>

        <!-- Avatar / user menu -->
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
import { useDisplay, useTheme } from 'vuetify'
import { useAuthStore } from '@stores/auth'
import { THEMES } from '@/layouts/ownerThemes'
import OwnerNavigationDrawer from '@/components/smart/owner/OwnerNavigationDrawer.vue'
import OwnerBottomNav from '@/components/smart/owner/OwnerBottomNav.vue'

const { mdAndUp } = useDisplay()
const theme = useTheme()
const router = useRouter()
const authStore = useAuthStore()

// Desktop: open by default; mobile: closed by default
const sidebarOpen = ref(mdAndUp.value)

function applyTheme(id: string) {
  theme.name.value = id
}

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
