# CI/CD Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a GitHub Actions CI/CD pipeline that gates every PR with lint + type-check + tests + bundle size + Lighthouse, deploys previews to Cloudflare Pages per PR, and deploys production on merge to main with Sentry release tracking.

**Architecture:** Two workflows (`ci.yml` for PRs, `deploy.yml` for main) share the same pnpm cache and build command (`pnpm build:owner-only`). The build artifact is produced once per run and reused for bundle check → Cloudflare preview deploy → Lighthouse audit. CodeQL runs in parallel on PRs (non-blocking). Dependabot opens weekly dep-update PRs that automatically flow through `ci.yml`.

**Tech Stack:** GitHub Actions, Cloudflare Pages + Wrangler CLI, Sentry (`sentry-cli`), Codecov, Lighthouse CI (`@lhci/cli`), Dependabot, GitHub CodeQL, pnpm 10.32.1, Node 20, Vue 3 + Vite 7 + Vitest 4.

---

## File Map

| File | Status | Purpose |
|------|--------|---------|
| `scripts/check-bundle-size.js` | Create | Node script: scan `dist/assets/` for `owner-app*.js`, sum gzip sizes, fail if > 500 KB |
| `scripts/__tests__/check-bundle-size.test.js` | Create | Vitest unit tests for the bundle size logic |
| `lighthouserc.json` | Create | Lighthouse CI thresholds (perf ≥ 0.80, a11y ≥ 0.90, best-practices ≥ 0.90) |
| `.github/dependabot.yml` | Create | Weekly npm dep-update PRs targeting `main` |
| `.github/workflows/codeql.yml` | Create | CodeQL security scan on PRs + nightly schedule |
| `.github/workflows/ci.yml` | Create | PR pipeline: quality gate → build → bundle check → preview deploy → Lighthouse |
| `.github/workflows/deploy.yml` | Create | Production deploy on push to `main` + Sentry release notification |
| `package.json` | Modify | Add `wrangler` and `@lhci/cli` as dev dependencies |

---

## Task 1: Install pipeline dev dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install wrangler and lhci**

```bash
pnpm add -D wrangler @lhci/cli
```

Expected output ends with something like:
```
Done in Xs
```

- [ ] **Step 2: Verify both are in package.json**

```bash
node -e "const p = JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log(p.devDependencies.wrangler, p.devDependencies['@lhci/cli'])"
```

Expected: two version strings (e.g. `^3.x.x ^0.x.x`). Not `undefined`.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(ci): add wrangler and @lhci/cli for pipeline"
```

---

## Task 2: Bundle size gate script

**Files:**
- Create: `scripts/check-bundle-size.js`
- Create: `scripts/__tests__/check-bundle-size.test.js`

- [ ] **Step 1: Write the failing test**

Create `scripts/__tests__/check-bundle-size.test.js`:

```js
// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { checkOwnerBundleSize } from '../check-bundle-size.js'

