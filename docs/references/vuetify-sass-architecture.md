# Vuetify 4 SASS/CSS Architecture Reference

## 1. Settings Layer

### 1.1 File Structure

```
packages/vuetify/src/styles/
  settings/
    _index.sass          # @forward barrel for all settings modules
    _variables.scss      # Global design tokens (spacing, typography, breakpoints, etc.)
    _colors.scss         # Material Design color palette maps ($red, $pink, etc.)
    _elevations.scss     # Shadow maps ($shadow-key, $shadow-ambient)
    _utilities.scss      # Utility class generation config (margin, padding, flex, etc.)
  tools/
    _index.sass          # @forward barrel for all tool mixins/functions
    _functions.sass      # map-deep-merge(), map-deep-get(), theme-color(), roundEven()
    _layer.scss          # @layer wrapping mixin
    _variant.sass        # Variant mixin (elevated, flat, outlined, text, tonal, plain)
    _states.sass         # Interactive state overlay mixin (hover, focus, active)
    _elevation.sass      # Box-shadow mixin
    _density.sass        # Density modifier mixin
    _border.sass         # Border mixin
    _rounded.sass        # Border-radius mixin
    _theme.sass          # Background/color theme mixin
    _position.sass       # Position modifier mixin (absolute, fixed, sticky)
    _absolute.sass       # Absolute positioning mixin
    _typography.sass     # Typography utility generator
    _utilities.sass      # General utility generator
    _display.sass        # Display utility generator
    _rtl.sass            # RTL support mixin
```

### 1.2 Global Variables (`_variables.scss`)

All variables use `!default` and can be overridden before import.

#### Root Design Tokens

| Variable | Default | Purpose |
|---|---|---|
| `$body-font-family` | `var(--v-font-body, 'Roboto', sans-serif)` | Base body font |
| `$heading-font-family` | `var(--v-font-heading, #{$body-font-family})` | Heading font |
| `$font-size-root` | `1rem` | Root font size |
| `$line-height-root` | `1.5` | Root line height |
| `$border-color-root` | `rgba(var(--v-border-color), var(--v-border-opacity))` | Default border color |
| `$border-radius-root` | `4px` | Base border radius (components derive from this) |
| `$border-style-root` | `solid` | Default border style |
| `$border-width-root` | `thin` | Default border width |
| `$transition-duration-root` | `0.3s` | Standard transition duration |
| `$standard-easing` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard easing curve |
| `$decelerated-easing` | `cubic-bezier(0.0, 0, 0.2, 1)` | Entering easing |
| `$accelerated-easing` | `cubic-bezier(0.4, 0, 1, 1)` | Leaving easing |

#### Spacing System

| Variable | Default | Purpose |
|---|---|---|
| `$spacer` | `4px` | Base spacing unit |
| `$spacers-steps` | `16` | Number of spacer steps (0-16) |
| `$spacers` | Auto-generated map `(0: 0, 1: 4px, 2: 8px, ... 16: 64px)` | Spacing scale |
| `$negative-spacers` | Auto-generated map `(n1: -4px, n2: -8px, ...)` | Negative spacing |

#### Breakpoints

| Variable | Default | Purpose |
|---|---|---|
| `$grid-breakpoints` | `(xs: 0, sm: 600px, md: 840px, lg: 1145px, xl: 1545px, xxl: 2138px)` | Responsive breakpoints |
| `$grid-columns` | `12` | Grid column count |
| `$grid-gutter` | `24px` (`$spacer * 6`) | Grid gutter |
| `$container-padding-x` | `16px` (`$spacer * 4`) | Container horizontal padding |

#### Size Scale

| Variable | Default | Purpose |
|---|---|---|
| `$size-scale` | `8px` (`$spacer * 2`) | Step size between component sizes |
| `$size-scales` | `(x-small: -2, small: -1, default: 0, large: 1, x-large: 2)` | Named size multipliers |

#### Border Radius Tokens

| Key | Value | Generated From |
|---|---|---|
| `0` | `0` | Literal |
| `sm` | `2px` | `$border-radius-root * 0.5` |
| `null` / `md` | `4px` | `$border-radius-root` |
| `lg` | `8px` | `$border-radius-root * 2` |
| `xl` | `24px` | `$border-radius-root * 6` |
| `pill` | `9999px` | Literal |
| `circle` | `50%` | Literal |
| `shaped` | `24px 0` | `$border-radius-root * 6` and `0` |

