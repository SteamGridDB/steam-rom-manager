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

![Not appended arguments](../../../assets/images/cmd-not-appended.png) {.fitImage .center}

arguments are appended to target as shown below:

![Appended arguments](../../../assets/images/cmd-appended.png) {.fitImage .center}

This setting is used to influence Steam's APP ID.
