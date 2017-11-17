# Arguments en ligne de commande (facultatif) `[supports variables]`{.noWrap}

Arguments qui sont ajoutés à l'exécutable pour produire le raccourci final. La plupart du temps, vous voudrez le paramétrer à l'aide des variables d'analyse fournies.

## Exemples

Vous trouverez ici des exemples fournis par `HEspoke`{.noWrap}, `NicholasNRG`{.noWrap} et `FrogTheFrog`{.noWrap}.

### RetroArch

#### Nintendo Entertainment System (NES)
```
-D -f -L "E:\\emulation\\systems\\retroarch\\cores\\bnes_libretro.dll" "${filePath}"
```
#### Super Nintendo Entertainment System (SNES)
```
-D -f -L "E:\\emulation\\systems\\retroarch\\cores\\snes9x_libretro.dll" "${filePath}"
```
#### Nintendo 64 (N64)
```
-D -f -L "E:\\emulation\\systems\\RetroArch\\cores\\mupen64plus_libretro.dll" "${filePath}"
```
#### Sega Genesis
```
-D -f -L "E:\\emulation\\systems\\RetroArch\\cores\\genesis_plus_gx_libretro.dll" "${filePath}"
```
#### Sega CD
```
-D -f -L "E:\\emulation\\systems\\RetroArch\\cores\\genesis_plus_gx_libretro.dll" "${filePath}"
```
#### Sony Playstation
```
-D -f -L "E:\\emulation\\systems\\RetroArch\\cores\\mednafen_psx_libretro.dll" "${filePath}"
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

### Project64 (N64)

```
"${filePath}"
```

### Nestopia (NES/Famicom)

```
"${filePath}" -video fullscreen bpp : 16 -video fullscreen width : 1024 -video fullscreen height : 768 -preferences fullscreen on start : yes -view size fullscreen : stretched 
```

## Que fait "Ajouter des arguments à l'exécutable"?

Au lieu d'ajouter des arguments aux options de lancement de Steam:

![Not appended arguments](../../../images/cmd-not-appended.png) {.fitImage .center}

Les arguments sont ajoutés à la cible comme indiqué ci-dessous:

![Appended arguments](../../../images/cmd-appended.png) {.fitImage .center}

Ce paramètre est utilisé pour influencer l'ID APP de Steam.
