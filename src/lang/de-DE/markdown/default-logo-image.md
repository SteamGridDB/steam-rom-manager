# Standard-Logobild (optional) `[unterstützt Variablen]`{.noWrap}

Ermöglicht es, ein lokal gespeichertes Bild als Standard/Fallback-Logo zu verwenden. Um Bilder abzurufen, wird ein [special glob input](#special-glob-input) String verwendet. Es wird nur das erste abgerufene Bild verwendet.

Dieses Bild wird **nur** angezeigt, wenn kein anderes Bild verfügbar ist. Wenn ein Steam-Bild verfügbar ist, kannst du dieses aus Steam auswählen.

## Erlaubte Bilderweiterungen

Es werden nur `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} und `TGA`{.noWrap} Dateiformate unterstützt. Selbst wenn der Parser Dateien mit anderen Dateierweiterungen findet, werden diese nicht in die endgültige Liste aufgenommen.

## Kannst du das Verzeichnis des Standardbilds nach dem Speichern der App-Liste verschieben?

Ja, sobald die Liste gespeichert ist, ist das Standard-Logobild in ein Steam-Verzeichnis kopiert, in dem dieses umbenannt wird, um der App-ID von Steam zu entsprechen.
