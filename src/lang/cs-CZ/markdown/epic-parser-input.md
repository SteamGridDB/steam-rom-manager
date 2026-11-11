# Epic Games Store Specific Inputs

## Manifests Directory Override

Většina uživatelů by tohle neměla používát, protože většinou používají `Epic Games Store` instalační složku kde se hra oběví. Například na Windows, `C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests`.

If, however, for some reason your manifests directory is located in a non-typical location then you can specify the correct manifests directory here.

## Launch Via Epic Games Store `[Recommend enabled]`

This toggle lets you set whether games will launch via the Epic Games Store or directly. If you don't launch via the `Epic Games Store` you will not have access to Epic's online services in game.

## Wait For Game To Exit `[Windows only]`

Only applies when launching via the Epic Games Store. Without it, Steam loses track of the game: it either shows the game as stopped right away (Epic already running) or keeps showing it as running until you quit Epic (Epic not running), and Remote Play doesn't show the game.

With this enabled, the game's shortcut runs SRM's launch script (see **Script wrapper**). It restarts the Epic Games Store, starts the game through it and waits until the game has closed, so Steam's "Playing" status, play time, Remote Play and the overlay work. After the game, it waits for Epic to sync cloud saves, then closes Epic.

Note that Epic is closed before the game starts and again after it exits, which interrupts any downloads in progress and any other Epic game that is running at the time.
