<template>
  <v-app>
    <v-app-bar
      flat
      border="b"
      color="surface"
    >
      <v-app-bar-title>
        <span class="font-weight-bold">UI Mockups</span>
        <v-chip
          class="ml-2"
          size="x-small"
          color="warning"
          label
        >
          DEV
        </v-chip>
      </v-app-bar-title>
      <template #append>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          placeholder="Filter components…"
          variant="outlined"
          density="compact"
          hide-details
          rounded="lg"
          style="max-width:260px"
          class="mr-3"
          clearable
        />
      </template>
    </v-app-bar>

    <v-main>
      <v-container
        fluid
        class="pa-6"
      >
        <!-- Group sections -->
        <div
          v-for="group in filteredGroups"
          :key="group.name"
          class="mb-8"
        >
          <div class="text-overline text-medium-emphasis mb-3">
            {{ group.name }}
          </div>
          <v-row>
            <v-col
              v-for="demo in group.demos"
              :key="demo.path"
              cols="12"
              sm="6"
              md="4"
              lg="3"
            >
              <v-card
                :to="`/dev/demos/${demo.slug}`"
                variant="outlined"
                rounded="lg"
                class="demo-card pa-4"
                hover
              >
                <div class="d-flex align-center gap-3">
                  <v-icon
                    :color="group.color"
                    size="28"
                  >
                    {{ group.icon }}
                  </v-icon>
                  <div>
                    <div class="text-body-2 font-weight-medium">
                      {{ demo.label }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ demo.file }}
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <v-empty-state
          v-if="filteredGroups.every(g => g.demos.length === 0)"
          icon="mdi-file-search-outline"
          title="No demos match"
          :text="`No components matching '${search}'`"
        />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Auto-discover all .vue files in src/dev/demos (flat + Admin subfolder)
const modules = import.meta.glob('/src/dev/demos/**/*.vue')

interface DemoEntry {
  path: string
  slug: string
  label: string
  file: string
  group: string
}

function pathToLabel(file: string): string {
  return file
    .replace(/\.vue$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim()
}

const allDemos: DemoEntry[] = Object.keys(modules).map(path => {
  const parts = path.replace('/src/dev/demos/', '').split('/')
  const group = parts.length > 1 ? parts[0] : 'General'
  const file = parts[parts.length - 1]
  const slug = path
    .replace('/src/dev/demos/', '')
    .replace(/\.vue$/, '')
    .replace(/\//g, '--')
  return { path, slug, label: pathToLabel(file.replace(/\.vue$/, '')), file, group }
})

interface DemoGroup {
  name: string
  icon: string
  color: string
  demos: DemoEntry[]
}

const GROUP_META: Record<string, { icon: string; color: string }> = {
  Admin:   { icon: 'mdi-shield-account-outline', color: 'error' },
  General: { icon: 'mdi-palette-outline',        color: 'primary' },
}

const search = ref('')

const filteredGroups = computed<DemoGroup[]>(() => {
  const q = search.value.toLowerCase()
  const groups = [...new Set(allDemos.map(d => d.group))].sort((a, b) =>
    a === 'General' ? 1 : b === 'General' ? -1 : a.localeCompare(b)
  )
  return groups.map(name => ({
    name,
    ...(GROUP_META[name] ?? { icon: 'mdi-folder-outline', color: 'secondary' }),
    demos: allDemos
      .filter(d => d.group === name && (!q || d.label.toLowerCase().includes(q) || d.file.toLowerCase().includes(q)))
      .sort((a, b) => a.label.localeCompare(b.label)),
  })).filter(g => g.demos.length > 0)
})
</script>

<style scoped>
.demo-card {
  transition: border-color 0.15s;
}
.demo-card:hover {
  border-color: rgb(var(--v-theme-primary));
}
</style>
