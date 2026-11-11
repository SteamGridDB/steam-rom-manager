#

## 列表目录覆盖

大多数用户不应该使用这个，因为他们使用标准的 `Epic Games Store` 安装，在那里游戏清单将被放置在例如 Windows 上的 `C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests`。

然而，如果由于某些原因您的清单目录位于非典型位置，则可以在此处指定正确的清单目录。

## 通过 Epic Games Store 启动 `[建议启用]`

如果您不通过 `Epic Games Store` 启动游戏，将无法在游戏中使用 Epic 的在线服务。 This toggle lets you set whether games will launch via the Epic Games Store or directly. 如果您不通过 `Epic Games Store` 启动游戏，将无法在游戏中使用 Epic 的在线服务。

## Wait For Game To Exit `[Windows only]`

Only applies when launching via the Epic Games Store. Without it, Steam loses track of the game: it either shows the game as stopped right away (Epic already running) or keeps showing it as running until you quit Epic (Epic not running), and Remote Play doesn't show the game.

With this enabled, the game's shortcut runs SRM's launch script (see **Script wrapper**). It restarts the Epic Games Store, starts the game through it and waits until the game has closed, so Steam's "Playing" status, play time, Remote Play and the overlay work. After the game, it waits for Epic to sync cloud saves, then closes Epic.

Note that Epic is closed before the game starts and again after it exits, which interrupts any downloads in progress and any other Epic game that is running at the time.
