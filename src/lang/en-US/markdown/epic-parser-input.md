# Epic Games Store Specific Inputs

## Manifests Directory Override

Most users shouldn't use this, as they use the standard `Epic Games Store` installation where the game manifests will be located in, for example on Windows, `C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests`.

If, however, for some reason your manifests directory is located in a non-typical location then you can specify the correct manifests directory here.

## Launch Via Epic Games Store `[Recommend enabled]`

This toggle lets you set whether games will launch via the Epic Games Store or directly. If you don't launch via the `Epic Games Store` you will not have access to Epic's online services in game.

## Wait For Game To Exit `[Windows only]`

Only applies when launching via the Epic Games Store. Without it, Steam loses track of the game: it either shows the game as stopped right away (Epic already running) or keeps showing it as running until you quit Epic (Epic not running), and Remote Play doesn't show the game.

With this enabled, the shortcut runs a shell script at `${srmDir}/scripts/epic.ps1`, which restarts the Epic Games Store, starts the game through it and waits until the game has closed, so Steam's "Playing" status, play time, Remote Play and the overlay work. It runs through `conhost.exe --headless`, so no console window appears.

Note that the script closes the Epic Games Store before launching the game and again after the game exits, which interrupts any downloads in progress.
