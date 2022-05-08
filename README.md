Steam ROM Manager
=================

[![Build Status](https://github.com/SteamGridDB/steam-rom-manager/actions/workflows/main.yml/badge.svg)](https://github.com/SteamGridDB/steam-rom-manager/actions/workflows/main.yml)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/w/SteamGridDB/steam-rom-manager?logo=github&label=commits)](https://github.com/SteamGridDB/steam-rom-manager/commits/master)
[![GitHub all releases](https://img.shields.io/github/downloads/SteamGridDB/steam-rom-manager/total?logo=github)](https://github.com/SteamGridDB/steam-rom-manager/releases)
[![Discord](https://img.shields.io/discord/488621078302949377?color=5865F2&label=SRM&logo=discord&logoColor=white)](https://discord.gg/bnSVJrz)

# For users

Steam ROM Manager is a super flexible tool for adding non-Steam games to steam in bulk and managing their artwork assets. Added games could be ROMs for emulators, games from other stores such as Epic or GOG, or even not games at all. Have you always wanted your notes from junior year as a category in steam? If so that's pretty weird! But now it's possible.

For an overview of how SRM works see [here](https://steamgriddb.github.io/steam-rom-manager/). There is plenty of documentation available in the app's built in FAQ, and if you need further help there are expert users to be found on the [SGDB discord](https://discord.gg/bnSVJrz) under the Steam ROM Manager category and the [SRM subreddit](https://www.reddit.com/r/SteamRomManager/).

Check out the [releases page](https://github.com/SteamGridDB/steam-rom-manager/releases) for compiled downloads.

## Platform Parsers
In addition to flexible ROM parsers, SRM now has several *platform parsers* for importing from popular game stores:

|Parser|Windows|Mac OS|Linux|
|---|---|---|---|
|[Epic](https://store.epicgames.com/en-US/) / [Legendary](https://github.com/derrod/legendary)|✅|✅|❌|
|[GOG Galaxy](https://www.gog.com/galaxy)|✅|❌|❌|
|[UPlay](https://ubisoftconnect.com/en-US/)|✅|❌|❌|

Planned platform parsers include the Amazon Games Store, Itch.io, and Origin.

# Support

If you enjoy Steam ROM Manager and want it to continue to be useful consider supporting [SteamGridDB](https://www.steamgriddb.com/)'s Patreon. [SteamGridDB](https://www.steamgriddb.com/) hosts all of the artwork Steam ROM Manager uses to make your Steam library the envy of the town, so we should probably help them keep their lights on.

<a href="https://www.patreon.com/steamgriddb">
    <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

If you're feeling exceptionally generous then feel free to also buy me a coffee!

<a href="https://www.buymeacoffee.com/cbartondock" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="38" width="174">
</a>

# For developers

To compile this app, you'll need the latest `Node.js` and `npm` (if for any reason this doesn't work try downgrading to node 14.18.1 LTS using nvm or volta). Every script will need to be run from the project directory.

Before running any scripts, dependencies must be installed using:

```
npm ci
```

Unfortunately, because of an issue with `better-sqlite3` you will most likely also have to run `npm ci` after building for windows if you want `npm run start` to work. Otherwise, you will likely see the runtime error `better-sqlite3 is not a valid win32 application`.

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

## Building the app

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
