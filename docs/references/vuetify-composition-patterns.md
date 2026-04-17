# Vuetify 4 Internal Composition Patterns

Reference for Claude Code during automated design-to-code workflows in the Claro4 project.

Source: `vuetify/packages/vuetify/src/` (read 2026-04-15)

---

## 1. useDefaults

**Source**: `composables/defaults.ts`

### Injection Key

```ts
const DefaultsSymbol: InjectionKey<Ref<DefaultsInstance>> = Symbol.for('vuetify:defaults')
```

### DefaultsInstance Shape

```ts
type DefaultsInstance = undefined | {
  [key: string]: undefined | Record<string, unknown>  // keyed by component name, e.g. "VBtn"
  global?: Record<string, unknown>                     // applies to ALL components
}
```

### Resolution Order (highest to lowest priority)

1. **Explicit prop on the component instance** (checked via `propIsDefined(vm.vnode, prop)`)
2. **Component-specific defaults** (`defaults.value?.[componentName]?.[prop]`)
3. **Global defaults** (`defaults.value?.global?.[prop]`)
4. **Prop's declared default value** (Vue prop definition fallback)

The proxy in `internalUseDefaults` implements this:

```ts
const _props = new Proxy(props, {
  get(target, prop) {
    if (prop === 'class' || prop === 'style') {
      // class/style MERGE (array concat) rather than override
      return [componentDefaults.value?.[prop], propValue].filter(v => v != null)
    }
    if (propIsDefined(vm.vnode, prop)) return propValue        // 1. explicit prop wins
    const _componentDefault = componentDefaults.value?.[prop]
    if (_componentDefault !== undefined) return _componentDefault // 2. component default
    const _globalDefault = defaults.value?.global?.[prop]
    if (_globalDefault !== undefined) return _globalDefault      // 3. global default
    return propValue                                            // 4. Vue prop default
  },
})
```

### How Claro4 Global Defaults Work

When `createVuetify({ defaults: { VBtn: { variant: 'flat' } } })` is called, it creates a `Ref<DefaultsInstance>` provided at the app root. Every Vuetify component calls `useDefaults(props)` internally, which reads from this injection.

**Claro4 implication**: Setting `VTextField: { variant: 'outlined', density: 'comfortable' }` in `vuetify.ts` means every `<v-text-field>` automatically gets those values unless a parent `<v-defaults-provider>` overrides them or the instance sets the prop explicitly.

### Cascade via VDefaultsProvider

`VDefaultsProvider` calls `provideDefaults(defaults, options)`. The merge logic:

```ts
// provideDefaults merges new defaults with injected parent defaults
let properties = mergeDeep(providedDefaults.value, { prev: injectedDefaults.value })
// Then flattens: mergeDeep(properties.prev, properties, undefined, (_, v) => v !== undefined)
```

**Cascade chain**: `createVuetify defaults` -> `VDefaultsProvider (level 1)` -> `VDefaultsProvider (level 2)` -> component

Options:
- `scoped`: defaults apply ONLY to direct children, not inherited from parent
- `reset`: walk back N levels in the chain (number) or to root (Infinity)
- `root`: reset to root AND apply a named subset from root defaults
- `disabled`: pass through parent defaults unchanged

### Sub-Component Defaults

Components can nest defaults for their children. In `defaults.ts`, `internalUseDefaults` extracts entries where the key starts with an uppercase letter as sub-component defaults:

```ts
const subComponents = Object.entries(componentDefaults.value)
  .filter(([key]) => key.startsWith(key[0].toUpperCase()))
```

This is how VList pushes defaults to VListItem via `provideDefaults()` (see Section 6).

### Key Rules for Claro4

- Never set a prop explicitly on a component if the global default already covers it
- Use `<v-defaults-provider>` to override defaults for a subtree, not per-component props
- The `_as` prop allows a component to masquerade as another for defaults lookup

---

## 2. useTheme

**Source**: `composables/theme.ts`

### Injection Key

