<!-- layouts/default.vue -->
<template>
  <v-app>
    <!-- App Bar - Hidden on mobile for owner interface -->
    <!-- <v-app-bar
      v-show="!$vuetify.display.mobile"
      app
      color="surface"
      elevation="1"
      class="border-b"
    >
      <v-app-bar-nav-icon
        @click="toggleSidebar"
      />

      <v-app-bar-title class="font-weight-medium">
        Property Cleaning Scheduler
      </v-app-bar-title>

      <v-spacer />

      <ThemePicker />

      <v-menu
        location="bottom end"
        offset="5"
      >
        <template #activator="{ props: menuProps }">
          <v-btn
            icon
            v-bind="menuProps"
            class="ml-2"
          >
            <v-avatar size="36">
              <v-icon>mdi-account-circle</v-icon>
            </v-avatar>
          </v-btn>
        </template>

        <v-list min-width="200">
          <v-list-subheader>User Options</v-list-subheader>
          <v-list-item
            prepend-icon="mdi-account-outline"
            title="Profile"
          />
          <v-list-item
            prepend-icon="mdi-cog-outline"
            title="Settings"
          />
          <v-divider class="my-2" />
          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
            color="error"
          />
        </v-list>
      </v-menu>
    </v-app-bar> -->

    <!-- Main Content Area - Full Height for Mobile Calendar -->
    <v-main class="main-content-area">
      <div class="viewport-container">
        <router-view />
      </div>
    </v-main>

    <!-- Global Notification Area -->
    <!-- <div id="notification-area" /> -->

    <!-- Global Modal Area -->
    <!-- <div id="modal-area" /> -->
  </v-app>
</template>

  <script setup lang="ts">

  // Sidebar state (for future implementation)

  </script>

  
