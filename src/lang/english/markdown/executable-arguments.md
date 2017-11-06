# Command line arguments (optional) `[supports variables]`{.noWrap}

Arguments which are appended to executable to produce final shortcut. Most of the time you will want to set it using provided parser variables.

## Examples

Here you can find examples provided by `HE Spoke`{.noWrap}, `NicholasNRG`{.noWrap} and `FrogTheFrog`{.noWrap}.

### RetroArch

#### Nintendo Entertainment System (NES)
```
-D -f -L "${exeDir}\cores\bnes_libretro.dll" "${filePath}"
```
#### Super Nintendo Entertainment System (SNES)
```
-D -f -L "${exeDir}\cores\snes9x_libretro.dll" "${filePath}"
```
#### Nintendo 64 (N64)
```
-D -f -L "${exeDir}\cores\mupen64plus_libretro.dll" "${filePath}"
```
#### Sega Genesis
```
-D -f -L "${exeDir}\cores\genesis_plus_gx_libretro.dll" "${filePath}"
```
#### Sega CD
```
-D -f -L "${exeDir}\cores\genesis_plus_gx_libretro.dll" "${filePath}"
```
#### Sony Playstation
```
-D -f -L "${exeDir}\cores\mednafen_psx_libretro.dll" "${filePath}"
```

### Dolphin Emu (Gamecube and Wii)

```
--batch --exec "${filePath}"
```

### Cemu (WiiU)

```
-f -g "${filePath}"
```

### nullDC (Sega Dreamcast)

```
-config nullDC_GUI:Fullscreen=1 -config ImageReader:DefaultImage="${filePath}"
```

### PCSX2 (Sony Playstation 2)

```
--fullscreen --nogui "${filePath}"
```

### Kega Fusion (Sega Genesis and Sega 32X)

```
"${filePath}" -gen -auto -fullscreen
```

### Project64 2.3+ (N64)

```
"${filePath}"
```

### Nestopia (NES/Famicom)

```
"${filePath}" -video fullscreen bpp : 16 -video fullscreen width : 1024 -video fullscreen height : 768 -preferences fullscreen on start : yes -view size fullscreen : stretched 
```

## What does "Append arguments to executable" do?

Instead of adding arguments to Steam's launch options:

![Not appended arguments](../../../assets/images/cmd-not-appended.png) {.fitImage .center}

arguments are appended to target as shown below:

![Appended arguments](../../../assets/images/cmd-appended.png) {.fitImage .center}

This setting is used to influence Steam's APP ID.
