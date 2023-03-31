# 命令行参数（可选）`[支持变量]`{.noWrap}

附加到可执行文件以生成最终快捷方式的参数。 大多数情况下，您将希望使用提供的解析器变量进行设置。

## 系统示例

### RetroArch

```
-L cores${/}YOUR_CORE.dll "${filePath}"
```

### Cemu (WiiU)

```
-f -g "${filePath}"
```

### Dolphin Emu (Gamecube and Wii)

```
--exec="${filePath}" --batch --confirm=false
```

### Project64 2.3+ (N64)

```
"${filePath}"
```

### Mupen64+ (N64)

```
--fullscreen "${filePath}"
```

### DeSmuME (Nintendo DS)

```
"${filePath}"
```

### mGBA (Gameboy, Gameboy Color, and Gameboy Advance)

```
-f "${filePath}"
```

### Nestopia (NES/Famicom)

```
"${filePath}" -video fullscreen bpp : 16 -video fullscreen width : 1024 -video fullscreen height : 768 -preferences fullscreen on start : yes -view size fullscreen : stretched 
```

### higan (NES/Famicom, SNES/Famicom, Gameboy, Gameboy Color, Gameboy Advance)

```
"${filePath}"
```

### nullDC (Sega Dreamcast)

```
-config nullDC_GUI:Fullscreen=1 -config ImageReader:DefaultImage="${filePath}"
```

### Kega Fusion (Sega Genesis and Sega 32X)

```
"${filePath}" -gen -auto -fullscreen
```

### RPCS3 (Sony Playstation 3)

```
"${filePath}"
```

### PCSX2 (Sony Playstation 2)

```
--fullscreen --nogui "${filePath}"
```

### PCSX-R (Sony Playstation 1)

```
-nogui -cdfile "${filePath}"
```

### ePSXe (Sony Playstation 1)

```
-f -nogui -loadbin "${filePath}"
```

### Xebra (Sony Playstation 1)

```
-IMAGE "${filePath}" -RUN1 -FULL
```

### Mednafen (Sony Playstation 1, NES/Famicom, SNES/Super Famicom, etc.)

```
"${filePath}"
```

### PPSSPP (Sony Playstation Portable)

```
"${filePath}"
```

## What does "Append arguments to executable" do?

Instead of adding arguments to Steam's launch options:

![Not appended arguments](../../../assets/images/cmd-not-appended.png) {.fitImage.center}

arguments are appended to target as shown below:

![Appended arguments](../../../assets/images/cmd-appended.png) {.fitImage.center}

This setting is used to influence Steam's APP ID.

## Directory variables

| Variable (case-insensitive) | Corresponding value                     |
| ---------------------------:|:--------------------------------------- |
|                 `${exeDir}` | Executable directory                    |
|                 `${romDir}` | ROMs directory                          |
|               `${steamDir}` | Steam directory                         |
|             `${startInDir}` | "StartIn" directory                     |
|                `${fileDir}` | File's, returned by a parser, directory |

如果可执行目录输入留空，则 **empty**，`${exeDir}`{.noWrap} 等于 `${fileDir}`{.noWrap}。 此外，如果“StartIn”目录为**空**，则`${startInDir}`{.noWrap}等于`${exeDir}`{.noWrap}。

## 名称变量

|   变量 (大小写不敏感) | 对应的值              |
| -------------:|:----------------- |
|  `${exeName}` | 可执行文件名称 (无扩展名)    |
| `${fileName}` | 由解析器返回的文件名（不带扩展名） |

如果可执行目录输入**留空**，则 `${exeName}`{.noWrap} 等于 `${fileName}`{.noWrap}。

## 扩展变量

|  变量 (大小写不敏感) | 对应的值             |
| ------------:|:---------------- |
|  `${exeExt}` | 可执行文件的扩展名（带点）    |
| `${fileExt}` | 由解析器返回的文件扩展名（带点） |

如果可执行目录输入**留空**，则`${exeExt}`{.noWrap}等于`${fileExt}`{.noWrap}。

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

|                                                 变量 (大小写不敏感) | 对应的函数                                                          |
| -----------------------------------------------------------:|:-------------------------------------------------------------- |
|                                 `${regex\|input\|替换(可选)}` | 在输入上执行正则表达式。 支持 `u`、`g` 和 `i` 标志（捕获的组将被连接，除非提供了替换）。            |
|                                             `${uc\|input}` | 大写变量。 将输入转换为大写                                                 |
|                                             `${lc\|input}` | 小写变量。 将输入转换为小写                                                 |
|                                       `${cv:group\|input}` | 使用匹配的自定义变量更改输入（组是可选的）                                          |
|                                            `${rdc\|input}` | Replace diacritic input characters with their latin equivalent |
| `${os:[win\|mac\|linux]\|on match\|no match(optional)}` | If OS matches, uses `on match` value or `no match` otherwise   |

### Function variable example

Let's say that `${title}` variable equals to `Pokémon (USA) (Disc 1).iso`. Then these variables:
```
${/.*/|${title}}                           //Matches everything
${/(.*)/|${title}}                         //Captures everything
${/(\(.*?\))/|${title}|}                   //Captures all brackets and substitutes with nothing
${/(\(Disc\s?[0-9]\))/|${title}}           //Captures "Disc..." part
${uc|${/(\(Disc\s?[0-9]\))/|${title}}}     //Captures "Disc..." part and transforms it to uppercase
${rdc|${title}}                            //Replace diacritic characters (in this case: é -> e)
file${os:linux|.so|${os:win|.dll}}         //Selects correct file extension for OS
```
will be replaced with these:
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
