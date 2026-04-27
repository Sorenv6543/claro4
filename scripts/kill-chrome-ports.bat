@echo off
REM Kill all Chrome processes and free dev ports (9222, 3000, 3001, 3002).
REM Useful when chrome-debug.bat or `pnpm dev` refuses to start.

setlocal enabledelayedexpansion

echo Killing all Chrome processes...
taskkill /F /IM chrome.exe /T >nul 2>&1
if %errorlevel%==0 (
    echo   Chrome processes terminated.
) else (
    echo   No Chrome processes running.
)

for %%P in (9222 3000 3001 3002) do (
    echo Freeing port %%P...
    set "FOUND=0"
    for /f "tokens=5" %%A in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":%%P "') do (
        set "FOUND=1"
        taskkill /F /PID %%A >nul 2>&1
        if !errorlevel!==0 (
            echo   Killed PID %%A on port %%P.
        ) else (
            echo   Failed to kill PID %%A on port %%P.
        )
    )
    if "!FOUND!"=="0" echo   Port %%P already free.
)

echo Done.
endlocal
