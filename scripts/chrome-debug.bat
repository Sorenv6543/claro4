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
