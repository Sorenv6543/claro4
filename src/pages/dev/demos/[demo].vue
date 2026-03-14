<template>
  <v-app>
    <!-- Slim toolbar -->
    <v-app-bar
      flat
      border="b"
      color="surface"
      height="48"
    >
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        size="small"
        class="ml-1"
        @click="router.push('/dev/demos')"
      />
      <v-app-bar-title class="text-body-2 font-weight-medium">
        {{ label }}
      </v-app-bar-title>
      <template #append>
        <v-chip
          size="x-small"
          color="warning"
          label
          class="mr-3"
        >
          DEV
        </v-chip>
        <v-btn
          icon="mdi-content-copy"
          variant="text"
          size="small"
          class="mr-1"
          @click="copyPath"
        >
          <v-icon>mdi-content-copy</v-icon>
          <v-tooltip
            activator="parent"
            location="bottom"
          >
            Copy import path
          </v-tooltip>
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <!-- Not found -->
      <v-empty-state
        v-if="notFound"
        icon="mdi-file-alert-outline"
        title="Demo not found"
        :text="`No demo matches slug '${route.params.demo}'`"
        class="mt-8"
      />

      <!-- Live preview -->
      <component
        :is="resolvedComponent"
        v-else-if="resolvedComponent"
      />

      <div
        v-else
        class="d-flex align-center justify-center"
        style="height:60vh"
      >
        <v-progress-circular
          indeterminate
          color="primary"
        />
      </div>
    </v-main>

    <!-- Cherry-pick hint snackbar -->
    <v-snackbar
      v-model="copied"
      timeout="2500"
      location="bottom right"
      color="success"
    >
      <v-icon class="mr-2">
        mdi-check
      </v-icon>
      Import path copied!
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Same glob as the index — must match
const modules = import.meta.glob('/src/dev/demos/**/*.vue')

// slug format: flat → "FileName", nested → "Admin--FileName"
const slug = computed(() => String(route.params.demo))

const modulePath = computed(() => {
  const s = slug.value.replace('--', '/')
  const candidate = `/src/dev/demos/${s}.vue`
  return modules[candidate] ? candidate : null
})

const notFound = computed(() => modulePath.value === null)

const resolvedComponent = computed(() =>
  modulePath.value ? defineAsyncComponent(modules[modulePath.value] as () => Promise<typeof import('*.vue')>) : null
)

const label = computed(() => {
  if (!modulePath.value) return slug.value
  const file = modulePath.value.split('/').pop()!.replace(/\.vue$/, '')
  return file
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase())
})

const copied = ref(false)
function copyPath() {
  if (!modulePath.value) return
  // Emit a cherry-pick-friendly import statement
  const importPath = modulePath.value.replace('/src/', '@/')
  navigator.clipboard.writeText(`import ${label.value.replace(/\s/g, '')} from '${importPath}'`)
  copied.value = true
}
</script>
