# Steam Parser Specific Inputs

## Application Types

Which kinds of Steam applications to include: full games, demos, tools (e.g. `Wallpaper Engine`, `3DMark`), and/or source mods. Deselect a type to exclude it.

## Suche nur nach Artworks für installierte Titel

If enabled SRM will filter out any Steam applications that are not currently installed locally. Wenn du Spiele de-/installierst musst du Steam neustarten bevor die Liste der Spiele für SRM verfügbar ist.

## Game fetch strategy

Controls how SRM figures out which games belong to the selected Steam account. Steam does not keep a single, complete list of owned games in a readable local file, so you can choose the trade-off that fits you:

- **Installed at least once (offline)** — Default. Reads the account's local Steam files, so it works completely offline and needs no setup. Limitation: it only finds games that have been **installed at least once** on this machine; games you own but have never installed will not appear.

- **All owned games (Steam Web API)** — Fetches your full library (owned games, installed or not) from Valve's servers. This option **only works online and requires a Steam Web API key** (see below). It ignores the "installed only" limitation above.

## Steam Web API key

Only used by the **All owned games (Steam Web API)** strategy; leave it blank for the offline strategy.

To get a key:

1. Go to <https://steamcommunity.com/dev/apikey> and sign in with the Steam account you want to parse.
2. Enter any domain name in the "Domain Name" field (e.g. `localhost` — it is not validated for personal use) and agree to the terms.
3. Copy the generated key and paste it here.

Notes:

- The key is tied to your account; keep it private (it is stored in your parser configuration).
- The account's game details do **not** need to be public — the key works for its own account regardless of privacy settings.
- If you are offline or the key is missing/invalid, this strategy will error; switch back to "Installed at least once" to parse offline.
