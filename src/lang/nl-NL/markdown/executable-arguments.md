# Command line arguments `[supports variables]`{.noWrap}

Argumenten die aan het uitvoerbare bestand worden toegevoegd om de definitieve snelkoppeling te produceren. Meestal wilt u dit instellen met behulp van de meegeleverde parservariabelen.

## Voorbeelden per systeem

### RetroArch

```
-L cores${/}YOUR_CORE.dll "${filePath}"
```

### Cemu (WiiU)

```
-f -g "${filePath}"
```

### Dolphin Emu (Gamecube en Wii)

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

### mGBA (Gameboy, Gameboy Color, en Gameboy Advance)

```
-f "${filePath}"
```

### Nestopia (NES/Famicom)

```
"${filePath}" -video fullscreen bpp : 16 -video fullscreen width : 1024 -video fullscreen height : 768 -preferences fullscreen fullscreen on start: yes -view size fullscreen : stretched
```

### higan (NES/Famicom, SNES/Famicom, Gameboy, Gameboy Color en Gameboy Advance)

```
"${filePath}"
```

### nullDC (Sega Dreamcast)

```
-config nullDC_GUI:Fullscreen=1 -config ImageReader:DefaultImage="${filePath}"
```

### Kega Fusion (Sega Genesis en Sega 32X)

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

### Mednafen (Sony Playstation 1, NES/Famicom, SNES/Super Famicom, enz.)

```
"${filePath}"
```

### PPSSPP (Sony Playstation Portable)

```
"${filePath}"
```

## Wat doet "Argumenten toevoegen aan uitvoerbaar bestand"?

In plaats van argumenten toe te voegen aan de startopties van Steam:

![Not appended arguments](../../../assets/images/cmd-not-appended.png) {.fitImage.center}

argumenten worden aan het doel toegevoegd, zoals hieronder weergegeven:

![Appended arguments](../../../assets/images/cmd-appended.png) {.fitImage.center}

Deze instelling wordt gebruikt om de APP-ID van Steam te beïnvloeden.

## Folder variabelen

| Variabele (niet hoofdlettergevoelig) | Overeenkomstige waarde                    |
| ------------------------------------:|:----------------------------------------- |
|                          `${exeDir}` | Uitvoerbaar bestand map                   |
|                          `${romDir}` | ROMs map                                  |
|                        `${steamDir}` | Steam map                                 |
|                      `${startInDir}` | "StartIn" map                             |
|                         `${fileDir}` | Files returned by a parser or a directory |

Als uitvoerbare map-invoer **leeg** wordt gelaten, is `${exeDir}`{.noWrap} gelijk aan `${fileDir}`{.noWrap}. Bovendien, als de map "StartIn" **leeg** wordt gelaten, is `${startInDir}`{.noWrap} gelijk aan `${exeDir}`{.noWrap}.

## Naam variabelen

| Variabele (niet hoofdlettergevoelig) | Overeenkomstige waarde                                                      |
| ------------------------------------:|:--------------------------------------------------------------------------- |
|                         `${exeName}` | Naam van het uitvoerbaar bestand (zonder extensie)                          |
|                        `${fileName}` | Naam van het bestand dat is teruggestuurd door een parser (zonder extensie) |

Als uitvoerbare map-invoer **leeg** wordt gelaten, is `${exeName}`{.noWrap} gelijk aan `${fileName}`{.noWrap}.

## Extensie variabelen

| Variabele (niet hoofdlettergevoelig) | Overeenkomstige waarde                                                   |
| ------------------------------------:|:------------------------------------------------------------------------ |
|                          `${exeExt}` | Uitbreiding van uitvoerbaar bestand (met een punt)                       |
|                         `${fileExt}` | Extensie van bestand dat teruggestuurd is door een parser (met een punt) |

Als uitvoerbare map-invoer **leeg** wordt gelaten, is `${exeExt}`{.noWrap} gelijk aan `${fileExt}`{.noWrap}.

## Bestandspadvariabelen

| Variabele (niet hoofdlettergevoelig) | Overeenkomstige waarde                                             |
| ------------------------------------:|:------------------------------------------------------------------ |
|                         `${exePath}` | Volledig pad naar een uitvoerbaar bestand                          |
|                        `${filePath}` | Volledig pad naar een bestand dat teruggestuurd is door een parser |

Als uitvoerbare map-invoer **leeg** wordt gelaten, is `${exePath}`{.noWrap} gelijk aan `${filePath}`{.noWrap}.

## Parser variabelen

| Variabele (niet hoofdlettergevoelig) | Overeenkomstige waarde                               |
| ------------------------------------:|:---------------------------------------------------- |
|                           `${title}` | Uitgepakte titel                                     |
|                      `${fuzzyTitle}` | Fuzzy overeenkomende titel                           |
|                      `${finalTitle}` | Titel die het eindresultaat is van de title modifier |

Als fuzzy matching **mislukt** of **uitgeschakeld** is, is `${fuzzyTitle}`{.noWrap} gelijk aan `${title}`{.noWrap}.

## Functie variabele

|                                 Variable (case-insensitive) | Corresponding function                                                                                                 |
| -----------------------------------------------------------:|:---------------------------------------------------------------------------------------------------------------------- |
|                 `${regex\|input\|substitution(optional)}` | Executes regex on input. Supports `u`, `g` and `i` flags (captured groups are joined, unless substitution is provided) |
|                                             `${uc\|input}` | Uppercase variable. Transforms input to uppercase                                                                      |
|                                             `${lc\|input}` | Lowercase variable. Transforms input to lowercase                                                                      |
|                                       `${cv:group\|input}` | Change input with matched custom variable (group is optional)                                                          |
|                                            `${rdc\|input}` | Replace diacritic input characters with their latin equivalent                                                         |
| `${os:[win\|mac\|linux]\|on match\|no match(optional)}` | If OS matches, uses `on match` value or `no match` otherwise                                                           |

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
