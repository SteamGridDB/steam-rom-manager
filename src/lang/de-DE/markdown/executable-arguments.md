# Command line arguments `[supports variables]`{.noWrap}

Argumente die an Programmdateien angehängt werden, um den finalen Shortcut zu erzeugen. Meistens willst du diese mit bereitgestellten Parser-Variablen einstellen.

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

## Was macht "Argumente an Programmdatei anhängen"?

Anstatt Argumente zu den Start-Optionen von Steam hinzuzufügen:

![Nicht angehängte Argumente](../../../assets/images/cmd-not-appended.png) {.fitImage.center}

werden Argumente dem Ziel wie unten gezeigt angehängt:

![Angehängte Argumente](../../../assets/images/cmd-appended.png) {.fitImage.center}

Diese Einstellung wird verwendet, um die App-ID von Steam zu beeinflussen.

## Verzeichnis-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                |
| -----------------------------------------------------:|:-------------------------------------------------- |
|                                           `${exeDir}` | Verzeichnis der Programmdatei                      |
|                                           `${romDir}` | ROM-Verzeichnis                                    |
|                                         `${steamDir}` | Steam Verzeichnis                                  |
|                                       `${startInDir}` | "Starte in"-Verzeichnis                            |
|                                          `${fileDir}` | Vom Parser zurückgegebene Dateien oder Verzeichnis |

Falls der Input für Programmdateien-Verzeichnis **leer**gelassen wurde, ist `${exeDir}`{.noWrap} gleich `${fileDir}`{.noWrap}. Außerdem ist, wenn das Verzeichnis "Starte in" **leer** gelassen wird, `${startInDir}`{.noWrap} gleich `${exeDir}`{.noWrap}.

## Namen-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                                         |
| -----------------------------------------------------:|:--------------------------------------------------------------------------- |
|                                          `${exeName}` | Name der ausführbaren Datei (ohne Erweiterung)                              |
|                                         `${fileName}` | Name der Datei, die von einem Parser zurückgegeben wurde (ohne Erweiterung) |

Falls die ausführbare Verzeichniseingabe **leer** gelassen wurde, ist `${exeName}`{.noWrap} gleich `${fileName}`{.noWrap}.

## Dateiendungen-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                                          |
| -----------------------------------------------------:|:---------------------------------------------------------------------------- |
|                                           `${exeExt}` | Erweiterung der ausführbaren Datei (mit einem Punkt)                         |
|                                          `${fileExt}` | Dateierweiterung, die von einem Parser (mit einem Punkt) zurückgegeben wurde |

Falls die ausführbare Verzeichniseingabe **leer** gelassen wurde, ist `${exeExt}`{.noWrap}gleich `${fileExt}`{.noWrap}.

## Pfad-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                                         |
| -----------------------------------------------------:|:--------------------------------------------------------------------------- |
|                                          `${exePath}` | Vollständiger Pfad zu einer ausführbaren Datei                              |
|                                         `${filePath}` | Vollständiger Pfad zu einer Datei, die von einem Parser zurückgegeben wurde |

Falls die ausführbare Verzeichniseingabe **leer** gelassen wurde, ist `${exePath}`{.noWrap} gleich `${filePath}`{.noWrap}.

## Parser-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                   |
| -----------------------------------------------------:|:----------------------------------------------------- |
|                                            `${title}` | Extrahierter Titel                                    |
|                                       `${fuzzyTitle}` | Fuzzy Matched Titel                                   |
|                                       `${finalTitle}` | Titel, der das Endergebnis des Titel-Modifikators war |

Falls Fuzzy Matching **fehlschlägt** oder **deaktiviert** ist, ist `${fuzzyTitle}`{.noWrap} gleich `${title}`{.noWrap}.

## Funktions-Variablen

|       Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechende Funktion                                                                                                          |
| -----------------------------------------------------------:|:------------------------------------------------------------------------------------------------------------------------------- |
|                 `${regex\|input\|substitution(optional)}` | Führt Regex auf dem Input aus. Unterstützt `u`, `g` und `i` Flags(Gruppen werden zusammengefügt, außer Ersetzung ist angegeben) |
|                                             `${uc\|input}` | Großgeschriebene Variable. Wandelt Eingaben in Großbuchstaben um                                                                |
|                                             `${lc\|input}` | Kleingeschrieben Variable. Wandelt Eingaben in Kleinbuchstaben um                                                               |
|                                       `${cv:group\|input}` | Ersetzt den Input durch erfasste benutzerdefinierte Variable (Gruppe ist optional)                                              |
|                                            `${rdc\|input}` | Ersetzt diakritische Zeichen mit ihrem lateinischen Equivalent                                                                  |
| `${os:[win\|mac\|linux]\|on match\|no match(optional)}` | Wenn das Betriebssystem übereinstimmt, benutze den `on match` Wert ansonsten den `no match`                                     |

### Beispiel für Funktions-Variablen

Nehmen wir an `${title}` ist gleich `Pokémon (USA) (Disc 1).iso`. Dann werden diese Variablen:

```
${/.*/|${title}}                           //Entspricht allem
${/(.*)/|${title}}                         //Gruppiert alles
${/(\(.*?\))/|${title}|}                   //Gruppiert alle Klammern und ersetzt sie durch nichts
${/(\(Disc\s?[0-9]\))/|${title}}           //Gruppiert den "Disc..." Teil
${uc|${/(\(Disc\s?[0-9]\))/|${title}}}     //Gruppiert den "Disc..." Teil und transformiert ihn zu Großbuchstaben
${rdc|${title}}                            //Ersetzt diakritische Zeichen (In diesem Fall: é -> e)
file${os:linux|.so|${os:win|.dll}}         //Setzt die richtige Dateiendung nach Betriebssystem
```

ersetzt durch:

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
