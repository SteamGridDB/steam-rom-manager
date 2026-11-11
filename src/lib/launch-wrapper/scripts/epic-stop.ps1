# Epic games, "wait for the game to exit" (pre-launch, and post-exit after
# cloud saves): stops the Epic Games Launcher. Before the launch, so the
# launcher SRM's launch script starts (with the game) is part of the process
# tree Steam tracks: otherwise Remote Play and the overlay don't pick up the
# game. After the game, since Steam tracks the launcher until it exits.
# From https://github.com/SteamGridDB/steam-rom-manager/pull/904 (hbogaeus).
Write-Host 'Stopping Epic Games Launcher'
Get-Process "EpicGamesLauncher" -ErrorAction SilentlyContinue | Stop-Process -Force
Wait-Process "EpicGamesLauncher" -Timeout 15 -ErrorAction SilentlyContinue
