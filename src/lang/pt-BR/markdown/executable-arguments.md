# Command line arguments (optional) `[supports variables]`{.noWrap}

Arguments which are appended to executable to produce final shortcut. Most of the time you will want to set it using provided parser variables.

## Examples By System

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

| Variable (case-insensitive) | Corresponding value                          |
| ---------------------------:|:-------------------------------------------- |
|                 `${exeDir}` | Diretório executável                         |
|                 `${romDir}` | Diretório ROMs                               |
|               `${steamDir}` | Diretório Steam                              |
|             `${startInDir}` | Diretório inicial                            |
|                `${fileDir}` | Arquivo retornado pelo analisador, diretório |

Caso a entrada do diretório executável seja deixada **vazia**, `${exeDir}`{.noWrap} é igual a `${fileDir}`{.noWrap}. Além disso, se o diretório "StartIn" for deixado **vazio**, `${startInDir}`{.noWrap} é igual a `${exeDir}`{.noWrap}.

## Variáveis de nome

| Variável (maiúsculas e minúsculas) | Sobreposição correspondente                                        |
| ----------------------------------:|:------------------------------------------------------------------ |
|                       `${exeName}` | Nome do executável (sem extensão)                                  |
|                      `${fileName}` | Nome do arquivo que foi retornado por um analisador (sem extensão) |

Caso a entrada do diretório executável seja deixada **vazia**, `${exeName}`{.noWrap} é igual a `${fileName}`{.noWrap}.

## Variáveis de extensão

| Variável (maiúsculas e minúsculas) | Sobreposição correspondente                                            |
| ----------------------------------:|:---------------------------------------------------------------------- |
|                        `${exeExt}` | Extensão do executável (com um ponto)                                  |
|                       `${fileExt}` | Extensão do arquivo que foi retornado por um analisador (com um ponto) |

Caso a entrada do diretório executável seja deixada **vazia**, `${exeExt}`{.noWrap} é igual a `${fileExt}`{.noWrap}.

## Variáveis de nome

| Variável (maiúsculas e minúsculas) | Sobreposição correspondente                                          |
| ----------------------------------:|:-------------------------------------------------------------------- |
|                       `${exePath}` | Caminho completo para um executável                                  |
|                      `${filePath}` | Caminho completo para um arquivo que foi retornado por um analisador |

Caso a entrada do diretório executável seja deixada **vazia**, `${exePath}`{.noWrap} é igual a `${filePath}`{.noWrap}.

## Variáveis de nome

| Variável (maiúsculas e minúsculas) | Sobreposição correspondente                                 |
| ----------------------------------:|:----------------------------------------------------------- |
|                         `${title}` | Título extraído                                             |
|                    `${fuzzyTitle}` | Título difuso correspondente                                |
|                    `${finalTitle}` | O título que foi o resultado final do modificador do título |

No caso de correspondência difusa **falhar** ou está **desabilitado**, `${fuzzyTitle}`{.noWrap} é igual a `${title}`{.noWrap}.

## Custom variables

|                          Variável (maiúsculas e minúsculas) | Função correspondente                                                                                                               |
| -----------------------------------------------------------:|:----------------------------------------------------------------------------------------------------------------------------------- |
|                 `${regex\├input\├substitution(opcional)}` | Executa a expressão regex na entrada. Supports `u`, `g` and `i` flags (captured groups are joined, unless substitution is provided) |
|                                             `${uc\|input}` | Uppercase variable. Transforms input to uppercase                                                                                   |
|                                             `${lc\|input}` | Lowercase variable. Transforms input to lowercase                                                                                   |
|                                       `${cv:group\|input}` | Change input with matched custom variable (group is optional)                                                                       |
|                                            `${rdc\|input}` | Replace diacritic input characters with their latin equivalent                                                                      |
| `${os:[win\|mac\|linux]\|on match\|no match(optional)}` | If OS matches, uses `on match` value or `no match` otherwise                                                                        |

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
