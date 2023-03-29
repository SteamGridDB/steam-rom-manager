## Configurações gerais
### Modo offline `[Recomendado desativado]`

Quando a SRM habilitada não faz solicitações de rede, útil se você quiser usar apenas SRM para imagens locais.
### Limpar log automaticamente antes de testar os analisadores `[Recomendado ativado]`
Quando habilitado, o log é limpo cada vez que um analisador é testado.
### Mostrar imagens Steam atuais por padrão `[Recomendado ativado]`
Quando ativado esta configuração diz SRM para o padrão para qualquer arte que esteja atualmente no vapor para um determinado aplicativo. Se estiver desativado, então toda vez que a SRM for executada (e salva) todas as artes serão redefinidas.
### Remover atalhos para analisadores desativados `[Recomendado desativado]`
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