#### Typography Scale (Material Design 3)

The `$typography` map contains 15 type roles. Each entry has `size`, `weight`, `line-height`, `letter-spacing`, and `font-family`.

| Role | Size | Weight | Line Height |
|---|---|---|---|
| `display-large` | `3.5625rem` | 400 | 1.123 |
| `display-medium` | `2.8125rem` | 400 | 1.156 |
| `display-small` | `2.25rem` | 400 | 1.222 |
| `headline-large` | `2rem` | 400 | 1.25 |
| `headline-medium` | `1.75rem` | 400 | 1.286 |
| `headline-small` | `1.5rem` | 400 | 1.333 |
| `title-large` | `1.375rem` | 400 | 1.273 |
| `title-medium` | `1rem` | 500 | 1.5 |
| `title-small` | `0.875rem` | 500 | 1.429 |
| `body-large` | `1rem` | 400 | 1.5 |
| `body-medium` | `0.875rem` | 400 | 1.429 |
| `body-small` | `0.75rem` | 400 | 1.333 |
| `label-large` | `0.875rem` | 500 | 1.429 |
| `label-medium` | `0.75rem` | 500 | 1.333 |
| `label-small` | `0.6875rem` | 500 | 1.455 |

### 1.3 Elevations (`_elevations.scss`)

Shadow levels 0-5. Each has a key shadow and ambient shadow component:

| Variable | Purpose |
|---|---|
| `$shadow-key-color` | `rgba(var(--v-shadow-color), var(--v-shadow-key-opacity, 0.3))` |
| `$shadow-ambient-color` | `rgba(var(--v-shadow-color), var(--v-shadow-ambient-opacity, 0.15))` |
| `$shadow-key` | Map of levels 0-5 to key shadow values |
| `$shadow-ambient` | Map of levels 0-5 to ambient shadow values |
| `$elevation-overlay-step` | `2%` per level for overlay tinting |

### 1.4 Key Tool Functions

```scss
// Deep merge for map overrides (used everywhere)
@function map-deep-merge($parent-map, $child-map)

// Nested map access
@function map-deep-get($map, $keys...)

// Generate theme-aware color value using color-mix
// Returns: color-mix(in srgb, rgb(var(--v-theme-#{$color})) calc($opacity * 100%), transparent)
@function theme-color($color, $opacity: 1)
```

### 1.5 How to Customize Settings

Override variables **before** importing Vuetify's styles. In a Vite project using `vite-plugin-vuetify`:

```scss
// src/styles/settings.scss  (configured in vite.config.ts)
@use 'vuetify/settings' with (
  $border-radius-root: 8px,
  $body-font-family: ('Inter', sans-serif),
  $spacer: 6px,
);
```

Component-level variable overrides work the same way:

```scss
@use 'vuetify/settings' with (
  $border-radius-root: 8px,
);

@forward 'vuetify/components/VCard/variables' with (
  $card-border-radius: 12px,
  $card-elevation: 0,
);
```

---

## 2. Component Styles

### 2.1 Pattern

Every component follows this structure:

```
components/{Name}/
  _variables.scss   # All SASS variables with !default, references settings/tools
  _mixins.scss      # Optional component-specific mixins
  {Name}.sass       # Style rules consuming variables via tools.layer('components')
```

All component styles are wrapped in `@include tools.layer('components')`, which emits `@layer vuetify-components { ... }`.

### 2.2 VCard

**Variables file**: `components/VCard/_variables.scss`

| Variable | Default | Derives From |
|---|---|---|
| `$card-background` | `rgb(var(--v-theme-surface))` | Theme |
| `$card-color` | `theme-color('on-surface', var(--v-high-emphasis-opacity))` | Theme |
| `$card-border-radius` | `settings.$border-radius-root` | Global `4px` |
| `$card-border-width` | `0` | -- |
| `$card-border-thin-width` | `thin` | -- |
| `$card-elevation` | `1` | -- |
| `$card-hover-elevation` | `3` | -- |
| `$card-padding` | `0` | -- |
| `$card-disabled-opacity` | `0.6` | -- |
| `$card-plain-opacity` | `0.62` | -- |
| `$card-transition-duration` | `0.28s` | -- |
| `$card-transition-timing-function` | `settings.$standard-easing` | Global easing |
| `$card-item-padding` | `0.625rem 1rem` | -- |
| `$card-title-font-size` | from `settings.$typography, 'title-large', 'size'` | `1.375rem` |
| `$card-title-padding` | `0.5rem 1rem` | -- |
| `$card-subtitle-font-size` | from `settings.$typography, 'body-medium', 'size'` | `0.875rem` |
| `$card-text-padding` | `1rem` | -- |
| `$card-actions-padding` | `0.5rem` | -- |
| `$card-actions-gap` | `0.5rem` | -- |

