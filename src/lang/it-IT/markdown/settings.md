## Impostazioni Generali
### Modalità offline `[Disabilitazione Consigliata]`

Quando è abilitato, SRM non effettua richieste di rete, utile se si desidera utilizzare SRM solo per le immagini locali.
### Cancella automaticamente il log prima di testare i parser `[Abilitazione Consigliata]`
Quando è abilitato, il log viene cancellato ogni volta che viene testato un parser.
### Mostra le attuali immagini di Steam di default `[Abilitazione Consigliata]`
Quando abilitata, questa impostazione dice a SRM di preimpostare ad un qualsiasi artwork attualmente presente in Steam per una data app. Se è disabilitato, ogni volta che SRM viene eseguito (e salvato) tutti gli artwork verranno resettati.
### Rimuovi le scorciatoie per i parser disabilitati `[Disabilitazione Consigliata]`
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
Global setting to disable certain providers. Currently the only image provider is `SteamGridDB` since ConsoleGrid and RetroGaming.cloud are defunct.

## Community Variables and Presets
### Force download custom variables.
Resets the custom variables JSON file that is used for certain presets to whatever its current state is on the SRM github. Useful if the custom variables JSON file has been corrupted.
### Force download custom presets.
Resets the JSON files for parser presets to whatever is on the SRM github. Useful if your presets list is not automatically updating for some reason, or has become corrupted.
