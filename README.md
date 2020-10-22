Steam ROM Manager
=================

[![Build Status](https://travis-ci.org/doZennn/steam-rom-manager.svg?branch=master)](https://travis-ci.org/doZennn/steam-rom-manager)
[![Discord](https://img.shields.io/discord/344691247098757121?color=%237289DA&label=SRM&logo=discord&logoColor=white)](https://discord.gg/vrd6385)

# For casual users

Not sure what this app is even for? See [here](https://dozennn.github.io/steam-rom-manager/). There is plenty of documentation available in the app's built in FAQ, and if you need further help there are expert users to be found on the [discord](https://discord.gg/nxxzBPJ) and the [subreddit](https://www.reddit.com/r/SteamRomManager/).

Check out the [releases page](https://github.com/doZennn/steam-rom-manager/releases) for compiled downloads.

# For developers
To compile this app, you'll need the latest `Node.js` and `npm`. Every script will need to be run from project directory.

Before running any scripts, dependencies must be installed using:

```
npm install
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
