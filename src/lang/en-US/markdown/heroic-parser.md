# Heroic Parser

This parser imports games from the [Heroic Games Launcher](https://heroicgameslauncher.com/), which manages games from GOG, the Epic Games Store and Amazon Prime Games on Windows, Mac OS and Linux. It reads the installed-games files Heroic maintains under its config directory, so every game installed through Heroic is picked up automatically, with artwork selectable as with any other parser.

By default games are launched through Heroic itself (`heroic://launch?...`), the same way Heroic's own "Add to Steam" button wires them up. This keeps each game's per-game wine/proton configuration, so it is the recommended mode. With **Launch via Heroic** disabled, games are launched directly from their executable instead, bypassing Heroic entirely.

## Compatibility

This parser works on `Windows`, `Linux` and `Mac OS`. For the Flatpak version of Heroic, point the config directory override at `~/.var/app/com.heroicgameslauncher.hgl/config/heroic`.
