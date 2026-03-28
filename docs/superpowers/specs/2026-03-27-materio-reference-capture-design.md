# Materio UI/UX Reference Capture — Design Spec

**Date:** 2026-03-27
**Branch:** `materioUiswap`
**Status:** Approved

---

## Goal

Crawl the entire Materio Vuetify admin template demo and capture every page as a screenshot + structured JSON annotation. The output is a reference library that an AI agent can browse, search, and use as visual targets when building UI for Claro4.

**Source:** `https://demos.themeselection.com/materio-vuetify-vuejs-admin-template/demo-1/`

## Output Location

All output goes to `UI/materio/` in the project root.

## Directory Structure

```
UI/materio/
├── index.json                    # Master manifest — AI agent entry point
├── dashboards/
│   ├── analytics.png
│   ├── analytics.json
│   ├── crm.png
│   ├── crm.json
│   └── ...
├── forms/
│   ├── form-wizard-numbered.png
│   ├── form-wizard-numbered.json
│   └── ...
├── tables/
│   ├── data-table.png
│   ├── data-table.json
│   └── ...
├── pages/
├── charts/
├── ui-elements/
└── ... (one folder per nav category discovered)
```

## Per-Page Output

Each captured page produces two files:

### Screenshot (PNG)

- Full-page capture at **1280px viewport width**
- Saved as `UI/materio/{category}/{slug}.png`
- Captures the page after Vuetify rendering has settled (network idle + short delay)

### Structured Annotation (JSON)

Saved as `UI/materio/{category}/{slug}.json` with this schema:

```json
{
  "url": "https://demos.themeselection.com/.../analytics",
  "title": "Analytics Dashboard",
  "category": "dashboards",
  "screenshot": "dashboards/analytics.png",
  "summary": "Human-readable description of the page layout and content",
  "components": ["v-card", "v-chip", "v-data-table", "v-avatar", "v-progress-linear"],
  "layout": {
    "type": "grid",
    "columns": "2-3 responsive",
    "sections": ["stat-row", "chart-row", "table-section"]
  },
  "patterns": ["stat-card-with-icon", "donut-chart", "line-chart", "avatar-list", "data-table-with-search"],
  "colors": ["primary", "success", "warning", "error", "info"],
  "interactions": ["hover-elevation", "sortable-table", "tab-switching"]
}
```

**Field definitions:**

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | Full URL of the captured page |
| `title` | string | Page title as shown in the demo |
| `category` | string | Route category (dashboards, forms, tables, etc.) |
| `screenshot` | string | Relative path to PNG from `UI/materio/` |
| `summary` | string | Human-readable description of visible UI patterns and layout |
| `components` | string[] | Vuetify components visually present on the page |
| `layout.type` | string | Primary layout strategy (grid, flex, single-column, split) |
| `layout.columns` | string | Column structure description |
| `layout.sections` | string[] | Named vertical sections top-to-bottom |
| `patterns` | string[] | Reusable UI patterns identified (e.g., stat-card-with-icon, avatar-list) |
| `colors` | string[] | Semantic color roles used on the page |
| `interactions` | string[] | Visible interactive behaviors (hover, sort, expand, tab-switch) |

## Master Index

`UI/materio/index.json`:

```json
{
  "source": "https://demos.themeselection.com/materio-vuetify-vuejs-admin-template/demo-1/",
  "captured": "2026-03-27",
  "total_pages": 0,
  "categories": {
    "dashboards": ["analytics", "crm"],
    "forms": ["form-wizard-numbered"]
  },
  "pages": [
    {
      "slug": "analytics",
      "category": "dashboards",
      "title": "Analytics Dashboard",
      "file": "dashboards/analytics.json"
    }
  ],
  "skipped": []
}
```

The `skipped` array logs any pages that failed to load or screenshot, with reason strings.

## Pipeline

### Step 1: URL Discovery (Firecrawl `map`)

- Call Firecrawl's `map` tool on the demo root URL
- Returns all discoverable links under the domain
- **Filter rules:**
  - Include only `/demo-1/` paths
  - Exclude other demo variants (`/demo-2/` through `/demo-6/`)
  - Exclude asset URLs (`.js`, `.css`, `.png`, `.svg`, etc.)
  - Exclude external links
  - Deduplicate by path (strip query params and anchors)

### Step 2: Categorization

- Parse each URL path to extract category and slug from route structure
  - Example: `/demo-1/dashboards/analytics` → category: `dashboards`, slug: `analytics`
  - Example: `/demo-1/forms/form-wizard-numbered` → category: `forms`, slug: `form-wizard-numbered`
- Create subdirectories under `UI/materio/` for each discovered category

### Step 3: Screenshot Loop (Chrome DevTools)


For each URL, sequentially:

1. Navigate Chrome to the page
2. Wait for network idle + 2s settle delay for Vuetify animations/transitions
3. Take full-page screenshot at 1280px viewport width
4. Save to `UI/materio/{category}/{slug}.png`

Pages are processed sequentially (Chrome DevTools drives one tab at a time).

### Step 4: Annotation Generation

For each captured page:

1. Analyze the screenshot to identify visible UI patterns, components, layout structure
2. Generate structured JSON annotation per the schema above
3. Save as `UI/materio/{category}/{slug}.json`

### Step 5: Index Assembly

- Build `UI/materio/index.json` from all captured pages
- Populate `total_pages`, `categories`, `pages` array, and `skipped` array

## Error Handling

- If a page fails to load: skip it, log URL and error in `index.json` → `skipped[]`
- If a screenshot fails: retry once, then skip and log
- If the site requires authentication or blocks automated access: stop and report

## AI Agent Consumption

The reference library supports these agent workflows:

1. **Browse by category** — read `index.json`, filter `pages[]` by category
2. **Search by pattern** — grep across `*.json` for pattern names like `"stat-card-with-icon"`
3. **Visual + semantic context** — load PNG for visual reference alongside JSON for structured data
4. **Component lookup** — filter by `components[]` to find pages using specific Vuetify components

No special tooling required — any agent with file read access can consume this.

## Scope Boundaries

- Screenshots capture static page state with demo data — no interaction states (hover, open dialogs, expanded rows)
- Annotations describe what's visible, not underlying source code
- This is a reference library for visual targets, not a component extraction/copy-paste tool
- Only `demo-1` variant is captured
