#From https://github.com/SteamGridDB/steamgriddb-manager/blob/master/BnetHelper.ps1
param (
    [Parameter(Mandatory=$True)][string]$bnet,    # Path to the Battle.net executable
    [Parameter(Mandatory=$True)][string]$launchid # Battle.net launch id to launch
)
Write-Host 'Stopping Battle.net'
Get-Process "battle.net" -ErrorAction SilentlyContinue | Stop-Process

Write-Host 'Starting Battle.net'
Start-Process $bnet

# Wait to be sure log file gets created (just to be safe, usually gets created instantly)
Start-Sleep -Seconds 3

# Get latest log file
$log = Get-ChildItem -Path "$env:LOCALAPPDATA\Battle.net\Logs" -Filter "battle.net-*.log" | Sort-Object LastAccessTime -Descending | Select-Object -First 1
Write-Host "Log Directory: $log"
$bnetStarted = $False

Write-Host 'Waiting for Battle.net to start completely'

# Get current system date
$currentDate = Get-Date
Do {
    # Check log file until we find this string
    $launchedCompletely = Select-String -path $log -pattern 'GameController initialization complete'
    Write-Host "Launched Completely: $(!$launchedCompletely)"
    If (!($launchedCompletely)) {
        # Timeout after 1 minute
        If ($currentDate.AddMinutes(1) -lt (Get-Date))
        {
            Write-Host 'Could not find successful launch'
            exit
        }
        Start-Sleep -Seconds 1
    } Else {
        Write-Host 'Bnet started!'
        $bnetStarted = $True
    }
} Until ($bnetStarted)

# Launch 
Write-Host "Starting game ($launchid)"
Start-Process $bnet "--exec=`"launch $launchid`""