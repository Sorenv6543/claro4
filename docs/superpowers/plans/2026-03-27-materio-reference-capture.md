# Materio UI/UX Reference Capture — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crawl the Materio Vuetify demo site, screenshot every page, and produce a structured reference library (PNG + JSON annotations + master index) in `UI/materio/` for AI agent consumption.

**Architecture:** Firecrawl `map` discovers all page URLs under `/demo-1/`, then Chrome DevTools navigates to each page sequentially, takes a full-page screenshot at 1280px viewport, and generates a structured JSON annotation per page. A master `index.json` ties everything together.

**Tech Stack:** Firecrawl MCP (URL discovery), Chrome DevTools MCP (navigation, screenshots, snapshots), filesystem tools (Write, Bash for mkdir)

**Spec:** `docs/superpowers/specs/2026-03-27-materio-reference-capture-design.md`

---

## Task 1: URL Discovery with Firecrawl

**Files:**
- Create: `UI/materio/_urls.json` (intermediate working file — list of discovered URLs)

- [ ] **Step 1: Call Firecrawl map on the Materio demo root**

Use `mcp__firecrawl__firecrawl_map` with:
```json
{
  "url": "https://demos.themeselection.com/materio-vuetify-vuejs-admin-template/demo-1/dashboards/analytics",
  "limit": 200,
  "ignoreQueryParameters": true
}
```

The analytics page is the entry point with the full sidebar nav visible, giving Firecrawl the best link graph to crawl from.

- [ ] **Step 2: Filter the URL list**

From the returned array, keep only URLs that:
1. Contain `/demo-1/` in the path
2. Have at least one path segment after `/demo-1/` (skip the root itself)
3. Do NOT end with file extensions (`.js`, `.css`, `.png`, `.svg`, `.jpg`, `.woff`, `.woff2`, `.map`)
4. Do NOT contain `/demo-2/`, `/demo-3/`, `/demo-4/`, `/demo-5/`, `/demo-6/`
5. Are not external links (must be on `demos.themeselection.com`)

Deduplicate by path (strip trailing slashes before comparing).

- [ ] **Step 3: Parse each URL into category + slug**

For each URL, extract the route structure after `/demo-1/`:
- URL: `https://demos.themeselection.com/materio-vuetify-vuejs-admin-template/demo-1/dashboards/analytics`
- Base path: `dashboards/analytics`
- Category: `dashboards` (first path segment)
- Slug: `analytics` (remaining segments joined with `-`)

Multi-level paths: `/demo-1/forms/form-wizard-numbered` → category: `forms`, slug: `form-wizard-numbered`
Deep paths: `/demo-1/pages/user-profile/profile` → category: `pages`, slug: `user-profile-profile`

- [ ] **Step 4: Save filtered URL list as working file**

Write the filtered, categorized list to `UI/materio/_urls.json`:

```json
[
  {
    "url": "https://demos.themeselection.com/materio-vuetify-vuejs-admin-template/demo-1/dashboards/analytics",
    "category": "dashboards",
    "slug": "analytics"
  }
]
```

This file is a working artifact for the screenshot loop. It can be deleted after the pipeline completes.

- [ ] **Step 5: Report URL count and categories**

Print the total number of URLs and the distinct categories discovered. Ask the user to confirm before proceeding to screenshots (this is a potentially large operation).

---

## Task 2: Create Directory Structure

**Files:**
- Create: `UI/materio/` subdirectories (one per category)

- [ ] **Step 1: Read `UI/materio/_urls.json`**

Load the URL list from Task 1.

- [ ] **Step 2: Create category directories**

Extract all unique category values from the URL list. Create each directory:

```bash
mkdir -p UI/materio/dashboards UI/materio/forms UI/materio/tables UI/materio/pages UI/materio/charts UI/materio/ui-elements
```

(Actual directory names come from the discovered categories — the above is illustrative.)

---

## Task 3: Browser Setup

- [ ] **Step 1: Get current browser tab context**

