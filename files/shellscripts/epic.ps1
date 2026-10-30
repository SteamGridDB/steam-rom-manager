# Launches an Epic Games Store game and keeps running until the game exits, so Steam can track it.
param (
    [Parameter(Mandatory=$True)][string]$appName,  # Epic AppName of the game to launch
    [string]$manifestsDir = "C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests"
)

$manifest = Get-ChildItem -Path $manifestsDir -Filter "*.item" |
    ForEach-Object { Get-Content $_.FullName -Raw | ConvertFrom-Json } |
    Where-Object { $_.AppName -eq $appName } |
    Select-Object -First 1
If (!$manifest) {
    Write-Host "No Epic manifest found for $appName"
    exit 1
}
$installDir = [IO.Path]::GetFullPath($manifest.InstallLocation).TrimEnd('\') + '\'
$exeName = [IO.Path]::GetFileNameWithoutExtension($manifest.LaunchExecutable)

# Any process running from the game's install folder counts as the game.
# Elevated processes hide their path, so fall back to matching the launch executable's name.
function Get-GameProcesses {
    @(Get-Process | Where-Object {
        If ($_.Path) { $_.Path.StartsWith($installDir, 'OrdinalIgnoreCase') } Else { $_.ProcessName -eq $exeName }
    })
}

# Bootstrappers hand off to the real game right after starting, so wait until the set of
# game processes stops changing (or 30 seconds pass) before watching it
function Wait-GameSettled {
    $timeout = (Get-Date).AddSeconds(30)
    Do {
        $before = (Get-GameProcesses).Id -join ','
        Start-Sleep -Seconds 3
        $after = (Get-GameProcesses).Id -join ','
    } Until ($before -eq $after -or (Get-Date) -gt $timeout)
}

# Wait on the game processes directly so their exit is noticed right away. Elevated processes
# can't always be waited on, in which case this falls back to polling. The short sleep before
# checking again catches a game that restarts itself, e.g. after changing settings.
function Wait-GameExit {
    While ($processes = Get-GameProcesses) {
        ForEach ($process in $processes) {
            Try { $process.WaitForExit() } Catch { Start-Sleep -Seconds 2 }
        }
        Start-Sleep -Seconds 2
    }
}

function Stop-EpicLauncher {
    Get-Process "EpicGamesLauncher" -ErrorAction SilentlyContinue | Stop-Process -Force
    Wait-Process "EpicGamesLauncher" -Timeout 15 -ErrorAction SilentlyContinue
}

# The game has to be started by a launcher that this script started, so that it is part of the
# process tree Steam tracks. Otherwise Remote Play and the overlay don't pick up the game.
Write-Host 'Stopping Epic Games Launcher'
Stop-EpicLauncher

Write-Host "Starting $($manifest.DisplayName) via Epic"
Start-Process "com.epicgames.launcher://apps/$($appName)?action=launch&silent=true"

# Wait up to 3 minutes for the game to start (cold launcher start, updates, cloud sync)
$timeout = (Get-Date).AddMinutes(3)
While (!(Get-GameProcesses)) {
    If ((Get-Date) -gt $timeout) {
        Write-Host 'Game did not start'
        Stop-EpicLauncher
        exit 2
    }
    Start-Sleep -Seconds 1
}

Wait-GameSettled
Wait-GameExit

# Give Epic time to sync cloud saves, then stop it, since Steam tracks it until it exits
Write-Host 'Game exited, stopping Epic Games Launcher'
Start-Sleep -Seconds 10
Stop-EpicLauncher
