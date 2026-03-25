# Chrome DevTools MCP — Quick Reference

## Daily Workflow

```
1. Run scripts/chrome-debug.bat       ← launches debug Chrome on port 9222
2. pnpm dev                           ← starts Vite dev server on localhost:3000
3. Start Claude Code                  ← MCP connects automatically
```

**First time only:** Chrome will show an "Allow remote debugging" prompt. Click Allow.

## What You Can Do

| Ask Claude to... | What happens |
|---|---|
| "Take a screenshot of localhost:3000" | Visual snapshot of your app |
| "List console errors on this page" | Reads Chrome console output |
| "Click the Sign In button" | Interacts with UI elements |
| "Run a Lighthouse audit" | Full performance/a11y/SEO report |
| "Start a performance trace, reload, then analyze" | CPU/network profiling |
| "Check network requests to Supabase" | Inspect API calls and payloads |
| "Emulate iPhone 14" | Mobile viewport + touch simulation |

## Gotchas

**Use `mcp__chrome-devtools__` tools, not `mcp__plugin_` ones.**
The project-level MCP (from `.mcp.json`) works. The plugin version has a connection issue.

**Debug Chrome must be running before Claude Code starts.**
If you forgot, run the bat script then type `/mcp` in Claude Code → select chrome-devtools → Reconnect.

**Don't close the debug Chrome while Claude is using it.**
You'll get "Connection closed" errors. Just relaunch the bat script and `/mcp` → Reconnect.

**Your regular Chrome stays open.**
The debug Chrome is a completely separate instance with its own profile at `C:\Users\Soren\.chrome-debug-profile`. They don't interfere.

**Port 9222 already in use?**
The bat script checks for this. If it says "already running", you're fine. If something else grabbed 9222, close it or change the port in both `chrome-debug.bat` and `.mcp.json`.

**Dev server is on port 3000, not 5173.**
Your Vite config maps to localhost:3000.

## Files

| File | Purpose |
|---|---|
| `scripts/chrome-debug.bat` | Launches debug Chrome with port guard |
| `.mcp.json` | MCP server config (connects to port 9222) |
| `C:\Users\Soren\.chrome-debug-profile\` | Persistent debug Chrome profile (logins stick) |
