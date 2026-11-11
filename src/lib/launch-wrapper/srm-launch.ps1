# Steam ROM Manager's launch script (Windows). A wrapped shortcut runs the
# game's own file in launch-wrappers\<Steam user>\, which calls this with the
# game's settings. It runs the scripts set for each stage (pre-launch,
# post-launch, post-exit), starts the game and waits for it to exit, so Steam
# shows it as running until then.
#
# A failing or missing script is logged (launch.log) and skipped: the game
# still starts. Scripts get SRM_GAME_TITLE, SRM_STAGE and SRM_RUN_DIR (a
# folder for this launch's scripts to share files in) as environment
# variables.
#
# SRM writes this file when it saves to Steam; changes to it are overwritten.
param (
    [Parameter(Mandatory = $True)]$Config
)

$runDir = Join-Path ([IO.Path]::GetTempPath()) ("srm-launch-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $runDir -Force | Out-Null
$env:SRM_GAME_TITLE = $Config.title
$env:SRM_RUN_DIR = $runDir

function Write-Log([string]$message) {
    Try {
        $log = $Config.log
        If ((Test-Path -LiteralPath $log) -and (Get-Item -LiteralPath $log).Length -gt 1MB) {
            Move-Item -LiteralPath $log -Destination "$log.old" -Force
        }
        $line = "{0} [{1}] {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Config.title, $message
        Add-Content -LiteralPath $log -Value $line -Encoding UTF8
    } Catch {}
}

function Wait-Seconds($seconds) {
    If ($seconds -gt 0) { Start-Sleep -Milliseconds ([int]([double]$seconds * 1000)) }
}

# Runs one script and waits for it. Never throws.
function Invoke-Step($step, [string]$stage) {
    $env:SRM_STAGE = $stage
    $script = [string]$step.script
    If (!$script) { Return }
    If (!(Test-Path -LiteralPath $script)) {
        Write-Log "${stage}: script not found, skipped: $script"
        Return
    }
    Write-Log "${stage}: running $script"
    Try {
        $stepArgs = @($step.args | Where-Object { $_ -ne $null })
        $global:LASTEXITCODE = 0
        If ([IO.Path]::GetExtension($script) -ieq ".ps1") {
            $output = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $script @stepArgs 2>&1
        } Else {
            $output = & $script @stepArgs 2>&1
        }
        $code = $LASTEXITCODE
        ForEach ($line in @($output)) { Write-Log "  $line" }
        If ($code) { Write-Log "${stage}: $script failed (exit code $code); carrying on" }
    } Catch {
        Write-Log "${stage}: $script failed: $($_.Exception.Message); carrying on"
    }
}

# Pre-launch scripts wait (delay) after running; the others before.
function Invoke-Stage([string]$stage, $steps) {
    ForEach ($step in @($steps)) {
        If (!$step) { Continue }
        If ($stage -ne "pre-launch") { Wait-Seconds $step.delay }
        Invoke-Step $step $stage
        If ($stage -eq "pre-launch") { Wait-Seconds $step.delay }
    }
}

# The game's processes. With a game folder: anything running from it (or,
# where the path can't be read, named like the game's executable). Without:
# the started process and every process it started, followed through
# processes that have exited (Windows keeps a child's parent id).
$script:tracked = @{}
function Get-GameProcesses {
    If ($Config.game -and $Config.game.folder) {
        $folder = [IO.Path]::GetFullPath([string]$Config.game.folder).TrimEnd('\') + '\'
        $exeName = If ($Config.game.exeName) { [IO.Path]::GetFileNameWithoutExtension([string]$Config.game.exeName) } Else { $null }
        Return @(Get-Process | Where-Object {
            If ($_.Path) { $_.Path.StartsWith($folder, 'OrdinalIgnoreCase') } Else { $exeName -and $_.ProcessName -eq $exeName }
        } | ForEach-Object { $_.Id })
    }
    $all = @(Get-CimInstance Win32_Process -Property ProcessId, ParentProcessId -ErrorAction SilentlyContinue)
    Do {
        $added = $False
        ForEach ($p in $all) {
            If (!$script:tracked.ContainsKey([int]$p.ProcessId) -and $script:tracked.ContainsKey([int]$p.ParentProcessId)) {
                $script:tracked[[int]$p.ProcessId] = $True
                $added = $True
            }
        }
    } While ($added)
    $alive = @{}
    ForEach ($p in $all) { $alive[[int]$p.ProcessId] = $True }
    Return @($script:tracked.Keys | Where-Object { $alive.ContainsKey($_) })
}

# Waits until no game process is left (and none comes back for a few
# seconds: some games restart themselves).
function Wait-GameExit {
    $goneSince = $null
    While (!$goneSince -or ((Get-Date) - $goneSince).TotalSeconds -lt 5) {
        If (@(Get-GameProcesses).Count) { $goneSince = $null } ElseIf (!$goneSince) { $goneSince = Get-Date }
        Start-Sleep -Seconds 2
    }
}

Try {
    Write-Log "launching"
    Invoke-Stage "pre-launch" $Config.preLaunch

    $started = $null
    Try {
        $start = @{ FilePath = [string]$Config.file; PassThru = $True }
        If ($Config.arguments) { $start.ArgumentList = [string]$Config.arguments }
        If ($Config.workingDirectory -and (Test-Path -LiteralPath $Config.workingDirectory)) {
            $start.WorkingDirectory = [string]$Config.workingDirectory
        }
        $started = Start-Process @start
        If ($started) { $script:tracked[[int]$started.Id] = $True }
        Write-Log "started $($Config.file) $($Config.arguments)"
    } Catch {
        Write-Log "could not start the game: $($_.Exception.Message)"
    }

    $running = $False
    If ($Config.game -and $Config.game.folder) {
        # The launcher starts the game: wait for it (3 minutes at most: a
        # launcher may be updating first) and for its start-up to settle.
        $timeout = (Get-Date).AddMinutes(3)
        While (!@(Get-GameProcesses).Count -and (Get-Date) -lt $timeout) { Start-Sleep -Seconds 1 }
        $running = [bool]@(Get-GameProcesses).Count
        If ($running) {
            $settleUntil = (Get-Date).AddMinutes(2)
            Do {
                $before = (@(Get-GameProcesses) | Sort-Object) -join ","
                Start-Sleep -Seconds 3
                $after = (@(Get-GameProcesses) | Sort-Object) -join ","
            } Until (($after -and $before -eq $after) -or (Get-Date) -gt $settleUntil)
        }
    } Else {
        $running = [bool]$started
    }

    If ($running) {
        Write-Log "game started"
        Invoke-Stage "post-launch" $Config.postLaunch
        Wait-GameExit
        Write-Log "game exited"
    } Else {
        Write-Log "the game didn't start; skipping post-launch scripts"
    }
    Invoke-Stage "post-exit" $Config.postExit
} Catch {
    Write-Log "launch script error: $($_.Exception.Message)"
} Finally {
    Remove-Item -LiteralPath $runDir -Recurse -Force -ErrorAction SilentlyContinue
}