Call `mcp__chrome-devtools__list_pages` to see what tabs are open. Select an existing tab or note that a new one is needed.

- [ ] **Step 2: Resize viewport to 1280px width**

Call `mcp__chrome-devtools__resize_page`:
```json
{
  "width": 1280,
  "height": 900
}
```

- [ ] **Step 3: Navigate to the first URL as a smoke test**

Call `mcp__chrome-devtools__navigate_page`:
```json
{
  "type": "url",
  "url": "https://demos.themeselection.com/materio-vuetify-vuejs-admin-template/demo-1/dashboards/analytics"
}
```

Verify the page loads successfully. If it requires authentication or shows a paywall, stop and report to the user.

- [ ] **Step 4: Take a test screenshot**

Call `mcp__chrome-devtools__take_screenshot`:
```json
{
  "fullPage": true,
  "format": "png",
  "filePath": "UI/materio/dashboards/analytics.png"
}
```

Verify the PNG was saved and looks correct (read the file to confirm it exists and has reasonable size).

---

## Task 4: Screenshot & Annotate Loop

**Files:**
- Create: `UI/materio/{category}/{slug}.png` (one per URL)
- Create: `UI/materio/{category}/{slug}.json` (one per URL)

This task is a **loop** — repeat steps 1-4 for each URL in `UI/materio/_urls.json`. Process pages sequentially. Skip the analytics page if it was already captured in Task 3.

### Per-page process (repeat for each URL):

- [ ] **Step 1: Navigate to the page**

Call `mcp__chrome-devtools__navigate_page`:
```json
{
  "type": "url",
  "url": "<url from _urls.json>"
}
```

If navigation fails or times out, log the URL to a `skipped` list with reason and move to the next URL.

- [ ] **Step 2: Wait for rendering to settle**

Use `mcp__chrome-devtools__wait_for` or a brief JavaScript `setTimeout` via `mcp__chrome-devtools__evaluate_script` to wait ~2 seconds for Vuetify animations/transitions to complete:

```json
{
  "expression": "new Promise(r => setTimeout(r, 2000))"
}
```

- [ ] **Step 3: Take full-page screenshot**

Call `mcp__chrome-devtools__take_screenshot`:
```json
{
  "fullPage": true,
  "format": "png",
  "filePath": "UI/materio/{category}/{slug}.png"
}
```

If the screenshot fails, retry once. If it fails again, add to `skipped` list and continue.

- [ ] **Step 4: Generate structured JSON annotation**

Analyze the screenshot (read the PNG) to identify:
- Page title (from the page heading or browser title)
- Vuetify components visible (v-card, v-chip, v-data-table, v-avatar, etc.)
- Layout structure (grid columns, sections top-to-bottom)
- UI patterns (stat-card-with-icon, donut-chart, data-table-with-search, etc.)
- Semantic colors used (primary, success, warning, error, info)
- Interactive behaviors visible (hover states, sortable columns, tabs, expandable rows)

Write the annotation to `UI/materio/{category}/{slug}.json` using this exact schema:

```json
{
  "url": "https://demos.themeselection.com/.../slug",
  "title": "Page Title",
  "category": "category-name",
  "screenshot": "category-name/slug.png",
  "summary": "Human-readable description of the page layout, key sections, and visual patterns",
  "components": ["v-card", "v-chip"],
  "layout": {
    "type": "grid|flex|single-column|split",
    "columns": "description of column structure",
    "sections": ["section-1", "section-2"]
  },
  "patterns": ["pattern-name-1", "pattern-name-2"],
  "colors": ["primary", "success"],
  "interactions": ["hover-elevation", "sortable-table"]
}
```

**Pattern vocabulary** — use these consistent names across all annotations to enable cross-page searching:

