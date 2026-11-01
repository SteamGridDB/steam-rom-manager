# Controller-Templates
Mit Controller-Templates kannst du das Button-Layout pro Controller und Parser konfigurieren.

Möglicherweise solltest du die `Cloud-Synchronisierung` in Steam deaktivieren, um zu vermeiden, dass deine SRM-zugewiesenen Controller-Einstellungen überschrieben werden. Die Einstellung findest du unter `Steam > Einstellungen > Cloud`.

Um ein eigenes Template zu erstellen:
* Öffne Steam.
* Schließe den Controller an, für den du ein Template konfigurieren möchtest.
* Rechtsklick auf ein beliebiges Spiel und drücke `Verwalten > Controller Layout`.
* Konfiguriere die Buttons nach deinem Geschmack.
* Klicke auf `Konfiguration Exportieren` und dann auf `Speichere neues Template Binding`.
* Benenne das Template in dieser Form: `Template Titel (SRM)`. Du musst den Namen mit `(SRM)` abschließen, sonst kann SRM das Template nicht entdecken.
* Wiederhole diesen Schritt, wenn du mehrere Controller-Typen konfigurieren möchtest.

Im SRM-Parser:
* Drücke `Controller Templates erneut abrufen` um Templates für alle Controller Arten aus Steam zu laden. Dies wird dein aktuell ausgewähltes Template löschen, wenn es nicht zu den in Steam verfügbaren Templates gehört.

Aktuell bezieht SRM die von Valve erstellten Templates für jeden Controller, sowie alle benutzerdefinierten Templates, die mit `(SRM)` enden.

* Wähle dein Template aus und speichere den Parser. The controller configsets will be applied once you hit `Save to Steam` in the Add Games.

* Zum Entfernen von Controller-Konfigurationen, kannst du entweder `alle hinzugefügten App-Einträge löschen ` in den globalen Einstellungen wählen (dies löscht alle SRM-Änderungen an deinen Steam Daten) oder `Alle Controller zurücksetzen` im Parser drücken (dies entfernt nur die Controller-Einstellungen für das in diesem Parser angegebene Steam-Verzeichnis und den in diesem Parser angegebenen Benutzer).

Once this is done you can parse and add games to steam as usual, and the templates will be applied to all the titles in the parser.


