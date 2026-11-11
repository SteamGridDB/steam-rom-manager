# Особые входные данные Epic Games Store

## Переопределение каталога манифестов

Большинство пользователей не используют это, так как они используют стандартную установку `Epic Games Store`, где манифесты игр расположены в папке по умолчанию. Например, для Windows она находится в `C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests`.

Но если по какой-либо причине директория расположена в другом месте, то вы можете указать правильный путь до директории манифестов здесь.

## Запуск через Epic Games Store `[Включено по рекомендации]`

Этот переключатель позволяет установить, будут ли игры запускаться через Epic Games Store или нет. Если вы не запустите игру через `Epic Games Store`, то вы не сможете получить доступ к онлайн-сервисам Epic Games внутри игры.

## Wait For Game To Exit `[Windows only]`

Only applies when launching via the Epic Games Store. Without it, Steam loses track of the game: it either shows the game as stopped right away (Epic already running) or keeps showing it as running until you quit Epic (Epic not running), and Remote Play doesn't show the game.

With this enabled, the game's shortcut runs SRM's launch script (see **Script wrapper**). It restarts the Epic Games Store, starts the game through it and waits until the game has closed, so Steam's "Playing" status, play time, Remote Play and the overlay work. After the game, it waits for Epic to sync cloud saves, then closes Epic.

Note that Epic is closed before the game starts and again after it exits, which interrupts any downloads in progress and any other Epic game that is running at the time.
