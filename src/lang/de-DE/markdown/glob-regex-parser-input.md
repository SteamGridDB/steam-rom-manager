# Glob-regex Parser Specific Inputs

## Benutzer Glob-regex

Hier erstellst du Globs um Titel aus Dateipfaden zu extrahieren. Bitte informiere dich vorher über alle [speziellen Glob Zeichen ](#special-glob-characters), wenn du nicht weißt, wie man einen Glob erstellt.

## Wie funktioniert es?

Zusätzlich zu speziellen Glob Zeichen, benötigt der Glob Parser eine `${/.../}`{.noWrap} Variable. Der Parser erkennt die Position innerhalb des Globs:

| Benutzer-Glob         | Position                |
| --------------------- | ----------------------- |
| `${/.+/}/*/*.txt`     | Erste Ebene von links   |
| `{*,*/*}/${/.+/}.txt` | Erste Ebene von rechts  |
| `**/${/.+/}/*.txt`    | Zweite Ebene von rechts |

Nach dem Erhalt der `${/.../}`{.noWrap} Position, wird `${/.../}`{.noWrap} durch einen Platzhalter `*` ersetzt.

## Regex Nachbearbeitung

Nach der Titelextraktion wird der Titel durch einen regulären Ausdruck verarbeitet. Es gibt 3 Möglichkeiten, einen regulären Ausdruck zu schreiben.

### Regulärer Ausdruck ohne Aufnahme: `${/.+/}`{.noWrap}

Dies ist identisch mit dem Glob Parser -- jeder Teil des extrahierten Titels wird genutzt.

### Regulärer Ausdruck mit Aufnahme-Klammern: `${/(.+)/}`{.noWrap}

Mehrere Treffer und Aufnahmegruppen sind erlaubt. Zum Beispiel haben wir hier 2 Matchgruppen mit mehreren Aufnahmegruppen:
```
${/(.*?)\s*\[USA\]\s*(.+)|(.*)/}
```
Die erste Gruppe (von links nach rechts) mit allen Aufnahmen wird benutzt. Zusätzlich werden alle Aufnahmegruppen **gruppiert**.

### Regulärer Ausdruck mit Aufnahme-Klammern und ersetztem Text: `${/(.+)/|...}`{.noWrap}

Wie bei [Regulärer Ausdruck mit Aufnahme-Klammern](#regular-expression-with-capture-brackets), außer dass Gruppen anders behandelt werden. Textersetzung kann genutzt werden um Gruppen zu bewegen. Zum Beispiel:
```
${/(.*?)\s*\[USA\]\s*(.+)/|Zweite Gruppe: "$2" ist der ersten vorangestellt "$1" }
```
Wenn unsere erste Gruppe `Legend of Zelda` und die zweite `SUPER EDITION` ist, dann ergibt dies den folgenden (nicht sehr nützlichen) Titel:

`Zweite Gruppe: "SUPER EDITION" ist der ersten vorangestellt "Legend of Zelda"`

Unberührter Text wird standardmäßig bleiben. Wenn du angestellte Zeichen hast, nutze `.*` am Ende oder `.*?` am Anfang des Ausdrucks.

### Unterstütze Flags

Erlaubte Flags sind `i`, `g` und `u`.

## Einschränkungen

Der Glob ist ungültig, wenn die Position nicht extrahiert werden konnte. Meistens wirst du davor gewarnt, wenn der Input ungültig ist. Solltest du jedoch eine Kombination finden, die erlaubt ist, aber falsche Titel erzeugt, gib uns dieses bitte auf [GitHub](https://github.com/FrogTheFrog/steam-rom-manager/issues) weiter.
