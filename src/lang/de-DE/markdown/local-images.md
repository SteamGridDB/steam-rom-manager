# Local images `[supports variables]`{.noWrap}

Erlaubt es, lokal gespeicherte Bilder zu verwenden. Ein [spezieller Glob Input](#special-glob-input) String wird genutzt, um Bilder abzurufen, so kannst du zum Beispiel: `/Pfad/zu/Heldenbilder/${title}.@(png|jpg)` nutzen. Backslashes können genutzt werden um Zeichen zu escapen. Wenn deine Bilder z. B. in `artwork [portraits]` liegen, kannst du diese mit `/Pfad/zu/artwork \[portraits\]/${title}.@(png|jpg)` angeben. Es wird empfohlen dein Artwork Verzeichnis global zu setzen und es mit der `${localimages}` Umgebungsvariable in diesem Feld: `${localimagesdir}/emuname/heroes/${title}.@(png|jpg)` zu setzen.

Jede Variable, die du in diesem Feld verwendest, die spezielle Globzeichen enthält, werden diese Zeichen escaped haben.

## Erlaubte Dateiendungen

Es werden nur `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} und `TGA`{.noWrap} Dateierweiterungen unterstützt. Selbst wenn der Parser Dateien mit anderen Dateierweiterungen findet, werden diese nicht in die endgültige Liste aufgenommen.

## Kann das Verzeichnis der lokalen Bilder nach dem Speichern der App-Liste verschoben werden?

Ja, sobald die Liste gespeichert ist, werden die Bilder in das Steam-Verzeichnis kopiert, in dem sie umbenannt wird, um Steams App-IDs zu entsprechen.
