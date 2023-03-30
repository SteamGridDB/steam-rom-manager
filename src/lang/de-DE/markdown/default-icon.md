# Standardsymbol (optional) `[unterstützt Variablen]`{.noWrap}

Ermöglicht es, ein lokal gespeichertes Bild als Standard/Fallback Icon zu verwenden. A [special glob input](#special-glob-input) string is used to retrieve images. Only the first retrieved image is used.

Dieses Bild wird **nur** angezeigt, wenn kein anderes Bild verfügbar ist. Wenn ein Steam-Bild verfügbar ist, kannst du dieses aus Steam auswählen.

## Erlaubte Bild-Dateiformate

Es werden nur `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} und `TGA`{.noWrap} Dateiformate unterstützt. Selbst wenn der Parser Dateien mit anderen Dateiformaten findet, werden diese nicht in die endgültige Liste aufgenommen.

## Kannst du das Verzeichnis des Standardbilds nach dem Speichern der App-Liste verschieben?

Ja, sobald die Liste gespeichert ist, ist das Standard-Icon in ein Steam-Verzeichnis kopiert, in dem es umbenannt wird, um der APP-ID von Steam zu entsprechen.
