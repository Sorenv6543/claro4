# Suggested Commands

## Development
pnpm run dev              # Start dev server (http://localhost:3000)
pnpm run preview          # Preview production build

## Building
pnpm run build:fast       # Quick build, no type-check
pnpm run build:production # Full production build
pnpm run build:owner-only # Owner interface only
pnpm run build:admin-only # Admin interface only

## Linting
pnpm run lint             # ESLint with auto-fix

## Testing
pnpm run test             # Vitest watch mode
pnpm run test:run         # Single run
pnpm run test:coverage    # With coverage
pnpm run test:performance # Performance regression tests
vitest run src/__tests__/path/to/file.spec.ts  # Single test file

## Type Checking
vue-tsc --noEmit          # TypeScript check (part of full build)

## Bundle Analysis
pnpm run analyze:bundle   # Analyze bundle output

## System Utilities (Windows)
git status / git diff / git log   # Git operations
dir                               # List directory
findstr                           # Search in files
