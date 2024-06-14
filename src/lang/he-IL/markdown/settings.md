## General Settings
### Check for updates on start `[Recommend enabled]`
Check if an update for SRM is available and prompt to update each time SRM launches.
### Auto kill Steam `[Recommend enabled]`
SRM will attempt to kill all running instances of Steam whenever it needs to read/write collections information (specifically when saving to steam from `Add Games` and when removing all games from `Settings`).
### Auto restart Steam `[Recommend enabled]`
SRM will attempt to restart Steam after killing it and completing whatever collections related task required killing Steam in the first place. Requires `Auto kill Steam` to be enabled.
### Offline mode `[Recommend disabled]`
When enabled SRM makes no network requests, useful if you only want to use SRM for local images.
### Automatically clear log before testing parsers `[Recommend enabled]`
When enabled the log is cleared each time a parser is tested.
## Add Games
### Show current steam images by default `[Recommend enabled]`
When enabled this setting tells SRM to default to whatever artwork is currently in steam for a given app. If it is disabled, then every time SRM is run (and saved) all artwork will be reset.
### Remove shortcuts for disabled parsers `[Recommend disabled]`
When enabled disabling a parser and running SRM will remove all added entries and artwork for the disabled parser. Useful if you want your steam library to be in 1-1 correspondence with enabled parsers.
### Disable saving of steam categories `[Recommend disabled]`
SRM will not write any collections information when saving to Steam. This allows SRM to perform its tasks while Steam is still running, at the obvious cost that added games will not be categorized.
### Hide Steam username from preview
Steam does not allow user's to alter their Steam usernames. In some cases (childish names, dead names, etc), users may no longer wish to see their Steam usernames. This setting hides it from `Add Games`.
### Remove all added games and controllers
Undo all SRM added changes from Steam.
### Remove all controllers only
Undo all SRM added controller settings from Steam.
## Fuzzy Matcher Settings
### Log matching results `[Recommend disabled]`
When enabled more verbose logs appear for the fuzzy title matcher in the `Event log`. Useful for debugging incorrect fuzzy matches.
### Reset fuzzy list
Resets the stored list of titles used for fuzzy matching to the list of titles returned by `SteamGridDB` (removes any user added titles).
### Reset fuzzy cache
Clears the cache of titles that fuzzy matching has already seen (try this if changes you make to fuzzy list are not resulting in changes to titles in SRM).
## Image provider settings
### Artwork loading strategy `[Recommend Load artwork lazily]`
This is the strategy SRM uses to pull artwork thumbnails for the `Add Games` UI. If you are parsing a lot of games, `Load artwork lazily` is recommended. `Preload first artwork` will try to pull the first piece of artwork for each game in each artwork category, and `Preload all artwork` will try to pull all available artwork for each game in each artwork category. `Preload all artwork` will cause network and performance issues unless the number of games is quite small (less than `30` or so).
### Enabled providers
Global setting to enable/disable particular image providers. Current options are `SteamGridDB` and `Steam Official`.
### DNS manual override
Set this if you want SRM to do DNS resolution internally, as opposed to relying on your system's default DNS server. This solves many timeout issues on the Steam Deck.
### Batch size for image downloads
Number of images SRM will attempt to download at once when saving to Steam. May help to lower this if you are receiving timeout errors from SGDB.
### Nuke artwork choice cache
SRM attempts to remember your artwork choices, this button forcibly forgets all of them.
### Nuke local artwork backups
This deletes all artwork backups created for parsers with `Backup artwork locally` enabled.
## Community Variables and Presets
### Force download custom variables.
Resets the custom variables JSON file that is used for certain presets to whatever its current state is on the SRM github. Useful if the custom variables JSON file has been corrupted.
### Force download custom presets.
Resets the JSON files for parser presets to whatever is on the SRM github. Useful if your presets list is not automatically updating for some reason, or has become corrupted.
### Force download shell scripts
Re fetches the shell scripts SRM uses to perform certain tasks.
