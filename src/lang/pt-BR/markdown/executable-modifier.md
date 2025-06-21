# Imagem padrão (opcional) `[suporta variáveis]`{.noWrap}

. . For example, given that `${exePath}`{.noWrap} is `C:\RetroArch\retroarch.exe`, you could start `Retroarch` minimized by setting the `Executable Modifier` "cmd" to:

```
"cmd" /k start /min "${exePath}"
```

In this case the `Target` property would begin with:

```
"cmd" /k start /min "C:\RetroArch\retroarch.exe"
```

followed by whatever launch arguments you choose in the `Command Line Arguments` field.

Você pode usar qualquer outra variável para construir o executável final.

Esta configuração é usada para influenciar o ID APP do Steam.

## Shortcut Passthrough

If you enable `Follow .lnk/.desktop to destination` and the glob search finds a `.lnk` or `.desktop` file, ie a shortcut, then the `${filePath}` variable will contain the target of the shortcut rather than the path to the shortcut. If you would like to add executable arguments either add them to the target of the shortcut or use the `Command Line Arguments` field in the parser.
