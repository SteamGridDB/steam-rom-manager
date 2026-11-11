- **`Heroic Executable Path Override`**

Path to the Heroic executable. Only needed when launching via Heroic and the `heroic` executable cannot be found on `PATH`.

- **`Heroic Config Directory Override`**

Path to Heroic's config directory containing the per-store `installed.json` files. Only needed when Heroic's config lives outside the default location, e.g. for the Flatpak version: `~/.var/app/com.heroicgameslauncher.hgl/config/heroic`.

- **`Launch via Heroic`**

Launch games through Heroic itself via `heroic://launch?...`, the same way Heroic's own "Add to Steam" button wires them up. Keeps each game's per-game wine/proton configuration, so this is the recommended mode. When disabled, games are launched directly from their executable, bypassing Heroic entirely.
