Launch Chrome with remote debugging enabled on port 9222 (required for chrome-devtools MCP).

First kill any existing Chrome processes, then launch fresh with debugging:

```bash
powershell -Command "taskkill /F /IM chrome.exe; Start-Process 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList '--remote-debugging-port=9222','--user-data-dir=C:\Temp\chrome-debug'; Start-Sleep -Seconds 4; (Invoke-WebRequest -Uri 'http://127.0.0.1:9222/json/version' -UseBasicParsing).Content"
```

Report the JSON response from the debug endpoint. If it shows a `Browser` field, Chrome launched successfully. If the connection fails, report the error.
