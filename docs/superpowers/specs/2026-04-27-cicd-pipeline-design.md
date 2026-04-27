# CI/CD Pipeline Design

## Goal

Deploy the owner-side Vue SPA to Cloudflare Pages with PR preview deployments, a full quality gate on every PR, and automated dependency/security management.

## Architecture

Two GitHub Actions workflows: `ci.yml` runs on every PR (full gate → preview deploy → Lighthouse), `deploy.yml` runs on merge to main (same build → production deploy → Sentry release). CodeQL runs as a parallel job on PRs and on a nightly schedule. Dependabot opens weekly PRs for dep updates which flow through `ci.yml` automatically.

The build artifact (`dist/`) is produced once per pipeline run using `pnpm build:owner-only` and reused across all downstream steps (bundle check → Cloudflare deploy → Lighthouse).

## Tech Stack

- **CI runner**: GitHub Actions
- **Hosting + preview URLs**: Cloudflare Pages (via `wrangler pages deploy`)
- **Observability**: Sentry (source maps upload during build, release notification post-deploy)
- **Coverage**: Codecov
- **Performance gate**: Lighthouse CI (`@lhci/cli`)
- **Dep updates**: Dependabot
- **Security analysis**: GitHub CodeQL

---

## Workflows

### `ci.yml` — Pull Request Pipeline

**Trigger:** `pull_request` targeting `main`

**Jobs:**

1. **`quality`** — Runs in sequence, each step blocks the next:
   - `pnpm install` (cached by `pnpm-lock.yaml` hash)
   - `pnpm lint` (ESLint with `--max-warnings 0`)
   - `vue-tsc --noEmit` (type-check — explicit step, not via `pnpm build`)
   - `pnpm test:run --coverage` → upload report to Codecov
   - `pnpm build:owner-only` → produces `dist/`
   - Bundle size check: fail if `owner-app` chunk > 500 KB gzipped
   - `wrangler pages deploy dist/ --project-name claro-owner` → outputs preview URL
   - Lighthouse CI (`lhci autorun`) against the preview URL

2. **`codeql`** — Parallel job, does not block merge:
   - GitHub CodeQL JavaScript/TypeScript analysis

**PR gate:** All `quality` job steps must pass. `codeql` is informational only.

**Preview URL:** Wrangler outputs a unique `*.pages.dev` URL per PR, posted as a GitHub Actions step summary.

---

### `deploy.yml` — Production Deploy

**Trigger:** `push` to `main`

**Steps:**
- `pnpm install` (cached)
- `vue-tsc --noEmit`
- `pnpm test:run`
- `pnpm build:owner-only` (Sentry Vite plugin uploads source maps automatically via `SENTRY_AUTH_TOKEN`)
- `wrangler pages deploy dist/ --project-name claro-owner --branch main`
- Sentry release notification: `sentry-cli releases finalize <version>` + `sentry-cli releases deploys <version> new -e production`

---

### `codeql.yml` — Security Analysis

**Trigger:** `pull_request` targeting `main` + `schedule` (nightly)

**Steps:** GitHub CodeQL action, JavaScript/TypeScript language pack.

---

### `.github/dependabot.yml`

Weekly schedule, `npm` ecosystem, targeting `main`. PRs from Dependabot go through `ci.yml` automatically.

---

## Lighthouse CI Configuration (`lighthouserc.json`)

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
      "numberOfRuns": 1
    }
  }
}
```

---

## Bundle Size Gate

A lightweight Node script (`scripts/check-bundle-size.js`) reads the Rollup manifest from `dist/.vite/manifest.json`, finds all chunks whose name includes `owner-app`, sums their gzipped sizes, and exits non-zero if the total exceeds 500 KB. This runs after `build:owner-only` and before the Cloudflare deploy step.

---

## Secrets

All stored in GitHub → Settings → Secrets → Actions:

| Secret | Source |
|--------|--------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → API Tokens (Pages:Edit permission) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → right sidebar |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SENTRY_AUTH_TOKEN` | Sentry → Settings → Auth Tokens |
| `SENTRY_ORG` | Sentry org slug |
| `SENTRY_PROJECT` | Sentry project slug |
| `CODECOV_TOKEN` | Codecov dashboard after repo connection |

---

## Files Created or Modified

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | PR pipeline (quality gate + preview deploy) |
| `.github/workflows/deploy.yml` | Production deploy on merge to main |
| `.github/workflows/codeql.yml` | Security analysis |
| `.github/dependabot.yml` | Weekly dep update PRs |
| `lighthouserc.json` | Lighthouse CI thresholds |
| `scripts/check-bundle-size.js` | Bundle size gate script |

---

## Gate Thresholds (starting defaults — tune after first few runs)

| Check | Threshold | Behavior |
|-------|-----------|----------|
| Bundle size (`owner-app` chunk) | 500 KB gzipped | Hard fail |
| Lighthouse Performance | ≥ 0.80 | Hard fail |
| Lighthouse Accessibility | ≥ 0.90 | Hard fail |
| Lighthouse Best Practices | ≥ 0.90 | Hard fail |
| Codecov coverage drop | > 5% | Warning only (not a hard fail) |
| Lint warnings | 0 allowed | Hard fail |
| Type errors | 0 allowed | Hard fail |
| Test failures | 0 allowed | Hard fail |

---

## Sentry Integration in Pipeline

The Sentry Vite plugin is already configured in `vite.config.ts`. In CI, the build step needs `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` available as environment variables — the plugin reads them at build time and uploads source maps automatically. No extra pipeline step needed for source map upload.

After the production deploy, `deploy.yml` calls `sentry-cli` to finalize the release and create a deploy record. This ties Cloudflare deploy timestamps to Sentry release health dashboards.

---

## Developer Experience Impact

- Every PR gets a live preview URL — share with stakeholders before merge
- Lint/type/test failures are reported inline on the PR within ~2 min of push
- Dependabot keeps deps current automatically; each dep-update PR is tested the same as feature PRs
- Codecov posts a coverage diff comment on every PR
- Lighthouse score visible on every PR — performance regressions caught before they reach prod
- CodeQL security findings appear as PR annotations (non-blocking)
