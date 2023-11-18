# Fuzzy Matching

Fuzzy (natürliches) Matchingwird gegen die Liste von [SteamGridDB](http://www.steamgriddb.com/) angewandt. Es wird versuchen, fehlende Zeichen für Titel auszufüllen, was die Wahrscheinlichkeit erhöht, Bilder zu finden.

Fuzzy Titel sind verfügbar als änderbare Titel via `${fuzzyTitle}`. Fuzzy Matching ist momentan nur aktiviert für `ROM Parsers` und `Manual Parsers`.

Es ist möglich, dass `false` Matching für Titel, die nicht in der Liste sqind, passiert. Wenn die fehlende Titel auffallen, eröffne ein Issue auf [GitHub](https://github.com/FrogTheFrog/steam-rom-manager/issues).

## Diakritische Zeichen ersetzen

Ersetzt diakritische Zeichen mit ihren lateinischen Equivalenten: `Ą` -> `A`, `Ę` -> `E`, `Ė` -> `E`, etc. Dies sollte das Matching des Fuzzy Matchers erhöhen.

## Aggressives Matching

Wenn du dies aktivierst, wird der Fuzzy Matcher alle Zeichen außer `a-zA-Z0-9 ()[]` entfernen und `_` mit Leerzeichen ersetzen. Dies sollte das Matching des Fuzzy Matchers erhöhen.

## (...) und [...] Klammern entfernen

Wenn du dies aktivierst, wrid der Fuzzy Matcher alle `(...)`{.noWrap} und `[...]`{.noWrap} inklusive ihrem Inhalt entfernen. Nützlich für Titel mit `[USA]`{.noWrap}, `[JPN]`{.noWrap} etc., da diese das matching erschweren.
