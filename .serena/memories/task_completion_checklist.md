# Task Completion Checklist

When a coding task is completed, run the following:

1. Lint: pnpm run lint (auto-fixes issues)
2. Type Check: vue-tsc --noEmit (if TypeScript was modified)
3. Tests: pnpm run test:run (or specific test file)
4. Build Check: pnpm run build:fast (quick verification)

## Notes
- Tests are in src/__tests__/ with Vitest + happy-dom
- Test setup file: src/__tests__/setup/setupTests.ts
- Tests are excluded from tsconfig.json (separate vitest.config.ts)
- Route guards in src/router/guards.ts are currently commented out
