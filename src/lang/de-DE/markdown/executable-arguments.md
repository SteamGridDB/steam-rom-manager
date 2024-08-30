# Befehlszeilenargumente (optional) `[unterstützt Variablen]`{.noWrap}

Arguments which are appended to executable to produce final shortcut. Meistens wirst du diese mit bereitgestellten Parser-Variablen einstellen.

## Beispiele nach System

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

Anstatt Argumente zu den Start-Optionen von Steam hinzuzufügen:

![Nicht angehängte Argumente](../../../assets/images/cmd-not-appended.png) {.fitImage.center}

Argumente werden dem Ziel wie unten gezeigt angehängt:

![Angehängte Argumente](../../../assets/images/cmd-appended.png) {.fitImage.center}

Diese Einstellung wird verwendet, um die App-ID von Steam zu beeinflussen.

## Verzeichnis-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Corresponding value                                  |
| ----------------------------------------------------: | :--------------------------------------------------- |
|                                           `${exeDir}` | Executable directory                                 |
|                                           `${romDir}` | ROM-Verzeichnis                                      |
|                                         `${steamDir}` | Dampftraktor                                         |
|                                       `${startInDir}` | "Startin"-Verzeichnis                                |
|                                          `${fileDir}` | Dateien, von einem Parser zurückgegeben, Verzeichnis |

Falls die ausführbare Verzeichniseingabe **leer gelassen wurde,**, `${exeDir}`{.noWrap} ist gleich `${fileDir}`{.noWrap}. Außerdem ist, wenn das Verzeichnis "StartIn" **leer** gelassen wird, `${startInDir}`{.noWrap} gleich `${exeDir}`{.noWrap}.

## Namen-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                                         |
| ----------------------------------------------------: | :-------------------------------------------------------------------------- |
|                                          `${exeName}` | Name der ausführbaren Datei (ohne Erweiterung)                              |
|                                         `${fileName}` | Name der Datei, die von einem Parser zurückgegeben wurde (ohne Erweiterung) |

Falls die ausführbare Verzeichniseingabe **leer gelassen wurde,**, `${exeName}`{.noWrap} ist gleich `${fileName}`{.noWrap}.

## Erweiterungs-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                                          |
| ----------------------------------------------------: | :--------------------------------------------------------------------------- |
|                                           `${exeExt}` | Erweiterung der ausführbaren Datei (mit einem Punkt)                         |
|                                          `${fileExt}` | Dateierweiterung, die von einem Parser (mit einem Punkt) zurückgegeben wurde |

Falls die ausführbare Verzeichniseingabe **leer gelassen wurde,**, `${exeExt}`{.noWrap} ist gleich `${fileExt}`{.noWrap}.

## Pfad-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                                         |
| ----------------------------------------------------: | :-------------------------------------------------------------------------- |
|                                          `${exePath}` | Vollständiger Pfad zu einer ausführbaren Datei                              |
|                                         `${filePath}` | Vollständiger Pfad zu einer Datei, die von einem Parser zurückgegeben wurde |

Falls die ausführbare Verzeichniseingabe **leer gelassen wurde,**, `${exePath}`{.noWrap} ist gleich `${filePath}`{.noWrap}.

## Parser-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                   |
| ----------------------------------------------------: | :---------------------------------------------------- |
|                                            `${title}` | Extrahierter Titel                                    |
|                                       `${fuzzyTitle}` | Fuzzy matched title                                   |
|                                       `${finalTitle}` | Titel, der das Endergebnis des Titel-Modifikators war |

In case fuzzy matching **fails** or is **disabled**, `${fuzzyTitle}`{.noWrap} is equal to `${title}`{.noWrap}.

## Funktions-Variablen

|   Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechende Funktion                                                                                                 |
| ------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------- |
|               `${regex\|input\|substitution(optional)}` | Executes regex on input. Supports `u`, `g` and `i` flags (captured groups are joined, unless substitution is provided) |
|                                          `${uc\|input}` | Uppercase variable. Wandelt Eingaben in Großbuchstaben um                                                              |
|                                          `${lc\|input}` | Lowercase variable. Wandelt Eingaben in Kleinbuchstaben um                                                             |
|                                    `${cv:group\|input}` | Change input with matched custom variable (group is optional)                                                          |
|                                         `${rdc\|input}` | Replace diacritic input characters with their latin equivalent                                                         |
| `${os:[win\|mac\|linux]\|on match\|no match(optional)}` | If OS matches, uses `on match` value or `no match` otherwise                                                           |

### Beispiel für Funktions-Variablen

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

wird durch folgende ersetzt:

```
Poke<unk> mon (USA) (Disc 1).iso
Poke<unk> mon (USA) (Disc 1).iso
Poke<unk> mon.iso
(Disc 1)
(DISC 1)
Pokemon (USA) (Disc 1). so

--Unter Linux:
file.so
--Unter Windows:
file.dll
--Auf MacOS:
Datei
```
