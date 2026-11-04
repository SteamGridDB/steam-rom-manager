Param(
    [Parameter(Mandatory=$true)]
    [string]$gameURI,
    [Parameter(Mandatory=$true)]
    [string]$gameProcessName,
    [int]$parentPid = 0
)

function Wait-ForGameStart([switch]$CheckParent) {
    $launchTimeout = 120
    $elapsed = 0
    while (-not (Get-Process -Name $gameProcessName -ErrorAction SilentlyContinue) -and ($elapsed -lt $launchTimeout)) {
        if ($CheckParent -and -not (Test-ParentAlive)) {
            break
        }
        Start-Sleep -Seconds 1
        $elapsed += 1
    }
    return [bool](Get-Process -Name $gameProcessName -ErrorAction SilentlyContinue)
}

# --- Detached Child / Watcher Mode ---
if ($parentPid -ne 0) {
    $parentProcess = $null

    try {
        $proc = [System.Diagnostics.Process]::GetProcessById($parentPid)
        if ($proc.ProcessName -match '^powershell|^pwsh') {
            $parentProcess = $proc
        }
    } catch {
        $parentProcess = $null
    }

    function Test-ParentAlive {
        if ($null -eq $parentProcess) { return $false }
        try {
            $parentProcess.Refresh()
            return (-not $parentProcess.HasExited)
        } catch {
            return $false
        }
    }

    $launchTimeout = 120
    $elapsed = 0

    $gameStarted = Wait-ForGameStart -CheckParent

    # Wait for either the game or parent process to exit
    while ((Test-ParentAlive) -and (Get-Process -Name $gameProcessName -ErrorAction SilentlyContinue)) {
        Start-Sleep -Seconds 1
    }

    # Stop the game if it's still running
    if (Get-Process -Name $gameProcessName -ErrorAction SilentlyContinue) {
        Stop-Process -Name $gameProcessName -Force -ErrorAction SilentlyContinue
    }

    # Stop the parent process if it's still running
    try {
        $parentProcess.Refresh()
        if (-not $parentProcess.HasExited) {
            $parentProcess.Kill()
        }
    } catch {}

    # Only give the Epic Games Launcher time to finish cloud save sync if the game actually started
    if ($gameStarted) {
        Start-Sleep -Seconds 10
    } else {
        Start-Sleep -Seconds 2
    }

    Stop-Process -Name "EpicGamesLauncher" -Force -ErrorAction SilentlyContinue

    exit 0
}

# --- Parent / Launcher Mode ---

# Launch the detached watcher child process
$watcherArgs = "-WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -gameURI `"$gameURI`" -gameProcessName `"$gameProcessName`" -parentPid $PID"
Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = "powershell.exe $watcherArgs"
}

Start-Process $gameURI

Wait-ForGameStart

# Wait for the game to exit
while (Get-Process -Name $gameProcessName -ErrorAction SilentlyContinue) {
    Start-Sleep -Seconds 1
}

exit 0