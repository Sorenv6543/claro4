<template>
  <v-dialog
    max-width="600px"
    :model-value="modelValue"
    persistent
    @update:model-value="updateModelValue"
  >
    <v-card>
      <v-card-title class="d-flex align-center pa-6 pb-4">
        <v-icon
          class="me-3"
          icon="mdi-account-edit"
        />

        <span class="text-h5 font-weight-bold">
          Bulk Role Change
        </span>

        <v-spacer />

        <v-btn
          :disabled="loading"
          icon="mdi-close"
          size="small"
          variant="text"
          @click="closeDialog"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <!-- Selected Users Preview -->
        <div class="mb-6">
          <h3 class="text-h6 font-weight-medium mb-4 text-primary">
            <v-icon
              class="me-2"
              icon="mdi-account-multiple"
            />
            Selected Users ({{ selectedUsers.length }})
          </h3>

          <v-card
            class="pa-4"
            max-height="200"
            style="overflow-y: auto;"
            variant="outlined"
          >
            <div
              v-if="selectedUsers.length === 0"
              class="text-center text-medium-emphasis py-4"
            >
              No users selected
            </div>

            <div v-else>
              <div
                v-for="user in selectedUsers"
                :key="user.id"
                class="d-flex align-center py-2"
                :class="{ 'border-b': selectedUsers.indexOf(user) < selectedUsers.length - 1 }"
              >
                <v-avatar
                  class="me-3"
                  :color="getRoleColor(user.role)"
                  size="32"
                >
                  <span class="text-white text-caption font-weight-bold">
                    {{ user.name.charAt(0).toUpperCase() }}
                  </span>
                </v-avatar>

                <div class="grow">
                  <p class="font-weight-medium mb-1">
                    {{ user.name }}
                  </p>

                  <p class="text-caption text-medium-emphasis">
                    {{ user.email }}
                  </p>
                </div>

                <v-chip
                  :color="getRoleColor(user.role)"
                  size="small"
                  :text="user.role.toUpperCase()"
                  variant="tonal"
                />
              </div>
            </div>
          </v-card>
        </div>

        <!-- Role Selection -->
        <div class="mb-6">
          <h3 class="text-h6 font-weight-medium mb-4 text-primary">
            <v-icon
              class="me-2"
              icon="mdi-shield-account"
            />
            New Role Assignment
          </h3>

          <v-select
            v-model="newRole"
            density="comfortable"
            :items="roleOptions"
            label="Select New Role *"
            prepend-inner-icon="mdi-account-group"
            :rules="[rules.required]"
            variant="outlined"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps">
                <template #prepend>
                  <v-icon
                    :color="item.color"
                    :icon="item.icon"
                  />
                </template>

                <v-list-item-title>{{ item.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.description }}</v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-select>
        </div>

        <!-- Impact Summary -->
        <div
          v-if="newRole"
          class="mb-6"
        >
          <h3 class="text-h6 font-weight-medium mb-4 text-warning">
            <v-icon
              class="me-2"
              icon="mdi-alert-circle"
            />
            Impact Summary
          </h3>

          <v-alert
            class="mb-4"
            type="warning"
            variant="tonal"
          >
            <div class="font-weight-medium mb-2">
              This action will change the role for {{ selectedUsers.length }} user{{ selectedUsers.length > 1 ? 's' : '' }}:
            </div>

            <ul class="ml-4">
              <li
                v-for="change in roleChanges"
                :key="change.from"
              >
                {{ change.count }} user{{ change.count > 1 ? 's' : '' }} from
                <strong>{{ change.from.toUpperCase() }}</strong> to
                <strong>{{ newRole.toUpperCase() }}</strong>
              </li>
            </ul>
          </v-alert>

          <!-- Warning for Admin Changes -->
          <v-alert
            v-if="newRole === 'admin' || hasAdminInSelection"
            class="mb-4"
            type="error"
            variant="tonal"
          >
            <div class="font-weight-medium mb-2">
              <v-icon
                class="me-2"
                icon="mdi-shield-alert"
              />
              Administrative Access Warning
            </div>

            <div v-if="newRole === 'admin'">
              You are granting administrative access to {{ selectedUsers.length }} user{{ selectedUsers.length > 1 ? 's' : '' }}.
              Admin users have full system access and can manage all users and data.
            </div>

            <div v-if="hasAdminInSelection && newRole !== 'admin'">
              You are removing administrative access from {{ adminUsersInSelection.length }} user{{ adminUsersInSelection.length > 1 ? 's' : '' }}.
              This will restrict their access to system management features.
            </div>
          </v-alert>
        </div>

        <!-- Confirmation Checkbox -->
        <div v-if="newRole">
          <v-checkbox
            v-model="confirmChange"
            color="primary"
            hide-details
          >
            <template #label>
              <span class="font-weight-medium">
                I understand the impact of this role change and confirm this action
              </span>
            </template>
          </v-checkbox>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-6 pt-4">
        <v-spacer />

        <v-btn
          :disabled="loading"
          size="large"
          variant="outlined"
          @click="closeDialog"
        >
          Cancel
        </v-btn>

        <v-btn
          color="primary"
          :disabled="!canProceed"
          :loading="loading"
          size="large"
          variant="elevated"
          @click="handleSubmit"
        >
          Change Roles
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { User, UserRole } from '@/types'
  import { computed, ref, watch } from 'vue'

  // Props and Emits
  interface Props {
    modelValue: boolean
    selectedUsers: User[]
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
  })

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'submit': [users: User[], newRole: UserRole]
  }>()

  // Form state
  const newRole = ref<UserRole | null>(null)
  const confirmChange = ref(false)

  // Options
  const roleOptions = [
    {
      title: 'Property Owner',
      value: 'owner',
      description: 'Manages properties and bookings',
      icon: 'mdi-home-account',
      color: 'primary',
    },
    {
      title: 'Administrator',
      value: 'admin',
      description: 'Full system access and user management',
      icon: 'mdi-shield-account',
      color: 'red',
    },
    {
      title: 'Cleaner',
      value: 'cleaner',
      description: 'Performs cleaning services',
      icon: 'mdi-broom',
      color: 'success',
    },
  ]

  // Validation rules
  const rules = {
    required: (value: unknown) => !!value || 'This field is required',
  }

  // Computed properties
  function updateModelValue (value: boolean) {
    if (!value && props.loading) return // block close while loading
    emit('update:modelValue', value)
  }

  const roleChanges = computed(() => {
    if (!newRole.value) return []

    const changes = new Map<UserRole, number>()

    for (const user of props.selectedUsers) {
      if (user.role !== newRole.value) {
        changes.set(user.role, (changes.get(user.role) || 0) + 1)
      }
    }

    return Array.from(changes.entries()).map(([from, count]) => ({
      from,
      count,
    }))
  })

  const hasAdminInSelection = computed(() => {
    return props.selectedUsers.some(user => user.role === 'admin')
  })

  const adminUsersInSelection = computed(() => {
    return props.selectedUsers.filter(user => user.role === 'admin')
  })

  const canProceed = computed(() => {
    return newRole.value && confirmChange.value && props.selectedUsers.length > 0
  })

  // Methods
  function closeDialog () {
    if (props.loading) return
    updateModelValue(false)
    resetForm()
  }

  function resetForm () {
    newRole.value = null
    confirmChange.value = false
  }

  function getRoleColor (role: UserRole) {
    const colors = {
      admin: 'red',
      owner: 'primary',
      cleaner: 'success',
    }
    return colors[role] || 'grey'
  }

  function handleSubmit () {
    if (!newRole.value) return

    // Filter out users who already have the target role
    const usersToUpdate = props.selectedUsers.filter(user => user.role !== newRole.value)

    if (usersToUpdate.length === 0) {
      closeDialog()
      return
    }

    emit('submit', usersToUpdate, newRole.value)
    // Parent controls close via modelValue after async operation completes
  }

  // Watchers
  watch(() => props.modelValue, newValue => {
    if (!newValue) {
      resetForm()
    }
  })
</script>
