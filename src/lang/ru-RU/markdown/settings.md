## Общие настройки
### Автономный режим `[Рекомендуется отключить]`

When enabled SRM makes no network requests, useful if you only want to use SRM for local images.
### Automatically clear log before testing parsers `[Recommend enabled]`
When enabled the log is cleared each time a parser is tested.
### Show current steam images by default `[Recommend enabled]`
When enabled this setting tells SRM to default to whatever artwork is currently in steam for a given app. If it is disabled, then every time SRM is run (and saved) all artwork will be reset.
### Remove shortcuts for disabled parsers `[Recommend disabled]`
When enabled disabling a parser and running SRM will remove all added entries and artwork for the disabled parser. Useful if you want your steam library to be in 1-1 correspondence with enabled parsers.

## Fuzzy Matcher Settings
### Log matching results `[Recommend disabled]`
When enabled more verbose logs appear for the fuzzy title matcher in the `Event log`. Useful for debugging incorrect fuzzy matches.

### Reset fuzzy list
Resets the stored list of titles used for fuzzy matching to the list of titles returned by `SteamGridDB` (removes any user added titles).
### Reset fuzzy cache
Clears the cache of titles that fuzzy matching has already seen (try this if changes you make to fuzzy list are not resulting in changes to titles in SRM).

## Image provider settings
### Preload retrieved images `[Recommend disabled]`
When enabled, SRM will pull all available artwork for every game, rather than pulling one piece of artwork at a time as the user flips through the images. Don't enable this unless you have a good reason and a very small library of games, otherwise it could result in very large (slow) network requests.
### Enabled providers
Global setting to enable/disable particular image providers. Current options are `SteamGridDB` and `Steam Official`.
### DNS manual override
Set this if you want SRM to do DNS resolution internally, as opposed to relying on your system's default DNS server. This solves many timeout issues on the Steam Deck.

## Community Variables and Presets
### Force download custom variables.
Resets the custom variables JSON file that is used for certain presets to whatever its current state is on the SRM github. Useful if the custom variables JSON file has been corrupted.
### Force download custom presets.
Resets the JSON files for parser presets to whatever is on the SRM github. Useful if your presets list is not automatically updating for some reason, or has become corrupted.