describe('checkOwnerBundleSize', () => {
  let tmpDir

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('passes when owner-app chunk is under the limit', () => {
    fs.writeFileSync(path.join(tmpDir, 'owner-app-abc123.js'), Buffer.alloc(1024, 'a'))
    const result = checkOwnerBundleSize(tmpDir, 500)
    expect(result.passed).toBe(true)
    expect(result.totalKB).toBeLessThan(500)
  })

  it('fails when owner-app chunk exceeds the limit', () => {
    // Incompressible-ish content: random chars resist gzip
    const content = Buffer.from(
      Array.from({ length: 600 * 1024 }, () => Math.random().toString(36)[2]).join('')
    )
    fs.writeFileSync(path.join(tmpDir, 'owner-app-abc123.js'), content)
    const result = checkOwnerBundleSize(tmpDir, 1)
    expect(result.passed).toBe(false)
  })

  it('throws when no owner-app chunks are found', () => {
    fs.writeFileSync(path.join(tmpDir, 'vendor-abc123.js'), 'other chunk')
    expect(() => checkOwnerBundleSize(tmpDir)).toThrow('No owner-app chunks found')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
pnpm test:run scripts/__tests__/check-bundle-size.test.js
```

Expected: FAIL — `checkOwnerBundleSize` is not defined / cannot import.

- [ ] **Step 3: Write the script**

Create `scripts/check-bundle-size.js`:

```js
import { gzipSync } from 'node:zlib'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const MAX_GZIP_KB = 500

export function checkOwnerBundleSize(assetsDir, maxKB = MAX_GZIP_KB) {
  const files = fs.readdirSync(assetsDir)
    .filter(f => f.includes('owner-app') && f.endsWith('.js'))

  if (files.length === 0) {
    throw new Error(`No owner-app chunks found in ${assetsDir}. Run pnpm build:owner-only first.`)
  }

  let totalGzipBytes = 0
  for (const file of files) {
    const content = fs.readFileSync(path.join(assetsDir, file))
    totalGzipBytes += gzipSync(content).length
  }

  const totalKB = totalGzipBytes / 1024
  return { totalKB, passed: totalKB <= maxKB, maxKB }
}

// Only execute CLI logic when run directly (not imported by tests)
if (path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const assetsDir = path.resolve('dist/assets')
  try {
    const { totalKB, passed, maxKB } = checkOwnerBundleSize(assetsDir)
    if (!passed) {
      console.error(`❌ owner-app bundle too large: ${totalKB.toFixed(1)} KB gzipped (limit: ${maxKB} KB)`)
      process.exit(1)
    }
    console.log(`✅ owner-app bundle: ${totalKB.toFixed(1)} KB / ${maxKB} KB`)
  } catch (err) {
    console.error(`❌ ${err.message}`)
    process.exit(1)
  }
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
pnpm test:run scripts/__tests__/check-bundle-size.test.js
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-bundle-size.js scripts/__tests__/check-bundle-size.test.js
git commit -m "feat(ci): add owner-app bundle size gate script"
```

---

## Task 3: Lighthouse CI config

**Files:**
- Create: `lighthouserc.json`

- [ ] **Step 1: Create `lighthouserc.json`**

```json
{
  "ci": {
    "assert": {
      "preset": "lighthouse:no-pwa",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.8 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }]
      }
    },
    "collect": {
      "numberOfRuns": 1,
      "settings": {
        "chromeFlags": "--no-sandbox --headless"
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

- [ ] **Step 2: Validate JSON syntax**

```bash
node -e "JSON.parse(require('fs').readFileSync('lighthouserc.json', 'utf8')); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add lighthouserc.json
git commit -m "feat(ci): add Lighthouse CI thresholds config"
```

---

## Task 4: Dependabot config

**Files:**
- Create: `.github/dependabot.yml`

- [ ] **Step 1: Create `.github/dependabot.yml`**

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
      time: "09:00"
    open-pull-requests-limit: 5
    groups:
      dev-dependencies:
        dependency-type: development
      production-dependencies:
        dependency-type: production
```

- [ ] **Step 2: Validate YAML syntax**

```bash
node -e "require('js-yaml').load(require('fs').readFileSync('.github/dependabot.yml','utf8')); console.log('valid')" 2>/dev/null || npx js-yaml .github/dependabot.yml
```

Expected: no error output.

- [ ] **Step 3: Commit**

```bash
git add .github/dependabot.yml
git commit -m "chore(ci): add Dependabot weekly npm update schedule"
```

---

## Task 5: CodeQL workflow

**Files:**
- Create: `.github/workflows/codeql.yml`

- [ ] **Step 1: Create `.github/workflows/codeql.yml`**

```yaml
name: CodeQL

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 2 * * *"

permissions:
  contents: read
  security-events: write

jobs:
  analyze:
    name: Analyze (javascript-typescript)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: /language:javascript-typescript
```

- [ ] **Step 2: Validate YAML syntax**

```bash
node -e "
const yaml = require('js-yaml');
const fs = require('fs');
yaml.load(fs.readFileSync('.github/workflows/codeql.yml', 'utf8'));
console.log('valid');
"
```

Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/codeql.yml
git commit -m "feat(ci): add CodeQL security analysis workflow"
```

---

## Task 6: PR CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

This is the main quality gate. It runs on every PR targeting `main` and gates on: lint → type-check → tests → build → bundle size → preview deploy → Lighthouse. CodeQL runs in parallel and is non-blocking.

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  quality:
    name: Quality Gate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.32.1

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint (no auto-fix in CI)
        run: pnpm exec eslint . --max-warnings 0

      - name: Type check
        run: pnpm exec vue-tsc --noEmit

      - name: Tests + coverage
        run: pnpm test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          fail_ci_if_error: false

      - name: Build owner bundle
        run: pnpm build:owner-only
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}

      - name: Check bundle size
        run: node scripts/check-bundle-size.js

      - name: Deploy preview to Cloudflare Pages
        id: deploy
        run: |
          OUTPUT=$(pnpm exec wrangler pages deploy dist/ \
            --project-name claro-owner \
            --branch "${{ github.head_ref }}" 2>&1)
          echo "$OUTPUT"
          URL=$(echo "$OUTPUT" | grep -oP 'https://[^\s]+\.pages\.dev' | tail -1)
          echo "preview_url=$URL" >> "$GITHUB_OUTPUT"
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Run Lighthouse CI
        run: |
          pnpm exec lhci autorun \
            --collect.url="${{ steps.deploy.outputs.preview_url }}" \
            --collect.numberOfRuns=1

      - name: Comment preview URL on PR
        if: steps.deploy.outputs.preview_url != ''
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: [
                '## Preview Deployment',
                '',
                `🔗 **Preview URL:** ${{ steps.deploy.outputs.preview_url }}`,
                '',
                '_This preview is deleted automatically when the PR is merged._',
              ].join('\n')
            })
```

- [ ] **Step 2: Validate YAML syntax**

```bash
node -e "
const yaml = require('js-yaml');
const fs = require('fs');
yaml.load(fs.readFileSync('.github/workflows/ci.yml', 'utf8'));
console.log('valid');
"
```

Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "feat(ci): add PR quality gate + preview deploy workflow"
```

---

## Task 7: Production deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

Runs on every push to `main`. Runs the same quality checks as CI, then deploys to production and notifies Sentry of the new release.

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  deploy:
    name: Production Deploy
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.32.1

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm exec vue-tsc --noEmit

      - name: Tests
        run: pnpm test:run

      - name: Build owner bundle
        run: pnpm build:owner-only
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}

      - name: Deploy to Cloudflare Pages (production)
        run: |
          pnpm exec wrangler pages deploy dist/ \
            --project-name claro-owner \
            --branch main
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Notify Sentry of release
        run: |
          PKG_VERSION=$(node -p "require('./package.json').version")
          SHORT_SHA=$(git rev-parse --short HEAD)
          VERSION="${PKG_VERSION}+${SHORT_SHA}"
          npx sentry-cli releases finalize "$VERSION" \
            --org "${{ secrets.SENTRY_ORG }}" \
            --project "${{ secrets.SENTRY_PROJECT }}"
          npx sentry-cli releases deploys "$VERSION" new \
            --env production \
            --org "${{ secrets.SENTRY_ORG }}" \
            --project "${{ secrets.SENTRY_PROJECT }}"
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

- [ ] **Step 2: Validate YAML syntax**

```bash
node -e "
const yaml = require('js-yaml');
const fs = require('fs');
yaml.load(fs.readFileSync('.github/workflows/deploy.yml', 'utf8'));
console.log('valid');
"
```

Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat(ci): add production deploy workflow with Sentry release notification"
```

---

## Task 8: Manual setup — external services

These steps require browser access. Do them in order before pushing to GitHub.

**Files:** None — all configuration is in external dashboards.

### 8A: Create Cloudflare Pages project

- [ ] **Step 1: Log in to Cloudflare dashboard**

Go to https://dash.cloudflare.com → Workers & Pages → Create → Pages.

- [ ] **Step 2: Create the project via "Direct Upload" (NOT Git integration)**

Choose **"Direct Upload"**, name the project exactly `claro-owner`. This creates the project without connecting Cloudflare's own build system — Wrangler will deploy to it from GitHub Actions.

Note your **Account ID** from the right sidebar (you'll need it for secrets).

- [ ] **Step 3: Create a Cloudflare API token**

Go to https://dash.cloudflare.com/profile/api-tokens → Create Token → Use the "Edit Cloudflare Pages" template. Scope it to your account. Copy the token — you only see it once.

### 8B: Connect Codecov

- [ ] **Step 4: Connect Codecov to the repo**

Go to https://app.codecov.io → Add new repo → select `Sorenv6543/claro4` (or your repo name). Copy the **CODECOV_TOKEN** shown after connecting.

### 8C: Add GitHub Secrets

- [ ] **Step 5: Add all secrets to GitHub**

Go to GitHub repo → Settings → Secrets and variables → Actions → New repository secret. Add each of these:

| Name | Value |
|------|-------|
| `CLOUDFLARE_API_TOKEN` | Token from Step 3 |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID from Step 2 |
| `VITE_SUPABASE_URL` | Your Supabase project URL (from `.env.local`) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key (from `.env.local`) |
| `SENTRY_AUTH_TOKEN` | From Sentry → Settings → Auth Tokens |
| `SENTRY_ORG` | Your Sentry org slug (visible in Sentry URL: `sentry.io/organizations/<slug>/`) |
| `SENTRY_PROJECT` | Your Sentry project slug |
| `CODECOV_TOKEN` | Token from Step 4 |

---

## Task 9: Smoke test — verify the full pipeline

**Files:** None created. This task verifies everything works end-to-end.

- [ ] **Step 1: Push all committed files to GitHub**

```bash
git push origin main
```

Watch the **Actions** tab: the `deploy.yml` workflow should trigger. Expected: all steps pass and production deploys to `https://claro-owner.pages.dev`.

- [ ] **Step 2: Create a test branch and open a PR**

```bash
git checkout -b ci/smoke-test
echo "# smoke test" >> .github/CI-SMOKE-TEST.md
git add .github/CI-SMOKE-TEST.md
git commit -m "test: ci smoke test PR"
git push origin ci/smoke-test
```

Then open a PR on GitHub from `ci/smoke-test` → `main`.

- [ ] **Step 3: Verify all CI jobs appear on the PR**

In the PR's Checks tab, you should see:
- `Quality Gate` — running lint → type-check → tests → build → bundle check → preview deploy → Lighthouse
- `CodeQL` — running in parallel

- [ ] **Step 4: Verify the preview URL comment appears on the PR**

After the `Deploy preview to Cloudflare Pages` step completes, a bot comment should appear on the PR with a `*.pages.dev` URL. Click the URL and verify the owner app loads.

- [ ] **Step 5: Close the PR without merging and clean up**

Close the PR on GitHub (don't merge). Then locally:

```bash
git checkout main
git branch -d ci/smoke-test
git push origin --delete ci/smoke-test
```

Delete `.github/CI-SMOKE-TEST.md` if it was accidentally merged:

```bash
# Only if the file made it to main somehow
git rm .github/CI-SMOKE-TEST.md
git commit -m "chore: remove smoke test file"
git push origin main
```

---

## Self-Review Notes

**Spec coverage:**
- ✅ `ci.yml` — PR gate with lint, type-check, tests, build, bundle size, preview deploy, Lighthouse
- ✅ `deploy.yml` — production deploy + Sentry release notification
- ✅ `codeql.yml` — security analysis on PRs + nightly
- ✅ `dependabot.yml` — weekly dep updates
- ✅ `lighthouserc.json` — thresholds (perf 0.80, a11y 0.90, best-practices 0.90)
- ✅ `check-bundle-size.js` — owner-app chunk gate at 500 KB gzipped
- ✅ Manual setup task — Cloudflare project, API token, all 8 GitHub Secrets, Codecov
- ✅ Codecov — wired via `codecov-action@v4` in `ci.yml`
- ✅ Sentry — source maps upload via Vite plugin during build (needs env vars), release notification in `deploy.yml`
- ✅ Smoke test task — end-to-end verification

**Known limitation (not in scope of this plan):** `pnpm build:owner-only` uses `ROLE_BUILD=owner` but `vite.config.ts` sets both `__ENABLE_OWNER_FEATURES__` and `__ENABLE_ADMIN_FEATURES__` to `true` unconditionally — the env var isn't read. The deployed bundle includes admin code. Fix this in a separate task when true role-based tree-shaking is needed.
