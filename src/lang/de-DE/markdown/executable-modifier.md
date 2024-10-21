# Programmdatei ändern`[unterstützt Variablen]`{.noWrap}

Standardwert ist `"${exePath}"`{.noWrap}. Diese Einstellung wird genutzt um Zeichen vor oder hinter Programmdateien zu setzen, welche zu Steam hinzugefügt werden (`Target` Eigenschaft). Zum Beispiel, wenn `${exePath}`{.noWrap} `C:\RetroArch\retroarch.exe` entspricht, kannst du `"cmd" /k start /min` hinzufügen in dem du den Wert eingibst:

```
"cmd" /k start /min "${exePath}"
```

Du kannst jede andere Variable verwenden, um die endgültige ausführbare Datei zu erstellen.

Diese Einstellung beeinflusst die Steam's APP-ID.

## Shortcut Passthrough

Wenn du "Folge .lnk zum Ziel" aktivierst und deine Programmdatei eine ".lnk" Datei ist, zum Beispiel ein Shortcut, dann wird, was du in dieses Feld einträgst, überschrieben mit dem Ziel der Verknüpfung. Wenn du Argumente hinzufügen willst, füge sie dem Ziel des Shortcuts hinzu oder nutze das "Kommandozeilenargumente" Feld im Parser.
