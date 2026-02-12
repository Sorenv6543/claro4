# Code Style and Conventions

## Naming
- Owner components: Owner prefix (OwnerSidebar.vue, OwnerCalendar.vue)
- Admin components: Admin prefix (AdminSidebar.vue, AdminCalendar.vue)
- Shared components: No prefix (PropertyCard.vue, TurnAlerts.vue)
- Owner composables: useOwner prefix (useOwnerBookings.ts)
- Admin composables: useAdmin prefix (useAdminBookings.ts)
- Stores/types/utils: camelCase filenames

## Architecture Rules
- Do NOT create generic components with role props - create separate role-specific components
- Owner composables MUST filter by owner_id
- Admin composables MUST NOT filter (sees all data)
- Stores use Map<string, T> - never convert to array-based state
- Use Map methods (.has(), .get(), .set(), .delete()), convert to arrays only for UI rendering

## Path Aliases
@ -> src/, plus @components, @composables, @stores, @types, @utils, @layouts, @pages, @plugins, @assets

## Component Organization
- Smart components (have logic): src/components/smart/{owner,admin}/
- Dumb components (props-only): src/components/dumb/{owner,admin,shared}/

## Vuetify
- Components are auto-imported - no manual imports needed

## TypeScript
- Vue 3 Composition API with script setup lang ts
- Types in src/types/
