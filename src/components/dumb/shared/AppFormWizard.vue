<template>
  <v-card class="app-form-wizard" :elevation="elevation">
    <v-card-text class="pa-6">
      <!-- Step Indicators -->
      <div class="wizard-steps d-flex align-center justify-center mb-8">
        <template v-for="(step, index) in steps" :key="index">
          <!-- Step indicator -->
          <div
            class="wizard-step d-flex align-center ga-3"
            :class="{
              'step-active': index === modelValue,
              'step-completed': index < modelValue,
              'step-pending': index > modelValue,
            }"
          >
            <div class="step-circle d-flex align-center justify-center">
              <v-icon v-if="index < modelValue" size="18">mdi-check</v-icon>
              <span v-else class="step-number">{{ String(index + 1).padStart(2, '0') }}</span>
            </div>

            <div class="step-text">
              <div class="step-title">{{ step.title }}</div>
              <div class="step-subtitle">{{ step.subtitle }}</div>
            </div>
          </div>
          <!-- Connector line -->
          <div
            v-if="index < steps.length - 1"
            class="step-connector mx-4"
            :class="{ 'connector-active': index < modelValue }"
          />
        </template>
      </div>

      <!-- Step Content -->
      <div class="wizard-content">
        <div v-if="steps[modelValue]" class="mb-6">
          <h3 class="text-h6 font-weight-medium mb-1">{{ steps[modelValue].title }}</h3>
          <p class="text-body-2 text-medium-emphasis">{{ steps[modelValue].subtitle }}</p>
        </div>

        <slot :name="`step-${modelValue}`" />
        <slot :index="modelValue" name="step" :step="steps[modelValue]" />
      </div>

      <!-- Navigation Buttons -->
      <div class="d-flex justify-space-between mt-8">
        <v-btn
          :disabled="modelValue === 0"
          prepend-icon="mdi-arrow-left"
          variant="outlined"
          @click="previousStep"
        >
          Previous
        </v-btn>

        <v-btn
          v-if="modelValue < steps.length - 1"
          append-icon="mdi-arrow-right"
          color="primary"
          @click="nextStep"
        >
          Next
        </v-btn>

        <v-btn
          v-else
          append-icon="mdi-check"
          color="primary"
          :loading="submitLoading"
          @click="$emit('submit')"
        >
          {{ submitText }}
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  export interface WizardStep {
    title: string
    subtitle: string
  }

  const props = withDefaults(defineProps<{
    steps: WizardStep[]
    modelValue: number
    submitText?: string
    submitLoading?: boolean
    elevation?: number | string
    /** Async validation callback. Return true to allow step advance, false to block. */
    beforeNext?: (from: number, to: number) => Promise<boolean> | boolean
  }>(), {
    submitText: 'Submit',
    submitLoading: false,
    elevation: 0,
    beforeNext: undefined,
  })

  const emit = defineEmits<{
    'update:modelValue': [step: number]
    'submit': []
    'step-change': [from: number, to: number]
  }>()

  async function nextStep () {
    if (props.modelValue < props.steps.length - 1) {
      const from = props.modelValue
      const to = from + 1

      // If a validation callback is provided, wait for it before advancing
      if (props.beforeNext) {
        const allowed = await props.beforeNext(from, to)
        if (!allowed) return
      }

      emit('update:modelValue', to)
      emit('step-change', from, to)
    }
  }

  function previousStep () {
    if (props.modelValue > 0) {
      const from = props.modelValue
      emit('update:modelValue', from - 1)
      emit('step-change', from, from - 1)
    }
  }
</script>

<style scoped>
.wizard-steps {
  flex-wrap: wrap;
  gap: 8px;
}

.step-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.step-active .step-circle {
  background: rgb(var(--v-theme-primary));
  color: white;
}

.step-completed .step-circle {
  background: rgb(var(--v-theme-primary));
  color: white;
}

.step-pending .step-circle {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.4);
}

.step-number {
  font-size: 0.875rem;
  font-weight: 600;
}

.step-title {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.2;
}

.step-subtitle {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
  line-height: 1.2;
}

.step-active .step-title {
  color: rgb(var(--v-theme-primary));
}

.step-pending .step-title {
  color: rgba(var(--v-theme-on-surface), 0.4);
}

.step-pending .step-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.3);
}

.step-connector {
  flex: 1;
  max-width: 100px;
  height: 2px;
  background: rgba(var(--v-theme-on-surface), 0.12);
  transition: background 0.3s ease;
}

.connector-active {
  background: rgb(var(--v-theme-primary));
}

@media (max-width: 600px) {
  .wizard-steps {
    flex-direction: column;
    align-items: flex-start;
  }

  .step-connector {
    display: none;
  }
}
</style>
