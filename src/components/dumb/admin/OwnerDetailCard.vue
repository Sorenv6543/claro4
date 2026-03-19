<template>
  <v-card>
    <!-- Profile header with avatar -->
    <div
      class="owner-header d-flex flex-column align-center pa-6 pb-4"
      :style="{ background: `linear-gradient(135deg, ${avatarColor}22, ${avatarColor}08)` }"
    >
      <v-avatar
        :color="avatarColor"
        size="96"
        class="mb-4 elevation-3"
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
        :color="owner.last_sign_in_at ? 'success' : 'warning'"
        size="small"
        variant="flat"
        class="mt-2"
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
          :title="owner.email"
          subtitle="Email"
        >
          <template #append>
            <v-btn
              icon="mdi-content-copy"
              size="x-small"
              variant="text"
              aria-label="Copy email"
              @click="$emit('copy', owner.email)"
            />
          </template>
        </v-list-item>

        <v-list-item
          prepend-icon="mdi-home-group"
          :title="`${propertyCount} ${propertyCount === 1 ? 'property' : 'properties'}`"
          subtitle="Portfolio"
        />

        <v-list-item
          prepend-icon="mdi-clock-outline"
          :title="owner.timezone || 'Not set'"
          subtitle="Timezone"
        />

        <v-list-item
          prepend-icon="mdi-translate"
          :title="languageLabel"
          subtitle="Language"
        />

        <v-list-item
          prepend-icon="mdi-bell-outline"
          :title="owner.notifications_enabled ? 'Enabled' : 'Disabled'"
          subtitle="Notifications"
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
          :title="owner.created_at ? formatDate(owner.created_at) : '—'"
          subtitle="Member since"
        />

        <v-list-item
          v-if="owner.last_sign_in_at"
          prepend-icon="mdi-login"
          :title="formatDate(owner.last_sign_in_at)"
          subtitle="Last sign in"
        />
      </v-list>
    </v-card-text>

    <v-divider />

    <v-card-actions class="pa-4">
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-pencil-outline"
        block
        @click="$emit('edit')"
      >
        Edit Profile
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '@/types/user'

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
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese'
}

const initials = computed(() =>
  props.owner.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
)

const languageLabel = computed(() =>
  LANGUAGES[props.owner.language] || props.owner.language || 'English'
)

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
</script>

<style scoped>
.owner-header {
  border-radius: inherit;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
</style>
