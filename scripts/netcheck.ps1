$pids = @(27136, 45040, 29488, 32724, 520, 21280, 1360, 5008)
Write-Host "=== Process names for PIDs with established connections ===" -ForegroundColor Cyan
foreach ($procId in $pids) {
  $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
  if ($p) {
    Write-Host ("PID {0,-6} {1,-25} {2}" -f $procId, $p.ProcessName, $p.Path)
  } else {
    Write-Host ("PID {0,-6} (not found or no access)" -f $procId)
  }
}

Write-Host ""
Write-Host "=== Listening ports on non-loopback addresses ===" -ForegroundColor Cyan
Get-NetTCPConnection -State Listen |
  Where-Object { $_.LocalAddress -ne '::1' -and $_.LocalAddress -ne '127.0.0.1' -and $_.LocalAddress -ne '0.0.0.0' -and $_.LocalAddress -ne '::' } |
  ForEach-Object {
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    [PSCustomObject]@{
      LocalAddress = $_.LocalAddress
      LocalPort = $_.LocalPort
      PID = $_.OwningProcess
      Process = if ($proc) { $proc.ProcessName } else { '(unknown)' }
    }
  } | Format-Table -AutoSize