```ts
const ThemeSymbol: InjectionKey<ThemeInstance> = Symbol.for('vuetify:theme')
```

### ThemeInstance Interface

```ts
interface ThemeInstance {
  change: (themeName: string) => void
  cycle: (themeArray?: string[]) => void
  toggle: (themeArray?: [string, string]) => void

  readonly isDisabled: boolean
  readonly isSystem: Readonly<Ref<boolean>>
  readonly themes: Ref<Record<string, InternalThemeDefinition>>
  readonly name: Readonly<Ref<string>>
  readonly current: DeepReadonly<Ref<InternalThemeDefinition>>
  readonly computedThemes: DeepReadonly<Ref<Record<string, InternalThemeDefinition>>>
  readonly prefix: string
  readonly themeClasses: Readonly<Ref<string | undefined>>
  readonly styles: Readonly<Ref<string>>
  readonly global: {
    readonly name: Ref<string>
    readonly current: DeepReadonly<Ref<InternalThemeDefinition>>
  }
}
```

### Using in Custom Composables

```ts
import { useTheme } from 'vuetify'

function useMyComposable() {
  const theme = useTheme()

  // Read current theme name
  const themeName = theme.name  // Ref<string>

  // Check if dark
  const isDark = computed(() => theme.current.value.dark)

  // Access a color value
  const primaryColor = computed(() => theme.current.value.colors.primary)

  // Switch themes
  theme.change('dark')          // switch to specific theme
  theme.toggle()                // toggle between 'light' and 'dark'
  theme.cycle(['light', 'dark', 'custom'])  // cycle through list

  return { isDark, primaryColor }
}
```

### CSS Custom Properties

Theme colors become CSS variables with the pattern:

```
--v-theme-{color-name}: R,G,B
```

Usage in CSS:

```css
.my-element {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
```

Theme variables (opacity, border, etc.):

```
--v-{variable-name}: value
```

For example: `--v-border-opacity: 0.12`, `--v-high-emphasis-opacity: 0.87`.

### Theme Classes

Each theme generates a CSS class: `.v-theme--{name}` (e.g., `.v-theme--light`, `.v-theme--dark`).

Components that call `provideTheme(props)` apply `themeClasses` to their root element, creating a theme scope boundary.

### Scoped Theme Override

```vue
<v-card theme="dark">
  <!-- Everything inside inherits dark theme -->
</v-card>
```

`provideTheme(props)` reads `props.theme`, falls back to parent theme name, and provides a new `ThemeInstance` to descendants.

### System Theme

Default theme is `'system'`. Vuetify listens to `prefers-color-scheme: dark` media query and resolves to `'light'` or `'dark'` accordingly. Check `theme.isSystem` to know if system detection is active.

---

## 3. useDisplay

**Source**: `composables/display.ts`

### Injection Key

```ts
const DisplaySymbol: InjectionKey<DisplayInstance> = Symbol.for('vuetify:display')
```

### Default Breakpoint Thresholds

```ts
{
  xs: 0,     // < 600px
  sm: 600,   // 600-839px
  md: 840,   // 840-1144px
  lg: 1145,  // 1145-1544px
  xl: 1545,  // 1545-2137px
  xxl: 2138  // >= 2138px
}
```

Default `mobileBreakpoint`: `'lg'` (width < 1145px is mobile).

### Reactive Properties

