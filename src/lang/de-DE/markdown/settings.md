## Allgemeine Einstellungen

### Offlinemodus `[nicht empfohlen]`

Wenn aktiviert, sendet SRM keine Netzwerkanfragen mehr. Geeignet, wenn SRM nur für lokale Bilder verwendet werden soll.

### Protokolle automatisch leeren bevor Parser getestet werden `[empfohlen]`

Wenn aktiviert, wird das Protokoll vor jedem Parsertest geleert.

### Aktuelle Steam-Bilder standardmäßig anzeigen `[empfohlen]`

Wenn aktiviert, wird SRM standardmäßig das jeweilige Steam-Artwork für eine App verwendet. Wenn deaktiviert, werden bei jedem Starten (und Speichern) von SRM alle Artworks zurückgesetzt.

### Verknüpfungen für deaktivierte Parser entfernen `[nicht empfohlen]`

Wenn aktiviert, werden beim Starten von SRM alle hinzugefügten Einträge und Artworks für deaktivierte Parser entfernt. Geeignet, wenn die Steam-Bibliothek 1:1 mit aktivierten Parsern übereinstimmen soll.

## Fuzzy Matcher Settings

### Gefundene Einträge protokollieren `[nicht empfohlen]`

When enabled more verbose logs appear for the fuzzy title matcher in the `Event log`. Useful for debugging incorrect fuzzy matches.

### Reset fuzzy list

Resets the stored list of titles used for fuzzy matching to the list of titles returned by `SteamGridDB` (removes any user added titles).

### Reset fuzzy cache

Clears the cache of titles that fuzzy matching has already seen (try this if changes you make to fuzzy list are not resulting in changes to titles in SRM).

## Bildanbieter-Einstellungen

### Abgerufene Bilder vorladen `[nicht empfohlen]`

Wenn aktiviert wird SRM alle verfügbaren Artworks für jedes Spiel laden, anstatt jedes Bild einzeln beim Durchblättern der Bilder zu laden. Diese Einstellung sollte nur dann aktiviert werden, wenn triftige Gründe und eine sehr kleine Spielbibliothek existieren, da sonst sehr große und langsame Netzwerkabfragen entstehen könnten.

### Aktivierte Anbieter

Globale Einstellung, um bestimmte Anbieter zu deaktivieren. Derzeit ist der einzige Bildanbieter `SteamGridDB`, da ConsoleGrid und RetroGaming.cloud nicht funktionieren.

## Community-Variablen und Vorlagen

### Erzwinge das Herunterladen benutzerdefinierter Variablen.

Resets the custom variables JSON file that is used for certain presets to whatever its current state is on the SRM github. Geeignet, falls die JSON-Datei mit benutzerdefinierten Variablen beschädigt wurde.

### Erzwinge das Herunterladen benutzerdefinierter Vorlagen.

Resets the JSON files for parser presets to whatever is on the SRM github. Geeignet, falls sich die Vorlagenliste nicht automatisch aktualisiert oder beschädigt wurde.
