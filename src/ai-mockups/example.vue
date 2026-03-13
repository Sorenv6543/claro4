<script setup lang="ts">
// Example AI Lab component — feel free to delete or replace this
</script>

<template>
  <v-container class="py-8">
    <v-card max-width="480" class="mx-auto">
      <v-card-title class="text-h5 pt-5 px-5">
        Welcome to AI Lab
      </v-card-title>
      <v-card-text>
        <p class="text-body-1 mb-4">
          This is your component scratch space. Ask Claude to generate a component
          and it will appear in the sidebar automatically.
        </p>
        <div class="flex flex-col gap-3">
          <v-chip color="primary" variant="tonal" prepend-icon="mdi-palette">
            Vuetify 4 theme tokens available
          </v-chip>
          <v-chip color="secondary" variant="tonal" prepend-icon="mdi-tailwind">
            Tailwind utilities available
          </v-chip>
          <v-chip color="success" variant="tonal" prepend-icon="mdi-lightning-bolt">
            HMR — changes appear instantly
          </v-chip>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>
