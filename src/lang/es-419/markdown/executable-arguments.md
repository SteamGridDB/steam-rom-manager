# Command line arguments `[supports variables]`{.noWrap}

Arguments which are appended to executable to produce final shortcut. Most of the time you will want to set it using provided parser variables.

## Ejemplos por Sistema

### RetroArch

```
-L cores${/}TU_CORE.dll "${filePath}"
```

### Cemu (WiiU)

```
-f -g "${filePath}"
```

### Dolphin Emu (Gamecube y Wii)

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

### mGBA (Gameboy, Gameboy Color, y Gameboy Advance)

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
-config nullDC_GUI:Fullscreen=1 -config ImageReader: DefaultImage="${filePath}"
```

### Kega Fusion (Sega Genesis y Sega 32X)

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

## ¿Qué hace "Añadir argumentos al ejecutable"?

En lugar de añadir argumentos a las opciones de lanzamiento de Steam:

![Argumentos no añadidos](../../../assets/images/cmd-not-appended.png) {.fitImage.center}

argumentos se añaden al objetivo como se muestra a continuación:

![Argumentos añadidos](../../../assets/images/cmd-appended.png) {.fitImage.center}

This setting is used to influence Steam's APP ID.

## Directory variables

| Variable (case-insensitive) | Corresponding value                       |
| ---------------------------:|:----------------------------------------- |
|                 `${exeDir}` | Executable directory                      |
|                 `${romDir}` | ROMs directory                            |
|               `${steamDir}` | Steam directory                           |
|             `${startInDir}` | "StartIn" directory                       |
|                `${fileDir}` | Files returned by a parser or a directory |

In case executable directory input is left **empty**, `${exeDir}`{.noWrap} is equal to `${fileDir}`{.noWrap}. Moreover, if "StartIn" directory is left **empty**, `${startInDir}`{.noWrap} is equal to `${exeDir}`{.noWrap}.

## Variables de nombres

| Variable (case-insensitive) | Valor correspondiente                                         |
| ---------------------------:|:------------------------------------------------------------- |
|                `${exeName}` | Nombre del ejecutable (sin extensión)                         |
|               `${fileName}` | Nombre del archivo devuelto por un analizador (sin extensión) |

In case executable directory input is left **empty**, `${exeName}`{.noWrap} is equal to `${fileName}`{.noWrap}.

## Variables de extensión

| Variable (case-insensitive) | Valor correspondiente                                           |
| ---------------------------:|:--------------------------------------------------------------- |
|                 `${exeExt}` | Extensión del ejecutable (con punto)                            |
|                `${fileExt}` | Extensión del archivo devuelto por un analizador (con un punto) |

In case executable directory input is left **empty**, `${exeExt}`{.noWrap} is equal to `${fileExt}`{.noWrap}.

## Path variables

| Variable (case-insensitive) | Corresponding value                                   |
| ---------------------------:|:----------------------------------------------------- |
|                `${exePath}` | Ruta completa a un ejecutable                         |
|               `${filePath}` | Ruta completa a un archivo devuelto por un analizador |

In case executable directory input is left **empty**, `${exePath}`{.noWrap} is equal to `${filePath}`{.noWrap}.

## Variables del analizador

| Variable (case-insensitive) | Valor correspondiente                            |
| ---------------------------:|:------------------------------------------------ |
|                  `${title}` | Título extraído                                  |
|             `${fuzzyTitle}` | Fuzzy matched title                              |
|             `${finalTitle}` | Title which was the end result of title modifier |

In case fuzzy matching **fails** or is **disabled**, `${fuzzyTitle}`{.noWrap} is equal to `${title}`{.noWrap}.

## Variables de función

|                                 Variable (case-insensitive) | Corresponding function                                                                                                 |
| -----------------------------------------------------------:|:---------------------------------------------------------------------------------------------------------------------- |
|                 `${regex\|input\|substitution(optional)}` | Executes regex on input. Supports `u`, `g` and `i` flags (captured groups are joined, unless substitution is provided) |
|                                             `${uc\|input}` | Uppercase variable. Transforms input to uppercase                                                                      |
|                                             `${lc\|input}` | Lowercase variable. Transforms input to lowercase                                                                      |
|                                       `${cv:group\|input}` | Change input with matched custom variable (group is optional)                                                          |
|                                            `${rdc\|input}` | Replace diacritic input characters with their latin equivalent                                                         |
| `${os:[win\|mac\|linux]\|on match\|no match(optional)}` | If OS matches, uses `on match` value or `no match` otherwise                                                           |

### Function variable example

Digamos que la variable `${title}` es igual a `Pokémon (USA) (Disc 1).ISO`. Entonces estas variables:

```
${/.*/|${title}}                           //Coincide con todo
${/(.*)/|${title}}                         //Captura todo
${/(\(.*?\))/|${title}|}                   //Captura todos los corchetes y sustitutos sin nada
${/(\(Disc\s?[0-9]\))/|${title}}           //Captura la parte de  "Disc..."
${uc|${/(\(Disc\s?[0-9]\))/|${title}}}     //Captura la parte de "Disc..." y lo transforma a mayúscula
${rdc|${title}}                            //Reemplaza caracteres diacríticos (en este caso: é -> e)
file${os:linux|.so|${os:win|.dll}}         //Selecciona la extensión correcta para el OS
```

se reemplazan con estos:

```
Pokémon (USA) (Disc 1).iso
Pokémon (USA) (Disc 1).iso
Pokémon.iso
(Disc 1)
(DISC 1)
Pokemon (USA) (Disc 1).iso

--En linux:
file.so
--En Windows:
file.dll
--En Mac OS:
file
```
