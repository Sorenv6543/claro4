# Chrome DevTools MCP Environment Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up a reliable Chrome DevTools MCP environment on Windows 11 with a dedicated debug Chrome profile, connected to Claude Code via `.mcp.json`.

**Architecture:** A batch script launches Chrome with `--remote-debugging-port=9222` and a separate `--user-data-dir`. The MCP server (via npx) connects to that Chrome instance. Claude Code communicates with the MCP server over stdio.

**Tech Stack:** Chrome DevTools Protocol, chrome-devtools-mcp (npm), Windows batch scripting

**Spec:** `docs/superpowers/specs/2026-03-23-chrome-devtools-mcp-setup-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `scripts/chrome-debug.bat` | Launch Chrome with debug port and separate profile, with port-in-use guard |
| Modify | `.mcp.json` | MCP server config: add `-y` flag, `env` block for Windows |

**Intentionally unchanged** (per spec sections 3-4): `.claude/mcp.json` (firecrawl config) and `.claude/settings.json` (plugin already enabled).

---

### Task 1: Create the Chrome debug launch script

**Files:**
- Create: `scripts/chrome-debug.bat`

- [ ] **Step 1: Create `scripts/chrome-debug.bat`**

```bat
@echo off
REM Chrome DevTools MCP - Debug Chrome Launcher
REM Launches Chrome with remote debugging on port 9222 using a separate profile.
REM Safe to run alongside regular Chrome.

REM Check if debug Chrome is already running on port 9222
netstat -ano | findstr :9222 >nul 2>&1
if %errorlevel%==0 (
    echo Chrome debug already running on port 9222.
    exit /b 0
)

start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir="C:\Users\Soren\.chrome-debug-profile" ^
  --no-first-run ^
  --no-default-browser-check ^
  --window-size=1280,720

echo Chrome debug launched on port 9222.
```

- [ ] **Step 2: Test the script launches Chrome**

Run: double-click `scripts/chrome-debug.bat` or run from terminal:
```
cmd /c scripts\chrome-debug.bat
```
Expected: A new Chrome window opens. The terminal prints `Chrome debug launched on port 9222.`

- [ ] **Step 3: Verify the debug port is active**

Visit in your regular Chrome: `http://127.0.0.1:9222/json/version`

Expected: JSON response containing Chrome version info, e.g.:
```json
{
  "Browser": "Chrome/...",
  "Protocol-Version": "1.3",
  "webSocketDebuggerUrl": "ws://127.0.0.1:9222/devtools/browser/..."
}
```

- [ ] **Step 4: Test the port guard**

Run the script a second time while Chrome debug is still open:
```
cmd /c scripts\chrome-debug.bat
```
Expected: Prints `Chrome debug already running on port 9222.` and does NOT open a second Chrome window.

- [ ] **Step 5: Close debug Chrome and commit**

Close the debug Chrome window, then:
```bash
git add scripts/chrome-debug.bat
git commit -m "$(cat <<'EOF'
feat: add Chrome debug launch script for DevTools MCP

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Update `.mcp.json` with Windows hardening

**Files:**
- Modify: `.mcp.json`

- [ ] **Step 1: Update `.mcp.json`**

Update the `chrome-devtools` entry (currently the only server in the file):

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--browserUrl", "http://127.0.0.1:9222"
      ],
      "env": {
        "SystemRoot": "C:\\Windows",
        "PROGRAMFILES": "C:\\Program Files"
      }
    }
  }
}
```

Changes from current:
- Added `-y` to auto-confirm npx, preventing interactive hangs
- Added `env` block — Windows needs `SystemRoot` and `PROGRAMFILES` for Node child processes to find system libraries

- [ ] **Step 2: Commit**

```bash
git add .mcp.json
git commit -m "$(cat <<'EOF'
fix: harden MCP config for Windows (add -y flag, env block)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: End-to-end verification

**Files:** None (verification only)

**Prerequisites:** Debug Chrome must be running (Task 1), Vite dev server on localhost:5173.

- [ ] **Step 1: Launch debug Chrome**

```
cmd /c scripts\chrome-debug.bat
```
Expected: Chrome opens or message says it's already running.

- [ ] **Step 2: Start the dev server**

```bash
pnpm dev
```
Expected: Vite server running on `http://localhost:5173`

- [ ] **Step 3: Verify MCP connection in Claude Code**

Run `/mcp` in Claude Code. Check that `chrome-devtools` shows as connected with tools available.

If it shows as failed: select chrome-devtools → Reconnect.

- [ ] **Step 4: Test a browser tool**

Ask Claude: `"Navigate to http://localhost:5173 and take a screenshot"`

Expected: Claude navigates the debug Chrome to the app and returns a screenshot of the Claro4 login page.

- [ ] **Step 5: Test a console inspection**

Ask Claude: `"List any console errors on the current page"`

Expected: Claude calls `list_console_messages` and reports what it finds (errors, warnings, or none).

---

## Troubleshooting Reference

If anything fails during verification, consult the spec's troubleshooting table:

| Symptom | Fix |
|---------|-----|
| No JSON at `127.0.0.1:9222/json/version` | Chrome didn't launch with debug flag — re-run the script |
| MCP fails to connect | `/mcp` → chrome-devtools → Reconnect |
| Timeout errors | Ensure debug Chrome is running *before* starting Claude Code |
| npx permission errors | `npm cache clean --force`, restart Claude Code |
| `enabledMcpjsonServers` empty | Either set `enableAllProjectMcpServers: true` in `.claude/settings.local.json`, or add `"chrome-devtools"` to the array in `.claude/settings.json` |
