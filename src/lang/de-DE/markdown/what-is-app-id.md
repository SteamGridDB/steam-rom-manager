# What is Steam's APP ID?

Steam uses APP ID to identify games. For non-Steam games they are generated using:

- Executable;
- Final app title.

If you use `RetroArch` or similar emulators to add the same game, but on different consoles, you will encounter a problem where only **one** title is added and others just disappear. This is due to duplicate APP IDs.

## Adding identical titles from different consoles

Die Steam-APP-ID darf nicht identisch sein. Dies kann erreicht werden, indem du den **Titelmodifikator** Wert änderst oder **Argumente an ausführbare anhängen** aktivierst. Die zweite Option fügt eine dritte Variable zur APP-ID hinzu:

- Ausführbare Datei;
- Finaler App-Titel;
- Command line arguments.

Die meiste Zeit wird die Kommandozeile einen eindeutigen Spielpfad enthalten, der es erlauben sollte, eindeutige APP-IDs zu generieren.
