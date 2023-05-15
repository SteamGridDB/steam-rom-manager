# Fuzzy Matching

Fuzzy (natürliches) Matchingwird gegen die Liste von [SteamGridDB](http://www.steamgriddb.com/) angewandt. Es wird versuchen, fehlende Zeichen für Titel auszufüllen, was die Wahrscheinlichkeit erhöht, Bilder zu finden.

Fuzzy Titel sind verfügbar als änderbare Titel via `${fuzzyTitle}`. Fuzzy Matching ist momentan nur aktiviert für `ROM Parsers` und `Manual Parsers`.

Es ist möglich, dass `false` Matching für Titel, die nicht in der Liste sqind, passiert. Wenn die fehlende Titel auffallen, eröffne ein Issue auf [GitHub](https://github.com/FrogTheFrog/steam-rom-manager/issues).

## Diakritische Zeichen ersetzen

Ersetzt diakritische Zeichen mit ihren lateinischen Equivalenten: `Ą` -> `A`, `Ę` -> `E`, `Ė` -> `E`, etc. Dies sollte das Matching des Fuzzy Matchers erhöhen.

## Aggressive matching

When enabled, fuzzy matcher will remove all characters except for `a-zA-Z0-9 ()[]` and will replace `_` with space. This should improve the matching ability of fuzzy matcher.

## Remove (...) and [...] brackets

When enabled, fuzzy matcher will remove all `(...)`{.noWrap} and `[...]`{.noWrap} together with their content. Useful for titles with `[USA]`{.noWrap}, `[JPN]`{.noWrap} and etc., as they prevent from matching titles correctly.
