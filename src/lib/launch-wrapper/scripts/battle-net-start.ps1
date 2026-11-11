# Battle.net games (pre-launch): restarts Battle.net and waits until it has
# started completely, so it can launch the game (SRM's launch script then
# starts it with Battle.net.exe --exec="launch <id>").
# Based on https://github.com/SteamGridDB/steamgriddb-manager/blob/master/BnetHelper.ps1
param (
    [Parameter(Mandatory = $True)][string]$bnet # Path to Battle.net.exe
)
Write-Host 'Stopping Battle.net'
Get-Process "battle.net" -ErrorAction SilentlyContinue | Stop-Process

Write-Host 'Starting Battle.net'
Start-Process $bnet

# Wait to be sure the log file gets created (usually it's instant)
Start-Sleep -Seconds 3

$log = Get-ChildItem -Path "$env:LOCALAPPDATA\Battle.net\Logs" -Filter "battle.net-*.log" |
    Sort-Object LastAccessTime -Descending | Select-Object -First 1
Write-Host "Log: $($log.FullName)"

Write-Host 'Waiting for Battle.net to start completely'
$timeout = (Get-Date).AddMinutes(1)
While (!(Select-String -Path $log.FullName -Pattern 'GameController initialization complete' -Quiet)) {
    If ((Get-Date) -gt $timeout) {
        Write-Host 'Battle.net did not finish starting within a minute'
        exit 1
    }
    Start-Sleep -Seconds 1
}
Write-Host 'Battle.net started'
