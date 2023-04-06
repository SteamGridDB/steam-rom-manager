# Benutzer-Ausnahmen
## Wofür dies nicht verwendet werden soll
Dieses Tool kann verwendet werden, um Ausnahmen pro App festzulegen, die die Parser überschreiben. Es sollte nicht zur Durchführung von Massen-Aufgaben verwendet werden. For example, removing the colon character from titles can be accomplished via the title modifier `${/:/|${title}|}` and should not be done here. Wenn ein Kommandozeilenargument für jede geparste App üblich ist, dann verwende das Kommandozeilenargument-Feld - erstelle hier keine Einträge!

## Extracted Title - *Mandatory*
The only mandatory exception field is `Extracted Title`. Once this is specified and the exception is saved, any game whose `Extracted Title` matches will have its fields overridden by any non-blank exception fields (if left blank, the exception fields do nothing).

Wenn du dir nicht sicher bist, was der `entpackte Titel` für ein bestimmtes Spiel ist, überprüfe die Ausgabe des Tests des Parsers, in dem sich das Spiel befindet.

## Neuer Anzeigetitel

Wie es klingt. Dies ist der Titel, der in Steam erscheinen wird.

## New Search Title

There are two options for overriding the title that is used to get images from SteamGridDB:

* Specify the new search title.
* Specify the exact game id to pull images from. For example to get images for the game [Flow](https://www.steamgriddb.com/game/5254019) which has SteamGridDB url `https://www.steamgriddb.com/game/5254019` you would put `${gameid:5254019}`.

## New Commandline Args

Custom commandline arguments like `--fullscreen`, etc, that can be applied to a specific title.

## Exclude Title

The ability to exclude individual titles from being added to Steam. This allows you to keep titles that you don't want in Steam in the same folder as the rest of your games.

## Local Artwork Only

Don't fetch artwork from remote providers (e.g. [steamgriddb](https://www.steamgriddb.com)). Useful when SGDB is incorrectly matching the game.

## Custom Variables
The task of overriding specific titles can also be accomplished by manually editing the custom variables JSON file and using appropriate variables in the `Title Modifier` parser field. It is recommended, however, that you use this tool instead since the custom variables JSON file will be updated over time and your edits may be overwritten.
