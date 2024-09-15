# Epic Games Parser

Dieser Parser importiert Spiele von dem [Epic Games Store](https://store.epicgames.com/en-US/), sodass Artwork für diese ausgewählt und in Steam hinzugefügt werden kann.

Wenn dies nicht funktioniert, liegt es daran, dass Epic die Struktur ihrer Spiele-Manifeste verändert hat. In diesem Fall informiere bitte die Entwickler von SRM, die das Problem lösen werden.

In order for this parser to work with the open source Epic alternative [Legendary](https://github.com/derrod/legendary), [EGL sync must be enabled in Legendary](https://github.com/derrod/legendary/discussions/276#discussioncomment-709748) (this creates the appropriate files for the parser to read, and does not require the `Epic Games Store` to be installed).

That said, there is also a `Legendary` parser in SRM which works right out of the box.

## Kompabilität

Dieser Parser funktioniert derzeit nur auf `Windows` und `Mac OS` Systemen. Unter `Mac OS` ist es nicht möglich, im Epic Store zu starten, so dass der Schalter deaktiviert bleiben soll.
