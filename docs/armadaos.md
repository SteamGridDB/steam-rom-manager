# Experimental ArmadaOS build

This target packages Steam ROM Manager for native ARM64 Linux, with ArmadaOS as
the primary test platform. ArmadaOS is currently experimental, so these builds
should be treated as prereleases too.

## Build

Build on an ARM64 Linux host (or use the `Experimental ArmadaOS release` GitHub
Actions workflow):

```sh
yarn install --frozen-lockfile
yarn run presets:validate
yarn run build:dist
yarn run build:armada
```

The build produces these files in `release/`:

- `Steam-ROM-Manager-ArmadaOS-<version>-arm64.AppImage`
- `Steam-ROM-Manager-ArmadaOS-<version>-arm64.tar.gz`

Native ARM64 Linux is required because Steam ROM Manager includes the native
`better-sqlite3` module. Building on ARM64 Linux ensures that it is compiled for
the same operating system and architecture as ArmadaOS.

## Install on ArmadaOS

Switch to Desktop Mode and download the AppImage. Then make it executable and
launch it:

```sh
chmod +x Steam-ROM-Manager-ArmadaOS-*-arm64.AppImage
./Steam-ROM-Manager-ArmadaOS-*-arm64.AppImage
```

If AppImage mounting is unavailable, extract the `tar.gz` build instead and run
the `steam-rom-manager` executable inside it.

ArmadaOS installs Steam at `~/.local/share/Steam` and provides the standard
`~/.steam/steam` and `~/.steam/root` links. Select any of those locations if
Steam ROM Manager does not detect Steam automatically. Fully exit Steam before
saving changes, then start Steam again.

## Current scope

- Architecture: ARM64 (`aarch64`)
- Distribution target: ArmadaOS/Fedora bootc
- Formats: AppImage and portable `tar.gz`
- Status: experimental; build validation does not replace testing on a supported
  ArmadaOS handheld