**CSS classes emitted**:

| Class | Purpose |
|---|---|
| `.v-card` | Root element |
| `.v-card--variant-elevated` | Elevated variant (background + shadow) |
| `.v-card--variant-flat` | Flat variant (background, no shadow) |
| `.v-card--variant-outlined` | Outlined variant (border, transparent bg) |
| `.v-card--variant-text` | Text variant (transparent bg, overlay) |
| `.v-card--variant-tonal` | Tonal variant (tinted underlay) |
| `.v-card--variant-plain` | Plain variant (reduced opacity) |
| `.v-card--disabled` | Disabled state |
| `.v-card--flat` | Forces no box-shadow |
| `.v-card--hover` | Hover elevation animation via `::before`/`::after` |
| `.v-card--link` | Pointer cursor |
| `.v-card--border` | Applies `$card-border-thin-width` |
| `.v-card--absolute` / `.v-card--fixed` | Positioning |
| `.v-card--density-comfortable` / `--density-compact` | Density modifiers (via line-height) |
| `.v-card-actions` | Actions container |
| `.v-card-item` | Grid-based header (prepend / content / append) |
| `.v-card-title` | Title text |
| `.v-card-subtitle` | Subtitle text |
| `.v-card-text` | Body text |
| `.v-card__image` | Background image |
| `.v-card__overlay` | State overlay (hover/focus/active opacity) |
| `.v-card__loader` | Loading indicator |

### 2.3 VBtn

**Variables file**: `components/VBtn/_variables.scss`

| Variable | Default | Derives From |
|---|---|---|
| `$button-background` | `rgb(var(--v-theme-surface))` | Theme |
| `$button-color` | `theme-color('on-surface', var(--v-high-emphasis-opacity))` | Theme |
| `$button-border-radius` | `settings.$border-radius-root` | Global `4px` |
| `$button-height` | `36px` | -- |
| `$button-font-size` | from `settings.$typography, 'label-large', 'size'` | `0.875rem` |
| `$button-font-weight` | from `settings.$typography, 'label-large', 'weight'` | `500` |
| `$button-text-letter-spacing` | from `settings.$typography, 'label-large', 'letter-spacing'` | `0.0071em` |
| `$button-text-transform` | `none` | -- |
| `$button-elevation` | `(default: 1, hover: 2, active: 1)` | -- |
| `$button-disabled-opacity` | `0.26` | -- |
| `$button-plain-opacity` | `0.62` | -- |
| `$button-icon-border-radius` | `settings.$rounded, 'circle'` | `50%` |
| `$button-rounded-border-radius` | `settings.$rounded, 'xl'` | `24px` |
| `$button-stacked-height` | `72px` | -- |
| `$button-density` | `(default: 0, comfortable: -2, compact: -3)` | -- |

**Size system**: Sizes are computed from `$button-height` + `$size-scale * multiplier`. For each named size (x-small through x-large), the mixin emits CSS custom properties:

```css
.v-btn--size-default {
  --v-btn-size: 0.875rem;     /* font-size */
  --v-btn-height: 36px;        /* base height */
  font-size: var(--v-btn-size);
  min-width: 64px;              /* roundEven(height * width-ratio) */
  padding: 0 16px;              /* roundEven(height / padding-ratio) */
}
```

**CSS classes emitted**:

