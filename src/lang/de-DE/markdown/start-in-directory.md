# "Start In" directory `[supports env variables]`

If `"Start In" Directory` is unset it defaults to the executable's directory. If not executable is set, it defaults to the directory of the ${filePath} variable:

![Standard "Starte in" Verzeichnis](../../../assets/images/default-start-in-directory.png) {.fitImage.center}

Mit dieser Option können Sie jedes gewünschte Verzeichnis als "Starte in" Verzeichnis festlegen:

![Ner "Starte In" Verzeichnis](../../../assets/images/new-start-in-directory.png) {.fitImage.center}

Dies ist notwendig, wenn du Batchdateien benutzt um Emulatoren und Spiele zu starten, die ein "Starte in" Verzeichnis benötigen um zu funktionieren.

## Shortcut durchgeben

Wenn du ".lnk zum Ziel folgen" aktivierst und die Programmdatei eine ".lnk" Datei, wie z.B. eine Verknüpfung, ist, dann weird der Input überschrieben mit dem Verzeichnis des Urpsrungs der Verknüpfung. In Zukunft wird dies überschrieben mit dem "Starte in" Verzeichnis des Shortcuts.
