# Testing Patterns

**Analysis Date:** 2026-03-09

## Test Framework

**Runner:**
- Vitest 4.1.7
- Config: `vitest.config.ts`

**Assertion Library:**
- Included with Vitest (Chai/Jest-compatible expect)

**Run Commands:**
```bash
pnpm test                   # Run all tests in watch mode
pnpm test:run               # Run all tests once
pnpm test:coverage          # Run tests with V8 coverage reporting
pnpm test:performance       # Run performance regression tests
```

## Test File Organization

**Location:**
- Centralized in `src/__tests__/`.
- Subdirectories mirror `src/` structure: `components/`, `composables/`, `stores/`, `utils/`.

**Naming:**
- `[FileName].spec.ts` (e.g., `performance.spec.ts`).

**Structure:**
```
src/__tests__/
├── components/         # Component unit/integration tests
├── composables/        # Composable logic tests
├── setup/              # Vitest setup and global mocks
├── stores/             # Pinia store tests
└── utils/              # Business logic and helper tests
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(MyComponent, {
      props: { /* ... */ }
    })
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
  })
})
```

**Patterns:**
- **Setup:** Global mocks defined in `src/__tests__/setup/setupTests.ts`.
- **Teardown:** `clearMocks` and `restoreMocks` enabled in `vitest.config.ts`.
- **Assertion:** Vuetify-aware assertions (e.g., checking for specific classes or child components).

## Mocking

**Framework:** Vitest Built-in (`vi`).

**Patterns:**
```typescript
// Global Supabase mock in setupTests.ts
vi.mock('@/plugins/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    // ...
  }
}))
```

**What to Mock:**
- Network requests (Supabase).
- Browser APIs not available in `happy-dom` (e.g., `ResizeObserver`, `matchMedia`).
- Complex heavy libraries (e.g., `FullCalendar`, `Sentry`).

**What NOT to Mock:**
- Core Vue/Pinia logic.
- Pure business logic in `src/utils/`.

## Fixtures and Factories

**Test Data:**
- Often defined as local constants within spec files or shared in a `fixtures/` directory (not yet explicitly seen but standard).

**Location:**
- Typically `src/__tests__/fixtures/` (recommended).

## Coverage

**Requirements:** None explicitly enforced in `package.json`, but `test:coverage` script exists.

**View Coverage:**
```bash
pnpm test:coverage
```

## Test Types

**Unit Tests:**
- Focus on isolated logic in utils, stores, and composables.

**Integration Tests:**
- Component tests using `@vue/test-utils` that verify interaction between components and stores.

**E2E Tests:**
- Playwright used for full application flow testing.
- Location: `e2e/`.

## Common Patterns

**Async Testing:**
```typescript
it('handles async data', async () => {
  await wrapper.find('button').trigger('click')
  await nextTick() // or flushPromises()
  expect(wrapper.text()).toContain('Success')
})
```

**Error Testing:**
```typescript
it('shows error on failure', async () => {
  const errorStore = useErrorStore()
  errorStore.setError('Failed')
  await nextTick()
  expect(wrapper.find('.error-alert').exists()).toBe(true)
})
```

---

*Testing analysis: 2026-03-09*
