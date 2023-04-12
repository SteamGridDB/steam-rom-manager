import { app, BrowserWindow, shell, ipcMain, IpcMainEvent } from 'electron';
import * as log from 'electron-log';
import { autoUpdater, CancellationToken } from 'electron-updater';
import * as paths from "../paths";
import * as path from 'path';
import * as url from 'url';


// Window setup
const windowStateKeeper = require('electron-window-state');
let mainWindow: Electron.BrowserWindow = null;

// Logging setup
log.transports.file.level='info';
log.info('App starting...');

// Auto updater setup
autoUpdater.logger = log;
autoUpdater.autoDownload = false;
const cancellationToken = new CancellationToken();

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
      devTools: true,
      contextIsolation: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      enableRemoteModule: true
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
  if(process.platform=='darwin' || process.env.PORTABLE_EXECUTABLE_DIR) {
    mainWindow.webContents.send('updater_message','update_portable');
  } else{
    mainWindow.webContents.send('updater_message','update_available');
  }
})

autoUpdater.on('error', (err) => {
  log.info(err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Progress: ' + Math.round(progressObj.percent) + '%';
  log.info(log_message)
  mainWindow.webContents.send('updater_message',{ progress: log_message });
})
autoUpdater.on('update-downloaded', (info) => {
  mainWindow.webContents.send('updater_message','update_downloaded');
});

// Main Listeners
app.on('ready', ()=>{
  createWindow()
  mainWindow.webContents.on('dom-ready',()=>{
    autoUpdater.checkForUpdatesAndNotify()
  });
  ipcMain.on('download_update', (event: IpcMainEvent)=>{
    log.info('downloading update')
    autoUpdater.downloadUpdate(cancellationToken);
  })
  ipcMain.on('restart_app', (event: IpcMainEvent)=>{
    log.info('restarting and installing update');
    autoUpdater.quitAndInstall()
  })
  ipcMain.on('cancel_update', (event: IpcMainEvent)=>{
    log.info('cancelling update');
    cancellationToken.cancel()
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
