# Executable modifier `[supports variables]`{.noWrap}

Default value is `"${exePath}"`{.noWrap}. This setting can be used to prepend or append desired characters to an executable which will be added to Steam (`Target` property). Default value is `"${exePath}"`{.noWrap}. This setting can be used to prepend or append desired characters to an executable which will be added to Steam (`Target` property). For example, given that `${exePath}`{.noWrap} is `C:\RetroArch\retroarch.exe`, you can add `"cmd" /k start /min` to it by setting value to:
```
"cmd" /k start /min "${exePath}"
```
You can use any other variable to construct the final executable.

This setting influences Steam's APP ID.


## Shortcut Passthrough
If you enable "Follow .lnk to destination" and your executable is a ".lnk" file, ie a shortcut, then whatever you put in this field will be overridden with the target of that shortcut. If you would like to add executable arguments either add them to the target of the shortcut or use the "Command Line Arguments" field in the parser. If you would like to add executable arguments either add them to the target of the shortcut or use the "Command Line Arguments" field in the parser.

## Directory variables

| Variable (case-insensitive) | Corresponding value                     |
| ---------------------------:|:--------------------------------------- |
|                 `${exeDir}` | Executable directory                    |
|                 `${romDir}` | ROMs directory                          |
|               `${steamDir}` | Steam directory                         |
|             `${startInDir}` | "StartIn" directory                     |
|                `${fileDir}` | File's, returned by a parser, directory |

In case executable directory input is left **empty**, `${exeDir}`{.noWrap} is equal to `${fileDir}`{.noWrap}. Moreover, if "StartIn" directory is left **empty**, `${startInDir}`{.noWrap} is equal to `${exeDir}`{.noWrap}. Moreover, if "StartIn" directory is left **empty**, `${startInDir}`{.noWrap} is equal to `${exeDir}`{.noWrap}.

## Name variables

| Variable (case-insensitive) | Corresponding value                                             |
| ---------------------------:|:--------------------------------------------------------------- |
|                `${exeName}` | Name of executable (without extension)                          |
|               `${fileName}` | Name of file which was returned by a parser (without extension) |

如果可执行目录输入**留空<**，则 `${exeName}`{.noWrap} 等于 `${fileName}`{.noWrap}。

## 扩展变量

|  变量 (大小写不敏感) | 对应的值             |
| ------------:|:---------------- |
|  `${exeExt}` | 可执行文件的扩展名（带点）    |
| `${fileExt}` | 由解析器返回的文件扩展名（带点） |

如果可执行目录输入**留空**，则 `${exeExt}`{.noWrap} 等于 `${fileExt}`{.noWrap}。

## 路径变量

|   变量 (大小写不敏感) | 对应的值           |
| -------------:|:-------------- |
|  `${exePath}` | 可执行文件的完整路径     |
| `${filePath}` | 由解析器返回的文件的完整路径 |

如果可执行目录输入**留空**，则`${exePath}`{.noWrap}等于`${filePath}`{.noWrap}。

## 解析器变量

|     变量 (大小写不敏感) | 对应的值          |
| ---------------:|:------------- |
|      `${title}` | 提取的标题         |
| `${fuzzyTitle}` | 模糊匹配的标题       |
| `${finalTitle}` | 标题是标题修改器的最终结果 |

如果模糊匹配**失败**或被**禁用**，则`${fuzzyTitle}`{.noWrap}等于`${title}`{.noWrap}。

## 函数变量

|                                  变量 (大小写不敏感) | 对应的函数                                               |
| --------------------------------------------:|:--------------------------------------------------- |
|                  `${regex\|input\|替换(可选)}` | 在输入上执行正则表达式。 支持 `u`、`g` 和 `i` 标志（捕获的组将被连接，除非提供了替换）。 |
|                              `${uc\|input}` | 大写变量。 将输入转换为大写                                      |
|                              `${lc\|input}` | 小写变量。 将输入转换为小写                                      |
|                        `${cv:group\|input}` | 使用匹配的自定义变量更改输入（组是可选的）                               |
|                             `${rdc\|input}` | 用拉丁字母替换带音符的输入字符                                     |
| `${os:[win\|mac\|linux]\|处于匹配\|无匹配(可选)}` | 如果操作系统匹配，则使用`匹配`值，否则使用`不匹配`。                        |

### 函数变量示例

假设`${title}`变量等于`Pokémon (USA) (Disc 1).iso`。 然后这些变量：
```
${/.*/|${title}}                           //匹配所有内容
${/(.*)/|${title}}                         //捕获所有内容
${/(\(.*?\))/|${title}|}                   //捕获所有括号并替换为空
${/(\(Disc\s?[0-9]\))/|${title}}           //捕获“Disc…”部分
${uc|${/(\(Disc\s?[0-9]\))/|${title}}}     //捕获“Disc…”部分并将其转换为大写字母
$ {rdc|${title}}                            //替换变音符号（在本例中：é -> e）
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

--On linux:
file.so
--On Windows:
file.dll
--On Mac OS:
file
```
