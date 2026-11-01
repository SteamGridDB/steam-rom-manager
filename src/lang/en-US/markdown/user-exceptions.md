# Exceptions

Per-game rules that overrule the parsers. There are two kinds, on two tabs:

- **Changes**: a different title in Steam, a different artwork search or SteamGridDB match, launch arguments, a compatibility tool, or local artwork only.
- **Excluded games**: games that are never added to Steam. This lets you keep games you don't want in Steam in the same folder as the rest.

The two are independent: excluding a game keeps the changes saved for it, and putting it back (the `Put back` button) brings them back into effect.

## What not to use this for

Rules are for individual games, not bulk tasks. For example, removing the colon character from every title is a job for the parser's title modifier (`${/:/|${title}|}`), and arguments common to every game belong in the parser's command line arguments field. Don't create a rule per game for those.

## Which games a rule applies to

Every rule says how it matches:

- **Added on Add Games**: rules made on the Add Games page (a game's details, or `Manage Excludes`) apply to that one game. SRM recognizes it by its app id, so a rule keeps working even after the game is renamed in Steam. Its title is shown for reference and can't be edited.
- **By title**: rules added on this page apply to every game whose _extracted title_ (the title before any changes; see the parser's `Test Parser` output) is exactly the one you enter. Use these for a title that several parsers or folders produce.

If a game has both, the one made for it on Add Games wins.

## New title

The title shown in Steam. It isn't used to search for artwork.

## Artwork search

What to search [SteamGridDB](https://www.steamgriddb.com) for instead of the game's title. To pick the exact SteamGridDB game, use `Fix match` on the Add Games page; the chosen game is then shown here instead (`Clear match` removes it).

## Launch arguments

Command line arguments like `--fullscreen` for this game. They replace the arguments field of the Steam shortcut; they're never appended to the executable.

## Compatibility tool

Forces a Steam Play compatibility tool (e.g. a Proton version) for this game, or none, instead of the parser's choice.

## Local artwork only

Don't fetch artwork from online providers (e.g. [SteamGridDB](https://www.steamgriddb.com)): useful when the online match is wrong, or you don't like any of the artwork available.

## Custom variables

Overriding specific titles can also be done by editing the custom variables JSON file and using its variables in the parser's title modifier. Rules here are recommended instead: the custom variables file is updated over time and your edits there may be overwritten.
