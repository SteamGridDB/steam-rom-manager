# Local images (optional) `[supports variables]`{.noWrap}

Erlaubt es, lokal gespeicherte Bilder zu verwenden. A [special glob input](#special-glob-input) string is used to retrieve images, so for example you might do `/path/to/heroes/${title}.@(png|jpg)`. Backslashes can be used to escape characters, so that if your images live in `artwork [portraits]` you might do `/path/to/artwork \[portraits\]/${title}.@(png|jpg)`. A good idea is to set your artwork directory globally and then use the `${localimages}` dir environment variable in this field: `${localimagesdir}/emuname/heroes/${title}.@(png|jpg)` for example.

Any variable you use in this field that contains special glob characters will have those characters escaped.

## Erlaubte Bilderweiterungen

Es werden nur `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} und `TGA`{.noWrap} Dateierweiterungen unterstützt. Selbst wenn der Parser Dateien mit anderen Dateierweiterungen findet, werden diese nicht in die endgültige Liste aufgenommen.

## Kannst du das Verzeichnis des lokalen Bildes nach dem Speichern der App-Liste verschieben?

Ja, sobald die Liste gespeichert ist, ist das lokale Bild in ein Steam-Verzeichnis kopiert, in dem es umbenannt wird, um der App-ID von Steam zu entsprechen.
