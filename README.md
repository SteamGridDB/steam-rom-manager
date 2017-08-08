
# Developing

To compile this app, you'll need the latest `Node.js` and `npm`. Every script will need to be run from project directory.

Before running any scripts, dependencies must be installed using:

```
npm install
```

## Scripts

All script must be run using `npm run` command. For example, `npm run watch:renderer`.

|Script|Function|
|---|---|
|`watch:main`|Compiles Electron app and watches for changes|
|`watch:renderer`|Compiles a renderer for an Electron app and watches for changes|
|`build:main`|Compiles Electron app in production mode|
|`build:renderer`|Compiles a renderer for an Electron app in production mode|
|`build:dist`|Runs `build:main` and `build:renderer`|
|`build:win`|Compiles an executable installer for Windows|
|`build:linux`|Compiles a `deb` package and `AppImage` for linux|
|`start`|Launches compiled app|
|`docker:create`|Create docker image|
|`docker:bash`|Allows to access bash in created image|
|`docker:remove`|Removes docker image and everything related to it|
|`docker:npm-install`|Runs `npm install` in docker|
|`docker:build`|Runs `build:win` and `build:linux` in docker|

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

### For docker

To create docker image and install dependencies:

```
npm run docker:create
npm run docker:npm-install
```

Then, scripts must be run in this order:

```
npm run build:dist
npm run docker:build
```

## Windows terminal

Some commands will require unix-like terminal, therefore if some commands don't work you'll need to set `npm` to use `powershell` or similar terminals for running scripts. This requires `npm > 5.1.x`. Terminal can be set using this command:

```
npm config set script-shell C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe
```