| Class | Purpose |
|---|---|
| `.v-btn` | Root element |
| `.v-btn--variant-elevated` | Elevated (has shadow, hover/active shadow changes) |
| `.v-btn--variant-flat` | Flat (background, no shadow) |
| `.v-btn--variant-outlined` | Outlined border |
| `.v-btn--variant-text` | Text-only with overlay |
| `.v-btn--variant-tonal` | Tonal with underlay |
| `.v-btn--variant-plain` | Plain with reduced opacity |
| `.v-btn--size-{x-small\|small\|default\|large\|x-large}` | Size classes |
| `.v-btn--density-{default\|comfortable\|compact}` | Density classes |
| `.v-btn--icon` | Icon-only button (circle, no min-width) |
| `.v-btn--block` | Full-width |
| `.v-btn--stacked` | Vertical layout (icon above text) |
| `.v-btn--disabled` | Disabled state |
| `.v-btn--loading` | Loading state (hides content) |
| `.v-btn--rounded` | Pill-shaped (xl radius) |
| `.v-btn--slim` | Reduced padding |
| `.v-btn__overlay` | State overlay element |
| `.v-btn__underlay` | Tonal underlay element |
| `.v-btn__content` | Content wrapper |
| `.v-btn__prepend` / `.v-btn__append` | Icon slots |
| `.v-btn__loader` | Loading spinner container |

### 2.4 VTextField

**Variables file**: `components/VTextField/_variables.scss` (also re-exports `VField/variables`)

| Variable | Default | Derives From |
|---|---|---|
| `$text-field-border-radius` | `settings.$border-radius-root` | Global `4px` |
| `$text-field-affix-color` | `theme-color('on-surface', var(--v-medium-emphasis-opacity))` | Theme |
| `$text-field-disabled-affix-color` | `theme-color('on-surface', var(--v-disabled-opacity))` | Theme |
| `$text-field-input-flex` | `1` | -- |
| `$text-field-input-transition` | `.15s opacity settings.$standard-easing` | Global easing |

Key VField variables (inherited):

| Variable | Default |
|---|---|
| `$field-border-radius` | `settings.$border-radius-root` |
| `$field-color` | `theme-color('on-surface', var(--v-medium-emphasis-opacity))` |
| `$field-error-color` | `rgb(var(--v-theme-error))` |
| `$field-font-size` | `16px` |
| `$field-control-filled-background` | `theme-color('on-surface', var(--v-idle-opacity))` |
| `$field-control-padding-start` | `16px` |
| `$field-control-padding-end` | `16px` |
| `$field-control-height` | `56px` |
| `$field-outline-opacity` | `0.38` |
| `$field-border-width` | `1px` |
| `$field-focused-border-width` | `2px` |
| `$field-label-floating-scale` | `0.75` |

**CSS classes emitted**: `.v-text-field`, `.v-text-field--prefixed`, `.v-text-field--suffixed`, `.v-text-field__prefix`, `.v-text-field__suffix`. The field chrome itself comes from `VField` (`.v-field`, `.v-field--variant-outlined`, etc.).

### 2.5 VAlert

**Variables file**: `components/VAlert/_variables.scss`

| Variable | Default | Derives From |
|---|---|---|
| `$alert-background` | `rgb(var(--v-theme-surface-light))` | Theme |
| `$alert-color` | `theme-color('on-surface-light', var(--v-high-emphasis-opacity))` | Theme |
| `$alert-border-radius` | `settings.$border-radius-root` | Global `4px` |
| `$alert-border-thin-width` | `8px` | -- |
| `$alert-border-opacity` | `0.38` | -- |
| `$alert-elevation` | `1` | -- |
| `$alert-padding` | `16px` | -- |
| `$alert-plain-opacity` | `0.62` | -- |
| `$alert-density` | `(default: 0, comfortable: -1, compact: -2)` | -- |
| `$alert-prepend-icon-size` | `1.75rem` | -- |
| `$alert-title-font-size` | from `settings.$typography, 'headline-small', 'size'` | `1.5rem` |
| `$alert-title-font-weight` | from `settings.$typography, 'headline-small', 'weight'` | `400` |

**CSS classes emitted**:

| Class | Purpose |
|---|---|
| `.v-alert` | Root (grid layout) |
| `.v-alert--variant-elevated` / `flat` / `outlined` / `text` / `tonal` / `plain` | Variants |
| `.v-alert--border` | Has colored border |
| `.v-alert--border-start` / `end` / `top` / `bottom` | Border position |
| `.v-alert--prominent` | Modified grid for larger icon area |
| `.v-alert--density-comfortable` / `compact` | Adjusts vertical padding |
| `.v-alert__border` | Border overlay element |
| `.v-alert__prepend` | Icon area |
| `.v-alert__content` | Main content area |
| `.v-alert__append` | Append slot |
| `.v-alert__close` | Close button container |
| `.v-alert__underlay` | Tonal underlay |
| `.v-alert-title` | Title text |

