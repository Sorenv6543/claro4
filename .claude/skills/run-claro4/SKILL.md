---
name: run-claro4
description: Run, start, launch, screenshot, verify, or drive the Claro4 app in a browser. Use when asked to run the app, confirm a change works, take a screenshot, or test a UI feature live.
---

# Run Claro4

Vue 3 / Vite / Vuetify 4 web app driven via the **chrome-devtools MCP** (`mcp__chrome-devtools__*` tools). No separate driver script needed — the MCP tools are the harness.

All paths are relative to the repo root (`C:\Users\soren\claro4`).

---

## Prerequisites

- Node.js + pnpm installed
- Chrome running with remote debugging on port 9222 — run `/openchrome` to launch it
- chrome-devtools MCP registered in `.claude/mcp.json` (already present)

---

## Start the dev server

```bash
pnpm dev
```

Vite serves on **http://localhost:3000**. Wait for the line:

```
VITE vX.X.X  ready in XXXX ms
  ➜  Local:   http://localhost:3000/
```

Takes ~3–5 seconds. To stop (PowerShell):

```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000 | Select-Object -First 1 -ExpandProperty OwningProcess) -Force
```

**Note:** `pnpm dev` runs `node scripts/remove-dev-manifest.js && vite` — the pre-step only prints status messages and is safe to ignore.

---

## Drive (agent path)

Requires Chrome open with `/openchrome` first.

### 1. Open the app

```
mcp__chrome-devtools__new_page  url=http://localhost:3000
```

On first visit you'll see the login page. On subsequent visits the Supabase session stored in `C:\Temp\chrome-debug` auto-authenticates → lands on `/owner/overview`.

### 2. Capture the current state

```
mcp__chrome-devtools__take_snapshot          # a11y tree + UIDs for clicking
mcp__chrome-devtools__take_screenshot        # visual snapshot
```

Save named screenshots to `.claude/skills/run-claro4/screenshots/` so they persist across sessions.

### 3. Navigate to a route

Use the snapshot UIDs from `take_snapshot` to click sidebar links:

```
mcp__chrome-devtools__click  uid=<uid-of-link>
# wait 2–4 seconds for lazy route chunk to load
mcp__chrome-devtools__take_snapshot   # re-snapshot after navigation
mcp__chrome-devtools__take_screenshot
```

Or navigate directly:

```
mcp__chrome-devtools__navigate_page  type=url  url=http://localhost:3000/owner/calendar
```

### 4. Check for errors

```
mcp__chrome-devtools__list_console_messages  types=["error","warn"]
```

Always run this after any interaction. A clean page can still have failing data fetches.

---

## Key routes

| Route | Role | Description |
|---|---|---|
| `/auth/login` | — | Login page (auto-skipped if session exists) |
| `/owner/overview` | owner | Landing page, today's schedule + stats |
| `/owner/calendar` | owner | FullCalendar booking calendar |
| `/owner/bookings` | owner | Booking list |
| `/owner/properties` | owner | Property management |
| `/admin` | admin | Admin overview |
| `/auth/no-access` | cleaner | Cleaners are redirected here |

---

## Auth

- **Existing session** (typical): Chrome profile at `C:\Temp\chrome-debug` persists the Supabase JWT. Navigation goes straight to `/owner/overview`.
- **First run / signed out**: Login page at `/auth/login`. Click the **Demo** button, or fill in email + password with real credentials and click Sign In.
- **Session reset**: Run `/killchrome` then `/openchrome` to start a fresh Chrome profile.

---

## Gotchas

- **First `navigate_page` after `new_page` fails with "No page selected"** — always use `new_page` to open a tab first; `navigate_page` only works on an already-selected page.
- **Calendar route takes 4+ seconds to render** — FullCalendar lazy-loads its chunk on first visit. After clicking the Calendar nav link, wait ~4s before taking a screenshot or the page will be blank/grey.
- **`take_snapshot` returns just the root node with `busy=true`** — page is still loading. Wait 2–3 seconds and re-snapshot.
- **Clicking sidebar nav links requires a fresh snapshot** — UIDs change after each navigation. Always call `take_snapshot` before clicking.
- **Port 3000 may already be in use** if a previous dev server wasn't stopped. Run `pnpm dev` and look for `EADDRINUSE`; kill the old process with `npx kill-port 3000` then retry.
- **`pnpm dev` doesn't use `--host`** by default — the app is only reachable on `localhost:3000`, not the network IP. This is fine for agent use.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Error: No page selected` on `navigate_page` | Use `new_page` first to open a tab |
| `Could not connect to Chrome` | Run `/openchrome` to start Chrome with remote debugging |
| Blank grey screenshot after clicking Calendar | Wait 4 seconds for FullCalendar chunk to load; retake |
| App redirects to `/auth/login` on every load | Chrome profile at `C:\Temp\chrome-debug` was cleared; log in once and the session will persist |
| `EADDRINUSE :::3000` when starting dev server | Another dev server is running; `npx kill-port 3000` then retry |
