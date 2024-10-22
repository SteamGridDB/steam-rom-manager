# Programmdatei ändern`[unterstützt Variablen]`{.noWrap}

Defaults to `"${exePath}"`{.noWrap} if unset. This field can be used to prepend or append desired characters to the executable which will be added to the Steam shortcut's `Target` property. For example, given that `${exePath}`{.noWrap} is `C:\RetroArch\retroarch.exe`, you could start `Retroarch` minimized by setting the `Executable Modifier` "cmd" to:

```
"cmd" /k start /min "${exePath}"
```

In this case the `Target` property would begin with:
```
"cmd" /k start /min "C:\RetroArch\retroarch.exe"
```
followed by whatever launch arguments you choose in the `Command Line Arguments` field.

Du kannst jede andere Variable verwenden, um die endgültige ausführbare Datei zu erstellen.

Diese Einstellung beeinflusst die Steam's APP-ID.

## Shortcut Passthrough

If you enable `Follow .lnk/.desktop to destination` and the glob search finds a `.lnk` or `.desktop` file, ie a shortcut, then the `${filePath}` variable will contain the target of the shortcut rather than the path to the shortcut. If you would like to add executable arguments either add them to the target of the shortcut or use the `Command Line Arguments` field in the parser.
