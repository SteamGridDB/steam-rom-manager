import { app, BrowserWindow, shell, ipcMain, IpcMainEvent } from 'electron';
import * as log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import * as paths from "../paths";
import * as path from 'path';
import * as url from 'url';

// Window setup
const windowStateKeeper = require('electron-window-state');
let mainWindow: Electron.BrowserWindow = null;

// Logging setup
log.transports.file.level='info';
autoUpdater.logger = log;
log.info('App starting...');

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

// Auto Updater Listeners
autoUpdater.on('checking-for-update', () => {
  log.info('checking for updates')
})
autoUpdater.on('update-available', (info) => {
  log.info('update available')
  mainWindow.webContents.send('updater_message','update_available');
})
autoUpdater.on('update-not-available', (info) => {
  // do nothing
})
autoUpdater.on('error', (err) => {
  log.info(err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  mainWindow.webContents.send('updater_message','download_progress');
})
autoUpdater.on('update-downloaded', (info) => {
  mainWindow.webContents.send('updater_message','update_downloaded');
});

// Main Listeners
app.on('ready', ()=>{
  createWindow()
  mainWindow.webContents.on('dom-ready',()=>{
    log.info('sending update_available')
    mainWindow.webContents.send('updater_message','update_available')
    autoUpdater.checkForUpdatesAndNotify()
  });
  ipcMain.on('restart_app',(event: IpcMainEvent)=>{
    log.info('restarting and installing update');
    //autoUpdater.quitAndInstall()
  })
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    //createWindow();
  }
});
