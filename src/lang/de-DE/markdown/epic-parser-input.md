# Epic Games Store Specific Inputs

## Manifest Verzeichnis überschreiben

Die meisten Benutzer sollten dies nicht verwenden da sie die Standard- `Epic Games Store` Installation verwenden, in der sich die Spielmanifeste befinden werden. Zum Beispiel unter Windows, `C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests`.

Wenn sich dein Manifest-Verzeichnis jedoch aus irgendeinem Grund an einem nicht typischen Ort befindet, kannst du das richtige Manifests-Verzeichnis hier angeben.

## Im Epic Games Store starten `[Empfohlen]`

Wenn du nicht über den `Epic Games Store` startest, wirst du im Spiel keinen Zugriff auf die Online-Dienste von Epic haben. Hiermit stellst du ein, ob du Spiele über `Epic Games Store ` oder direkt starten willst.

## Wait For Game To Exit `[Windows only]`

Only applies when launching via the Epic Games Store. Without it, Steam loses track of the game: it either shows the game as stopped right away (Epic already running) or keeps showing it as running until you quit Epic (Epic not running), and Remote Play doesn't show the game.

With this enabled, the game's shortcut runs SRM's launch script (see **Script wrapper**). It restarts the Epic Games Store, starts the game through it and waits until the game has closed, so Steam's "Playing" status, play time, Remote Play and the overlay work. After the game, it waits for Epic to sync cloud saves, then closes Epic.

Note that Epic is closed before the game starts and again after it exits, which interrupts any downloads in progress and any other Epic game that is running at the time.
