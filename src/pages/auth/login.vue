<!-- src/pages/auth/login.vue -->
<template>
  <v-card
    elevation="8"
    class="pa-6"
  >
    <v-card-title class="text-h4 text-center mb-4">
      <v-icon
        color="primary"
        class="mr-2"
      >
        mdi-login
      </v-icon>
      Sign In
    </v-card-title>

    <!-- Submitting overlay -->
    <div
      v-if="submitting"
      class="text-center py-8"
    >
      <v-progress-circular
        indeterminate
        color="primary"
      />
      <p class="mt-4">
        Signing you in...
      </p>
    </div>

    <!-- Login Form -->
    <v-form
      v-else
      ref="loginForm"
      @submit.prevent="handleLogin"
    >
      <!-- Error Alert -->
      <v-alert
        v-if="authStore.error || loginError"
        type="error"
        class="mb-4"
        closable
        @click:close="authStore.clearError(); loginError = null"
      >
        {{ authStore.error || loginError }}
      </v-alert>

      <!-- Email Field -->
      <v-text-field
        v-model="email"
        label="Email"
        type="email"
        :rules="emailRules"
        variant="outlined"
        class="mb-3"
        prepend-inner-icon="mdi-email"
        required
      />

      <!-- Password Field -->
      <v-text-field
        v-model="password"
        :label="showPassword ? 'Password (visible)' : 'Password'"
        :type="showPassword ? 'text' : 'password'"
        :rules="passwordRules"
        variant="outlined"
        class="mb-4"
        prepend-inner-icon="mdi-lock"
        :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
        required
        @click:append-inner="showPassword = !showPassword"
      />

      <!-- Sign In Button -->
      <v-btn
        type="submit"
        color="primary"
        size="large"
        block
        :loading="submitting"
        :disabled="submitting"
        class="mb-4"
      >
        <v-icon class="mr-2">
          mdi-login
        </v-icon>
        Sign In
      </v-btn>

      <!-- Register / Demos Links -->
      <v-divider class="my-4" />
      <div class="text-center">
        <p class="text-body-2 mb-2">
          Don't have an account?
        </p>
        <v-btn
          color="primary"
          variant="text"
          :disabled="submitting"
          @click="goToRegister"
        >
          Create Account
        </v-btn>
        <v-divider class="my-4" />
        <v-btn
          color="primary"
          variant="text"
          :disabled="submitting"
          @click="goToDemos"
        >
          Demos
        </v-btn>
      </div>
    </v-form>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getDefaultRouteForRole } from '@/utils/authHelpers'
import type { VForm } from 'vuetify/components'

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const loginError = ref<string | null>(null)
const loginForm = ref<VForm | null>(null)

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid'
]
const passwordRules = [
  (v: string) => !!v || 'Password is required'
]

async function handleLogin() {
  const { valid } = await loginForm.value!.validate()
  if (!valid) return

  submitting.value = true
  loginError.value = null
  authStore.clearError()

  try {
    const success = await authStore.login(email.value, password.value)
    if (success && authStore.user) {
      await router.push(getDefaultRouteForRole(authStore.user.role))
    } else if (success && !authStore.user) {
      loginError.value = 'Login succeeded but your profile could not be loaded. Please try again.'
    }
    // If !success, authStore.error is already set by the store
  } catch (err) {
    // Navigation failures or other unexpected errors
    if (!authStore.error) {
      loginError.value = err instanceof Error ? err.message : 'An unexpected error occurred'
    }
  } finally {
    submitting.value = false
  }
}

function goToDemos() {
  router.push('/demos')
}

function goToRegister() {
  router.push('/auth/register')
}

// Clear any stale errors on mount
authStore.clearError()
</script>