---

## 3. Theme Integration

### 3.1 How `createVuetify({ theme })` Works

The theme system is implemented in `composables/theme.ts`. When you call:

```ts
createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1867C0',
          secondary: '#48A9A6',
          surface: '#FFFFFF',
          background: '#FFFFFF',
          error: '#B00020',
          // ...
        },
        variables: {
          'border-color': '#000000',
          'border-opacity': 0.12,
          'high-emphasis-opacity': 0.87,
          // ...
        },
      },
    },
  },
})
```

The following processing occurs:

1. **Merge with defaults**: User theme is deep-merged with built-in light/dark defaults.
2. **Auto-generate `on-*` colors**: For every color (e.g., `primary`), if no `on-primary` is provided, one is auto-generated based on luminance contrast (light foreground vs dark foreground).
3. **Generate variations**: If `variations` is configured, lighten/darken variants are generated.
4. **Convert to CSS custom properties**: Each color hex is parsed to RGB and emitted as a CSS variable.

### 3.2 CSS Custom Property Output

For theme color `primary: '#1867C0'`, the system generates:

```css
:root {
  --v-theme-primary: 24,103,192;
  --v-theme-primary-overlay-multiplier: 2;
  --v-theme-on-primary: 255,255,255;
}
```

For theme variable `'border-opacity': 0.12`:

```css
:root {
  --v-border-opacity: 0.12;
}
```

For theme variable `'border-color': '#000000'` (hex strings are auto-converted to RGB):

```css
:root {
  --v-border-color: 0, 0, 0;
}
```

### 3.3 Default Theme Colors

| Color Key | Light Default | Dark Default |
|---|---|---|
| `background` | `#FFFFFF` | `#121212` |
| `surface` | `#FFFFFF` | `#212121` |
| `surface-bright` | `#FFFFFF` | `#ccbfd6` |
| `surface-light` | `#EEEEEE` | `#424242` |
| `surface-variant` | `#424242` | `#c8c8c8` |
| `primary` | `#1867C0` | `#2196F3` |
| `secondary` | `#48A9A6` | `#54B6B2` |
| `error` | `#B00020` | `#CF6679` |
| `info` | `#2196F3` | `#2196F3` |
| `success` | `#4CAF50` | `#4CAF50` |
| `warning` | `#FB8C00` | `#FB8C00` |

### 3.4 Default Theme Variables

| Variable Key | Light | Dark | CSS Property |
|---|---|---|---|
| `border-color` | `#000000` | `#FFFFFF` | `--v-border-color` |
| `border-opacity` | `0.12` | `0.12` | `--v-border-opacity` |
| `shadow-color` | `#000000` | `#000000` | `--v-shadow-color` |
| `high-emphasis-opacity` | `0.87` | `1` | `--v-high-emphasis-opacity` |
| `medium-emphasis-opacity` | `0.60` | `0.70` | `--v-medium-emphasis-opacity` |
| `disabled-opacity` | `0.38` | `0.50` | `--v-disabled-opacity` |
| `idle-opacity` | `0.04` | `0.10` | `--v-idle-opacity` |
| `hover-opacity` | `0.04` | `0.04` | `--v-hover-opacity` |
| `focus-opacity` | `0.12` | `0.12` | `--v-focus-opacity` |
| `selected-opacity` | `0.08` | `0.08` | `--v-selected-opacity` |
| `activated-opacity` | `0.12` | `0.12` | `--v-activated-opacity` |
| `pressed-opacity` | `0.12` | `0.16` | `--v-pressed-opacity` |
| `dragged-opacity` | `0.08` | `0.08` | `--v-dragged-opacity` |

### 3.5 How Components Consume Theme

In SASS, the `theme-color()` function generates CSS that reads theme variables at runtime:

```scss
// In _functions.sass:
@function theme-color($color, $opacity: 1)
  $color: rgb(var(--v-theme-#{$color}))
  $color: color-mix(in srgb, $color calc($opacity * 100%), transparent)
  @return $color

// Usage in component _variables.scss:
$card-color: tools.theme-color('on-surface', var(--v-high-emphasis-opacity));
// Compiles to: color-mix(in srgb, rgb(var(--v-theme-on-surface)) calc(var(--v-high-emphasis-opacity) * 100%), transparent)
```

