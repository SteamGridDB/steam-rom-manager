# Модификатор исполняемого файла `[поддерживает переменные]`{.noWrap}

. . :

```
"cmd" /k start /min "${exePath}"
```

In this case the `Target` property would begin with:

```
"cmd" /k start /min "C:\RetroArch\retroarch.exe"
```

followed by whatever launch arguments you choose in the `Command Line Arguments` field.

Вы можете использовать любую другую переменную для создания конечного исполняемого файла.

Эта настройка влияет на APP ID Steam.

## Shortcut Passthrough

If you enable `Follow .lnk/.desktop to destination` and the glob search finds a `.lnk` or `.desktop` file, ie a shortcut, then the `${filePath}` variable will contain the target of the shortcut rather than the path to the shortcut. If you would like to add executable arguments either add them to the target of the shortcut or use the `Command Line Arguments` field in the parser.
