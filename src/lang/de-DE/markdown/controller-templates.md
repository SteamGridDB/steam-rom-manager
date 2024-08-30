# Controller-Vorlagen

Mit Controller-Vorlagen können Sie das Button-Layout pro Controller und Parser konfigurieren.

Möglicherweise solltest du die `Cloud-Synchronisierung` in Steam deaktivieren, um zu vermeiden, dass deine SRM-zugewiesenen Controller-Einstellungen überschrieben werden. Die Einstellung findest du unter `Steam > Einstellungen > Cloud`.

Um eine benutzerdefinierte Vorlage erstellen:

- Öffne Steam.
- Schließe den Controller an, für den du eine Vorlage konfigurieren möchtest.
- Rechtsklick auf ein beliebiges Spiel und drücke `Verwalte > Controller Layout`.
- Konfiguriere die Buttons nach deinem Geschmack.
- Klicken Sie auf `Export Config` und dann auf `Save new template binding`.
- Benenne die Vorlage in dieser Form: `Template Title (SRM)`. Du musst den Namen mit `(SRM)` abschließen, sonst kann SRM die Vorlage nicht übernehmen.
- Wiederhole diesen Schritt, wenn du mehrere Controller-Typen konfigurieren möchtest.

Im SRM-Parser:

- Hit `Re-Fetch Controller Templates` to pull templates for all controller types from steam. Dies wird Ihre aktuell ausgewählte Vorlage löschen, wenn sie nicht zu den in Steam verfügbaren Templates gehört.

Aktuell bezieht SRM die Standardvorlagen (Valve made) für jeden Controller sowie alle benutzerdefinierten Vorlagen, die in `(SRM)` enden.

- Wähle deine Vorlagen aus und speichere den Parser. Die Controller-Konfigurationen werden angewendet, sobald du in der Vorschau `App-Liste speichern` drückst.

- Zum Entfernen von Controller-Konfigurationen, kannst du entweder `alle hinzugefügten App-Einträge` aus den globalen Einstellungen entfernen (dies löscht alle SRM-Änderungen an deinen Dampfdaten) oder `Alle Controller` im Parser entfernen drücken (dies entfernt nur die Controller-Einstellungen für das in diesem Parser angegebene Steam-Verzeichnis und den in diesem Parser angegebenen Benutzer).

Sobald dies erledigt ist, kannst du die Vorschau wie gewohnt erstellen und speichern, sodass das Template auf alle Titel im Parser angewendet wird.
