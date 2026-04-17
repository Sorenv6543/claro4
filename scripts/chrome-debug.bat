@echo off
REM Chrome DevTools MCP - Debug Chrome Launcher
REM Launches Chrome with remote debugging on port 9222 using a separate profile.
REM Safe to run alongside regular Chrome.

set CHROME_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe
set DEBUG_PROFILE=C:\Users\Soren\.chrome-debug-profile

REM Check if debug Chrome is already LISTENING on port 9222
REM (Plain "findstr :9222" false-positives on outgoing SYN_SENT/ESTABLISHED entries.)
netstat -ano | findstr "LISTENING" | findstr ":9222 " >nul 2>&1
if %errorlevel%==0 (
    echo Chrome debug already running on port 9222.
    exit /b 0
)

REM Clean stale profile if it exists but Chrome isn't running on the debug port.
REM This prevents corrupted profiles from causing blank-page launches.
if exist "%DEBUG_PROFILE%\Local State" (
    echo Clearing stale debug profile...
    rd /s /q "%DEBUG_PROFILE%" 2>nul
)

start "" "%CHROME_EXE%" ^
  --remote-debugging-port=9222 ^
  --user-data-dir="%DEBUG_PROFILE%" ^
  --no-first-run ^
  --no-default-browser-check ^
  --disable-background-networking ^
  --window-size=1280,720

echo Chrome debug launched on port 9222.
