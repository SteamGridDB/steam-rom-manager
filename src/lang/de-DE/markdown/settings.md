## Allgemeine Einstellungen
### Offlinemodus `[nicht empfohlen]`

Wenn aktiviert, sendet SRM keine Netzwerkanfragen mehr. Geeignet, wenn SRM nur für lokale Bilder verwendet werden soll.
### Logs automatisch leeren bevor Parser getestet werden `[empfohlen]`
Wenn aktiviert, wird das Log vor jedem Parsertest geleert.
### Aktuelle Steam-Bilder standardmäßig anzeigen `[empfohlen]`
Wenn aktiviert, wird SRM standardmäßig das jeweilige Steam-Artwork für eine gegebene App verwenden. Wenn deaktiviert, werden bei jedem Starten (und Speichern) von SRM alle Artworks zurückgesetzt.
### Verknüpfungen für deaktivierte Parser entfernen `[nicht empfohlen]`
Wenn aktiviert, werden beim Starten von SRM alle hinzugefügten Einträge und Artworks für deaktivierte Parser entfernt. Geeignet, wenn die Steam-Bibliothek 1:1 mit aktivierten Parsern übereinstimmen soll.

## Fuzzy Matcher Einstellungen
### Gefundene Einträge loggen `[nicht empfohlen]`
Wenn aktiviert, werden für den Fuzzy Titel Matcher aussagekräftigere `Event Logs` geschrieben. Nützlich um falsche Fuzzy matches zu debuggen.

### Fuzzy Liste zurücksetzen
Setzt die gespeicherte Liste der Titel zurück, die vom Fuzzy Matcher genutzt werden. Standard ist `SteamGridDB` (entfernt benutzerdefinierte Titel).
### Fuzzy Cache zurücksetzen
Löscht den Cache der Titel die der Fuzzy Matcher schon gesehen hat (versuche dies, wenn Änderungen die du in der Fuzzy Liste vornimmst, die nicht in der TItelliste von SRM vorkommen).

## Bildanbieter-Einstellungen
### Abgerufene Bilder vorladen `[nicht empfohlen]`
Wenn aktiviert wird SRM alle verfügbaren Artworks für jedes Spiel laden, anstatt jedes Bild einzeln beim Durchblättern der Bilder zu laden. Diese Einstellung sollte nur dann aktiviert werden, wenn triftige Gründe und eine sehr kleine Spielbibliothek existieren, da sonst sehr große und langsame Netzwerkabfragen entstehen könnten.
### Aktivierte Anbieter
Global setting to enable/disable particular image providers. Current options are `SteamGridDB` and `Steam Official`.
### DNS manual override
Set this if you want SRM to do DNS resolution internally, as opposed to relying on your system's default DNS server. This solves many timeout issues on the Steam Deck.

## Community-Variablen und Vorlagen
### Erzwinge das Herunterladen benutzerdefinierter Variablen.
Setzt die benutzerdefinierten-Variablen-JSON-Datei zurück auf den SRM Stand in GitHub. Geeignet, falls die JSON-Datei mit benutzerdefinierten Variablen beschädigt wurde.
### Erzwinge das Herunterladen benutzerdefinierter Vorlagen.
Setzt die JSON Datei für Parser Vorlagen auf den SRM Stand in GitHub zurück. Geeignet, falls sich die Vorlagenliste nicht automatisch aktualisiert oder beschädigt wurde.
