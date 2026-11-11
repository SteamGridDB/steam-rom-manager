# Epic Games Store Specific Inputs

## Manifest Directory overschrijven

De meeste gebruikers zouden dit niet hoeven te gebruiken, omdat ze de standaard `Epic Games Store`-installatie gebruiken waarin de game-manifesten zich bevinden, bijvoorbeeld in Windows, `C:\ProgramData\Epic\EpicGamesLauncher\ Gegevens\manifesten`.

Als uw manifestenmap zich om de een of andere reden echter op een niet-typische locatie bevindt, kunt u hier de juiste manifestenmap specificeren.

## Start Via Epic Games Store `[Ingeschakeld aanbevolen]`

Als je niet start via de `Epic Games Store`, heb je geen toegang tot de online services van Epic in de game. This toggle lets you set whether games will launch via the Epic Games Store or directly.

## Wait For Game To Exit `[Windows only]`

Only applies when launching via the Epic Games Store. Without it, Steam loses track of the game: it either shows the game as stopped right away (Epic already running) or keeps showing it as running until you quit Epic (Epic not running), and Remote Play doesn't show the game.

With this enabled, the game's shortcut runs SRM's launch script (see **Script wrapper**). It restarts the Epic Games Store, starts the game through it and waits until the game has closed, so Steam's "Playing" status, play time, Remote Play and the overlay work. After the game, it waits for Epic to sync cloud saves, then closes Epic.

Note that Epic is closed before the game starts and again after it exits, which interrupts any downloads in progress and any other Epic game that is running at the time.
