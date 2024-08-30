# Glob-regex Parser specific inputs

## Benutzer glob-regex

This is where you create your glob for extracting title from file path. Please read all of [special glob characters](#special-glob-characters) if you don't know how to construct a glob.

## Wie funktioniert es?

In addition to special glob characters, glob parser requires you to enter `${/.../}`{.noWrap} variable. Parser will locate it's position inside your glob, for example:

| Benutzer-Glob         | Position                |
| --------------------- | ----------------------- |
| `${/.+/}/*/*.txt`     | Erste Ebene von links   |
| `{*,*/*}/${/.+/}.txt` | Erste Ebene von rechts  |
| `**/${/.+/}/*.txt`    | Zweite Ebene von rechts |

After acquiring `${/.../}`{.noWrap} position, `${/.../}`{.noWrap} will be replaced with a wildcard `*`.

## Regex post-processing

Nach der Titelextraktion wird der Titel durch einen regulären Ausdruck verarbeitet. Es gibt 3 Möglichkeiten, einen regulären Ausdruck zu schreiben.

### Regulärer Ausdruck ohne Aufnahme: `${/.+/}`{.noWrap}

This is practically identical to "Glob" parser -- every piece of extracted title will be used.

### Regulärer Ausdruck mit Aufnahme-Klammern: `${/(.+)/}`{.noWrap}

Mehrere Treffer und Aufnahmegruppen sind erlaubt. Zum Beispiel haben wir hier 2 Matchgruppen mit mehreren Aufnahmegruppen:

```
${/(.*?)\s*\[USA\]\s*(.+)|(.*)/}
```

First match group (from left to right) with all correct captures will be used. Furthermore, all capture groups will be **joined**.

### Regulärer Ausdruck mit Aufnahme-Klammern und ersetztem Text: `${/(.+)/|...}`{.noWrap}

Similar to [regular expression with capture brackets](#regular-expression-with-capture-brackets) except for how it handles captured groups. Replacement text can be used to move around captured groups. For example:

```
${/(.*?)\s*\[USA\]\s*(.+)/|Second capture group: "$2" precedes the first one, which is "$1" }
```

If our first capture group is `Legend of Zelda` and second one is `SUPER EDITION`, then we will get the following (not very useful) title:

`Second capture group: "SUPER EDITION" precedes the first one, which is "Legend of Zelda"`

Untouched text will remain by default, so if you see some trailing characters be sure to add `.*` at the end or `.*?` at the begging of regular expression.

### Unterstütze Markierungen

Erlaubte Markierungen sind `i`, `g` und `u`.

## Einschränkungen

Positionsextraktion kommt mit einigen Einschränkungen -- Glob ist ungültig, wenn keine Position extrahiert werden kann. Meistens wirst du davor gewarnt, was du nicht tun kannst. Solltest du jedoch eine Kombination finden, die erlaubt ist, aber falsche Titel erzeugt, gib uns dieses Problem bitte auf [github](https://github.com/FrogTheFrog/steam-rom-manager/issues) weiter.
