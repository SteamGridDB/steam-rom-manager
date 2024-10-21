# 可执行文件修饰符`[支持变量]`{.noWrap}

默认值为 `"${exePath}"`{.noWrap}。 此设置可用于在 Steam (`目标` 属性) 中添加要执行的字符前缀或后缀。 例如，假设 `${exePath}`{.noWrap} 是 `C:\RetroArch\retroarch.exe`，您可以通过将值设置为 `"cmd" /k start /min` 来添加它：

```
"cmd" /k start /min "${exePath}"
```

你可以使用任何其他变量来构建最终的可执行文件。

这个设置会影响 Steam 的应用 APP ID。

## Shortcut Passthrough

If you enable "Follow .lnk to destination" and your executable is a ".lnk" file, ie a shortcut, then whatever you put in this field will be overridden with the target of that shortcut. If you would like to add executable arguments either add them to the target of the shortcut or use the "Command Line Arguments" field in the parser. If you would like to add executable arguments either add them to the target of the shortcut or use the "Command Line Arguments" field in the parser. 如果您想添加可执行参数，请将它们添加到快捷方式的目标中，或者使用解析器中的“命令行参数”字段。 如果您想添加可执行参数，请将它们添加到快捷方式的目标中，或者使用解析器中的“命令行参数”字段。