Background colors reference theme variables directly:

```scss
$card-background: rgb(var(--v-theme-surface));
```

### 3.6 Theme Class Selectors

Each named theme gets a CSS class `.v-theme--{name}` (e.g., `.v-theme--light`, `.v-theme--dark`). These classes contain the full set of CSS custom properties for that theme and can be applied to any element to create scoped theme zones.

### 3.7 CSS Layer Structure

Styles are emitted in a strict cascade order via `@layer`:

```
@layer vuetify-core {
  @layer reset, base;
}
@layer vuetify-components;
@layer vuetify-overrides;
@layer vuetify-utilities {
  @layer theme-base;
  @layer typography;
  @layer helpers;
  @layer theme-background;
  @layer theme-foreground;
}
@layer vuetify-final {
  @layer transitions, trumps;
}
```

- **vuetify-core**: Resets and base element styles
- **vuetify-components**: All component styles (`.v-card`, `.v-btn`, etc.)
- **vuetify-overrides**: Contextual styles for nested component combinations
- **vuetify-utilities**: Theme variables on `:root`, utility classes (`.bg-primary`, `.text-primary`, `.border-primary`, margin/padding helpers, typography classes)
- **vuetify-final**: Transitions and "trump" overrides that must win

### 3.8 Generated Utility Classes from Theme

For each theme color key, the system generates:

| Pattern | Example | Effect |
|---|---|---|
| `.bg-{color}` | `.bg-primary` | Sets `background-color`, `color` (to on-color), and overlay multiplier |
| `.text-{color}` | `.text-primary` | Sets `color` |
| `.border-{color}` | `.border-primary` | Sets `--v-border-color` |
| `.{on-color}` | `.on-primary` | Sets `color` to the on-color |

---

## 4. Custom Token Hookpoints

### 4.1 Override Hierarchy

```
1. SASS variable override   (compile-time, highest control, requires rebuild)
2. Theme colors/variables    (runtime, via createVuetify({ theme }))
3. CSS custom properties     (runtime, via stylesheet or inline style)
4. Raw CSS rules             (last resort, fragile)
```

### 4.2 SASS Variable Overrides (Preferred)

Override Vuetify SASS variables at build time. This changes the compiled output.

```scss
// Override global token: all components using border-radius-root will update
@use 'vuetify/settings' with (
  $border-radius-root: 8px,
);

// Override a single component:
@forward 'vuetify/components/VBtn/variables' with (
  $button-height: 40px,
  $button-border-radius: 8px,
);
```

**Safe**: Changes propagate through the dependency chain. If `$card-border-radius` defaults to `settings.$border-radius-root`, overriding the root changes all components that derive from it.

### 4.3 Theme Color/Variable Overrides (Runtime)

Add custom colors or adjust opacity variables at theme definition time:

```ts
createVuetify({
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#6750A4',              // Change primary color
          'claro-brand': '#FF5722',        // Add custom named color
          'surface-light': '#F5F0FF',      // Override surface tint
        },
        variables: {
          'border-opacity': 0.08,          // Subtler borders
          'high-emphasis-opacity': 0.92,   // Slightly less contrast
          'hover-opacity': 0.06,           // Adjust hover state
        },
      },
    },
  },
})
```

Custom colors added here automatically get:
- CSS variable: `--v-theme-claro-brand: 255,87,34`
- Auto-generated on-color: `--v-theme-on-claro-brand: 255,255,255`
- Utility classes: `.bg-claro-brand`, `.text-claro-brand`, `.border-claro-brand`

### 4.4 CSS Custom Property Overrides (No Rebuild)

For overrides that do not require a rebuild and are not covered by theme config:

```css
/* Override globally */
:root {
  --v-font-body: 'Inter', sans-serif;
  --v-font-heading: 'Inter', sans-serif;
}

/* Override per-component via CSS custom properties that components expose */
.v-btn {
  --v-btn-height: 40px;
}

/* Override theme variables scoped to a container */
.claro-sidebar {
  --v-high-emphasis-opacity: 1;
  --v-medium-emphasis-opacity: 0.8;
}
```

#### Exposed CSS Custom Properties (set by components at runtime)