| Property | Type | Description |
|---|---|---|
| `xs` | `Ref<boolean>` | Width < sm threshold |
| `sm` | `Ref<boolean>` | Width in sm range |
| `md` | `Ref<boolean>` | Width in md range |
| `lg` | `Ref<boolean>` | Width in lg range |
| `xl` | `Ref<boolean>` | Width in xl range |
| `xxl` | `Ref<boolean>` | Width >= xxl threshold |
| `smAndUp` | `Ref<boolean>` | Width >= sm |
| `mdAndUp` | `Ref<boolean>` | Width >= md |
| `lgAndUp` | `Ref<boolean>` | Width >= lg |
| `xlAndUp` | `Ref<boolean>` | Width >= xl |
| `smAndDown` | `Ref<boolean>` | Width < md |
| `mdAndDown` | `Ref<boolean>` | Width < lg |
| `lgAndDown` | `Ref<boolean>` | Width < xl |
| `xlAndDown` | `Ref<boolean>` | Width < xxl |
| `name` | `Ref<DisplayBreakpoint>` | Current breakpoint name |
| `width` | `Ref<number>` | Viewport width |
| `height` | `Ref<number>` | Viewport height |
| `mobile` | `Ref<boolean>` | Below mobile breakpoint |
| `platform` | `Ref<DisplayPlatform>` | OS/browser detection |

### Using in Custom Composables

```ts
import { useDisplay } from 'vuetify'

function useMyLayout() {
  const { mobile, mdAndUp, width, name } = useDisplay()

  const columns = computed(() => {
    if (mobile.value) return 1
    if (mdAndUp.value) return 3
    return 2
  })

  return { columns, mobile }
}
```

### Component-Level Mobile Override

Components using `makeDisplayProps` accept `mobile` and `mobileBreakpoint` props that override the global setting for that component subtree:

```vue
<v-navigation-drawer :mobile-breakpoint="960" />
```

---

## 4. useLocale

**Source**: `composables/locale.ts`

### Injection Key

```ts
const LocaleSymbol: InjectionKey<LocaleInstance & RtlInstance> = Symbol.for('vuetify:locale')
```

### LocaleInstance Interface

```ts
interface LocaleInstance {
  name: string
  decimalSeparator: ShallowRef<string>
  messages: Ref<LocaleMessages>
  current: Ref<string>          // e.g. 'en', 'fr'
  fallback: Ref<string>
  t: (key: string, ...params: unknown[]) => string  // translate
  n: (value: number) => string                        // format number
  provide: (props: LocaleOptions) => LocaleInstance
}
```

### RTL Support

Bundled with locale. `RtlInstance` provides:
- `isRtl: Ref<boolean>` -- based on current locale
- `rtlClasses: Ref<string>` -- `'v-locale--is-rtl'` or `'v-locale--is-ltr'`

### Usage

```ts
import { useLocale, useRtl } from 'vuetify'

const locale = useLocale()
locale.current.value  // 'en'
locale.t('$vuetify.close')  // translated string

const { isRtl } = useRtl()
```

### Custom Adapter

Pass `adapter` in `createVuetify({ locale: { adapter } })` to use vue-i18n or another i18n library. The adapter must implement `LocaleInstance`.

---

## 5. Slot Composition Patterns

### Pattern A: VCard -- Props-to-Subcomponents with Slot Overrides

**Source**: `components/VCard/VCard.tsx`

VCard demonstrates the "convenience props with slot escape hatches" pattern:

```tsx
// VCard accepts title/subtitle/text as props AND as slots
const hasTitle = !!(slots.title || props.title != null)
const hasText = !!(slots.text || props.text != null)

// When cardItem section is needed, it delegates to VCardItem
{hasCardItem && (
  <VCardItem
    prependAvatar={props.prependAvatar}
    prependIcon={props.prependIcon}
    title={props.title}
    subtitle={props.subtitle}
    appendAvatar={props.appendAvatar}
    appendIcon={props.appendIcon}
  >
    {{
      default: slots.item,
      prepend: slots.prepend,
      title: slots.title,
      subtitle: slots.subtitle,
      append: slots.append,
    }}
  </VCardItem>
)}

// Text section: slot takes priority over prop
{hasText && (
  <VCardText>
    {slots.text?.() ?? props.text}
  </VCardText>
)}

// Default slot for arbitrary content
{slots.default?.()}

// Actions slot renders VCardActions wrapper
{slots.actions && (
  <VCardActions v-slots={{ default: slots.actions }} />
)}
```

**Claro4 wrapper pattern**: When wrapping VCard, forward slots explicitly:

