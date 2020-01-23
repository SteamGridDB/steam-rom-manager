import { app, BrowserWindow, shell } from 'electron';
import * as paths from "../paths";
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import * as contextMenu from 'electron-context-menu';
contextMenu({
  prepend: (defaultActions: any, params: any, browserWindow: any) => [
    {
      label: 'Rainbow',
      // Only show it when right-clicking images
      visible: params.mediaType === 'image'
    },
    {
      label: 'Search Google for “{selection}”',
      // Only show it when right-clicking text
      visible: params.selectionText.trim().length > 0,
      click: () => {
        shell.openExternal(`https://google.com/search?q=${encodeURIComponent(params.selectionText)}`);
      }
    }
  ]
});


import 'unknown-ts';
const windowStateKeeper = require('electron-window-state');
let mainWindow: Electron.BrowserWindow = null;

function createWindow() {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 600,
    maximize: false,
    path: paths.userDataDir
  });

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width < 1024 ? 1024 : mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 1024,
    minHeight: 600,
    frame: false,
    backgroundColor: '#121212',
    webPreferences: {
      devTools: process.env.NODE_ENV !== 'production',
      nodeIntegration: true,
      nodeIntegrationInWorker: true
    }
  });

  mainWindowState.manage(mainWindow);

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'renderer', 'index.html'),
    protocol: 'file:',
    slashes: true
  }));
  mainWindow.on('closed', () => {
    mainWindow = null
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.show();
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
