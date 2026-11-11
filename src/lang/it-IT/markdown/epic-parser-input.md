# Input specifici per l'Epic Games Store

## Sovrascrittura della Cartella Manifests

La maggior parte degli utenti non dovrebbero usare questa opzione, in quanto utilizzano l'installazione standard `Epic Games Store` dove si trovaranno i manifests del gioco, ad esempio su Windows, `C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests`.

Se, tuttavia, per qualche motivo, la cartella manifests si trova in una posizione non tipica, allora qui puoi specificare la cartella manifests corretta.

## Esegui tramite Epic Games Store `[Abilitazione Raccomandata]`

Questa opzione ti permette d'impostare se i giochi verranno avviati attraverso l'Epic Games Store o direttamente. Se non avvii attraverso l' `Epic Games Store` non avrai accesso ai servizi online di Epic in gioco.

## Wait For Game To Exit `[Windows only]`

Only applies when launching via the Epic Games Store. Without it, Steam loses track of the game: it either shows the game as stopped right away (Epic already running) or keeps showing it as running until you quit Epic (Epic not running), and Remote Play doesn't show the game.

With this enabled, the game's shortcut runs SRM's launch script (see **Script wrapper**). It restarts the Epic Games Store, starts the game through it and waits until the game has closed, so Steam's "Playing" status, play time, Remote Play and the overlay work. After the game, it waits for Epic to sync cloud saves, then closes Epic.

Note that Epic is closed before the game starts and again after it exits, which interrupts any downloads in progress and any other Epic game that is running at the time.
