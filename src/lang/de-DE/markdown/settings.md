## Allgemeine Einstellungen
### Check for updates on start `[Recommend enabled]`
Check if an update for SRM is available and prompt to update each time SRM launches.
### Auto kill Steam `[Recommend enabled]`
SRM will attempt to kill all running instances of Steam whenever it needs to read/write collections information (specifically when saving to steam from `Add Games` and when removing all games from `Settings`).
### Auto restart Steam `[Recommend enabled]`
SRM will attempt to restart Steam after killing it and completing whatever collections related task required killing Steam in the first place. Requires `Auto kill Steam` to be enabled.
### Offlinemodus `[nicht empfohlen]`
Wenn aktiviert, sendet SRM keine Netzwerkanfragen mehr. Geeignet, wenn SRM nur für lokale Bilder verwendet werden soll.
### Logs automatisch leeren bevor Parser getestet werden `[empfohlen]`
Wenn aktiviert, wird das Log vor jedem Parsertest geleert.
## Add Games
### Aktuelle Steam-Bilder standardmäßig anzeigen `[empfohlen]`
Wenn aktiviert, wird SRM standardmäßig das jeweilige Steam-Artwork für eine gegebene App verwenden. Wenn deaktiviert, werden bei jedem Starten (und Speichern) von SRM alle Artworks zurückgesetzt.
### Verknüpfungen für deaktivierte Parser entfernen `[nicht empfohlen]`
Wenn aktiviert, werden beim Starten von SRM alle hinzugefügten Einträge und Artworks für deaktivierte Parser entfernt. Geeignet, wenn die Steam-Bibliothek 1:1 mit aktivierten Parsern übereinstimmen soll.
### Disable saving of steam categories `[Recommend disabled]`
SRM will not write any collections information when saving to Steam. This allows SRM to perform its tasks while Steam is still running, at the obvious cost that added games will not be categorized.
### Hide Steam username from preview
Steam does not allow user's to alter their Steam usernames. In some cases (childish names, dead names, etc), users may no longer wish to see their Steam usernames. This setting hides it from `Add Games`.
### Remove all added games and controllers
Undo all SRM added changes from Steam.
### Remove all controllers only
Undo all SRM added controller settings from Steam.
## Fuzzy Matcher Einstellungen
### Gefundene Einträge loggen `[nicht empfohlen]`
Wenn aktiviert, werden für den Fuzzy Titel Matcher aussagekräftigere `Event Logs` geschrieben. Nützlich um falsche Fuzzy matches zu debuggen.
### Fuzzy Liste zurücksetzen
Setzt die gespeicherte Liste der Titel zurück, die vom Fuzzy Matcher genutzt werden. Standard ist `SteamGridDB` (entfernt benutzerdefinierte Titel).
### Fuzzy Cache zurücksetzen
Löscht den Cache der Titel die der Fuzzy Matcher schon gesehen hat (versuche dies, wenn Änderungen die du in der Fuzzy Liste vornimmst, die nicht in der TItelliste von SRM vorkommen).
## Bildanbieter-Einstellungen
### Artwork loading strategy `[Recommend Load artwork lazily]`
This is the strategy SRM uses to pull artwork thumbnails for the `Add Games` UI. If you are parsing a lot of games, `Load artwork lazily` is recommended. `Preload first artwork` will try to pull the first piece of artwork for each game in each artwork category, and `Preload all artwork` will try to pull all available artwork for each game in each artwork category. `Preload all artwork` will cause network and performance issues unless the number of games is quite small (less than `30` or so).
### Aktivierte Anbieter
Global setting to enable/disable particular image providers. Current options are `SteamGridDB` and `Steam Official`.
### DNS manual override
Set this if you want SRM to do DNS resolution internally, as opposed to relying on your system's default DNS server. This solves many timeout issues on the Steam Deck.
### Batch size for image downloads
Number of images SRM will attempt to download at once when saving to Steam. May help to lower this if you are receiving timeout errors from SGDB.
### Nuke artwork choice cache
SRM attempts to remember your artwork choices, this button forcibly forgets all of them.
### Nuke local artwork backups
This deletes all artwork backups created for parsers with `Backup artwork locally` enabled.
## Community-Variablen und Vorlagen
### Erzwinge das Herunterladen benutzerdefinierter Variablen.
Setzt die benutzerdefinierten-Variablen-JSON-Datei zurück auf den SRM Stand in GitHub. Geeignet, falls die JSON-Datei mit benutzerdefinierten Variablen beschädigt wurde.
### Erzwinge das Herunterladen benutzerdefinierter Vorlagen.
Setzt die JSON Datei für Parser Vorlagen auf den SRM Stand in GitHub zurück. Geeignet, falls sich die Vorlagenliste nicht automatisch aktualisiert oder beschädigt wurde.
### Force download shell scripts
Re fetches the shell scripts SRM uses to perform certain tasks.
