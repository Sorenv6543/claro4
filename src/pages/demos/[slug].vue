<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Auto-discover all demo files
const demoModules = import.meta.glob('@/dev/demos/**/*.vue')

// Build slug → module path mapping
const slugToModule = computed(() => {
  const map: Record<string, () => Promise<unknown>> = {}
  for (const [path, loader] of Object.entries(demoModules)) {
    const match = path.match(/\/dev\/demos\/(.+)\.vue$/)
    if (!match) continue
    const filePath = match[1]
    const slug = filePath.replace(/\//g, '--').toLowerCase()
    map[slug] = loader
  }
  return map
})

const slug = computed(() => route.params.slug as string)

const DemoComponent = computed(() => {
  const loader = slugToModule.value[slug.value]
  if (!loader) return null
  return defineAsyncComponent(loader as () => Promise<{ default: object }>)
})

const title = computed(() => {
  return slug.value
    .replace(/--/g, ' / ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
})
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-btn
            icon="mdi-arrow-left"
            variant="text"
            @click="router.push('/dev/demos')"
          />
          <h1 class="text-h5 ml-2">{{ title }}</h1>
        </div>

        <v-alert v-if="!DemoComponent" type="error" class="mb-4">
          Demo "{{ slug }}" not found.
        </v-alert>

        <component :is="DemoComponent" v-if="DemoComponent" />
      </v-col>
    </v-row>
  </v-container>
</template>
