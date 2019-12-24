# Maintenance-only as of 2019-09-13

Steam ROM Manager will only be updated to fix breaking bugs. No new features will be added.  
Pull requests will still be reviewed and merged.

# For casual users

Visit [Steam ROM Manager](https://frogthefrog.github.io/steam-rom-manager)'s github page for more information.

# For developers

[![Build Status](https://travis-ci.org/doZennn/steam-rom-manager.svg)](https://travis-ci.org/doZennn/steam-rom-manager)

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

`Ctrl + Shift + I` can be used to launch Chrome inspector once the app is running.

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
