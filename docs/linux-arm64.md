# Experimental ARM64 Linux build

This target packages Steam ROM Manager for native ARM64 Linux. It produces an
AppImage and a portable tarball without changing the existing x64 Linux build.

## Build

Build on an ARM64 Linux host (or use the `Experimental Linux ARM64 release`
GitHub Actions workflow):

```sh
yarn install --frozen-lockfile
yarn run presets:validate
yarn run build:dist
yarn run build:linux-arm64
```

The build produces these files in `release/`:

- `Steam-ROM-Manager-<version>-linux-arm64.AppImage`
- `Steam-ROM-Manager-<version>-linux-arm64.tar.gz`

Native ARM64 Linux is required because Steam ROM Manager includes the native
`better-sqlite3` module. Building on ARM64 Linux ensures that it is compiled for
the same operating system and architecture as the target system.

## Install

Download the AppImage, make it executable, and launch it:

```sh
chmod +x Steam-ROM-Manager-*-linux-arm64.AppImage
./Steam-ROM-Manager-*-linux-arm64.AppImage
```

If AppImage mounting is unavailable, extract the `tar.gz` build instead and run
the `steam-rom-manager` executable inside it.

Steam ROM Manager normally detects Steam through the standard
`~/.local/share/Steam`, `~/.steam/steam`, or `~/.steam/root` locations. Fully
exit Steam before saving changes, then start Steam again.

## Validation

The ARM64 artifacts and the native `better-sqlite3` module were built and smoke
tested on Ubuntu 24.04 ARM64. The resulting AppImage was also tested
successfully on an ArmadaOS handheld, including launching games through Steam
ROM Manager.

This target remains experimental until it has broader coverage across ARM64
Linux distributions and devices.