```vue
<template>
  <v-card v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData ?? {}" />
    </template>
  </v-card>
</template>

<script setup>
defineOptions({ inheritAttrs: false })
</script>
```

### Pattern B: VDefaultsProvider for Slot Defaults

**Source**: `components/VList/VListItem.tsx`

When a component renders user-provided slot content, it wraps it in `VDefaultsProvider` to set sensible defaults for components the user might place in that slot:

```tsx
// VListItem prepend slot with defaults for common sub-components
{slots.prepend ? (
  <VDefaultsProvider
    defaults={{
      VAvatar: { density: props.density, image: props.prependAvatar },
      VIcon: { density: props.density, icon: props.prependIcon },
      VListItemAction: { start: true },
      VCheckboxBtn: { density: props.density },
    }}
  >
    {slots.prepend?.(slotProps.value)}
  </VDefaultsProvider>
) : (
  // Fallback: render VAvatar/VIcon directly from props
  <>
    {props.prependAvatar && <VAvatar density={props.density} image={props.prependAvatar} />}
    {props.prependIcon && <VIcon density={props.density} icon={props.prependIcon} />}
  </>
)}
```

**Claro4 implication**: When creating wrapper components that expose slots, use `<v-defaults-provider>` to provide context-appropriate defaults to user-supplied content.

### Pattern C: Scoped Slots

VListItem provides interaction state through scoped slots:

```ts
type ListItemSlot = {
  isActive: boolean
  isOpen: boolean
  isSelected: boolean
  isIndeterminate: boolean
  isDisabled: boolean
  select: (value: boolean) => void
}
```

Usage:

```vue
<v-list-item>
  <template #prepend="{ isActive }">
    <v-checkbox-btn :model-value="isActive" />
  </template>
</v-list-item>
```

### When to Use Sub-Components vs Slots

| Use Sub-Components | Use Slots |
|---|---|
| Structured, well-defined sections (VCardItem, VCardActions) | Custom/dynamic content |
| When the component manages layout/spacing of the section | When the consumer controls layout |
| Reusable across multiple parents | One-off customization |

---

## 6. Provide/Inject Patterns

### Pattern A: VForm -> VTextField (Validation)

**Injection Key**: `Symbol.for('vuetify:form')`

**Provider**: `createForm()` in `composables/form.ts`, called by VForm

**Consumer**: `useForm()` in `composables/form.ts`, called by `useValidation()` in every input component

**What FormProvide carries**:

```ts
interface FormProvide {
  register: (item: {
    id: number | string
    vm: ComponentInternalInstance
    validate: () => Promise<string[]>
    reset: () => Promise<void>
    resetValidation: () => Promise<void>
  }) => void
  unregister: (id: number | string) => void
  update: (id: number | string, isValid: boolean | null, errorMessages: string[]) => void
  items: Ref<FormField[]>
  isDisabled: Readonly<Ref<boolean>>
  isReadonly: Readonly<Ref<boolean>>
  isValidating: Ref<boolean>
  isValid: Ref<boolean | null>
  validateOn: Ref<FormProps['validateOn']>
}
```

**Lifecycle**:
1. VForm calls `createForm()` which `provide(FormKey, {...})` with register/unregister/update functions
2. Each input calls `useValidation()` -> `useForm()` -> `inject(FormKey, null)`
3. On `onBeforeMount`, the input registers itself: `form.register?.({ id, vm, validate, reset, resetValidation })`
4. On `onBeforeUnmount`, the input unregisters: `form.unregister?.(uid.value)`
5. When validation state changes, input calls `form.update?.(uid, isValid, errorMessages)`
6. VForm aggregates all field states to compute overall `isValid`

**disabled/readonly cascade**: `useForm` merges form-level and component-level:

```ts
isReadonly: computed(() => !!(props?.readonly ?? form?.isReadonly.value))
isDisabled: computed(() => !!(props?.disabled ?? form?.isDisabled.value))
```

### Pattern B: VList -> VListItem (Defaults Cascade)

