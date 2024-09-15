# Benutzer-Ausnahmen

## Wofür dies nicht verwendet werden soll

Dieses Tool kann verwendet werden, um Ausnahmen pro App festzulegen, die die Parser überschreiben. Es sollte nicht zur Durchführung von Massen-Aufgaben verwendet werden. For example, removing the colon character from titles can be accomplished via the title modifier `${/:/|${title}|}` and should not be done here. Wenn ein Kommandozeilenargument für jede geparste App üblich ist, dann verwende das Kommandozeilenargument-Feld - erstelle hier keine Einträge!

## Extracted Title - _Mandatory_

The only mandatory exception field is `Extracted Title`. Once this is specified and the exception is saved, any game that matches will have its fields overridden by any non-blank exception fields (if left blank, the exception fields do nothing).

The `Extracted Title` field matches in two ways:

- Based on the `Exception ID` (found by running test parser). For example if the game were `Portal 1` and its `Exception ID` was `12345` then you might put `Portal 1 ${id:12345}`. If the `Exception ID` is present then it doesn't matter what label you put in front of it, but for readability and searchability it's nice to put the game's actual name in front of the `Exception ID`.
- Based on the `Extracted Title` (found by running test parser). For example if the `Extracted Title` were `Portal 2` you would put `Portal 2`.

Thus you can either have an exception that applies to all games with the same name or an exception that applies only to an exact game (`Exception ID`s are unique). The reason for this is primarily backwards compatibility -- SRM formerly matched only on the `Extracted Title`.

Exceptions generated from `Preview` will always be in the form `Extracted Title ${id:XXXXXX}`.

## Neuer Anzeigetitel

Dies ist der Titel, der in Steam angezeigt wird. Er wird nicht für die Suche nach Bildern verwendet.

## Neuer Suchtitel

Dies ist der Titel, der für die Suche nach Bildern in [SteamGridDB](https://www.steamgriddb.com) verwendet wird. Es gibt zwei Möglichkeiten, sie außer Kraft zu setzen:

- Legen Sie den neuen Text für die Suche fest.
- Geben Sie die genaue Spiel-ID an, von der Bilder abgerufen werden sollen. Um zum Beispiel Bilder für das Spiel [Flow](https://www.steamgriddb.com/game/5254019) mit der SteamGridDB Url `https://www.steamgriddb.com/game/5254019` zu erhalten, würde man `${gameid:5254019}` eingeben.

## Neue Befehlszeilen-Argumente

Benutzerdefinierte Befehlszeilenargumente wie `--fullscreen`, usw., die auf einen bestimmten Titel angewendet werden können. Diese überschreiben nur das Argumentfeld der Steam-Verknüpfung und werden nie an die ausführbare Datei angehängt.

## Titel ausschließen

Die Möglichkeit, einzelne Titel von der Aufnahme in Steam auszuschließen. Dies ermöglicht es dir, Titel, die du nicht in Steam angezeigt haben möchtest, im gleichen Ordner wie deine anderen Spiele zu behalten.

## Nur lokale Artworks

Don't fetch artwork from remote providers (e.g. [steamgriddb](https://www.steamgriddb.com)). Useful when SGDB is incorrectly matching the game or you just don't like any of the artwork available for it.

## Custom Variables

The task of overriding specific titles can also be accomplished by manually editing the custom variables JSON file and using appropriate variables in the `Title Modifier` parser field. It is recommended, however, that you use this tool instead since the custom variables JSON file will be updated over time and your edits may be overwritten.
