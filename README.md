Steam ROM Manager
=================

[![Build Status](https://github.com/doZennn/steam-rom-manager/actions/workflows/main.yml/badge.svg)](https://github.com/doZennn/steam-rom-manager/actions/workflows/main.yml)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/w/doZennn/steam-rom-manager?logo=github&style=flat-square&label=commits)]()
[![GitHub all releases](https://img.shields.io/github/downloads/doZennn/steam-rom-manager/total?logo=github&style=flat-square)](https://github.com/janeczku/calibre-web/releases)
[![Discord](https://img.shields.io/discord/344691247098757121?color=%237289DA&label=SRM&logo=discord&logoColor=white)](https://discord.gg/vrd6385)

# For users

Steam ROM Manager is a super flexible tool for adding non Steam games to steam in bulk. Added games could be ROMs for emulators, games from other stores such as Epic, or even not games at all. Have you always wanted your notes from junior year as a category in steam? If so that's pretty weird! But now it's possible.

For an overview of how SRM works see [here](https://dozennn.github.io/steam-rom-manager/). There is plenty of documentation available in the app's built in FAQ, and if you need further help there are expert users to be found on the [discord](https://discord.gg/nxxzBPJ) and the [subreddit](https://www.reddit.com/r/SteamRomManager/).

Check out the [releases page](https://github.com/doZennn/steam-rom-manager/releases) for compiled downloads.

# Support

If you enjoy Steam ROM Manager and want it to continue to be useful consider supporting [SteamGridDB](https://www.steamgriddb.com/)'s Patreon. SteamGridDB hosts all of the artwork that is used by Steam ROM Manager to make your steam library the envy of the town, so we should probably help them keep their lights on.

<a href="https://www.patreon.com/steamgriddb">
    <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

If you're feeling exceptionally generous then feel free to also buy me a coffee!

<a href="https://www.buymeacoffee.com/cbartondock" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="38" width="174">
</a>

# For Developers

To compile this app, you'll need the latest `Node.js` and `npm` (if for any reason this doesn't work try downgrading to node 14.18.1 using nvm or volta). Every script will need to be run from project directory.

Before running any scripts, dependencies must be installed using:

```
npm ci
```

## Scripts

All script must be run using `npm run` command. For example, `npm run watch:renderer`.

|Script|Function|
|---|---|
|`postinstall`|Recompiles native apps to match Electron's NodeJS version if needed|
|`start`|Launches compiled app|
|`watch:main`|Compiles Electron app and watches for changes|
|`watch:renderer`|Compiles a renderer for an Electron app and watches for changes|
|`build:main`|Compiles Electron app in production mode|
|`build:renderer`|Compiles a renderer for an Electron app in production mode|
|`build:dist`|Runs `build:main` and `build:renderer`|
|`build:win`|Compiles an executable installer for Windows|
|`build:linux`|Compiles a `deb` package and `AppImage` for linux|
|`build:docker`|`build:win` and `build:linux` joined together|
|`build:mac`|Compiles a `dmg` package for MacOS|

## Debugging an app

Run `watch:main` (usually once since you rarely change anything in Electron app) and `watch:renderer`.
Each command creates separate `webpack` instance which will watch referenced files for changes and will recompile app.

App can be run using `start` script. After every recompile by `watch:renderer`, app can be refreshed using `Ctrl + R`, however `watch:main` requires need a restart.

`Ctrl + Shift + I` can be used to launch Chrome inspector once the app is running. This works even in the release version.

## Building and app

### For Windows

Scripts must be run in this order:

```
npm run build:dist
npm run build:win
```

### For linux

Scripts must be run in this order:

```
npm run build:dist
npm run build:linux
```

### For MacOS

Scripts must be run in this order:

```
npm run build:dist
npm run build:mac
```
