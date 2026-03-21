import { execSync } from 'node:child_process'

if (process.platform !== 'win32') {
  console.error(
    'open-chrome-debug.js is Windows-only and expects Chrome at '
    + String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe. `
    + 'This script cannot be run on non-Windows platforms.',
  )
}

execSync(
  String.raw`start "Start-Process 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList 'use--remote-debugging-port=9222', '--user-data-dir=C:\Users\Soren\TEMP\chrome-profile-stable', '--channel=stable'"`,
)
const userDataDir = process.env.CHROME_USER_DATA_DIR ?? String.raw`${process.cwd()}\.chrome-profile-stable`

execSync(
  String.raw`start "Start-Process 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList 'use--remote-debugging-port=9222', '--user-data-dir=${userDataDir}', '--channel=stable'"`,
)
