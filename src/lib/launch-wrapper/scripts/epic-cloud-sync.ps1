# Epic games, "wait for the game to exit". Epic syncs cloud saves right
# after the game exits, so the launcher can only be stopped once that's done.
#   -Mark (post-launch): notes how long Epic's log is, since Epic also syncs
#     before launching the game; only what it logs after counts.
#   (post-exit): waits until Epic logs that this game's sync has finished.
#     Games without cloud saves never start one: stop waiting after 10
#     seconds if none has started (Epic can take a few seconds to notice the
#     game exited), and never wait more than a minute.
# From https://github.com/SteamGridDB/steam-rom-manager/pull/904 (hbogaeus).
param (
    [Parameter(Mandatory = $True)][string]$appName, # Epic AppName of the game
    [switch]$Mark
)
$markFile = Join-Path $env:SRM_RUN_DIR "epic-log-lines.txt"

# Epic keeps its log open, so read it with shared access
function Get-EpicLogLines {
    Try {
        $stream = [IO.File]::Open("$env:LOCALAPPDATA\EpicGamesLauncher\Saved\Logs\EpicGamesLauncher.log", 'Open', 'Read', 'ReadWrite')
        $reader = New-Object IO.StreamReader($stream)
        $reader.ReadToEnd() -split "`r?`n" | Where-Object { $_ }
        $reader.Close()
    } Catch {
        @()
    }
}

If ($Mark) {
    @(Get-EpicLogLines).Count | Set-Content -LiteralPath $markFile
    Exit 0
}

$skipLines = 0
If (Test-Path -LiteralPath $markFile) { $skipLines = [int](Get-Content -LiteralPath $markFile) }
Write-Host 'Waiting for Epic to sync cloud saves'
$noSyncTimeout = (Get-Date).AddSeconds(10)
$timeout = (Get-Date).AddMinutes(1)
$app = "(\S*:)?$([regex]::Escape($appName))\s*$"
While ((Get-Date) -lt $timeout) {
    $lines = @(Get-EpicLogLines | Select-Object -Skip $skipLines)
    $started = @($lines | Select-String "Sync Started for $app").Count
    $finished = @($lines | Select-String "Exiting Cloud Sync - \w+ - AppName: $app").Count
    If ($started -and $finished -ge $started) { Exit 0 }
    If (!$started -and (Get-Date) -gt $noSyncTimeout) { Exit 0 }
    Start-Sleep -Milliseconds 500
}
Write-Host 'Gave up waiting for the cloud sync after a minute'
