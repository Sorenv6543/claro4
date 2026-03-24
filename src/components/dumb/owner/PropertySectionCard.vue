<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" :color="iconColor">{{ icon }}</v-icon>
      {{ title }}
      <v-spacer />
      <v-btn
        v-if="!readonly && !editing"
        data-testid="section-edit-btn"
        icon="mdi-pencil"
        size="small"
        variant="text"
        @click="$emit('edit')"
      />
    </v-card-title>
    <v-card-text>
      <slot v-if="!editing" />
      <slot v-else name="edit" />

      <v-alert
        v-if="error && editing"
        class="mt-3"
        closable
        type="error"
        variant="tonal"
      >
        {{ error }}
      </v-alert>
    </v-card-text>
    <v-card-actions v-if="editing">
      <v-spacer />
      <v-btn
        data-testid="section-cancel-btn"
        variant="text"
        @click="$emit('cancel')"
      >
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        data-testid="section-save-btn"
        :disabled="saveDisabled"
        :loading="loading"
        @click="$emit('save')"
      >
        Save
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
  withDefaults(defineProps<{
    title: string
    icon: string
    iconColor?: string
    editing?: boolean
    loading?: boolean
    readonly?: boolean
    saveDisabled?: boolean
    error?: string | null
  }>(), {
    iconColor: 'primary',
    editing: false,
    loading: false,
    readonly: false,
    saveDisabled: false,
    error: null,
  })

  defineEmits<{
    (e: 'edit' | 'save' | 'cancel'): void
  }>()
</script>
