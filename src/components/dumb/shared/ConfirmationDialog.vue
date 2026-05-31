<template>
  <v-dialog
    v-model="isOpen"
    max-width="500px"
    :persistent="persistent"
    @keydown.esc="handleCancel"
  >
    <v-card class="glass-card fade-in">
      <v-card-title class="text-h5">
        {{ title }}
      </v-card-title>

      <v-card-text>
        <p>{{ message }}</p>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn
          color="grey-darken-1"
          :disabled="isLoading"
          variant="text"
          @click="handleCancel"
        >
          {{ cancelText }}
        </v-btn>

        <v-spacer />

        <v-btn
          :color="confirmColor"
          :disabled="isLoading"
          :loading="isLoading"
          variant="text"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'

  // PROPS & EMITS
  interface Props {
    open?: boolean
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    confirmColor?: string
    dangerous?: boolean
    persistent?: boolean
    loading?: boolean
  }

  interface Emits {
    (e: 'close' | 'confirm' | 'cancel'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    open: false,
    title: 'Confirm',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: 'primary',
    dangerous: false,
    persistent: true,
    loading: false,
  })

  const emit = defineEmits<Emits>()

  // LOCAL STATE
  const internalLoading = ref<boolean>(false)

  // COMPUTED PROPERTIES
  const isLoading = computed(() => props.loading || internalLoading.value)

  const isOpen = computed({
    get: () => props.open,
    set: (value: boolean) => {
      if (!value) emit('close')
    },
  })

  // If the action is dangerous, use 'error' color, otherwise use the provided color
  const confirmColor = computed((): string => {
    return props.dangerous ? 'error' : props.confirmColor
  })

  // METHODS
  function handleConfirm (): void {
    internalLoading.value = true

    try {
      // emit('confirm') is synchronous — if the parent sets their loading prop to true
      // inside their confirm handler, props.loading will be true by the time we reach
      // the finally block. In that case the parent owns the close lifecycle, so we
      // skip the auto-close and let the parent call closeConfirmDialog on success only.
      emit('confirm')
    } finally {
      internalLoading.value = false
      if (!props.loading) {
        emit('close')
      }
    }
  }

  function handleCancel (): void {
    emit('cancel')
    emit('close')
  }
</script>

<style scoped>
/* Dialog theming */
:deep(.v-dialog .v-card) {
  background: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
}

/* Card title theming */
:deep(.v-card-title) {
  background: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
}

/* Card text theming */
:deep(.v-card-text) {
  color: rgba(var(--v-theme-on-surface), 0.8) !important;
}

/* Button theming */
:deep(.v-btn) {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

:deep(.v-btn--variant-text) {
  color: rgb(var(--v-theme-primary)) !important;
}

:deep(.v-btn--variant-text.text-error) {
  color: rgb(var(--v-theme-error)) !important;
}

:deep(.v-btn--variant-text.text-grey-darken-1) {
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}

:deep(.v-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.3);
}

/* Divider theming */
:deep(.v-divider) {
  border-color: rgba(var(--v-theme-on-surface), 0.12) !important;
}

/* Loading state theming */
:deep(.v-btn--loading) {
  color: rgba(var(--v-theme-on-surface), 0.5) !important;
}
</style>
