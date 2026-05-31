<template>
  <v-card>
    <v-card-title>Profile</v-card-title>

    <v-card-text>
      <v-empty-state
        icon="mdi-account-circle"
        text="Owner profile management will be available in a future release."
        title="Profile — Coming Soon"
      />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  defineOptions({ name: 'OwnerProfilePlaceholder' })
</script>