| Property | Set By | Purpose |
|---|---|---|
| `--v-theme-{color}` | Theme system | RGB triplet for each color |
| `--v-theme-{color}-overlay-multiplier` | Theme system | Light/dark surface indicator (1 or 2) |
| `--v-border-color` | Theme system | Border color RGB |
| `--v-border-opacity` | Theme system | Border opacity |
| `--v-shadow-color` | Theme system | Shadow color RGB |
| `--v-shadow-key-opacity` | Theme system | Key shadow opacity (default `0.3`) |
| `--v-shadow-ambient-opacity` | Theme system | Ambient shadow opacity (default `0.15`) |
| `--v-hover-opacity` | Theme system | Hover state opacity |
| `--v-focus-opacity` | Theme system | Focus state opacity |
| `--v-activated-opacity` | Theme system | Active state opacity |
| `--v-pressed-opacity` | Theme system | Pressed state opacity |
| `--v-high-emphasis-opacity` | Theme system | High emphasis text opacity |
| `--v-medium-emphasis-opacity` | Theme system | Medium emphasis text opacity |
| `--v-disabled-opacity` | Theme system | Disabled state opacity |
| `--v-idle-opacity` | Theme system | Idle/filled background opacity |
| `--v-font-body` | Stylesheet | Body font family |
| `--v-font-heading` | Stylesheet | Heading font family |
| `--v-btn-height` | VBtn size classes | Button computed height |
| `--v-btn-size` | VBtn size classes | Button font size |
| `--v-field-padding-start` | VField | Field start padding |
| `--v-field-padding-end` | VField | Field end padding |
| `--v-field-padding-top` | VField | Field top padding |
| `--v-field-padding-bottom` | VField | Field bottom padding |
| `--v-input-padding-top` | VInput | Extra input top padding |
| `--v-input-control-height` | VInput | Input control height |
| `--v-card-subtitle-opacity` | Consumer | Card subtitle opacity override |
| `--v-card-text-opacity` | Consumer | Card text opacity override |
| `--v-elevation-overlay` | Elevation mixin | Elevation tint overlay color |
| `--v-elevation-overlay-color` | Theme variable | Color for elevation overlays |
| `--v-icon-size-multiplier` | VIcon context | Icon size relative adjustment |

### 4.5 Where `--claro-*` Custom Properties Fit

Define claro-specific tokens as a separate layer that maps to Vuetify's hookpoints:

```css
/* claro-tokens.css - loaded after Vuetify styles */

:root {
  /* Claro design tokens */
  --claro-radius-sm: 6px;
  --claro-radius-md: 10px;
  --claro-radius-lg: 16px;
  --claro-spacing-unit: 6px;
  --claro-font-body: 'Inter', sans-serif;
  --claro-font-heading: 'Inter', sans-serif;

  /* Map to Vuetify hookpoints */
  --v-font-body: var(--claro-font-body);
  --v-font-heading: var(--claro-font-heading);
}
```

For properties that Vuetify does not expose as CSS custom properties (like `$border-radius-root`), use SASS variable overrides at build time:

```scss
@use 'vuetify/settings' with (
  $border-radius-root: 10px,
);
```

### 4.6 Raw CSS Overrides (Last Resort)

When neither SASS variables nor CSS custom properties can achieve the goal, target Vuetify's CSS classes directly. Use the `@layer` system to ensure correct cascade:

```css
/* Place in a layer after vuetify-components but before vuetify-utilities */
@layer vuetify-overrides {
  .v-card {
    border-radius: var(--claro-radius-lg);
  }

  .v-btn--rounded {
    border-radius: var(--claro-radius-md);
  }
}
```

**Warning**: Raw CSS overrides are fragile -- they break when Vuetify changes internal class names or DOM structure between versions.

---

## 5. Practical Rules

### 5.1 Override Decision Table

| Goal | Method | Rebuild? | Fragility |
|---|---|---|---|
| Change base border radius for all components | `$border-radius-root` SASS override | Yes | Low |
| Change a single component's radius | `$card-border-radius` SASS override | Yes | Low |
| Change theme colors (primary, surface, etc.) | `createVuetify({ theme })` colors | No | Low |
| Adjust emphasis/opacity levels | `createVuetify({ theme })` variables | No | Low |
| Add custom named colors with utilities | `createVuetify({ theme })` colors | No | Low |
| Change font family | `--v-font-body` / `--v-font-heading` CSS vars | No | Low |
| Adjust button height per-instance | `--v-btn-height` CSS variable | No | Low |
| Change field padding | `--v-field-padding-*` CSS variables | No | Low |
| Override component appearance beyond exposed hookpoints | Raw CSS in `@layer vuetify-overrides` | No | High |

