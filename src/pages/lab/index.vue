<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onErrorCaptured, watch } from 'vue'
import type { Component } from 'vue'
import { useDisplay } from 'vuetify'
import LoadingSpinner from '@components/dumb/shared/LoadingSpinner.vue'

// Auto-discover all .vue files in src/ai-mockups/
const modules = import.meta.glob<{ default: Component }>('/src/ai-mockups/**/*.vue')

interface LabEntry {
  name: string
  path: string
  group: string
  component: Component
}

const entries: LabEntry[] = Object.entries(modules).map(([path, loader]) => {
  const relative = path.replace('/src/ai-mockups/', '').replace('.vue', '')
  const parts = relative.split('/')
  const group = parts.length > 1 ? parts[0] : 'General'
  const rawName = parts[parts.length - 1]
  const name = rawName
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .trim()
  return {
    name,
    path,
    group,
    component: defineAsyncComponent({
      loader,
      loadingComponent: LoadingSpinner,
      delay: 150,
      timeout: 10000,
    }),
  }
})

const groups = computed(() => {
  const map = new Map<string, LabEntry[]>()
  for (const entry of entries) {
    if (!map.has(entry.group)) map.set(entry.group, [])
    map.get(entry.group)!.push(entry)
  }
  return map
})

// Persist last-selected path in localStorage
const STORAGE_KEY = 'lab:selected'

function safeStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeStorageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Non-fatal: selection won't persist (private mode or quota exceeded)
  }
}

function safeStorageRemove(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Non-fatal
  }
}

function findEntry(path: string | null) {
  return path ? entries.find(e => e.path === path) ?? null : null
}

const selected = ref<LabEntry | null>(
  findEntry(safeStorageGet(STORAGE_KEY)) ?? entries[0] ?? null
)

watch(selected, entry => {
  if (entry) safeStorageSet(STORAGE_KEY, entry.path)
  else safeStorageRemove(STORAGE_KEY)
})

// Error boundary — catches runtime/mount errors from async child components
const currentError = ref<string | null>(null)
const retryKey = ref(0)

onErrorCaptured((err) => {
  currentError.value = err instanceof Error ? err.message : String(err)
  return false // prevent propagation
})

function selectEntry(entry: LabEntry) {
  currentError.value = null
  selected.value = entry
}

const { mobile } = useDisplay()
const drawerOpen = ref(true)
</script>

<template>
  <v-navigation-drawer v-model="drawerOpen" :temporary="mobile" width="240">
    <v-list-item
      title="AI Lab"
      subtitle="DEV — scratch space"
      prepend-icon="mdi-robot-outline"
      class="py-4"
    >
      <template #append>
        <v-chip size="x-small" color="warning" variant="tonal" class="mr-1">DEV</v-chip>
        <v-btn
          icon="mdi-chevron-left"
          variant="text"
          size="x-small"
          density="compact"
          @click="drawerOpen = false"
        />
      </template>
    </v-list-item>
    <v-divider />

    <!-- Empty state in sidebar -->
    <template v-if="entries.length === 0">
      <v-list-item class="py-6 text-center">
        <div class="text-body-2 text-medium-emphasis px-2">
          No mockups yet.<br>Ask Claude to generate one!
        </div>
      </v-list-item>
    </template>

    <v-list v-else density="compact" nav>
      <template v-for="[group, items] in groups" :key="group">
        <v-list-subheader>{{ group }}</v-list-subheader>
        <v-list-item
          v-for="entry in items"
          :key="entry.path"
          :title="entry.name"
          :active="selected?.path === entry.path"
          active-color="primary"
          rounded="lg"
          @click="selectEntry(entry)"
        />
      </template>
    </v-list>
  </v-navigation-drawer>

  <v-main>
    <!-- Sidebar toggle — visible when drawer is closed -->
    <v-btn
      v-show="!drawerOpen"
      icon="mdi-menu"
      variant="tonal"
      size="small"
      class="position-fixed"
      style="top: 10px; left: 10px; z-index: 200"
      @click="drawerOpen = true"
    />

    <!-- Empty state — no files at all -->
    <template v-if="entries.length === 0">
      <v-container class="py-12">
        <v-card max-width="480" class="mx-auto text-center" variant="outlined">
          <v-card-text class="py-8">
            <v-icon size="56" color="medium-emphasis" class="mb-4">mdi-robot-outline</v-icon>
            <div class="text-h6 mb-2">AI Lab is ready</div>
            <div class="text-body-2 text-medium-emphasis mb-4">
              No components yet. Open a chat with Claude and use <code>/ui-designer</code> to generate one.
            </div>
            <v-chip variant="tonal" color="primary" size="small" prepend-icon="mdi-folder-outline">
              src/ai-mockups/
            </v-chip>
          </v-card-text>
        </v-card>
      </v-container>
    </template>

    <!-- Component preview -->
    <template v-else-if="selected">
      <v-toolbar flat border="b">
        <v-btn
          v-if="!drawerOpen"
          icon="mdi-menu"
          variant="text"
          class="mr-1"
          @click="drawerOpen = true"
        />
        <v-toolbar-title>{{ selected.name }}</v-toolbar-title>
        <v-spacer />
        <v-chip size="small" color="info" variant="tonal" class="mr-3 font-mono text-xs">
          {{ selected.path.replace('/src/', 'src/') }}
        </v-chip>
      </v-toolbar>

      <!-- Error boundary display -->
      <template v-if="currentError">
        <v-container class="py-8">
          <v-alert
            type="error"
            title="Component Error"
            :text="currentError"
            variant="tonal"
          >
            <template #append>
              <v-btn size="small" variant="tonal" @click="currentError = null; retryKey++">
                Retry
              </v-btn>
            </template>
          </v-alert>
        </v-container>
      </template>

      <component :is="selected.component" :key="`${selected.path}-${retryKey}`" v-else />
    </template>
  </v-main>
</template>
