# 可执行文件修饰符`[支持变量]`{.noWrap}

默认值为 `"${exePath}"`{.noWrap}。 此设置可用于在 Steam (`目标` 属性) 中添加要执行的字符前缀或后缀。 例如，假设 `${exePath}`{.noWrap} 是 `C:\RetroArch\retroarch.exe`，您可以通过将值设置为 `"cmd" /k start /min` 来添加它：

```
"cmd" /k start /min "${exePath}"
```

你可以使用任何其他变量来构建最终的可执行文件。

这个设置会影响 Steam 的应用 APP ID。

## 快捷方式直通

If you enable "Follow .lnk to destination" and your executable is a ".lnk" file, ie a shortcut, then whatever you put in this field will be overridden with the target of that shortcut. If you would like to add executable arguments either add them to the target of the shortcut or use the "Command Line Arguments" field in the parser. If you would like to add executable arguments either add them to the target of the shortcut or use the "Command Line Arguments" field in the parser. 如果您想添加可执行参数，请将它们添加到快捷方式的目标中，或者使用解析器中的“命令行参数”字段。 如果您想添加可执行参数，请将它们添加到快捷方式的目标中，或者使用解析器中的“命令行参数”字段。

## 目录变量

| 变量 (大小写不敏感) | 对应的值                 |
| ------------------: | :----------------------- |
|         `${exeDir}` | 可执行文件目录:          |
|         `${romDir}` | ROM 目录                 |
|       `${steamDir}` | Steam 目录               |
|     `${startInDir}` | "Start In" 目录          |
|        `${fileDir}` | 由解析器返回的文件目录。 |

In case executable directory input is left **empty**, `${exeDir}`{.noWrap} is equal to `${fileDir}`{.noWrap}. Moreover, if "StartIn" directory is left **empty**, `${startInDir}`{.noWrap} is equal to `${exeDir}`{.noWrap}. Moreover, if "StartIn" directory is left **empty**, `${startInDir}`{.noWrap} is equal to `${exeDir}`{.noWrap}. 此外，如果“StartIn”目录为**空**，则`${startInDir}`{.noWrap}等于`${exeDir}`{.noWrap}。 此外，如果“StartIn”目录为**空**，则 `${startInDir}`{.noWrap} 等于 `${exeDir}`{.noWrap}。

## 名称变量

| 变量 (大小写不敏感) | 对应的值                           |
| ------------------: | :--------------------------------- |
|        `${exeName}` | 可执行文件名称 (无扩展名)          |
|       `${fileName}` | 由解析器返回的文件名（不带扩展名） |

如果可执行目录输入 **留空**，则 `${exeName}`{.noWrap} 等于 `${fileName}`{.noWrap}。

## 扩展变量

| 变量 (大小写不敏感) | 对应的值                         |
| ------------------: | :------------------------------- |
|         `${exeExt}` | 可执行文件的扩展名（带点）       |
|        `${fileExt}` | 由解析器返回的文件扩展名（带点） |

如果可执行目录输入**留空**，则 `${exeExt}`{.noWrap} 等于 `${fileExt}`{.noWrap}。

## 路径变量

| 变量 (大小写不敏感) | 对应的值                     |
| ------------------: | :--------------------------- |
|        `${exePath}` | 可执行文件的完整路径         |
|       `${filePath}` | 由解析器返回的文件的完整路径 |

如果可执行目录输入 **留空**，则 `${exePath}`{.noWrap} 等于 `${filePath}`{.noWrap}。

## 解析器变量

| 变量 (大小写不敏感) | 对应的值                   |
| ------------------: | :------------------------- |
|          `${title}` | 提取的标题                 |
|     `${fuzzyTitle}` | 模糊匹配的标题             |
|     `${finalTitle}` | 标题是标题修改器的最终结果 |

如果模糊匹配 **失败** 或被 **禁用**，则 `${fuzzyTitle}`{.noWrap} 等于 `${title}`{.noWrap}。

## 函数变量

|                               变量 (大小写不敏感) | 对应的函数                                                                               |
| ------------------------------------------------: | :--------------------------------------------------------------------------------------- |
|                     `${regex\|input\|替换(可选)}` | 在输入上执行正则表达式。 支持 `u`、`g` 和 `i` 标志（捕获的组将被连接，除非提供了替换）。 |
|                                    `${uc\|input}` | 大写变量。 将输入转换为大写                                                              |
|                                    `${lc\|input}` | 小写变量。 将输入转换为小写                                                              |
|                              `${cv:group\|input}` | 使用匹配的自定义变量更改输入（组是可选的）                                               |
|                                   `${rdc\|input}` | 用拉丁字母替换带音符的输入字符                                                           |
| `${os:[win\|mac\|linux]\|处于匹配\|无匹配(可选)}` | 如果操作系统匹配，则使用`匹配`值，否则使用`不匹配`。                                     |

### 函数变量示例

假设 `${title}` 变量等于 `Pokémon (USA) (Disc 1).iso`。 然后这些变量：

```
${/.*/|${title}}                           //匹配所有内容
${/(.*)/|${title}}                         //捕获所有内容
${/(\(.*?\))/|${title}|}                   //捕获所有括号并替换为空
${/(\(Disc\s?[0-9]\))/|${title}}           //捕获“Disc…”部分
${uc|${/(\(Disc\s?[0-9]\))/|${title}}}     //捕获“Disc…”部分并将其转换为大写字母
${rdc|${title}}                            //替换变音符号（在本例中：é -> e）
file${os:linux|.so|${os:win|.dll}}          //选择适用于操作系统的正确文件扩展名
```

将被替换为以下内容：

```
Pokémon (USA) (Disc 1).iso
Pokémon (USA) (Disc 1).iso
Pokémon.iso
(Disc 1)
(DISC 1)
Pokemon (USA) (Disc 1).iso

--在 Linux:
file.so
--在 Windows:
file.dll
--在 macOS:
file
```