| Pattern Name | Description |
|---|---|
| `stat-card-with-icon` | Card showing a single metric with an icon |
| `stat-pill` | Compact inline stat with colored background |
| `welcome-banner` | Hero-style greeting card at top of dashboard |
| `donut-chart` | Circular/ring chart |
| `line-chart` | Line/area chart |
| `bar-chart` | Horizontal or vertical bar chart |
| `data-table-with-search` | Table with search/filter input |
| `data-table-expandable` | Table with expandable row detail |
| `data-table-editable` | Table with inline or dialog editing |
| `avatar-list` | List of items with user avatars |
| `progress-list` | List with progress bars per item |
| `timeline` | Vertical timeline of events |
| `form-wizard-numbered` | Multi-step form with numbered indicators |
| `form-wizard-icon` | Multi-step form with icon indicators |
| `form-standard` | Single-page form layout |
| `card-grid` | Grid of cards (2-4 columns) |
| `card-list` | Vertical stack of cards |
| `tab-panel` | Tabbed content switching |
| `tree-view` | Hierarchical tree structure |
| `pricing-table` | Feature comparison pricing cards |
| `login-form` | Authentication form |
| `registration-form` | Sign-up form |
| `profile-header` | User profile hero with avatar/stats |
| `chat-interface` | Messaging/chat UI |
| `kanban-board` | Column-based drag-drop board |
| `calendar-view` | Calendar/scheduler component |
| `file-manager` | File browser/manager UI |
| `invoice-template` | Print-ready invoice layout |
| `faq-accordion` | Expandable question/answer list |

Use these names when they match. Invent new names following the same `kebab-case` convention for patterns not listed above.

- [ ] **Step 5: Commit in batches**

After every 10 pages (or at the end), commit the captured screenshots and annotations:

```bash
git add UI/materio/
git commit -m "ref: capture Materio reference screenshots — {category} ({N} pages)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

Batch commits prevent losing work if the pipeline is interrupted.

---

## Task 5: Assemble Master Index

**Files:**
- Create: `UI/materio/index.json`

- [ ] **Step 1: Read all annotation JSON files**

Glob for `UI/materio/**/*.json` (excluding `_urls.json` and `index.json`). Read each file to extract `slug`, `category`, `title`, and relative `file` path.

- [ ] **Step 2: Build index.json**

Assemble the master index with this structure:

```json
{
  "source": "https://demos.themeselection.com/materio-vuetify-vuejs-admin-template/demo-1/",
  "captured": "2026-03-27",
  "total_pages": 0,
  "categories": {},
  "pages": [],
  "skipped": []
}
```

Populate:
- `total_pages`: count of successfully captured pages
- `categories`: object mapping category name → array of slugs in that category
- `pages`: array of `{ "slug", "category", "title", "file" }` objects for every captured page
- `skipped`: array of `{ "url", "reason" }` for any pages that failed

Write to `UI/materio/index.json`.

- [ ] **Step 3: Clean up working file**

Delete `UI/materio/_urls.json` (the intermediate URL list is no longer needed — all data is in the annotation files and index).

```bash
rm UI/materio/_urls.json
```

- [ ] **Step 4: Final commit**

```bash
git add UI/materio/index.json
git commit -m "ref: add Materio reference library master index ({N} pages across {M} categories)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Verification

- [ ] **Step 1: Verify directory structure**

```bash
find UI/materio -type f | head -30
```

Confirm PNG + JSON pairs exist for each page and `index.json` is present.

- [ ] **Step 2: Validate index.json**

Read `UI/materio/index.json` and verify:
- `total_pages` matches the actual file count
- Every entry in `pages[]` has a corresponding `.json` and `.png` file
- `skipped[]` contains only pages that genuinely failed

- [ ] **Step 3: Spot-check 3 annotations**

Read 3 annotation JSON files from different categories. Verify:
- `url` is correct
- `screenshot` path matches an existing PNG
- `components`, `patterns`, and `layout` fields are populated (not empty arrays)
- `summary` is a meaningful description (not generic placeholder text)

- [ ] **Step 4: Report summary to user**

Print:
- Total pages captured
- Categories and page counts per category
- Any skipped pages and why
- Total disk usage of `UI/materio/`
