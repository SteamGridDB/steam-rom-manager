# Glob Parser Specific Inputs

## Benutzer-Glob

Hier erstellst du Globs zum extrahieren von Titeln aus Dateipfaden. Bitte informiere dich vorher über alle [speziellen Glob Zeichen ](#special-glob-characters), wenn du nicht weißt, wie man einen Glob erstellt.

## Wie funktioniert es?

Zusätzlich zu speziellen Glob Zeichen, benötigt der Glob Parser eine `${title}`{.noWrap} Variable. Der Parser wird die Position innerhalb des  **Globs** finden, zum Beispiel:

| Benutzer-Glob          | Position                |
| ---------------------- | ----------------------- |
| `${title}/*/*.txt`     | Erste Ebene von links   |
| `{*,*/*}/${title}.txt` | Erste Ebene von rechts  |
| `**/${title}/*.txt`    | Zweite Ebene von rechts |

Nach dem Erhalt der `${title}`{.noWrap} Position, wird der `${title}`{.noWrap} durch einen Platzhalter `*` ersetzt.

## Einschränkungen

Der Glob ist ungültig, wenn die Position nicht extrahiert werden konnte. Meistens wirst du davor gewarnt, wenn der Input ungültig ist. Solltest du jedoch eine Kombination finden, die erlaubt ist, aber falsche Titel erzeugt, gib uns dieses bitte auf [GitHub](https://github.com/FrogTheFrog/steam-rom-manager/issues) weiter.
