<script setup lang="ts">
import { ref } from 'vue'

export interface AssignableCleaner {
  id: string
  name: string
  assigned: number
  total: number
}

export interface AssignableTeam {
  id: string
  name: string
  member_ids: string[]
  assigned: number
  total: number
}

const props = defineProps<{
  cleaners: AssignableCleaner[]
  teams: AssignableTeam[]
}>()

const emit = defineEmits<{
  assignCleaner: [cleanerId: string]
  assignTeam: [teamId: string]
  assignGroup: [cleanerIds: string[]]
}>()

const activeTab = ref(0)
const selectedGroupIds = ref<string[]>([])

function toggleGroupMember(cleanerId: string) {
  const idx = selectedGroupIds.value.indexOf(cleanerId)
  if (idx >= 0) {
    selectedGroupIds.value.splice(idx, 1)
  } else {
    selectedGroupIds.value.push(cleanerId)
  }
}

function submitGroup() {
  if (selectedGroupIds.value.length >= 2) {
    emit('assignGroup', [...selectedGroupIds.value])
    selectedGroupIds.value = []
  }
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}
</script>

<template>
  <v-card width="320" rounded="lg" elevation="4">
    <v-tabs v-model="activeTab" density="compact" grow>
      <v-tab :value="0">Cleaner</v-tab>
      <v-tab :value="1">Team</v-tab>
      <v-tab :value="2">Quick Group</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item :value="0">
        <v-list density="compact" max-height="240" class="overflow-y-auto">
          <v-list-item
            v-for="c in cleaners"
            :key="c.id"
            :data-testid="'cleaner-item'"
            :disabled="c.assigned >= c.total"
            @click="c.assigned < c.total && emit('assignCleaner', c.id)"
          >
            <template #prepend>
              <v-avatar size="28" color="primary" variant="tonal">
                <span class="text-caption">{{ initials(c.name) }}</span>
              </v-avatar>
            </template>
            <v-list-item-title class="text-body-2">{{ c.name }}</v-list-item-title>
            <template #append>
              <div class="d-flex align-center ga-2">
                <v-progress-linear
                  :model-value="c.total ? (c.assigned / c.total) * 100 : 0"
                  :color="c.assigned >= c.total ? 'error' : c.assigned / c.total >= 0.5 ? 'warning' : 'success'"
                  rounded
                  height="4"
                  style="width: 50px;"
                />
                <span class="text-caption text-medium-emphasis">{{ c.assigned }}/{{ c.total }}</span>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-window-item>

      <v-window-item :value="1">
        <v-list density="compact" max-height="240" class="overflow-y-auto">
          <v-list-item
            v-for="t in teams"
            :key="t.id"
            @click="emit('assignTeam', t.id)"
          >
            <template #prepend>
              <v-avatar size="28" color="blue-grey" variant="tonal">
                <v-icon size="16">mdi-account-multiple</v-icon>
              </v-avatar>
            </template>
            <v-list-item-title class="text-body-2">{{ t.name }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              {{ t.member_ids.length }} members
            </v-list-item-subtitle>
            <template #append>
              <span class="text-caption text-medium-emphasis">{{ t.assigned }}/{{ t.total }}</span>
            </template>
          </v-list-item>
          <v-list-item v-if="teams.length === 0" disabled>
            <v-list-item-title class="text-caption text-medium-emphasis text-center">
              No saved teams
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-window-item>

      <v-window-item :value="2">
        <v-list density="compact" max-height="200" class="overflow-y-auto">
          <v-list-item
            v-for="c in cleaners"
            :key="c.id"
            :disabled="c.assigned >= c.total"
            @click="c.assigned < c.total && toggleGroupMember(c.id)"
          >
            <template #prepend>
              <v-checkbox-btn
                :model-value="selectedGroupIds.includes(c.id)"
                density="compact"
                hide-details
                :disabled="c.assigned >= c.total"
                @click.stop="c.assigned < c.total && toggleGroupMember(c.id)"
              />
            </template>
            <v-list-item-title class="text-body-2">{{ c.name }}</v-list-item-title>
            <template #append>
              <span class="text-caption text-medium-emphasis">{{ c.assigned }}/{{ c.total }}</span>
            </template>
          </v-list-item>
        </v-list>
        <v-divider />
        <div class="pa-2 text-center">
          <v-btn
            size="small"
            color="primary"
            :disabled="selectedGroupIds.length < 2"
            @click="submitGroup"
          >
            Assign Group ({{ selectedGroupIds.length }})
          </v-btn>
        </div>
      </v-window-item>
    </v-window>
  </v-card>
</template>
