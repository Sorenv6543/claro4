# Chrome DevTools MCP Environment Setup

**Date:** 2026-03-23
**Status:** Approved
**Approach:** Shell script + manual MCP config (Approach A)

## Overview

Set up a reliable Chrome DevTools MCP environment on Windows for live debugging of the Claro4 Vite dev server and UI work, with optional headless mode for automated performance checks. Uses a dedicated Chrome debug profile that coexists with the user's regular Chrome browser.

## Architecture

```
┌─────────────────┐     port 9222      ┌──────────────────────┐
│  chrome-debug   │◄───────────────────►│  chrome-devtools-mcp │
│  (separate      │   Chrome DevTools   │  (npx, latest)       │
│   profile)      │   Protocol (CDP)    │                      │
└────────┬────────┘                     └──────────┬───────────┘
         │                                         │
         │ browses                                  │ stdio
         ▼                                         ▼
┌─────────────────┐                     ┌──────────────────────┐
│  localhost:5173  │                     │  Claude Code         │
│  (pnpm dev)     │                     │  (VS Code / CLI)     │
└─────────────────┘                     └──────────────────────┘
```

**Connection flow:**
1. User launches `scripts/chrome-debug.bat` → Chrome opens with debug port 9222
2. User runs `pnpm dev` → Vite dev server on localhost:5173
3. User starts Claude Code → MCP server starts via npx, connects to Chrome on 127.0.0.1:9222
4. Claude Code tools (navigate, screenshot, inspect, etc.) operate through CDP

## File Changes

### 1. Create: `scripts/chrome-debug.bat`

Launch script for the dedicated debug Chrome instance.

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

**Flags explained:**
- `--remote-debugging-port=9222`: Opens CDP port for MCP connection
- `--user-data-dir="C:\Users\Soren\.chrome-debug-profile"`: Separate profile directory, ensures this Chrome instance is independent of the user's regular Chrome
- `--no-first-run`: Skips Chrome's welcome/onboarding flow
- `--no-default-browser-check`: Suppresses "set as default browser" prompt
- `--window-size=1280,720`: Consistent window size for UI work (actual page viewport will be slightly smaller due to Chrome toolbar/tabs)

**Port guard:** The `netstat` check prevents launching a second instance if one is already running, which would silently fail to bind port 9222.

### 2. Update: `.mcp.json`

Update the existing project MCP configuration with Windows hardening.

**Current:**
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest", "--browserUrl", "http://127.0.0.1:9222"]
    }
  }
}
```

**Updated:**
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

**Changes:**
- Added `-y` flag to auto-confirm npx install, preventing interactive hangs
- Added `env` block with `SystemRoot` and `PROGRAMFILES` — Windows-specific fix that ensures Node child processes can find system libraries and Chrome
- Kept `--browserUrl` with space separator — matches the official CLI help and examples

### 3. No Change: `.claude/mcp.json`

The firecrawl MCP config in this file is unrelated and stays untouched.

### 4. No Change: `.claude/settings.json`

The chrome-devtools plugin is already enabled, and tool permissions are already configured.

**Note on MCP server enablement:** The `.mcp.json` server is activated because `enableAllProjectMcpServers: true` is set in `.claude/settings.local.json`. On a fresh setup without this local setting, Claude Code will prompt to enable the server on first use, or you can manually add `"chrome-devtools"` to the `enabledMcpjsonServers` array in `.claude/settings.json`.

## Windows-Specific Mitigations

| Issue | Root Cause | Mitigation |
|---|---|---|
| **Chrome path detection** | MCP looks in `%LOCALAPPDATA%`, Chrome is in `Program Files` | Not applicable — we connect to already-running Chrome via `--browserUrl`, MCP never needs to find/launch Chrome |
| **Port already in use** | Launching script twice without closing first instance | Port guard in `chrome-debug.bat` checks before launching |
| **Stale npx cache** | `npx @latest` sometimes serves cached old version | `-y` flag helps; manual fix: `npm cache clean --force` then restart Claude Code |
| **MCP connection timing** | Claude Code starts before Chrome debug is ready | Run `/mcp` → select chrome-devtools → Reconnect if the MCP fails on first attempt |
| **Firewall prompt** | Windows Firewall may block port 9222 in some configurations | Unlikely for localhost-only binding, but if prompted: allow for "Private networks" |

## Verification Steps

**Initial setup (one-time):**

1. Run `scripts/chrome-debug.bat` — debug Chrome window opens
2. Visit `http://127.0.0.1:9222/json/version` in regular Chrome — should return JSON with Chrome version info
3. Start Claude Code — MCP should connect automatically (check for no "mcp failed" indicator)
4. Test: ask Claude `"Navigate to http://localhost:5173 and take a screenshot"` — confirms full pipeline
5. Run `/mcp` in Claude Code — verify `chrome-devtools` shows as connected with tools available

