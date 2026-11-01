# 可执行文件修饰符`[支持变量]`{.noWrap}

This field can be used to prepend or append desired characters to the executable which will be added to the Steam shortcut's `Target` property.

```

```

：

```

```

你可以使用任何其他变量来构建最终的可执行文件。

这个设置会影响 Steam 的应用 APP ID。

## 快捷方式直通

如果启用了 `跟随 .lnk/.desktop 快捷方式到目标文件`，且搜索匹配模式找到了 `.lnk` 或 `.desktop` 文件，也就是快捷方式，那么 `${filePath}` 变量将保存该快捷方式所指向目标的路径，而不是快捷方式文件本身的路径。
