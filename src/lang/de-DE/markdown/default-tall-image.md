# Default tall image (optional) `[supports variables]`{.noWrap}

Ermöglicht es, ein lokal gespeichertes Bild als Standard/Fallback Heldenbild zu verwenden. Um Bilder abzurufen, wird ein [special glob input](#special-glob-input) String verwendet. Es wird nur das erste abgerufene Bild verwendet.

Dieses Bild wird **nur** angezeigt, wenn kein anderes Bild verfügbar ist. Wenn ein Steam-Bild verfügbar ist, kannst du dieses aus Steam auswählen.

## Erlaubte Bild-Dateiformate

Only `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} and `TGA`{.noWrap} file extensions are supported. Selbst wenn der Parser Dateien mit anderen Dateiformaten findet, werden diese nicht in die endgültige Liste aufgenommen.

## Kannst du das Verzeichnis des Standardbilds nach dem Speichern der App-Liste verschieben?

Yes, once the list is saved, default tall image is copied to a Steam directory where they are renamed to match Steam's APP ID.
