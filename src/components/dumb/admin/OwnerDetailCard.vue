<template>
  <v-card>
    <!-- Profile header with avatar -->
    <div
      class="owner-header d-flex flex-column align-center pa-6 pb-4"
      :style="{ background: `linear-gradient(135deg, ${avatarColor}22, ${avatarColor}08)` }"
    >
      <v-avatar
        class="mb-4 elevation-3"
        :color="avatarColor"
        size="96"
      >
        <span class="text-white text-h4 font-weight-bold">
          {{ initials }}
        </span>
      </v-avatar>

      <h2 class="text-h5 font-weight-bold text-center">
        {{ owner.name }}
      </h2>

      <p
        v-if="owner.company_name"
        class="text-body-1 text-medium-emphasis mt-1"
      >
        {{ owner.company_name }}
      </p>

      <v-chip
        class="mt-2"
        :color="owner.last_sign_in_at ? 'success' : 'warning'"
        size="small"
        variant="flat"
      >
        {{ owner.last_sign_in_at ? 'Active' : 'Inactive' }}
      </v-chip>
    </div>

    <v-divider />

    <!-- Info rows -->
    <v-card-text class="pa-0">
      <v-list lines="two">
        <v-list-item
          prepend-icon="mdi-email-outline"
          subtitle="Email"
          :title="owner.email"
        >
          <template #append>
            <v-btn
              aria-label="Copy email"
              icon="mdi-content-copy"
              size="x-small"
              variant="text"
              @click="$emit('copy', owner.email)"
            />
          </template>
        </v-list-item>

        <v-list-item
          prepend-icon="mdi-home-group"
          subtitle="Portfolio"
          :title="`${propertyCount} ${propertyCount === 1 ? 'property' : 'properties'}`"
        />

        <v-list-item
          prepend-icon="mdi-clock-outline"
          subtitle="Timezone"
          :title="owner.timezone || 'Not set'"
        />

        <v-list-item
          prepend-icon="mdi-translate"
          subtitle="Language"
          :title="languageLabel"
        />

        <v-list-item
          prepend-icon="mdi-bell-outline"
          subtitle="Notifications"
          :title="owner.notifications_enabled ? 'Enabled' : 'Disabled'"
        >
          <template #append>
            <v-icon
              :color="owner.notifications_enabled ? 'success' : 'error'"
              size="18"
            >
              {{ owner.notifications_enabled ? 'mdi-check-circle' : 'mdi-close-circle' }}
            </v-icon>
          </template>
        </v-list-item>

        <v-list-item
          prepend-icon="mdi-calendar-plus-outline"
          subtitle="Member since"
          :title="owner.created_at ? formatDate(owner.created_at) : '—'"
        />

        <v-list-item
          v-if="owner.last_sign_in_at"
          prepend-icon="mdi-login"
          subtitle="Last sign in"
          :title="formatDate(owner.last_sign_in_at)"
        />
      </v-list>
    </v-card-text>

    <v-divider />

    <v-card-actions class="pa-4">
      <v-btn
        block
        color="primary"
        prepend-icon="mdi-pencil-outline"
        variant="flat"
        @click="$emit('edit')"
      >
        Edit Profile
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
  import type { User } from '@/types/user'
  import { computed } from 'vue'

  interface Props {
    owner: User
    propertyCount: number
    avatarColor: string
  }

  const props = defineProps<Props>()

  defineEmits<{
    edit: []
    copy: [value: string]
  }>()

  const LANGUAGES: Record<string, string> = {
    en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese',
  }

  const initials = computed(() =>
    props.owner.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
  )

  const languageLabel = computed(() =>
    LANGUAGES[props.owner.language] || props.owner.language || 'English',
  )

  function formatDate (d: string) {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }
</script>
