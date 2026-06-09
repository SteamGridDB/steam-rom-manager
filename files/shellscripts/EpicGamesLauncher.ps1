Param(
        [Parameter(Mandatory=$true)]
        $gameURI,
        [Parameter(Mandatory=$true)]
        $gameProcessName
)


# Start the game via Epic Games Launcher
Start-Process $gameURI

# Wait for the game to start
while (-not (Get-Process -Name $gameProcessName -ErrorAction SilentlyContinue)) {
    Start-Sleep -Seconds 5
}

# Wait for the game to exit
while (Get-Process -Name $gameProcessName -ErrorAction SilentlyContinue) {
    Start-Sleep -Seconds 5
}

# Give Epic Games Launcher a few seconds before closing
Start-Sleep -Seconds 10

# Close Epic Games Launcher
Stop-Process -Name "EpicGamesLauncher" -Force -ErrorAction SilentlyContinue