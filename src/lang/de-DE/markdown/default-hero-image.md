# Standard-Heldenbild (optional) `[unterstützt Variablen]`{.noWrap}

Ermöglicht es, ein lokal gespeichertes Bild als Standard/Fallback Heldenbild zu verwenden. A [special glob input](#special-glob-input) string is used to retrieve images. Es wird nur das erste abgerufene Bild verwendet.

Dieses Bild wird **nur** angezeigt, wenn kein anderes Bild verfügbar ist. If Steam image is available, you will be able to choose from Steam and this image.

## Erlaubte Bild-Dateiformate

Es werden nur `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} und `TGA`{.noWrap} Dateiformate unterstützt. Selbst wenn der Parser Dateien mit anderen Dateiformaten findet, werden diese nicht in die endgültige Liste aufgenommen.

## Kannst du das Verzeichnis des Standardbilds nach dem Speichern der App-Liste verschieben?

Yes, once the list is saved, default hero image is copied to a Steam directory where they are renamed to match Steam's APP ID.