**If verification fails:**
- No JSON at port 9222 → Chrome didn't launch with debug flag; check the script path and re-run
- MCP fails to connect → run `/mcp` → select chrome-devtools → Reconnect
- Timeout errors → wait a few seconds and run `/mcp` → Reconnect; if persistent, ensure Chrome debug is running first
- Permission errors on npx → run `npm cache clean --force`, restart Claude Code

## Daily Workflow

```
1. Click chrome-debug shortcut (or run scripts/chrome-debug.bat)
2. Run pnpm dev (start Vite server on localhost:5173)
3. Start Claude Code session
4. Work normally — Chrome DevTools MCP tools are available
5. When done, close the debug Chrome window
```

## Available Tools

| Category | Tools | Use Case |
|---|---|---|
| **Navigation** | `navigate_page`, `new_page`, `list_pages`, `select_page`, `close_page`, `wait_for` | Open app pages, switch tabs |
| **Inspection** | `take_screenshot`, `take_snapshot`, `evaluate_script` | Visual checks, DOM inspection, run JS in page |
| **Console** | `list_console_messages`, `get_console_message` | Read errors/warnings from the app |
| **Network** | `list_network_requests`, `get_network_request` | Debug Supabase API calls, check request/response payloads |
| **Performance** | `performance_start_trace`, `performance_stop_trace`, `performance_analyze_insight`, `take_memory_snapshot` | Profile page load, find bottlenecks, detect memory leaks |
| **Input** | `click`, `fill`, `fill_form`, `type_text`, `press_key`, `hover`, `drag`, `upload_file`, `handle_dialog` | Interact with UI elements |
| **Audit** | `lighthouse_audit` | Full Lighthouse performance/accessibility/SEO report |
| **Emulation** | `emulate`, `resize_page` | Test mobile viewports, color schemes, network throttling, geolocation |

## Headless Mode (Optional)

For automated checks without a visible browser, launch Chrome with the `--headless` flag:

```bat
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Users\Soren\.chrome-debug-profile" --headless
```

The MCP config stays the same — it connects to `127.0.0.1:9222` regardless of whether Chrome is headless or visible.

## Prerequisites

| Requirement | Current Status |
|---|---|
| Node.js v20.19+ | v22.22.0 — met |
| Chrome (current stable) | Installed at `C:\Program Files\Google\Chrome\Application\chrome.exe` — met |
| npm/npx | v10.9.4 — met |
| Claude Code with chrome-devtools plugin | Enabled in `.claude/settings.json` — met |

## Security Notes

- The remote debugging port (9222) is only accessible locally (127.0.0.1)
- The debug profile is separate from the user's main Chrome profile
- Avoid accessing sensitive sites (banking, personal email) in the debug profile
- Close the debug Chrome when not in use to close the debugging port

## References

- [Chrome DevTools MCP GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [Chrome DevTools MCP npm](https://www.npmjs.com/package/chrome-devtools-mcp)
- [Claude Code MCP docs](https://code.claude.com/docs/en/mcp)
- [Chrome debugging profile blog (raf.dev)](https://raf.dev/blog/chrome-debugging-profile-mcp/)
- [Windows timeout fix guide](https://www.xugj520.cn/en/archives/chrome-devtools-mcp-timeout-fix-windows.html)
- [Issue #182: Connection failures](https://github.com/ChromeDevTools/chrome-devtools-mcp/issues/182)
