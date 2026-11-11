#

## Outrepasser le répertoire des Manifestes

La plupart des utilisateurs ne devraient pas utiliser ceci, car ils utilisent l'installation standard de l'`Epic Games Store` ou les manifestes de jeu vont se trouver, par exemple sur Windows, `C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests`.

Si, par contre, pour n'importe quelle raison votre répertoire des manifestes est placé dans un endroit atypique, vous pouvez spécifier ce répertoire ici.

## Démarrer Via Epic Games Store `[Activation recommandée]`

Ce switch vous laisse choisir si vous préférer lancer les jeux directement via Epic Games Stores. Si vous ne démarrer pas via `Epic Games Store` vous n'aurez pas accès aux services en jeu d'Epic en ligne.

## Wait For Game To Exit `[Windows only]`

Only applies when launching via the Epic Games Store. Without it, Steam loses track of the game: it either shows the game as stopped right away (Epic already running) or keeps showing it as running until you quit Epic (Epic not running), and Remote Play doesn't show the game.

With this enabled, the game's shortcut runs SRM's launch script (see **Script wrapper**). It restarts the Epic Games Store, starts the game through it and waits until the game has closed, so Steam's "Playing" status, play time, Remote Play and the overlay work. After the game, it waits for Epic to sync cloud saves, then closes Epic.

Note that Epic is closed before the game starts and again after it exits, which interrupts any downloads in progress and any other Epic game that is running at the time.
