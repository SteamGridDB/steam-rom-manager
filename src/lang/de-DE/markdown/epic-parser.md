# Epic Games Parser

Dieser Parser importiert Spiele aus dem [Epic Games Store](https://store.epicgames.com/en-US/), sodass Artwork für diese ausgewählt und in Steam hinzugefügt werden kann.

Wenn dies nicht funktioniert, liegt es daran, dass Epic die Struktur deiner Spiele-Manifeste verändert hat. In diesem Fall informiere bitte die Entwickler von SRM, die das Problem lösen werden.

Um den Parser mit der Open Source Epic Alternative [Legendary](https://github.com/derrod/legendary), zu nutzen, muss [EGL Sync in Legendary aktiviert sein](https://github.com/derrod/legendary/discussions/276#discussioncomment-709748). Dadurch werden alle benötigten Dateien für den Parser erstellt und `Epic Games Store` muss nicht installiert werden.

Alternativ kannst du den `Legendary` Parser in SRM nutzen, welcher out-of-the-box funtkioniert.

## Kompabilität
Dieser Parser funktioniert derzeit nur auf `Windows` und `Mac OS` Systemen. Unter `Mac OS` ist es nicht möglich, im Epic Store zu starten, so dass der Schalter deaktiviert bleiben soll.