**Mechanism**: `provideDefaults()` (NOT a custom injection key)

VList pushes defaults to VListItem through the defaults system:

```ts
// In VList setup()
provideDefaults({
  VListGroup: {
    activeColor,
    baseColor,
    color,
    expandIcon: toRef(() => props.expandIcon),
    collapseIcon: toRef(() => props.collapseIcon),
  },
  VListItem: {
    activeClass: toRef(() => props.activeClass),
    activeColor,
    baseColor,
    color,
    density: toRef(() => props.density),
    disabled: toRef(() => props.disabled),
    lines: toRef(() => props.lines),
    nav: toRef(() => props.nav),
    slim: toRef(() => props.slim),
    variant: toRef(() => props.variant),
  },
})
```

VListItem does NOT inject a custom key. It simply calls `useDefaults(props)`, which reads from the `DefaultsSymbol` injection that VList's `provideDefaults()` populated.

### Pattern C: VList -> VListItem (List Context)

**Injection Key**: `Symbol.for('vuetify:list')`

Separate from defaults, VList provides list-specific behavior context:

```ts
interface ListProvide {
  filterable: MaybeRefOrGetter<boolean>
  hasPrepend: Ref<boolean>
  updateHasPrepend: (value: boolean) => void
  trackingIndex: Ref<number>
  navigationStrategy: Ref<'focus' | 'track'>
  uid: string
}
```

VListItem calls `useList()` -> `inject(ListKey, null)` to access this. Used for:
- Keyboard navigation coordination (`trackingIndex`, `navigationStrategy`)
- Consistent prepend alignment (`hasPrepend`)
- Ripple behavior (`filterable`)

### Pattern D: Depth Tracking

**Injection Key**: `Symbol.for('vuetify:depth')`

Nested lists track depth via provide/inject:

```ts
function useDepth(hasPrepend?: Ref<boolean>) {
  const parent = inject(DepthKey, shallowRef(-1))
  const depth = computed(() => parent.value + 1 + (hasPrepend?.value ? 1 : 0))
  provide(DepthKey, depth)
  return depth
}
```

### Summary of Injection Keys

| Symbol | Provider | Consumer | Purpose |
|---|---|---|---|
| `vuetify:defaults` | `createVuetify`, `provideDefaults`, `VDefaultsProvider` | All components via `useDefaults` | Prop default cascade |
| `vuetify:theme` | `createTheme`, `provideTheme` | `useTheme`, components | Theme colors/classes |
| `vuetify:display` | `createDisplay` | `useDisplay`, components | Breakpoints/viewport |
| `vuetify:locale` | `createLocale`, `provideLocale` | `useLocale` | i18n, RTL |
| `vuetify:form` | `createForm` (VForm) | `useForm` (inputs) | Validation coordination |
| `vuetify:list` | `createList` (VList) | `useList` (VListItem) | List behavior coordination |
| `vuetify:depth` | `useDepth` | `useDepth` | Nested list indentation |

---

## 7. Anti-Patterns

### Anti-Pattern 1: Duplicating Default Logic

```vue
<!-- WRONG: hardcoding what globals already provide -->
<v-text-field variant="outlined" density="comfortable" rounded hide-details="auto" />

<!-- RIGHT: globals handle it, only set what differs -->
<v-text-field />
```

Claro4's `vuetify.ts` already sets `VTextField: { variant: 'outlined', density: 'comfortable', rounded: true, hideDetails: 'auto' }`. Every explicit prop on every instance is redundant noise that also prevents global changes from propagating.

### Anti-Pattern 2: Fighting the Cascade

```vue
<!-- WRONG: overriding defaults per-instance to fight a parent VDefaultsProvider -->
<v-defaults-provider :defaults="{ VBtn: { variant: 'flat' } }">
  <v-btn variant="elevated">Override</v-btn>  <!-- explicit prop wins, but this is fragile -->
</v-defaults-provider>

<!-- RIGHT: use another VDefaultsProvider to create a proper scope -->
<v-defaults-provider :defaults="{ VBtn: { variant: 'flat' } }">
  <v-defaults-provider :defaults="{ VBtn: { variant: 'elevated' } }">
    <v-btn>Properly Scoped</v-btn>
  </v-defaults-provider>
</v-defaults-provider>
```