### 5.2 Common Pitfalls

1. **Do not use `!important`**. Vuetify 4 uses CSS `@layer` for cascade control. Place overrides in the `vuetify-overrides` layer instead.

2. **Colors are RGB triplets, not hex**. The `--v-theme-primary` variable holds `24,103,192` not `#1867C0`. Use `rgb(var(--v-theme-primary))` to consume them.

3. **`on-*` colors are auto-generated**. If you add `colors: { 'claro-brand': '#FF5722' }`, Vuetify auto-generates `on-claro-brand`. To override the auto-generated value, explicitly set `'on-claro-brand': '#FFFFFF'`.

4. **Variant classes control background/color pairing**. Do not set `background` or `color` directly on `.v-card` -- use the `variant` prop (`elevated`, `flat`, `outlined`, `text`, `tonal`, `plain`) which triggers the correct class and overlay behavior.

5. **Density affects padding/height, not font-size**. The density system modifies vertical spacing by multiplying `$spacer` by the density modifier. Font sizes remain unchanged.

6. **The `theme-color()` function uses `color-mix()`**. This is a CSS-native function that requires browser support (all modern browsers). It replaces the older `rgba()` approach.

7. **Component SASS variables reference settings at compile time**. If `$card-border-radius: settings.$border-radius-root`, overriding `$border-radius-root` propagates to the card. But overriding `$card-border-radius` directly takes priority over the global.

8. **Layer order matters for raw overrides**. The layer order is: `vuetify-core` < `vuetify-components` < `vuetify-overrides` < `vuetify-utilities` < `vuetify-final`. Place component overrides in `vuetify-overrides`. Place utility-level overrides after `vuetify-utilities`.

9. **Elevation uses two shadow components**. Each elevation level emits both a key shadow and an ambient shadow, plus a `--v-elevation-overlay` CSS variable for surface tinting. Override `--v-shadow-color`, `--v-shadow-key-opacity`, and `--v-shadow-ambient-opacity` to adjust shadow appearance without changing the geometry.

10. **Font variables use CSS var() with fallback**. `$body-font-family` defaults to `var(--v-font-body, 'Roboto', sans-serif)`. Set `--v-font-body` in CSS to change the font without a SASS rebuild.

### 5.3 Quick Reference: Variant Mixin Output

The `@include tools.variant()` mixin (used by VCard, VBtn, VAlert) generates this class pattern:

| Variant | Background | Color | Shadow | Special |
|---|---|---|---|---|
| `--variant-elevated` | `$background` | `$color` | `elevation($n)` | -- |
| `--variant-flat` | `$background` | `$color` | `elevation(0)` | -- |
| `--variant-outlined` | `transparent` | `inherit` | none | `border: thin solid currentColor` |
| `--variant-text` | `transparent` | `inherit` | none | Overlay uses `currentColor` |
| `--variant-tonal` | `transparent` | `inherit` | none | Underlay with `currentColor` at `--v-activated-opacity` |
| `--variant-plain` | `transparent` | `inherit` | none | `opacity: $plain-opacity`, full on hover/focus |

### 5.4 Quick Reference: State Overlay Opacity Formulas

The `@include tools.states()` mixin generates interactive state overlays:

| State | Opacity Formula |
|---|---|
| Hover | `var(--v-hover-opacity) * var(--v-theme-overlay-multiplier)` |
| Focus-visible | `var(--v-focus-opacity) * var(--v-theme-overlay-multiplier)` |
| Active | `var(--v-activated-opacity) * var(--v-theme-overlay-multiplier)` |
| Active + Hover | `(var(--v-activated-opacity) + var(--v-hover-opacity)) * var(--v-theme-overlay-multiplier)` |
| Active + Focus | `(var(--v-activated-opacity) + var(--v-focus-opacity)) * var(--v-theme-overlay-multiplier)` |

The `--v-theme-overlay-multiplier` is `1` for dark surfaces, `2` for light surfaces (auto-calculated from luminance). This ensures visible state feedback on both light and dark backgrounds.
