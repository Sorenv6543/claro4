<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()

  // Auto-discover all demo files via glob
  const demoModules = import.meta.glob('@/dev/demos/**/*.vue')

  // Build demo list from file paths
  const demos = computed(() => {
    return Object.keys(demoModules)
      .map(path => {
        // Extract relative path after /dev/demos/
        const match = path.match(/\/dev\/demos\/(.+)\.vue$/)
        if (!match) return null
        const filePath = match[1]
        // Create a URL-friendly slug
        const slug = filePath.replace(/\//g, '--').toLowerCase()
        // Create a display title from the filename
        const name = filePath.split('/').pop()!
        const title = name
          .replace(/([A-Z])/g, ' $1')
          .replace(/[-_]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        // Determine category from subfolder
        const parts = filePath.split('/')
        const category = parts.length > 1 ? parts[0] : 'General'

        return { title, slug, category, filePath }
      })
      .filter(Boolean)
      .toSorted((a, b) => {
        // Sort by category first, then title
        const catCmp = a!.category.localeCompare(b!.category)
        if (catCmp !== 0) return catCmp
        return a!.title.localeCompare(b!.title)
      }) as { title: string, slug: string, category: string, filePath: string }[]
  })

  // Group by category
  const groupedDemos = computed(() => {
    const groups: Record<string, typeof demos.value> = {}
    for (const demo of demos.value) {
      if (!groups[demo.category]) groups[demo.category] = []
      groups[demo.category].push(demo)
    }
    return groups
  })

  function navigateToDemo (slug: string) {
    router.push(`/dev/demos/${slug}`)
  }
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-2">Demo Components</h1>
        <p class="text-body-2 text-medium-emphasis mb-6">
          {{ demos.length }} demos available
        </p>

        <template v-for="(items, category) in groupedDemos" :key="category">
          <h2 class="text-h6 mb-3 mt-4">{{ category }}</h2>
          <v-row class="mb-2">
            <v-col
              v-for="demo in items"
              :key="demo.slug"
              cols="12"
              lg="3"
              md="4"
              sm="6"
            >
              <v-card
                class="cursor-pointer"
                hover
                @click="navigateToDemo(demo.slug)"
              >
                <v-card-title class="text-body-1">
                  {{ demo.title }}
                </v-card-title>
              </v-card>
            </v-col>
          </v-row>
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>
