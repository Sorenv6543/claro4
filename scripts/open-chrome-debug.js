import { exec } from 'node:child_process'
exec(String.raw`start "Start-Process 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList '--remote-debugging-port=9222', '--user-data-dir=C:\some\folder'"`)
