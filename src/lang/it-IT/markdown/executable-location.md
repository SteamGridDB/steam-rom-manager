# Executable `[supports env variables]`

Percorso all'eseguibile dell'emulatore. Può essere un file o qualsiasi percorso di sistema valido.

## Perché facoltativo?

In alcuni casi si potrebbe voler avviare il gioco da un tipo di file batch che avvierà anche automaticamente l'emulatore stesso. Se questo è il caso, allora fornire eseguibile è inutile.

The final shortcut will just be `"${filePath}" --command-line-args`.

### Quindi, come posso aggiungere file a Steam senza eseguibile predefinito?

Tutti i file recuperati da un parser saranno invece trattati come eseguibili.