### Anti-Pattern 3: Bypassing Provide/Inject with Manual Props

```vue
<!-- WRONG: manually passing form state to every input -->
<template>
  <v-text-field :disabled="formDisabled" :readonly="formReadonly" />
  <v-select :disabled="formDisabled" :readonly="formReadonly" />
</template>

<!-- RIGHT: VForm handles this via provide/inject -->
<template>
  <v-form :disabled="formDisabled" :readonly="formReadonly">
    <v-text-field />
    <v-select />
  </v-form>
</template>
```

The `useForm()` composable automatically injects `isDisabled` and `isReadonly` from the parent VForm. Manual prop passing duplicates this AND breaks if a VForm is added later.

### Anti-Pattern 4: Wrapping Without Forwarding Slots/Attrs

```vue
<!-- WRONG: wrapper eats slots and attrs -->
<template>
  <v-card :title="title">
    <slot />
  </v-card>
</template>

<!-- RIGHT: forward everything -->
<template>
  <v-card v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData ?? {}" />
    </template>
  </v-card>
</template>
<script setup>
defineOptions({ inheritAttrs: false })
</script>
```

### Anti-Pattern 5: Ignoring VDefaultsProvider in Custom Slots

```vue
<!-- WRONG: slot content loses density context -->
<v-list-item>
  <template #prepend>
    <v-avatar size="24">...</v-avatar>  <!-- density not inherited -->
  </template>
</v-list-item>
```

VListItem already wraps the prepend slot in `<VDefaultsProvider>` that sets `VAvatar: { density }`. The `<v-avatar>` inside will automatically receive the density. If you bypass this by using a different component structure, you lose the cascaded defaults.

### Anti-Pattern 6: Using Theme CSS Variables Without the RGB Pattern

```css
/* WRONG: theme variables are R,G,B not hex */
.my-element {
  color: var(--v-theme-primary);
}

/* RIGHT: wrap in rgb() */
.my-element {
  color: rgb(var(--v-theme-primary));
  /* With opacity: */
  background: rgba(var(--v-theme-primary), 0.1);
}
```

### Anti-Pattern 7: Re-implementing Density in Custom Components

```vue
<!-- WRONG: custom density classes -->
<div :class="{ 'my-compact': density === 'compact' }">

<!-- RIGHT: use the composable -->
<script setup>
import { makeDensityProps, useDensity } from 'vuetify/lib/composables/density'
const props = defineProps({ ...makeDensityProps() })
const { densityClasses } = useDensity(props)
</script>
```

---

## Quick Reference: Claro4 Global Defaults

These are already configured in `vuetify.ts`. Do NOT repeat these as explicit props:

| Component | Defaults |
|---|---|
| VBtn | `variant: 'flat'`, `rounded: true`, `elevation: 1` |
| VCard | `elevation: 0`, `rounded: true` |
| VTextField, VSelect, VAutocomplete, VCombobox | `variant: 'outlined'`, `density: 'comfortable'`, `rounded: true`, `hideDetails: 'auto'` |
| VTextarea | `variant: 'outlined'`, `rounded: true`, `hideDetails: 'auto'` |
| VList | `bgColor: 'transparent'`, `rounded: true` |
| VListItem | `rounded: true`, `minHeight: '40px'` |
| VNavigationDrawer | `rounded: true`, `elevation: 3` |
| VDialog | `maxWidth: '700px'`, `rounded: true` |
| VAlert | `rounded: true`, `variant: 'tonal'` |
| VChip, VBadge | `rounded: 'pill'` |
| VExpansionPanel | `rounded: true`, `elevation: 0` |

Only set props that **differ** from these defaults for a specific instance.
