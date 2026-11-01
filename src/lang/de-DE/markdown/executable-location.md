# Executable `[supports env variables]`

Pfad zur ausführbaren Datei des Emulators. Kann eine Datei oder ein gültiger Systempfad sein.

## Warum optional?

In manchen Fällen willst du eventuell Spiele über eine Batch-Datei ausführen, die automatisch den Emulator starten. In diesem Fall muss keine ausführbare Datei angegeben werden.

The final shortcut will just be `"${filePath}" --command-line-args`.

### Wie füge ich Dateien zu Steam hinzu ohne eine Datei anzugeben?

Alle Dateien, die von einem der Parser zurückgegeben werden, werden stattdessen als ausführbare Dateien behandelt.
